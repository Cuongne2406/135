import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import MakeupSession from '@/models/makeupSession';
import Student from '@/models/student';
import '@/models/book';
import '@/models/users';
import { verifyParentToken, PARENT_COOKIE_NAME } from '@/utils/parentAuth';
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

        const learnIndex = (course.Student[stuIndex].Learn || []).findIndex(
            l => String(l.Lesson) === String(lessonId)
        );

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
        await MakeupSession.findOneAndUpdate(
            {
                studentId: activeStudentId,
                course: course._id,
                lesson: lesson._id
            },
            {
                $set: {
                    makeupStatus: 'MAKEUP_PENDING',
                    originalDate: lesson.Day,
                    absenceReason: fullReason,
                    note: 'Phụ huynh gửi đơn xin nghỉ trực tuyến từ Sổ liên lạc'
                }
            },
            { upsert: true, new: true }
        );

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

        const stuIndex = course.Student.findIndex(s => s.ID === activeStudentId);
        if (stuIndex !== -1) {
            const learnIndex = (course.Student[stuIndex].Learn || []).findIndex(
                l => String(l.Lesson) === String(lessonId)
            );

            if (learnIndex !== -1) {
                // Đưa trạng thái về 0 (Chưa điểm danh) và xóa lý do vắng
                course.Student[stuIndex].Learn[learnIndex].Checkin = 0;
                course.Student[stuIndex].Learn[learnIndex].absenceReason = '';
                course.Student[stuIndex].Learn[learnIndex].makeupStatus = 'NOT_REQUIRED';
                await course.save();
            }
        }

        // Cập nhật MakeupSession thành MAKEUP_CANCELLED hoặc xóa
        await MakeupSession.deleteOne({
            studentId: activeStudentId,
            course: course._id,
            lesson: lessonId
        });

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
