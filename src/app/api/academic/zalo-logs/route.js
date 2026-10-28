import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import ZaloMessageLog from '@/models/zaloMessageLog';
import authenticate from '@/utils/authenticate';

export async function GET(req) {
    try {
        const { user } = await authenticate(req);
        if (!user) {
            return NextResponse.json({ success: false, mes: 'Chưa đăng nhập.' }, { status: 401 });
        }

        await connectDB();

        const { searchParams } = new URL(req.url);
        const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
        const type = searchParams.get('type') || '';
        const phone = searchParams.get('phone') || '';

        const filter = {};
        if (type) filter.type = type;
        if (phone) filter.recipientPhone = new RegExp(phone.trim(), 'i');

        const [items, total] = await Promise.all([
            ZaloMessageLog.find(filter)
                .sort({ sentAt: -1 })
                .limit(limit)
                .lean(),
            ZaloMessageLog.countDocuments(filter)
        ]);

        return NextResponse.json({
            success: true,
            total,
            items
        });
    } catch (error) {
        console.error('[ZALO_LOGS_GET_ERROR]', error);
        return NextResponse.json({
            success: false,
            mes: error.message || 'Lỗi lấy nhật ký Zalo.'
        }, { status: 500 });
    }
}
