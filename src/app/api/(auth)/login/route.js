import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import connectDB from '@/config/connectDB';
import users from '@/models/users';
import { getCookieName, getJwtSecret } from '@/utils/env';

export async function POST(req) {
  try {
    await connectDB();
    const { email, password, re } = await req.json();

    if (!email || !password) {
      return jsonRes(400, { status: 1, mes: 'Vui lòng nhập đầy đủ thông tin đăng nhập!', data: [] });
    }

    const cleanInput = email.trim();
    const user = await users.findOne({
      $or: [
        { email: cleanInput },
        { phone: cleanInput }
      ]
    }).lean();

    if (!user) return jsonRes(404, { status: 1, mes: 'Tài khoản không tồn tại trên hệ thống!', data: [] });

    if (user.status === false) return jsonRes(403, { status: 1, mes: 'Tài khoản đã bị vô hiệu hóa! Vui lòng liên hệ Admin.', data: [] });

    const ok = await bcrypt.compare(password, user.uid);
    if (!ok) return jsonRes(401, { status: 1, mes: 'Mật khẩu không chính xác!', data: [] });

    const jwtLife = re ? '30d' : '12h';
    const secret = getJwtSecret();
    const accessToken = jwt.sign(
      { id: user._id, role: user.role, name: user.name, email: user.email },
      secret,
      { expiresIn: jwtLife }
    );

    const opts = {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    };
    if (re) opts.maxAge = 60 * 60 * 24 * 30;

    const cookieStore = await cookies();
    const cookieName = getCookieName();
    cookieStore.set(cookieName, accessToken, opts);

    return jsonRes(200, {
      status: 2,
      mes: 'Đăng nhập thành công',
      token: accessToken,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role
      },
      data: []
    });
  } catch (err) {
    console.error('Lỗi API Login:', err);
    return jsonRes(500, { status: 1, mes: 'Lỗi máy chủ nội bộ', data: [] });
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };
}

function jsonRes(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
  });
}
