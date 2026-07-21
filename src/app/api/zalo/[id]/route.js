import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import authenticate from '@/utils/authenticate'
import ZaloAccount from '@/models/zalo'
import { reloadZalo } from '@/data/actions/reload'

export async function PATCH(request, { params }) {
  try {
    const { user } = await authenticate(request)
    if (!user.role.some(r => /^admin$/i.test(r)) && !user.role.some(r => /^academic$/i.test(r))) {
      return NextResponse.json({ success: false, error: 'Không có quyền' }, { status: 403 })
    }

    const { id } = await params
    const { proxy } = await request.json()

    await connectDB()
    const updated = await ZaloAccount.findByIdAndUpdate(
      id,
      { $set: { proxy } },
      { new: true }
    ).lean()

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Không tìm thấy tài khoản Zalo' }, { status: 404 })
    }

    reloadZalo()

    return NextResponse.json({ success: true, data: { _id: updated._id, name: updated.name, proxy: updated.proxy } })
  } catch (error) {
    console.error('PATCH /api/zalo/[id] error:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await authenticate(request)
    if (!user.role.some(r => /^admin$/i.test(r))) {
      return NextResponse.json({ success: false, message: 'Không có quyền' }, { status: 403 })
    }

    const { id } = await params
    await connectDB()
    const deleted = await ZaloAccount.findByIdAndDelete(id).lean()

    if (!deleted) {
      return NextResponse.json({ success: false, message: 'Không tìm thấy tài khoản Zalo' }, { status: 404 })
    }

    reloadZalo()
    return NextResponse.json({ success: true, message: 'Đã xóa tài khoản Zalo' })
  } catch (error) {
    console.error('DELETE /api/zalo/[id] error:', error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
