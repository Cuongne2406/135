import { NextResponse } from 'next/server'
import authenticate from '@/utils/authenticate'
import { closeNotification } from '@/data/database/notification'

export async function PUT(request, { params }) {
  try {
    const { user } = await authenticate(request)
    const { id } = await params
    const body = await request.json()

    const notification = await closeNotification(id, user._id, body.reason)
    if (!notification) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy thông báo' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/notifications/[id]/close error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
