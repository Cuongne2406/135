import connectDB from '@/config/connectDB'
import Area from '@/models/area'
import PostCourse from '@/models/course'
import TrialCourse from '@/models/coursetry'
import MakeupSession from '@/models/makeupSession'
import authenticate from '@/utils/authenticate'
import jsonRes from '@/utils/response'
import { reloadArea } from '@/data/actions/reload'
import mongoose from 'mongoose'

const isHex = (c) => typeof c === 'string' && /^#[0-9a-f]{6}$/i.test(c)

export async function PUT(request, { params }) {
    const { id } = await params
    try {
        const { user, body } = await authenticate(request)
        if (!user.role.includes('Admin')) {
            return jsonRes(403, { status: false, mes: 'Không có quyền truy cập chức năng này.', data: [] })
        }
        const { name, rooms, color } = body

        if (!name?.trim() || !Array.isArray(rooms) || !isHex(color))
            return jsonRes(400, { status: false, mes: 'Dữ liệu không hợp lệ.', data: [] })

        await connectDB()

        if (await Area.exists({ name: name.trim(), _id: { $ne: id } }))
            return jsonRes(409, { status: false, mes: `Tên "${name}" đã tồn tại.`, data: [] })
        const normRooms = rooms.map((r) =>
            typeof r.name === 'string' ? { name: r.name.trim() } : { name: String(r.name).trim() }
        )

        const updated = await Area.findByIdAndUpdate(
            id,
            { name: name.trim(), rooms: normRooms, color },
            { new: true, runValidators: true }
        )
        if (!updated)
            return jsonRes(409, { status: false, mes: `Tên "${name}" đã tồn tại.`, data: [] })
        await reloadArea(id)
        return jsonRes(200, { status: true, mes: 'Cập nhật thành công!', data: updated })
    } catch (e) {
        const code = e.kind === 'ObjectId' ? 400 : e.message === 'Authentication failed' ? 401 : 500
        return jsonRes(code, { status: false, mes: e.message, data: [] })
    }
}

export async function DELETE(request, { params }) {
    const { id } = await params
    try {
        const { user } = await authenticate(request)
        if (!user.role.includes('Admin')) {
            return jsonRes(403, { status: false, mes: 'Không có quyền truy cập chức năng này.', data: [] })
        }
        const { searchParams } = new URL(request.url)
        const roomId = searchParams.get('roomId')
        if (!roomId || !mongoose.Types.ObjectId.isValid(roomId))
            return jsonRes(400, { status: false, mes: 'roomId không hợp lệ.', data: [] })

        await connectDB()

        const area = await Area.findById(id)
        if (!area) return jsonRes(404, { status: false, mes: 'Khu vực không tồn tại.', data: [] })

        const roomExists = area.rooms.some(r => r._id.toString() === roomId)
        if (!roomExists) return jsonRes(404, { status: false, mes: 'Phòng không tồn tại trong khu vực này.', data: [] })

        area.rooms.pull({ _id: roomId })
        await area.save()

        const roomObjId = new mongoose.Types.ObjectId(roomId)

        // 1. Khóa chính: Gỡ phòng khỏi PostCourse.Detail
        await PostCourse.updateMany(
            { 'Detail.Room': roomObjId },
            { $set: { 'Detail.$[elem].Room': null } },
            { arrayFilters: [{ 'elem.Room': roomObjId }] }
        )

        // 2. Khóa học thử: Gỡ phòng khỏi TrialCourse.sessions
        await TrialCourse.updateMany(
            { 'sessions.room': roomObjId },
            { $set: { 'sessions.$[elem].room': null } },
            { arrayFilters: [{ 'elem.room': roomObjId }] }
        )

        // 3. Học bù: Gỡ phòng và bật cờ roomAlert trên MakeupSession
        await MakeupSession.updateMany(
            { makeupRoom: roomObjId },
            { $set: { makeupRoom: null, roomAlert: true } }
        )

        await reloadArea(id)
        return jsonRes(200, { status: true, mes: 'Xóa phòng thành công!', data: [] })
    } catch (e) {
        const code = e.kind === 'ObjectId' ? 400 : e.message === 'Authentication failed' ? 401 : 500
        return jsonRes(code, { status: false, mes: e.message, data: [] })
    }
}
