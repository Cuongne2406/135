import connectDB from '@/config/connectDB';
import mongoose from 'mongoose';
import PostCourse from '@/models/course';
import Student from '@/models/student';
import User from '@/models/users';
import ZaloMessageLog from '@/models/zaloMessageLog';
import { createNotification } from '@/data/database/notification';
import { actionZalo } from '@/function/drive/appscript';
import dayjs from 'dayjs';

/**
 * Hàm gửi tin nhắn Zalo cốt lõi (Dispatch & Log)
 */
async function dispatchZaloMessage({
    recipientPhone,
    studentId,
    studentName,
    courseId,
    lessonId,
    type,
    title,
    content,
    actionUrl = '',
    metadata = {}
}) {
    await connectDB();

    if (!recipientPhone) {
        console.warn(`[ZALO_AUTOMATION] Học sinh ${studentId} (${studentName}) không có số điện thoại.`);
        return { success: false, reason: 'MISSING_PHONE' };
    }

    let status = 'SENT';
    let errorMessage = '';

    try {
        // Định dạng tin nhắn gửi đi kèm link hành động
        const fullMessage = actionUrl 
            ? `${content}\n\n👉 Chi tiết sổ liên lạc: ${actionUrl}`
            : content;

        // 1. Kiểm tra và gửi qua Zalo Bot Platform chính thức
        const botToken = process.env.ZALO_BOT_TOKEN;
        let sentViaBot = false;

        if (botToken) {
            // Tra cứu học sinh để lấy zaloChatId đã liên kết
            const studentDoc = await Student.findOne({
                $or: [{ ID: studentId }, { Phone: recipientPhone }]
            }).select('zaloChatId').lean();

            const targetChatId = studentDoc?.zaloChatId || process.env.ZALO_BOT_DEFAULT_CHAT_ID || null;
            if (targetChatId) {
                try {
                    const botRes = await fetch(`https://bot-api.zaloplatforms.com/bot${botToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: String(targetChatId),
                            text: fullMessage
                        })
                    });
                    const botData = await botRes.json();
                    if (botData.ok) {
                        status = 'SENT';
                        sentViaBot = true;
                    } else {
                        errorMessage = botData.description || 'Lỗi gửi tin qua Zalo Bot';
                    }
                } catch (botErr) {
                    errorMessage = botErr.message;
                }
            }
        }

        // 2. Nếu chưa liên kết Bot chat_id hoặc Bot lỗi, chạy fallback AppScript / Simulation
        if (!sentViaBot) {
            const zaloResult = await actionZalo({
                phone: recipientPhone,
                actionType: type,
                message: fullMessage
            }).catch(err => ({ status: false, message: err.message }));

            if (zaloResult && zaloResult.status === false) {
                status = 'SIMULATED';
                errorMessage = zaloResult.message || 'Chờ phụ huynh nhắn tin kết nối với Bot 135Tiet';
            }
        }
    } catch (err) {
        status = 'SIMULATED';
        errorMessage = err.message || 'Simulation fallback';
    }

    // Ghi nhận lịch sử vào ZaloMessageLog
    try {
        await ZaloMessageLog.create({
            recipientPhone,
            studentId,
            studentName,
            courseId: courseId || null,
            lessonId: lessonId || null,
            type,
            title,
            content,
            actionUrl,
            status,
            errorMessage,
            metadata
        });
    } catch (logErr) {
        console.error('[ZALO_AUTOMATION] Lỗi ghi log:', logErr);
    }

    return { success: true, status, recipientPhone, type };
}

/**
 * 1. THÔNG BÁO KHI PHỤ HUYNH XIN NGHỈ PHÉP
 * - Bắn thông báo nội bộ (In-App Notification) cho Giáo viên + Học vụ
 * - Gửi tin Zalo xác nhận đến phụ huynh
 */
export async function sendLeaveRequestNotifications({
    student,
    course,
    lesson,
    fullReason
}) {
    await connectDB();

    const lessonIndex = lesson.index || '•';
    const topicName = lesson.TopicName || 'Buổi học Robotics';
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const portalUrl = `${baseUrl}/parent`;

    // A. Bắn thông báo nội bộ hệ thống cho Giáo viên & Học vụ
    try {
        await createNotification({
            title: `Đơn xin nghỉ: ${student.Name} (${student.ID})`,
            content: `Phụ huynh em ${student.Name} vừa gửi đơn xin nghỉ Buổi ${lessonIndex} (${topicName}) lớp ${course.ID}. Lý do: ${fullReason}`,
            type: 'STUDENT_LEAVE_REQUEST',
            level: 'INFO',
            priority: 2,
            ref_course: course._id,
            ref_lesson: lesson._id,
            ref_teacher: lesson.Teacher || course.TeacherHR,
            ref_student: student._id,
            targetRoles: ['teacher', 'hocvu', 'academic', 'admin'],
            userId: lesson.Teacher
        });
    } catch (notiErr) {
        console.error('[LEAVE_NOTI_ERROR] Lỗi gửi in-app notification:', notiErr);
    }

    // B. Gửi tin Zalo xác nhận lại cho phụ huynh
    if (student.Phone) {
        const title = 'Xác nhận đơn xin nghỉ phép';
        const content = `AIR Robotic xin xác nhận đã tiếp nhận đơn xin nghỉ của bé ${student.Name} cho Buổi ${lessonIndex}: "${topicName}".\n\nLý do: ${fullReason}.\nBộ phận Học vụ đã ghi nhận và sẽ liên hệ hỗ trợ sắp xếp lịch học bù cho bé.`;
        
        await dispatchZaloMessage({
            recipientPhone: student.Phone,
            studentId: student.ID,
            studentName: student.Name,
            courseId: course._id,
            lessonId: lesson._id,
            type: 'LEAVE_REQUEST_CONFIRMATION',
            title,
            content,
            actionUrl: portalUrl,
            metadata: { lessonIndex, fullReason }
        });
    }
}

/**
 * 2. THÔNG BÁO KHI PHỤ HUYNH HỦY ĐƠN XIN NGHỈ (CHO CON ĐI HỌC LẠI)
 */
export async function sendLeaveCancelNotifications({
    student,
    course,
    lesson
}) {
    await connectDB();

    const lessonIndex = lesson.index || '•';
    const topicName = lesson.TopicName || 'Buổi học Robotics';
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const portalUrl = `${baseUrl}/parent`;

    // Thông báo nội bộ cho Giáo viên & Học vụ
    try {
        await createNotification({
            title: `Hủy đơn nghỉ: ${student.Name} (${student.ID})`,
            content: `Phụ huynh em ${student.Name} đã HỦY đơn xin nghỉ Buổi ${lessonIndex} (${topicName}) lớp ${course.ID}. Bé sẽ đi học bình thường.`,
            type: 'STUDENT_LEAVE_CANCEL',
            level: 'INFO',
            priority: 3,
            ref_course: course._id,
            ref_lesson: lesson._id,
            ref_teacher: lesson.Teacher || course.TeacherHR,
            ref_student: student._id,
            targetRoles: ['teacher', 'hocvu', 'academic', 'admin'],
            userId: lesson.Teacher
        });
    } catch (notiErr) {
        console.error('[LEAVE_CANCEL_NOTI_ERROR] Lỗi gửi in-app notification:', notiErr);
    }

    // Gửi tin Zalo xác nhận hủy cho phụ huynh
    if (student.Phone) {
        const title = 'Khôi phục lịch học bình thường';
        const content = `AIR Robotic đã khôi phục lịch học của bé ${student.Name} cho Buổi ${lessonIndex}: "${topicName}". Thầy cô rất vui khi được đón con đến lớp đúng giờ!`;
        
        await dispatchZaloMessage({
            recipientPhone: student.Phone,
            studentId: student.ID,
            studentName: student.Name,
            courseId: course._id,
            lessonId: lesson._id,
            type: 'LEAVE_CANCEL_CONFIRMATION',
            title,
            content,
            actionUrl: portalUrl,
            metadata: { lessonIndex }
        });
    }
}

/**
 * 3. THÔNG BÁO ĐIỂM DANH TỨC THÌ (INSTANT CHECKIN)
 * - Checkin 1: Bé có mặt an toàn
 * - Checkin 2: Cảnh báo bé vắng mặt không phép
 * - Checkin 3: ĐÃ CÓ PHÉP -> TUYỆT ĐỐI KHÔNG GỬI CẢNH BÁO
 */
export async function sendInstantCheckinZaloNotification({
    studentId,
    courseId,
    lessonId,
    checkin
}) {
    // Nếu học sinh đã có phép (checkin === 3), bỏ qua không thông báo
    if (checkin === 3) {
        return { skipped: true, reason: 'EXCUSED_LEAVE' };
    }

    await connectDB();

    const courseQuery = mongoose.Types.ObjectId.isValid(courseId)
        ? { $or: [{ _id: courseId }, { ID: courseId }] }
        : { ID: courseId };
    const course = await PostCourse.findOne(courseQuery).lean();
    if (!course) return { success: false, reason: 'COURSE_NOT_FOUND' };

    const lesson = (course.Detail || []).find(d => String(d._id) === String(lessonId));
    const studentInfo = await Student.findOne({ ID: studentId }).lean();
    if (!studentInfo || !studentInfo.Phone) {
        return { success: false, reason: 'STUDENT_PHONE_NOT_FOUND' };
    }

    const nowTimeStr = dayjs().format('HH:mm - DD/MM/YYYY');
    const lessonTitle = lesson?.TopicName || 'Buổi học Robotics';
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const portalUrl = `${baseUrl}/parent`;

    if (checkin === 1) {
        // CÓ MẶT
        const title = `Điểm danh có mặt - ${studentInfo.Name}`;
        const content = `🔔 AIR Robotic Thông Báo:\nBé ${studentInfo.Name} đã có mặt tại lớp ${course.ID} (${lessonTitle}) lúc ${nowTimeStr}.\nChúc con có một buổi học thật vui và sáng tạo cùng Thầy Cô và các bạn!`;

        return dispatchZaloMessage({
            recipientPhone: studentInfo.Phone,
            studentId: studentInfo.ID,
            studentName: studentInfo.Name,
            courseId: course._id,
            lessonId: lesson?._id,
            type: 'INSTANT_CHECKIN_PRESENT',
            title,
            content,
            actionUrl: portalUrl,
            metadata: { checkin, checkinTime: nowTimeStr }
        });
    }

    if (checkin === 2) {
        // VẮNG MẶT KHÔNG PHÉP
        const title = `Cảnh báo vắng mặt - ${studentInfo.Name}`;
        const content = `⚠️ AIR Robotic Cảnh Báo:\nHiện tại đã vào giờ học nhưng trung tâm chưa thấy bé ${studentInfo.Name} có mặt tại lớp ${course.ID} (${lessonTitle}).\nNếu gia đình có việc bận đột xuất, Ba/Mẹ vui lòng mở Sổ liên lạc để báo nghỉ phép hoặc liên hệ trực tiếp với Thầy Cô quản lý lớp nhé!`;

        return dispatchZaloMessage({
            recipientPhone: studentInfo.Phone,
            studentId: studentInfo.ID,
            studentName: studentInfo.Name,
            courseId: course._id,
            lessonId: lesson?._id,
            type: 'INSTANT_CHECKIN_ABSENT',
            title,
            content,
            actionUrl: portalUrl,
            metadata: { checkin, checkinTime: nowTimeStr }
        });
    }

    return { skipped: true };
}

/**
 * 4. NHẮC LỊCH HỌC THÔNG MINH (SMART SCHEDULE REMINDER)
 * Quét các buổi học diễn ra vào ngày mai (targetDate).
 * Bỏ qua học sinh đã có phép (Checkin === 3).
 */
export async function sendSmartScheduleReminders(targetDateInput = null) {
    await connectDB();

    // Mặc định là ngày mai
    const targetDate = targetDateInput 
        ? dayjs(targetDateInput) 
        : dayjs().add(1, 'day');

    const startOfDay = targetDate.startOf('day').toDate();
    const endOfDay = targetDate.endOf('day').toDate();

    // Tìm tất cả các khóa học có buổi học trong ngày targetDate
    const courses = await PostCourse.find({
        'Detail.Day': { $gte: startOfDay, $lte: endOfDay }
    }).populate('Detail.Topic', 'Name Slide').lean();

    let processedCount = 0;
    let remindersSent = 0;
    let skippedExcused = 0;
    const details = [];

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

    for (const course of courses) {
        const matchingLessons = (course.Detail || []).filter(d => {
            const dDate = new Date(d.Day);
            return dDate >= startOfDay && dDate <= endOfDay;
        });

        for (const lesson of matchingLessons) {
            processedCount++;
            const topicName = lesson.TopicName || lesson.Topic?.Name || 'Chủ đề Robotics';
            const lessonDateFormatted = dayjs(lesson.Day).format('DD/MM/YYYY');
            const lessonTime = lesson.Time || '08:30 - 10:00';
            const roomName = lesson.Room || 'Phòng Lab sáng tạo';

            for (const stu of (course.Student || [])) {
                const learn = (stu.Learn || []).find(l => String(l.Lesson) === String(lesson._id));
                const checkin = learn ? learn.Checkin : 0;

                // QUY TẮC: Nếu học sinh ĐÃ CÓ PHÉP (checkin === 3), KHÔNG GỬI NHẮC LỊCH
                if (checkin === 3) {
                    skippedExcused++;
                    details.push({
                        studentId: stu.ID,
                        status: 'SKIPPED_EXCUSED',
                        lessonId: lesson._id
                    });
                    continue;
                }

                // Kiểm tra xem hôm nay đã gửi nhắc lịch buổi này chưa (chống spam trùng)
                const alreadySent = await ZaloMessageLog.findOne({
                    studentId: stu.ID,
                    lessonId: lesson._id,
                    type: 'SMART_SCHEDULE_REMINDER',
                    sentAt: { $gte: dayjs().startOf('day').toDate() }
                }).lean();

                if (alreadySent) {
                    continue;
                }

                // Lấy thông tin học sinh & SĐT
                const studentDoc = await Student.findOne({ ID: stu.ID }).select('Name Phone').lean();
                if (!studentDoc || !studentDoc.Phone) {
                    continue;
                }

                const title = `Nhắc lịch học ngày mai - ${studentDoc.Name}`;
                const content = `📅 AIR Robotic Nhắc Lịch Học:\nNgày mai (${lessonDateFormatted}), bé ${studentDoc.Name} có lịch học buổi tiếp theo:\n• Chủ đề: ${topicName}\n• Thời gian: ${lessonTime}\n• Địa điểm: ${roomName}\n\nBa/Mẹ vui lòng đưa bé đến lớp đúng giờ để con kịp khởi động cùng các bạn nhé!`;
                const actionUrl = `${baseUrl}/parent`;

                await dispatchZaloMessage({
                    recipientPhone: studentDoc.Phone,
                    studentId: studentDoc.ID,
                    studentName: studentDoc.Name,
                    courseId: course._id,
                    lessonId: lesson._id,
                    type: 'SMART_SCHEDULE_REMINDER',
                    title,
                    content,
                    actionUrl,
                    metadata: { lessonDay: lesson.Day, lessonTime, topicName }
                });

                remindersSent++;
                details.push({
                    studentId: stu.ID,
                    status: 'SENT',
                    recipientPhone: studentDoc.Phone,
                    topicName
                });
            }
        }
    }

    return {
        success: true,
        targetDate: targetDate.format('YYYY-MM-DD'),
        coursesCount: courses.length,
        lessonsCount: processedCount,
        remindersSent,
        skippedExcused,
        details
    };
}

/**
 * 5. BÁO CÁO SAU BUỔI HỌC (POST-SESSION DIGEST)
 * Tự động gửi tin nhắn Zalo kèm link xem nhận xét và album ảnh thực hành
 */
export async function sendPostSessionDigestZaloNotification({
    courseId,
    studentId,
    lessonId,
    commentText
}) {
    if (!commentText || !commentText.trim()) return { skipped: true };

    await connectDB();

    const courseObjectId = mongoose.Types.ObjectId.isValid(courseId)
        ? new mongoose.Types.ObjectId(courseId)
        : null;
    const courseQuery = courseObjectId
        ? { $or: [{ _id: courseObjectId }, { ID: courseId }] }
        : { ID: courseId };
    const course = await PostCourse.findOne(courseQuery).lean();
    if (!course) return { success: false, reason: 'COURSE_NOT_FOUND' };

    const lesson = (course.Detail || []).find(d => String(d._id) === String(lessonId));
    const studentDoc = await Student.findOne({ ID: studentId }).select('Name Phone').lean();
    if (!studentDoc || !studentDoc.Phone) return { success: false, reason: 'PHONE_NOT_FOUND' };

    const topicName = lesson?.TopicName || 'Buổi học Robotics';
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const sessionUrl = `${baseUrl}/parent/session/${lessonId}`;

    const title = `Báo cáo nhận xét buổi học - ${studentDoc.Name}`;
    const content = `🌟 AIR Robotic Báo Cáo Buổi Học:\nThầy/Cô vừa hoàn thành nhận xét buổi học "${topicName}" của bé ${studentDoc.Name}:\n\n"${commentText}"\n\nKính mời Ba/Mẹ bấm vào đường link dưới đây để xem chi tiết nhận xét & ngắm nhìn album ảnh/video thực hành của con hôm nay!`;

    return dispatchZaloMessage({
        recipientPhone: studentDoc.Phone,
        studentId: studentDoc.ID,
        studentName: studentDoc.Name,
        courseId: course._id,
        lessonId: lesson?._id,
        type: 'POST_SESSION_DIGEST',
        title,
        content,
        actionUrl: sessionUrl,
        metadata: { commentSnippet: commentText.slice(0, 100) }
    });
}
