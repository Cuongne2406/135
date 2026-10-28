import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostStudent from '@/models/student';
import PostCourse from '@/models/course';
import '@/models/book';
import '@/models/users';
import '@/models/area';
import { verifyParentToken, PARENT_COOKIE_NAME } from '@/utils/parentAuth';
import { srcImage } from '@/function';

export async function GET(request) {
    try {
        const token = request.cookies.get(PARENT_COOKIE_NAME)?.value;
        const decoded = verifyParentToken(token);

        if (!decoded || !decoded.phone) {
            return NextResponse.json({
                success: false,
                authenticated: false,
                mes: 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'
            }, { status: 401 });
        }

        await connectDB();

        // 1. Lấy thông tin học sinh hiện tại
        const student = await PostStudent.findOne({ ID: decoded.activeStudentId })
            .select('ID Name ParentName Phone Avt BD School Area Profile Course')
            .lean();

        if (!student) {
            return NextResponse.json({
                success: false,
                mes: 'Không tìm thấy thông tin học viên.'
            }, { status: 404 });
        }

        // 2. Lấy danh sách tất cả học sinh thuộc phụ huynh này để chuyển đổi nếu cần
        const allChildren = await PostStudent.find({ ID: { $in: decoded.studentIds || [student.ID] } })
            .select('ID Name Avt')
            .lean();

        // 3. Lấy tất cả khóa học của bé
        const courses = await PostCourse.find({ 'Student.ID': student.ID })
            .populate('Book', 'Name Cover Topics')
            .populate('TeacherHR', 'name phone avt')
            .populate('Area', 'name address')
            .populate('Detail.Teacher', 'name')
            .populate('Detail.TeachingAs', 'name')
            .populate('Detail.Room', 'name')
            .sort({ updatedAt: -1 })
            .lean();

        const url = new URL(request.url);
        const requestedCourseId = url.searchParams.get('courseId');

        let activeCourse = null;
        let studentLearnEntries = [];
        let stats = {
            totalLessons: 0,
            completedLessons: 0,
            presentCount: 0,
            excusedCount: 0,
            unexcusedCount: 0,
            attendanceRate: 100
        };

        let latestSession = null;
        let nextSession = null;
        const allUpcomingSessions = [];

        if (courses && courses.length > 0) {
            // Xác định khóa học đang xem
            if (requestedCourseId) {
                activeCourse = courses.find(c => String(c._id) === requestedCourseId) || courses[0];
            } else {
                activeCourse = courses.find(c => c.Status === true) || courses[0];
            }

            // Thu thập các buổi học sắp tới trên TẤT CẢ các khóa học đang theo học
            const now = new Date();
            courses.forEach(c => {
                const sInCourse = c.Student?.find(s => s.ID === student.ID);
                const lMap = new Map();
                (sInCourse?.Learn || []).forEach(lr => {
                    if (lr.Lesson) lMap.set(String(lr.Lesson), lr);
                });

                const tMap = new Map();
                if (c.Book?.Topics) {
                    c.Book.Topics.forEach(t => tMap.set(String(t._id), t));
                }

                (c.Detail || []).forEach((d, idx) => {
                    const lr = lMap.get(String(d._id)) || {};
                    const topicInfo = tMap.get(String(d.Topic)) || {};
                    const lessonDate = new Date(d.Day);
                    const checkin = lr.Checkin ?? 0;

                    // Buổi học chưa diễn ra hoặc đã báo nghỉ phép trước
                    if (lessonDate >= now && (checkin === 0 || checkin === 3)) {
                        allUpcomingSessions.push({
                            _id: String(d._id),
                            index: idx + 1,
                            TopicName: topicInfo.Name || 'Chủ đề buổi học',
                            Day: d.Day,
                            Time: d.Time || '08:00 - 10:00',
                            Room: d.Room?.name || 'Phòng học Lab',
                            Teacher: d.Teacher?.name || c.TeacherHR?.name || 'Thầy/Cô giáo',
                            Checkin: checkin,
                            absenceReason: lr.absenceReason || '',
                            makeupStatus: lr.makeupStatus || 'NOT_REQUIRED',
                            CourseId: String(c._id),
                            CourseName: c.Book?.Name || 'Chương trình Robotics',
                            TotalLessons: c.Detail?.length || 0,
                            lessonDate
                        });
                    }
                });
            });

            // Sắp xếp các buổi học sắp tới theo thứ tự thời gian gần nhất
            allUpcomingSessions.sort((a, b) => new Date(a.Day) - new Date(b.Day));

            // Lấy dữ liệu học tập của học sinh trong khóa đang chọn
            const studentInCourse = activeCourse.Student?.find(s => s.ID === student.ID);
            studentLearnEntries = studentInCourse?.Learn || [];

            const learnMap = new Map();
            studentLearnEntries.forEach(lr => {
                if (lr.Lesson) learnMap.set(String(lr.Lesson), lr);
            });

            // Map topic details
            const topicMap = new Map();
            if (activeCourse.Book?.Topics) {
                activeCourse.Book.Topics.forEach(t => {
                    topicMap.set(String(t._id), t);
                });
            }

            const lessons = (activeCourse.Detail || []).map((d, idx) => {
                const lr = learnMap.get(String(d._id)) || {};
                const topicInfo = topicMap.get(String(d.Topic)) || {};
                const lessonDate = new Date(d.Day);

                return {
                    _id: String(d._id),
                    index: idx + 1,
                    TopicName: topicInfo.Name || 'Chủ đề buổi học',
                    Day: d.Day,
                    Time: d.Time || '08:00 - 10:00',
                    Room: d.Room?.name || 'Phòng học Lab',
                    Teacher: d.Teacher?.name || activeCourse.TeacherHR?.name || 'Thầy/Cô giáo',
                    TeachingAs: d.TeachingAs?.name || '',
                    Type: d.Type || 'Chính thức',
                    Checkin: lr.Checkin ?? 0,
                    absenceReason: lr.absenceReason || '',
                    makeupStatus: lr.makeupStatus || 'NOT_REQUIRED',
                    Cmt: lr.Cmt || [],
                    CmtFn: lr.CmtFn || '',
                    Note: lr.Note || '',
                    StudentImages: (lr.Image || []).map(img => img.id),
                    DetailImages: (d.DetailImage || []).map(img => img.id),
                    isPast: lessonDate < now
                };
            });

            stats.totalLessons = lessons.length;
            stats.completedLessons = lessons.filter(l => (l.Checkin === 1 || l.Checkin === 2) || (l.isPast && l.Checkin !== 0)).length;
            stats.presentCount = lessons.filter(l => l.Checkin === 1).length;
            stats.excusedCount = lessons.filter(l => l.Checkin === 3).length;
            stats.unexcusedCount = lessons.filter(l => l.Checkin === 2).length;

            if (stats.completedLessons > 0) {
                stats.attendanceRate = Math.round(((stats.presentCount + stats.excusedCount) / stats.completedLessons) * 100);
            }

            // Tìm buổi học mới nhất đã diễn ra hoặc đang diễn ra của khóa này
            const pastLessons = lessons.filter(l => (l.Checkin > 0 && l.Checkin !== 3) || l.isPast);
            latestSession = pastLessons.length > 0 ? pastLessons[pastLessons.length - 1] : lessons[0] || null;

            // Tìm buổi học tiếp theo của khóa này
            const upcomingLessons = lessons.filter(l => !l.isPast && (l.Checkin === 0 || l.Checkin === 3));
            nextSession = upcomingLessons.length > 0 ? upcomingLessons[0] : null;
        }

        return NextResponse.json({
            success: true,
            student: {
                _id: student._id.toString(),
                ID: student.ID,
                Name: student.Name,
                ParentName: student.ParentName || 'Quý phụ huynh',
                Phone: student.Phone,
                Avt: srcImage(student.Avt),
                School: student.School || 'Chưa cập nhật',
                BD: student.BD
            },
            allChildren: allChildren.map(c => ({
                ID: c.ID,
                Name: c.Name,
                Avt: srcImage(c.Avt)
            })),
            courses: (courses || []).map(c => ({
                _id: String(c._id),
                ID: c.ID,
                BookName: c.Book?.Name || 'Chương trình Robotics & STEM',
                Cover: c.Book?.Cover || '',
                Status: c.Status,
                TotalLessons: c.Detail?.length || 0,
                TeacherHRName: c.TeacherHR?.name || 'Giảng viên'
            })),
            course: activeCourse ? {
                _id: String(activeCourse._id),
                ID: activeCourse.ID,
                BookName: activeCourse.Book?.Name || 'Chương trình Robotics & STEM',
                Cover: activeCourse.Book?.Cover || '',
                TeacherHR: activeCourse.TeacherHR ? {
                    name: activeCourse.TeacherHR.name,
                    phone: activeCourse.TeacherHR.phone,
                    avt: activeCourse.TeacherHR.avt
                } : null,
                Area: activeCourse.Area?.name || 'Trung tâm AIR'
            } : null,
            stats,
            latestSession,
            nextSession,
            upcomingSessions: allUpcomingSessions.slice(0, 5)
        });
    } catch (error) {
        console.error('[API_PARENT_OVERVIEW_ERROR]', error);
        return NextResponse.json({
            success: false,
            mes: error.message || 'Lỗi lấy dữ liệu tổng quan cho phụ huynh.'
        }, { status: 500 });
    }
}
