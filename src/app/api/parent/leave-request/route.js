import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import MakeupSession from '@/models/makeupSession';
import Student from '@/models/student';
import '@/models/book';
import '@/models/users';
import { verifyParentToken, PARENT_COOKIE_NAME, isLeaveRequestAllowed } from '@/utils/parentAuth';
import { isValidInitialStatus, isValidTransition } from '@/lib/makeupFsm';
import { 
    sendLeaveRequestNotifications, 
    sendLeaveCancelNotifications 
} from '@/services/zaloAutomation.service';

export async function POST(request) {
    try {
        const token = request.cookies.get(PARENT_COOKIE_NAME)?.value;
        const decoded = verifyParentToken(token);

        if (!decoded || !decoded.phone) {
            return NextResponse.json({
                success: false,
                mes: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
            }, { status: 401 });
        }

        const body = await request.json();
        const { lessonId, reason, note } = body;

        if (!lessonId) {
            return NextResponse.json({
                success: false,
                mes: 'Thiếu mã buổi học (lessonId).'
            }, { status: 400 });
        }

        if (!reason || !reason.trim()) {
            return NextResponse.json({
                success: false,
                mes: 'Vui lòng chọn hoặc nhập lý do xin nghỉ.'
            }, { status: 400 });
        }

        await connectDB();

        const activeStudentId = decoded.activeStudentId;

        // 1. Tìm khóa học chứa buổi học này và học sinh đang chọn
        const course = await PostCourse.findOne({
            'Detail._id': lessonId,
            'Student.ID': activeStudentId
        });

        if (!course) {
            return NextResponse.json({
                success: false,
                mes: 'Không tìm thấy thông tin khóa học hoặc học viên trong lớp.'
            }, { status: 404 });
        }

        const lesson = course.Detail.find(d => String(d._id) === String(lessonId));
        if (!lesson) {
            return NextResponse.json({
                success: false,
                mes: 'Không tìm thấy buổi học trong khóa.'
            }, { status: 404 });
        }

        // Kiểm tra thời hạn báo nghỉ: tối đa 1 tiếng sau khi giờ học bắt đầu
        const leaveCheck = isLeaveRequestAllowed(lesson.Day, lesson.Time);
        if (!leaveCheck.allowed) {
            return NextResponse.json({
                success: false,
                mes: 'Đã quá thời hạn báo nghỉ phép (chỉ hỗ trợ tối đa 1 tiếng sau khi giờ học bắt đầu). Quý phụ huynh vui lòng liên hệ trực tiếp với văn phòng hoặc giáo viên.'
            }, { status: 400 });
        }

        const fullReason = note && note.trim()
            ? `${reason.trim()} (${note.trim()})`
            : reason.trim();

        // 2. Cập nhật trạng thái trong mảng Student.Learn của khóa học
        // Checkin: 3 = Vắng có phép
        const stuIndex = course.Student.findIndex(s => s.ID === activeStudentId);
        if (stuIndex === -1) {
            return NextResponse.json({
                success: false,
                mes: 'Không tìm thấy học sinh trong khóa học.'
            }, { status: 404 });
        }

        const studentLearn = course.Student[stuIndex].Learn || [];
        const learnIndex = studentLearn.findIndex(
            l => String(l.Lesson) === String(lessonId)
        );
        const existingLearn = learnIndex !== -1 ? studentLearn[learnIndex] : null;

        // Bảo vệ Lớp 1: không ghi đè nếu giáo viên đã điểm danh (1: Có mặt, 2: Vắng không phép)
        if (existingLearn && existingLearn.Checkin !== 0 && existingLearn.Checkin !== 3) {
            return NextResponse.json({
                success: false,
                mes: 'Buổi học đã được giáo viên điểm danh, không thể gửi đơn xin nghỉ trực tuyến.'
            }, { status: 400 });
        }

        // Kiểm tra FSM Lớp 2 trước khi tạo/cập nhật yêu cầu học bù
        const existingMakeup = await MakeupSession.findOne({
            studentId: activeStudentId,
            course: course._id,
            lesson: lesson._id
        }).sort({ createdAt: -1 }).lean();

        const currentStatus = existingMakeup?.makeupStatus || existingLearn?.makeupStatus || 'NOT_REQUIRED';

        if (!existingMakeup && currentStatus === 'NOT_REQUIRED') {
            if (!isValidInitialStatus('MAKEUP_PENDING')) {
                return NextResponse.json({
                    success: false,
                    mes: 'Trạng thái khởi tạo MAKEUP_PENDING không hợp lệ.'
                }, { status: 400 });
            }
        } else if (!isValidTransition(currentStatus, 'MAKEUP_PENDING')) {
            return NextResponse.json({
                success: false,
                mes: `Không thể gửi đơn xin nghỉ khi trạng thái học bù đang là ${currentStatus} theo quy tắc FSM.`
            }, { status: 400 });
        }

        if (learnIndex !== -1) {
            course.Student[stuIndex].Learn[learnIndex].Checkin = 3;
            course.Student[stuIndex].Learn[learnIndex].absenceReason = fullReason;
            course.Student[stuIndex].Learn[learnIndex].makeupStatus = 'MAKEUP_PENDING';
        } else {
            course.Student[stuIndex].Learn.push({
                Lesson: lesson._id,
                Checkin: 3,
                absenceReason: fullReason,
                makeupStatus: 'MAKEUP_PENDING',
                Cmt: [],
                CmtFn: '',
                Image: []
            });
        }

        await course.save();

        // 3. Tự động ghi nhận / cập nhật vào MakeupSession để Học vụ tiện theo dõi
        if (existingMakeup) {
            await MakeupSession.findByIdAndUpdate(
                existingMakeup._id,
                {
                    $set: {
                        originalDate: lesson.Day,
                        absenceReason: fullReason,
                        note: 'Phụ huynh gửi/cập nhật đơn xin nghỉ trực tuyến từ Sổ liên lạc'
                    }
                },
                { new: true, runValidators: true }
            );
        } else {
            await MakeupSession.create({
                studentId: activeStudentId,
                course: course._id,
                lesson: lesson._id,
                makeupStatus: 'MAKEUP_PENDING',
                originalDate: lesson.Day,
                absenceReason: fullReason,
                note: 'Phụ huynh gửi đơn xin nghỉ trực tuyến từ Sổ liên lạc'
            });
        }

        // 4. Kích hoạt thông báo tự động (In-App SSE cho GV/Học vụ + Tin Zalo xác nhận cho Phụ huynh)
        const studentDoc = await Student.findOne({ ID: activeStudentId }).lean();
        sendLeaveRequestNotifications({
            student: studentDoc || { ID: activeStudentId, Name: 'Học viên' },
            course,
            lesson,
            fullReason
        }).catch(err => console.error('[SEND_LEAVE_NOTI_FAIL]', err));

        return NextResponse.json({
            success: true,
            mes: 'Đã gửi đơn xin nghỉ phép thành công! Học vụ và Thầy/Cô đã ghi nhận thông tin.',
            absenceReason: fullReason
        });

    } catch (error) {
        console.error('[API_PARENT_LEAVE_REQUEST_ERROR]', error);
        return NextResponse.json({
            success: false,
            mes: error.message || 'Lỗi khi gửi đơn xin nghỉ phép.'
        }, { status: 500 });
    }
}

