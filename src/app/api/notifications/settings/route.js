import { NextResponse } from 'next/server'
import authenticate from '@/utils/authenticate'
import { getSettings, updateSetting } from '@/data/database/notification'

export async function GET(request) {
  try {
    await authenticate(request)
    const settings = await getSettings()
    return NextResponse.json({ success: true, data: settings })
  } catch (error) {
    console.error('GET /api/notifications/settings error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const { user } = await authenticate(request)
    if (!user.role.some(r => r.toLowerCase() === 'admin')) {
      return NextResponse.json({ success: false, error: 'Chỉ Admin Sys mới có quyền này' }, { status: 403 })
    }

    const body = await request.json()
    const results = []
    if (body.settings) {
      for (const s of body.settings) {
        const updated = await updateSetting(s.key, s.value, user._id)
        results.push(updated)
      }
    }
    return NextResponse.json({ success: true, data: results })
  } catch (error) {
    console.error('PUT /api/notifications/settings error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
