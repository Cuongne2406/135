import connectDB from '@/config/connectDB';
import { reloadUser } from '@/data/actions/reload';
import PostUser from '@/models/users';
import authenticate from '@/utils/authenticate';
import jsonRes from '@/utils/response';

export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        if (!id) {
            return jsonRes(400, { error: 'Thiếu ID người dùng.' });
        }

        const { user } = await authenticate(request);
        if (!user || !user.role?.includes('Admin')) {
            return jsonRes(403, { error: 'Chỉ Quản trị viên (Admin) mới có quyền thay đổi thông tin phân quyền.' });
        }

        await connectDB();

        const body = await request.json();
        const { name, address, phone, role } = body;

        const updateData = {};
        if (name) updateData.name = name;
        if (address) updateData.address = address;
        if (phone) updateData.phone = phone;
        if (role && typeof role === 'string') {
            updateData.role = [role];
        } else if (Array.isArray(role)) {
            updateData.role = role;
        }

        const updatedUser = await PostUser.findByIdAndUpdate(id, { $set: updateData }, { new: true });

        if (!updatedUser) {
            return jsonRes(404, { error: 'Không tìm thấy người dùng để cập nhật.' });
        }
        await reloadUser(id);
        return jsonRes(200, { message: 'Cập nhật thông tin thành công.', user: updatedUser });

    } catch (err) {
        console.error(err);
        const statusCode = err.message === 'Authentication failed' ? 401 : err.message.includes('quyền') ? 403 : 500;
        return jsonRes(statusCode, { error: err.message || 'Lỗi máy chủ' });
    }
}