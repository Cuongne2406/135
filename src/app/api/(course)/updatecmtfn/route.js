import { NextResponse } from 'next/server'
import PostCourse from '@/models/course'
import TrialCourse from '@/models/coursetry'
import connectDB from '@/config/connectDB'
import mongoose from 'mongoose'
import jsonRes, { corsHeaders } from '@/utils/response'
import { Re_coursetry } from '@/data/course'
import authenticate from '@/utils/authenticate'
import { sendPostSessionDigestZaloNotification } from '@/services/zaloAutomation.service'

const CORS_HEADERS = corsHeaders

export async function POST(req) {
    try {
        const { user } = await authenticate(req);
        if (!user) {
            return jsonRes(401, { status: false, mes: 'Chưa đăng nhập.', data: null });
        }
        const isAdminOrAcademic = user.role.includes('Admin') || user.role.includes('Academic');
        if (!isAdminOrAcademic && !user.role.includes('Teacher')) {
            return jsonRes(403, { status: false, mes: 'Bạn không có quyền chỉnh sửa nhận xét.', data: null });
        }

        const { courseId, studentId, lessonId, commentText } = await req.json()
        if (!courseId || !studentId || !lessonId || commentText === undefined) {
            return jsonRes(400, { status: false, mes: "Request body must include 'courseId', 'studentId', 'lessonId', and 'commentText'.", data: null })
        }

        await connectDB()

        if (!isAdminOrAcademic) {
            const courseDoc = await PostCourse.findById(courseId).select('TeacherHR Detail').lean();
            if (courseDoc) {
                const isTeacherOfLesson = String(courseDoc.TeacherHR) === String(user._id) ||
                    courseDoc.Detail?.some(d => String(d._id) === String(lessonId) && (String(d.Teacher) === String(user._id) || String(d.TeachingAs) === String(user._id)));
                if (!isTeacherOfLesson) {
                    return jsonRes(403, { status: false, mes: 'Bạn không có quyền chỉnh sửa nhận xét của lớp này.', data: null });
                }
            } else {
                const trialDoc = await TrialCourse.findById(courseId).select('sessions').lean();
                const sessionItem = trialDoc?.sessions?.find(s => String(s._id) === String(lessonId));
                const isTrialTeacher = sessionItem && (String(sessionItem.teacher) === String(user._id) || String(sessionItem.teachingAs) === String(user._id));
                if (!isTrialTeacher) {
                    return jsonRes(403, { status: false, mes: 'Bạn không có quyền chỉnh sửa nhận xét của buổi học thử này.', data: null });
                }
            }
        }

        const courseObjectId = mongoose.Types.ObjectId.isValid(courseId) 
            ? new mongoose.Types.ObjectId(courseId) 
            : null;

        let result = await PostCourse.updateOne(
            { $or: [courseObjectId ? { _id: courseObjectId } : null, { ID: courseId }].filter(Boolean) },
            { $set: { 'Student.$[stu].Learn.$[les].CmtFn': commentText } },
            {
                arrayFilters: [
                    { 'stu.ID': studentId },
                    { 'les.Lesson': new mongoose.Types.ObjectId(lessonId) }
                ]
            }
        );

        if (result.matchedCount === 0) {
            result = await TrialCourse.updateOne(
                { $or: [courseObjectId ? { _id: courseObjectId } : null, { ID: courseId }].filter(Boolean) },
                { $set: { 'sessions.$[ses].students.$[stu].cmt': commentText } },
                { arrayFilters: [{ 'ses._id': new mongoose.Types.ObjectId(lessonId) }, { 'stu.studentId': studentId }] }
            );
            if (result.matchedCount === 0) {
                return jsonRes(404, { status: false, mes: 'Course or student not found.', data: null });
            }
        }
        Re_coursetry();

        // Kích hoạt thông báo Zalo Báo cáo sau buổi học (kèm link mở Sổ liên lạc xem album ảnh & nhận xét)
        if (commentText && commentText.trim()) {
            await sendPostSessionDigestZaloNotification({
                courseId,
                studentId,
                lessonId,
                commentText: commentText.trim()
            }).catch(err => console.error('[POST_SESSION_ZALO_ERROR]', err));
        }

        return jsonRes(200, { status: true, mes: 'Comment updated successfully.', data: null })

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        return jsonRes(500, { status: false, mes: errorMessage, data: null })
    }
}

export async function OPTIONS() {
    return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}