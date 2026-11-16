import { NextResponse } from 'next/server'
import authenticate from '@/utils/authenticate'
import { escalateNotification } from '@/data/database/notification'

export async function POST(request, { params }) {
  try {
    const { user } = await authenticate(request)
    const { id } = await params
    const body = await request.json()

    const result = await escalateNotification(id, user._id, body.reason)
    if (!result) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy thông báo' }, { status: 404 })
    }
    return NextResponse.json({
      success: true,
      new_notification_id: result.new_notification?._id,
      level: 'INCIDENT'
    })
  } catch (error) {
    console.error('POST /api/notifications/[id]/escalate error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
