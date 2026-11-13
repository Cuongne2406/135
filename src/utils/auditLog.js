import connectDB from '@/config/connectDB';
import Log from '@/models/log';

/**
 * Ghi lại nhật ký kiểm toán hệ thống (Audit Trail)
 * @param {Object} params
 * @param {string} params.type - Loại thao tác: 'PAYMENT', 'ATTENDANCE_CHECKIN', 'CONVERT_LEAD', 'STUDENT_DELETE', 'STUDENT_UPDATE', etc.
 * @param {boolean} [params.status=true] - Trạng thái thành công/thất bại
 * @param {string} [params.message=''] - Thông báo tóm tắt
 * @param {string|ObjectId} [params.createBy] - ID người thực hiện
 * @param {string|ObjectId} [params.student] - ID học sinh liên quan
 * @param {string|ObjectId} [params.customer] - ID khách hàng liên quan
 * @param {string} [params.note] - Ghi chú chi tiết
 * @param {Object} [params.details={}] - Dữ liệu mở rộng
 */
export async function writeSystemLog({ type, status = true, message = '', createBy = null, student = null, customer = null, note = '', details = {} }) {
    try {
        await connectDB();
        const entry = new Log({
            type,
            status: {
                status: Boolean(status),
                message: message || note || 'Hoàn thành tác vụ',
                data: details || {}
            },
            note: note || message,
            details,
            createBy: createBy || null,
            student: student || null,
            customer: customer || null,
            createdAt: new Date()
        });
        await entry.save();
        return entry;
    } catch (err) {
        console.warn('[AuditLog] Không thể ghi log:', err.message);
        return null;
    }
}