// Xử lý Hủy đơn xin nghỉ phép (khi phụ huynh đổi ý cho con đi học lại bình thường)
export async function DELETE(request) {
    try {
        const token = request.cookies.get(PARENT_COOKIE_NAME)?.value;
        const decoded = verifyParentToken(token);

        if (!decoded || !decoded.phone) {
            return NextResponse.json({
                success: false,
                mes: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
            }, { status: 401 });
        }

        const body = await request.json();
        const { lessonId } = body;

        if (!lessonId) {
            return NextResponse.json({
                success: false,
                mes: 'Thiếu mã buổi học (lessonId).'
            }, { status: 400 });
        }

        await connectDB();
        const activeStudentId = decoded.activeStudentId;

        const course = await PostCourse.findOne({
            'Detail._id': lessonId,
            'Student.ID': activeStudentId
        });

        if (!course) {
            return NextResponse.json({
                success: false,
                mes: 'Không tìm thấy thông tin khóa học hoặc học viên trong lớp.'
            }, { status: 404 });
        }

        const targetLesson = (course.Detail || []).find(d => String(d._id) === String(lessonId));
        if (targetLesson) {
            const leaveCheck = isLeaveRequestAllowed(targetLesson.Day, targetLesson.Time);
            if (!leaveCheck.allowed) {
                return NextResponse.json({
                    success: false,
                    mes: 'Không thể hủy đơn xin nghỉ do buổi học đã bắt đầu quá 1 tiếng hoặc đã diễn ra trong quá khứ.'
                }, { status: 400 });
            }
        }

        const stuIndex = course.Student.findIndex(s => s.ID === activeStudentId);
        if (stuIndex === -1) {
            return NextResponse.json({
                success: false,
                mes: 'Không tìm thấy học sinh trong khóa học.'
            }, { status: 404 });
        }

        const studentLearn = course.Student[stuIndex].Learn || [];
        const learnIndex = studentLearn.findIndex(
            l => String(l.Lesson) === String(lessonId)
        );
        const existingLearn = learnIndex !== -1 ? studentLearn[learnIndex] : null;
        const lessonOid = targetLesson?._id || lessonId;

        const existingMakeup = await MakeupSession.findOne({
            studentId: activeStudentId,
            course: course._id,
            lesson: lessonOid
        }).sort({ createdAt: -1 }).lean();

        if (!existingLearn && !existingMakeup) {
            return NextResponse.json({
                success: false,
                mes: 'Không tìm thấy đơn xin nghỉ phép để hủy.'
            }, { status: 404 });
        }

        if (existingLearn && existingLearn.Checkin !== 3) {
            const msg = (existingLearn.Checkin === 1 || existingLearn.Checkin === 2)
                ? 'Buổi học đã được giáo viên điểm danh, không thể hủy đơn xin nghỉ.'
                : 'Buổi học hiện chưa có đơn xin nghỉ phép để hủy.';
            return NextResponse.json({ success: false, mes: msg }, { status: 400 });
        }

        const currentStatus = existingMakeup?.makeupStatus || existingLearn?.makeupStatus || 'NOT_REQUIRED';

        // Quy trình nghiệp vụ: Khi Học vụ đã xếp lịch bù (MAKEUP_SCHEDULED), phụ huynh phải liên hệ Học vụ chứ không tự ý hủy trên hệ thống
        if (currentStatus === 'MAKEUP_SCHEDULED') {
            return NextResponse.json({
                success: false,
                mes: 'Buổi học bù đã được Học vụ xếp lịch (MAKEUP_SCHEDULED). Quý phụ huynh vui lòng liên hệ trực tiếp Học vụ để thay đổi hoặc hủy lịch học bù.'
            }, { status: 400 });
        }

        if (!isValidTransition(currentStatus, 'MAKEUP_CANCELLED')) {
            return NextResponse.json({
                success: false,
                mes: `Không thể hủy đơn xin nghỉ từ trạng thái ${currentStatus} theo quy tắc FSM.`
            }, { status: 400 });
        }

        // Đưa Lớp 1 về 0 (Chưa điểm danh) và chuyển Lớp 2 sang MAKEUP_CANCELLED theo đúng FSM
        if (learnIndex !== -1) {
            course.Student[stuIndex].Learn[learnIndex].Checkin = 0;
            course.Student[stuIndex].Learn[learnIndex].absenceReason = '';
            course.Student[stuIndex].Learn[learnIndex].makeupStatus = 'MAKEUP_CANCELLED';
            await course.save();
        }

        if (existingMakeup) {
            await MakeupSession.findByIdAndUpdate(
                existingMakeup._id,
                {
                    $set: {
                        makeupStatus: 'MAKEUP_CANCELLED',
                        note: existingMakeup.note
                            ? `${existingMakeup.note} | Phụ huynh đã hủy đơn xin nghỉ`
                            : 'Phụ huynh đã hủy đơn xin nghỉ'
                    }
                },
                { new: true, runValidators: true }
            );
        }

        // Kích hoạt thông báo hủy đơn cho GV/Học vụ và xác nhận qua Zalo cho Phụ huynh
        const studentDoc = await Student.findOne({ ID: activeStudentId }).lean();
        const lessonDoc = (course.Detail || []).find(d => String(d._id) === String(lessonId));
        sendLeaveCancelNotifications({
            student: studentDoc || { ID: activeStudentId, Name: 'Học viên' },
            course,
            lesson: lessonDoc || { _id: lessonId }
        }).catch(err => console.error('[SEND_CANCEL_NOTI_FAIL]', err));

        return NextResponse.json({
            success: true,
            mes: 'Đã hủy đơn xin nghỉ phép. Trạng thái buổi học đã được khôi phục.'
        });

    } catch (error) {
        console.error('[API_PARENT_CANCEL_LEAVE_ERROR]', error);
        return NextResponse.json({
            success: false,
            mes: error.message || 'Lỗi khi hủy đơn xin nghỉ phép.'
        }, { status: 500 });
    }
}
