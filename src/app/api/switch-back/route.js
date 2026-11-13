import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { getJwtSecret, getCookieName } from '@/utils/env'

export async function POST(request) {
  try {
    let backupToken;
    try {
      const body = await request.json()
      backupToken = body?.backupToken
    } catch (e) {}

    const cookieStore = await cookies()
    if (!backupToken) {
      backupToken = cookieStore.get('backup_token')?.value
    }

    if (!backupToken) {
      return NextResponse.json({ success: false, error: 'Thiếu backup token' }, { status: 400 })
    }

    const decoded = jwt.verify(backupToken, getJwtSecret())
    cookieStore.set(getCookieName(), backupToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
    cookieStore.delete('backup_token')

    return NextResponse.json({
      success: true,
      user: { name: decoded.name, role: decoded.role },
    })
  } catch (error) {
    console.error('POST /api/switch-back error:', error)
    return NextResponse.json({ success: false, error: 'Token không hợp lệ hoặc đã hết hạn' }, { status: 401 })
  }
}
