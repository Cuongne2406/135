import { NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import connectDB from '@/config/connectDB'
import authenticate from '@/utils/authenticate'
import User from '@/models/users'
import { getJwtSecret, getCookieName } from '@/utils/env'

export async function POST(request, { params }) {
  try {
    const { user } = await authenticate(request)
    if (!user.role.some(r => /^admin$/i.test(r))) {
      return NextResponse.json({ success: false, error: 'Chỉ Admin mới có quyền chuyển đổi' }, { status: 403 })
    }

    const { id } = await params
    await connectDB()
    const target = await User.findById(id).lean()
    if (!target) {
      return NextResponse.json({ success: false, error: 'Người dùng không tồn tại' }, { status: 404 })
    }

    const targetToken = jwt.sign(
      { id: target._id, role: target.role },
      getJwtSecret(),
      { expiresIn: '1h' }
    )

    const backupToken = jwt.sign(
      { id: user._id, role: user.role },
      getJwtSecret(),
      { expiresIn: '1h' }
    )

    const cookieStore = await cookies()
    cookieStore.set(getCookieName(), targetToken, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: { name: target.name, role: target.role },
      backupToken,
    })
  } catch (error) {
    console.error('POST /api/switch-role/[id] error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
