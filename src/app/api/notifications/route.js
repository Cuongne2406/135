import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import authenticate from '@/utils/authenticate'
import { getNotifications } from '@/data/database/notification'

export async function GET(request) {
  try {
    const { user } = await authenticate(request)
    await connectDB()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status') || null
    const level = searchParams.get('level') || null
    const type = searchParams.get('type') || null

    const result = await getNotifications({
      userId: user._id,
      role: user.role,
      page,
      limit,
      status,
      level,
      type,
    })

    return NextResponse.json({ success: true, data: result.data, pagination: result.pagination })
  } catch (error) {
    console.error('GET /api/notifications error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
