import { NextResponse } from 'next/server'
import authenticate from '@/utils/authenticate'
import { markAsRead } from '@/data/database/notification'

export async function PUT(request, { params }) {
  try {
    const { user } = await authenticate(request)
    const { id } = await params
    const result = await markAsRead(id, user._id)
    if (!result) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy' }, { status: 404 })
    }
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('PUT /api/notifications/[id]/read error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
