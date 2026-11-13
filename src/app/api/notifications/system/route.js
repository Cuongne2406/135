import { NextResponse } from 'next/server'
import authenticate from '@/utils/authenticate'
import { createNotification } from '@/data/database/notification'

export async function POST(request) {
  try {
    const { user } = await authenticate(request)
    if (!user.role.some(r => r.toLowerCase() === 'admin')) {
      return NextResponse.json({ success: false, error: 'Chỉ Admin Sys mới có quyền này' }, { status: 403 })
    }

    const body = await request.json()
    const notification = await createNotification({
      title: body.title,
      content: body.content,
      type: body.type || 'SYSTEM_ERROR',
      level: body.level || 'WARNING',
      created_by: user._id,
      targetRoles: body.target_roles || ['admin', 'hocvu', 'Academic', 'teacher'],
      userId: user._id,
      ref_course: body.ref_course || null,
      ref_lesson: body.ref_lesson || null,
      ref_teacher: body.ref_teacher || null,
      ref_student: body.ref_student || null,
      sla_deadline: body.sla_deadline || null,
    })

    return NextResponse.json({ success: true, id: notification._id })
  } catch (error) {
    console.error('POST /api/notifications/system error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
