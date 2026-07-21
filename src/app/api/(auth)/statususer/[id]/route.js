import connectDB from '@/config/connectDB';
import { reloadUser } from '@/data/actions/reload';
import PostUser from '@/models/users';
import jsonRes from '@/utils/response';

export async function PATCH(request, { params }) {
    try {
        const { id } = await params;
        if (!id) {
            return jsonRes(400, { error: 'Thiếu ID người dùng.' });
        }

        await connectDB();

        const user = await PostUser.findById(id);
        if (!user) {
            return jsonRes(404, { error: 'Không tìm thấy người dùng.' });
        }

        user.status = !user.status;
        await user.save();

        await reloadUser()
        return jsonRes(200, { message: 'Cập nhật trạng thái thành công.', status: user.status });

    } catch (err) {
        console.error(err);
        return jsonRes(500, { error: 'Lỗi máy chủ' });
    }
}
