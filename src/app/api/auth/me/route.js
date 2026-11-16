import { NextResponse } from 'next/server'
import authenticate from '@/utils/authenticate'

export async function GET(req) {
  try {
    const auth = await authenticate(req)
    return NextResponse.json({
      user: {
        _id: auth.user._id,
        name: auth.user.name,
        role: auth.user.role,
        email: auth.user.email,
        phone: auth.user.phone,
      }
    })
  } catch {
    return NextResponse.json({ user: null }, { status: 401 })
  }
}
