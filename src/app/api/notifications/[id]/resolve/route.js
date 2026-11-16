import { NextResponse } from 'next/server'
import authenticate from '@/utils/authenticate'
import { resolveNotification } from '@/data/database/notification'

export async function PUT(request, { params }) {
  try {
    const { user } = await authenticate(request)
    const { id } = await params
    const body = await request.json()

    const notification = await resolveNotification(id, user._id, body.note)
    if (!notification) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy thông báo' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/notifications/[id]/resolve error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
