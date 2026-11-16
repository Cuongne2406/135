import { NextResponse } from 'next/server'
import authenticate from '@/utils/authenticate'
import { getTemplates } from '@/data/database/notification'

export async function GET(request) {
  try {
    await authenticate(request)
    const templates = await getTemplates()
    return NextResponse.json({ success: true, data: templates })
  } catch (error) {
    console.error('GET /api/notifications/templates error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
