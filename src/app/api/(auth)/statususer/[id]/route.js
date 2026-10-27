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

        const { user: currentUser } = await authenticate(request);
        if (!currentUser || !currentUser.role?.includes('Admin')) {
            return jsonRes(403, { error: 'Chỉ Quản trị viên (Admin) mới có quyền khóa hoặc mở khóa tài khoản.' });
        }

        if (currentUser._id.toString() === id.toString()) {
            return jsonRes(400, { error: 'Bạn không thể tự vô hiệu hóa tài khoản của chính mình.' });
        }

        await connectDB();

        const targetUser = await PostUser.findById(id);
        if (!targetUser) {
            return jsonRes(404, { error: 'Không tìm thấy người dùng.' });
        }

        targetUser.status = !targetUser.status;
        await targetUser.save();

        await reloadUser(id);
        return jsonRes(200, { message: 'Cập nhật trạng thái thành công.', status: targetUser.status });

    } catch (err) {
        console.error(err);
        const statusCode = err.message === 'Authentication failed' ? 401 : err.message.includes('quyền') ? 403 : 500;
        return jsonRes(statusCode, { error: err.message || 'Lỗi máy chủ' });
    }
}
