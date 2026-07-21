import { NextResponse } from 'next/server'
import authenticate from '@/utils/authenticate'
import { getUnreadCount } from '@/data/database/notification'

export async function GET(request) {
  try {
    const { user } = await authenticate(request)
    const result = await getUnreadCount(user._id)
    return NextResponse.json({ success: true, ...result })
  } catch (error) {
    console.error('GET /api/notifications/unread-count error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
