import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import authenticate from '@/utils/authenticate'
import Notification from '@/models/notification'
import NotificationRecipient from '@/models/notificationRecipient'
import NotificationLog from '@/models/notificationLog'
import { createNotification } from '@/data/database/notification'

export async function POST(request, { params }) {
  try {
    const { user } = await authenticate(request)
    await connectDB()
    const { id } = await params
    const { target_role, message } = await request.json()

    const notification = await Notification.findById(id)
    if (!notification) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy thông báo' }, { status: 404 })
    }

    await NotificationLog.create({
      notification: id,
      actor: user.name || user._id.toString(),
      actor_id: user._id,
      action: 'REMIND',
      note: message || `Nhắc nhở ${target_role === 'teacher' ? 'giáo viên' : 'học vụ'}`,
    })

    const targetRoles = target_role === 'teacher' ? ['teacher'] : ['hocvu', 'Academic']
    await createNotification({
      title: `[Nhắc nhở] ${notification.title}`,
      content: message || `Nhắc nhở từ hệ thống: ${notification.content}`,
      type: 'INCIDENT',
      level: 'WARNING',
      ref_course: notification.ref_course,
      ref_lesson: notification.ref_lesson,
      ref_teacher: target_role === 'teacher' ? notification.ref_teacher : undefined,
      targetRoles,
      userId: user._id,
    })

    return NextResponse.json({ success: true })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('POST /api/notifications/[id]/remind error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
