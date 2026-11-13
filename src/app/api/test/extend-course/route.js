import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import { Types } from 'mongoose'

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Endpoint test extend-course bị vô hiệu hóa trên môi trường Production' }, { status: 403 });
    }
    try {
        await connectDB()
        const results = []
        const courses = await PostCourse.find({
            'Detail.Type': 'Học bù'
        }).lean()

        for (const course of courses) {
            const makeupSessions = course.Detail.filter(d => d.Type === 'Học bù')
            let totalStudents = 0
            let totalLearnEntries = 0
            let missingLearn = 0

            for (const ses of makeupSessions) {
                const sesId = ses._id instanceof Types.ObjectId ? ses._id : new Types.ObjectId(ses._id)
                for (const student of (course.Student || [])) {
                    totalStudents++
                    const matching = (student.Learn || []).filter(l => {
                        const lessonId = l.Lesson instanceof Types.ObjectId ? l.Lesson : l.Lesson?._id
                        return lessonId && lessonId.toString() === sesId.toString()
                    })
                    totalLearnEntries += matching.length
                    if (matching.length === 0) missingLearn++
                }
            }

            const expectedEntries = (course.Student || []).length * makeupSessions.length
            results.push({
                course: course.ID,
                numStudents: (course.Student || []).length,
                makeupSessions: makeupSessions.length,
                totalLearnEntries,
                expectedEntries,
                missingLearn,
                ok: totalLearnEntries === expectedEntries
            })
        }

        return NextResponse.json({ success: true, results })
    } catch (err) {
        console.error('[VERIFY_EXTEND_ERROR]', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
