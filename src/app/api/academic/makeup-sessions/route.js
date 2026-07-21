import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import MakeupSession from '@/models/makeupSession'
import PostCourse from '@/models/course'
import PostStudent from '@/models/student'
import authenticate from '@/utils/authenticate'
import mongoose from 'mongoose'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const status = searchParams.get('status')
        const courseId = searchParams.get('courseId')
        const studentId = searchParams.get('studentId')

        await connectDB()
        const filter = {}
        if (status) filter.makeupStatus = status
        if (courseId) filter.course = new mongoose.Types.ObjectId(courseId)
        if (studentId) filter.studentId = studentId

        const sessions = await MakeupSession.find(filter)
            .populate('course', 'ID Name')
            .populate('makeupTeacher', 'name')
            .populate('createdBy', 'name')
            .populate('updatedBy', 'name')
            .sort({ createdAt: -1 })
            .lean()

        const studentIds = [...new Set(sessions.map(s => s.studentId))]
        const students = studentIds.length > 0
            ? await PostStudent.find({ ID: { $in: studentIds } }, 'ID Name _id').lean()
            : []
        const studentMap = new Map(students.map(s => [s.ID, s]))

        const items = sessions.map(s => ({
            ...s,
            studentName: studentMap.get(s.studentId)?.Name || 'N/A',
        }))

        return NextResponse.json({ items })
    } catch (err) {
        console.error('Makeup sessions list error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function POST(req) {
    try {
        const auth = await authenticate(req)
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const body = await req.json()
        const { courseId, lessonId, studentId, ...rest } = body

        if (!courseId || !lessonId || !studentId) {
            return NextResponse.json({ error: 'Thiếu courseId, lessonId hoặc studentId' }, { status: 400 })
        }

        await connectDB()

        const session = await MakeupSession.create({
            course: new mongoose.Types.ObjectId(courseId),
            lesson: new mongoose.Types.ObjectId(lessonId),
            studentId,
            ...rest,
            createdBy: auth.user._id,
            makeupStatus: rest.makeupStatus || 'MAKEUP_PENDING'
        })

        await PostCourse.updateOne(
            { _id: new mongoose.Types.ObjectId(courseId), 'Student.ID': studentId, 'Student.Learn.Lesson': new mongoose.Types.ObjectId(lessonId) },
            { $set: { 'Student.$[stu].Learn.$[les].makeupStatus': session.makeupStatus } },
            { arrayFilters: [{ 'stu.ID': studentId }, { 'les.Lesson': new mongoose.Types.ObjectId(lessonId) }] }
        )

        return NextResponse.json({ session }, { status: 201 })
    } catch (err) {
        console.error('Create makeup session error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
