import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/config/connectDB';
import PostStudent from '@/models/student';
import PostCourse from '@/models/course';
import { revalidateTag } from 'next/cache';

export async function PATCH(request, { params }) {
    const { id: studentId } = await params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
        return NextResponse.json({ success: false, message: 'ID học sinh không hợp lệ.' }, { status: 400 });
    }

    let body;
    try {
        body = await request.json();
    } catch (error) {
        return NextResponse.json({ success: false, message: 'Request body không phải là JSON hợp lệ.' }, { status: 400 });
    }

    const { action, note, courseId } = body;

    if (!action || !note) {
        return NextResponse.json({ success: false, message: 'Action và lý do (note) là bắt buộc.' }, { status: 400 });
    }

    await dbConnect();

    try {
        const student = await PostStudent.findById(studentId);
        if (!student) {
            throw new Error('Không tìm thấy học sinh.');
        }

        switch (action) {
            case 'leave_permanently': {
                const studentCourseIds = student.Course.map(c => c.course);
                const activeCourses = await PostCourse.find({
                    _id: { $in: studentCourseIds },
                    Status: false,
                    'Student.ID': student.ID
                }, '_id').lean();

                const activeCourseIds = activeCourses.map(c => c._id);

                if (activeCourseIds.length > 0) {
                    await PostCourse.updateMany(
                        { _id: { $in: activeCourseIds }, 'Student.ID': student.ID },
                        { $pull: { 'Student.$.Learn': { Checkin: 0 } } }
                    );
                }

                const leaveStatus = { status: 0, act: 'nghỉ', date: new Date(), note };

                await PostStudent.updateOne(
                    { _id: studentId },
                    { $push: { Status: leaveStatus }, $set: { 'Course.$[elem].status': 1 } },
                    { arrayFilters: [{ 'elem.course': { $in: activeCourseIds } }] }
                );

                break;
            }

            case 'reactivate': {
                const preservedCourseIds = student.Course
                    .filter(c => c.status === 1)
                    .map(c => c.course);

                if (preservedCourseIds.length > 0) {
                    await PostStudent.updateOne(
                        { _id: studentId },
                        { $set: { 'Course.$[elem].status': 0 } },
                        { arrayFilters: [{ 'elem.course': { $in: preservedCourseIds } }] }
                    );
                }

                const reactivateStatus = { status: 2, act: 'học lại', date: new Date(), note };
                await PostStudent.updateOne(
                    { _id: studentId },
                    { $push: { Status: reactivateStatus } }
                );

                break;
            }

            case 'leave_course': {
                if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
                    throw new Error('ID khóa học không hợp lệ hoặc bị thiếu.');
                }

                await PostCourse.updateOne(
                    { _id: courseId, 'Student.ID': student.ID },
                    { $pull: { 'Student.$.Learn': { Checkin: 0 } } }
                );

                const studentUpdateOps = { $set: { 'Course.$[elem].status': 1 } };
                const studentUpdateOptions = {
                    arrayFilters: [{ 'elem.course': new mongoose.Types.ObjectId(courseId) }],
                    new: true
                };

                const otherCourseIds = student.Course
                    .filter(c => c.course.toString() !== courseId)
                    .map(c => c.course);

                let otherActiveCoursesCount = 0;
                if (otherCourseIds.length > 0) {
                    otherActiveCoursesCount = await PostCourse.countDocuments({
                        _id: { $in: otherCourseIds }, Status: false
                    });
                }

                if (otherActiveCoursesCount === 0) {
                    studentUpdateOps.$push = { Status: { status: 0, act: 'nghỉ', date: new Date(), note } };
                }

                await PostStudent.findByIdAndUpdate(studentId, studentUpdateOps, studentUpdateOptions);

                break;
            }

            default:
                throw new Error('Hành động không hợp lệ.');
        }

        revalidateTag('student', 'max');
        revalidateTag('course', 'max');

        const finalStudentData = await PostStudent.findById(studentId);

        return NextResponse.json({ success: true, message: "Cập nhật thành công và bảo toàn dữ liệu.", data: finalStudentData }, { status: 200 });

    } catch (error) {
        console.error('API Error:', error);

        const errorMessage = error.message || 'Lỗi máy chủ nội bộ.';
        const statusCode = error.message.includes('Không tìm thấy') ? 404 : 500;

        return NextResponse.json({ success: false, message: errorMessage, error: error.message }, { status: statusCode });
    }
}
