import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import authenticate from '@/utils/authenticate'
import { getNotificationDetail } from '@/data/database/notification'
import NotificationRecipient from '@/models/notificationRecipient'
import NotificationLog from '@/models/notificationLog'

export async function GET(request, { params }) {
  try {
    const { user } = await authenticate(request)
    await connectDB()
    const { id } = await params

    const notification = await getNotificationDetail(id)
    if (!notification) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy thông báo' }, { status: 404 })
    }

    const recipient = await NotificationRecipient.findOne({ notification: id, user: user._id })
    if (!recipient) {
      return NextResponse.json({ success: false, error: 'Bạn không có quyền xem thông báo này' }, { status: 403 })
    }

    if (recipient.status === 'UNREAD') {
      recipient.status = 'READ'
      recipient.read_at = new Date()
      await recipient.save()
      await NotificationLog.create({
        notification: id,
        actor: user.name || user._id.toString(),
        actor_id: user._id,
        action: 'VIEW',
        old_status: 'UNREAD',
        new_status: 'READ',
      })
    }

    return NextResponse.json({ success: true, data: notification })
  } catch (error) {
    console.error('GET /api/notifications/[id] error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
