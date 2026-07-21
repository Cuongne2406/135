import { NextResponse } from 'next/server'
import authenticate from '@/utils/authenticate'
import { markAllAsRead } from '@/data/database/notification'

export async function PUT(request) {
  try {
    const { user } = await authenticate(request)
    const updatedCount = await markAllAsRead(user._id)
    return NextResponse.json({ success: true, updated_count: updatedCount })
  } catch (error) {
    console.error('PUT /api/notifications/read-all error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
