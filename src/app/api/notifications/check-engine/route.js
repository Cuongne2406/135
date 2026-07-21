import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import authenticate from '@/utils/authenticate'
import PostCourse from '@/models/course'
import { checkLessonAfterEnd } from '@/function/notificationEngine'

export async function POST(request) {
  try {
    const { user } = await authenticate(request)
    if (!user.role.some(r => r.toLowerCase() === 'admin' || r.toLowerCase() === 'hocvu' || r === 'Academic')) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 403 })
    }

    const { course_id, lesson_id } = await request.json()

    if (course_id && lesson_id) {
      await checkLessonAfterEnd(course_id, lesson_id)
      return NextResponse.json({ success: true, message: 'Đã kiểm tra buổi học' })
    }

    await connectDB()
    const courses = await PostCourse.find({}).lean()
    let checked = 0

    for (const course of courses) {
      for (const lesson of (course.Detail || [])) {
        await checkLessonAfterEnd(course._id.toString(), lesson._id.toString())
        checked++
      }
    }

    return NextResponse.json({ success: true, message: `Đã kiểm tra ${checked} buổi học` })
  } catch (error) {
    console.error('Check engine error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
