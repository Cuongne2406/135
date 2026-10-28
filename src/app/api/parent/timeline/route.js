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
                mes: 'Phiên đăng nhập đã hết hạn.'
            }, { status: 401 });
        }

        await connectDB();

        const student = await PostStudent.findOne({ ID: decoded.activeStudentId })
            .select('ID Name Avt')
            .lean();

        if (!student) {
            return NextResponse.json({ success: false, mes: 'Không tìm thấy học sinh.' }, { status: 404 });
        }

        const courses = await PostCourse.find({ 'Student.ID': student.ID })
            .populate('Book', 'Name Cover Topics')
            .populate('TeacherHR', 'name')
            .populate('Detail.Teacher', 'name')
            .populate('Detail.Room', 'name')
            .sort({ updatedAt: -1 })
            .lean();

        if (!courses || courses.length === 0) {
            return NextResponse.json({
                success: true,
                course: null,
                courses: [],
                lessons: []
            });
        }

        const url = new URL(request.url);
        const requestedCourseId = url.searchParams.get('courseId');

        let activeCourse = null;
        if (requestedCourseId) {
            activeCourse = courses.find(c => String(c._id) === requestedCourseId) || courses[0];
        } else {
            activeCourse = courses.find(c => c.Status === true) || courses[0];
        }

        const studentInCourse = activeCourse.Student?.find(s => s.ID === student.ID);
        const learnMap = new Map();
        (studentInCourse?.Learn || []).forEach(lr => {
            if (lr.Lesson) learnMap.set(String(lr.Lesson), lr);
        });

        const topicMap = new Map();
        if (activeCourse.Book?.Topics) {
            activeCourse.Book.Topics.forEach(t => topicMap.set(String(t._id), t));
        }

        const now = new Date();
        const lessons = (activeCourse.Detail || []).map((d, index) => {
            const lr = learnMap.get(String(d._id)) || {};
            const topic = topicMap.get(String(d.Topic)) || {};
            const lessonDate = new Date(d.Day);

            return {
                _id: String(d._id),
                index: index + 1,
                TopicName: topic.Name || 'Chủ đề bài học',
                Day: d.Day,
                Time: d.Time || '08:00 - 10:00',
                Room: d.Room?.name || 'Phòng Lab Robotics',
                Teacher: d.Teacher?.name || activeCourse.TeacherHR?.name || 'Giáo viên',
                Type: d.Type || 'Chính thức',
                Checkin: lr.Checkin ?? 0,
                CmtFn: lr.CmtFn || '',
                hasFeedback: Boolean(lr.CmtFn || (lr.Cmt && lr.Cmt.length > 0)),
                photoCount: (d.DetailImage?.length || 0) + (lr.Image?.length || 0),
                absenceReason: lr.absenceReason || '',
                isPast: lessonDate < now
            };
        });

        return NextResponse.json({
            success: true,
            activeCourseId: String(activeCourse._id),
            courses: courses.map(c => ({
                _id: String(c._id),
                ID: c.ID,
                BookName: c.Book?.Name || 'Chương trình Robotics',
                Status: c.Status,
                TotalLessons: c.Detail?.length || 0
            })),
            course: {
                _id: String(activeCourse._id),
                ID: activeCourse.ID,
                BookName: activeCourse.Book?.Name || 'Chương trình Robotics',
                TotalLessons: lessons.length
            },
            student: {
                ID: student.ID,
                Name: student.Name,
                Avt: srcImage(student.Avt)
            },
            lessons
        });
    } catch (error) {
        console.error('[API_PARENT_TIMELINE_ERROR]', error);
        return NextResponse.json({
            success: false,
            mes: error.message || 'Lỗi lấy lộ trình học tập.'
        }, { status: 500 });
    }
}
