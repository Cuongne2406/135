import connectDB from '@/config/connectDB'
import Bank from '@/models/bank'
import jsonRes from '@/utils/response'
import authenticate from '@/utils/authenticate'

export async function GET() {
    try {
        await connectDB()
        const banks = await Bank.find({}).sort({ createdAt: -1 }).lean()
        return jsonRes(200, { status: true, data: banks })
    } catch (err) {
        return jsonRes(500, { status: false, mes: err.message, data: [] })
    }
}

export async function POST(request) {
    try {
        const { user, body } = await authenticate(request)
        if (!user.role?.includes('Admin')) {
            return jsonRes(403, { status: false, mes: 'Không có quyền truy cập.', data: [] })
        }
        await connectDB()
        const { bankName, accountNumber, accountName, isDefault } = body
        if (!bankName || !accountNumber || !accountName) {
            return jsonRes(400, { status: false, mes: 'Nhập đầy đủ thông tin tài khoản ngân hàng.', data: [] })
        }
        if (isDefault) {
            await Bank.updateMany({}, { isDefault: false })
        }
        const bank = await Bank.create({ bankName, accountNumber, accountName, isDefault: !!isDefault })
        return jsonRes(201, { status: true, mes: 'Thêm tài khoản ngân hàng thành công', data: bank })
    } catch (err) {
        const code = err.message === 'Authentication failed' ? 401 : 500
        return jsonRes(code, { status: false, mes: err.message, data: [] })
    }
}

export async function PUT(request) {
    try {
        const { user, body } = await authenticate(request)
        if (!user.role?.includes('Admin')) {
            return jsonRes(403, { status: false, mes: 'Không có quyền truy cập.', data: [] })
        }
        await connectDB()
        const { _id, bankName, accountNumber, accountName, isDefault } = body
        if (!_id) {
            return jsonRes(400, { status: false, mes: 'Thiếu thông tin tài khoản.', data: [] })
        }
        if (isDefault) {
            await Bank.updateMany({}, { isDefault: false })
        }
        const bank = await Bank.findByIdAndUpdate(_id, { bankName, accountNumber, accountName, isDefault: !!isDefault }, { new: true })
        return jsonRes(200, { status: true, mes: 'Cập nhật thành công', data: bank })
    } catch (err) {
        const code = err.message === 'Authentication failed' ? 401 : 500
        return jsonRes(code, { status: false, mes: err.message, data: [] })
    }
}

export async function DELETE(request) {
    try {
        const { user, body } = await authenticate(request)
        if (!user.role?.includes('Admin')) {
            return jsonRes(403, { status: false, mes: 'Không có quyền truy cập.', data: [] })
        }
        await connectDB()
        const { _id } = body
        if (!_id) {
            return jsonRes(400, { status: false, mes: 'Thiếu thông tin tài khoản.', data: [] })
        }
        await Bank.findByIdAndDelete(_id)
        return jsonRes(200, { status: true, mes: 'Xóa tài khoản ngân hàng thành công' })
    } catch (err) {
        const code = err.message === 'Authentication failed' ? 401 : 500
        return jsonRes(code, { status: false, mes: err.message, data: [] })
    }
}
