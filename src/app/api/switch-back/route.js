import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { getJwtSecret, getCookieName } from '@/utils/env'

export async function POST(request) {
  try {
    const { backupToken } = await request.json()
    if (!backupToken) {
      return NextResponse.json({ success: false, error: 'Thiếu backup token' }, { status: 400 })
    }

    const decoded = jwt.verify(backupToken, getJwtSecret())
    const cookieStore = await cookies()
    cookieStore.set(getCookieName(), backupToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: { name: decoded.name, role: decoded.role },
    })
  } catch (error) {
    console.error('POST /api/switch-back error:', error)
    return NextResponse.json({ success: false, error: 'Token không hợp lệ hoặc đã hết hạn' }, { status: 401 })
  }
}
