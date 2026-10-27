import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import authenticate from '@/utils/authenticate';
import { getNotificationSettings, updateNotificationSetting } from '@/services/notification.service';
import NotificationTemplate from '@/models/notificationTemplate';

export async function GET(request) {
    try {
        const { user } = await authenticate(request);
        if (!user) {
            return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();
        const settings = await getNotificationSettings();
        const templates = await NotificationTemplate.find({}).sort({ createdAt: -1 }).lean();

        return NextResponse.json({
            success: true,
            settings,
            templates,
            data: Object.entries(settings).map(([key, value]) => ({ key, value }))
        });
    } catch (err) {
        console.error('Error fetching notification settings:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

async function handleUpdateSettings(request) {
    try {
        const { user } = await authenticate(request);
        if (!user || (!user.role?.includes('Admin') && !user.role?.includes('Academic'))) {
            return NextResponse.json({ success: false, error: 'Bạn không có quyền thay đổi cấu hình thông báo.' }, { status: 403 });
        }

        await connectDB();
        const body = await request.json();

        if (body.settings && Array.isArray(body.settings)) {
            for (const item of body.settings) {
                if (item.key) {
                    await updateNotificationSetting(item.key, item.value, user._id);
                }
            }
        } else {
            // Cập nhật từng key trong body
            for (const [key, value] of Object.entries(body)) {
                await updateNotificationSetting(key, value, user._id);
            }
        }

        const updatedSettings = await getNotificationSettings();
        return NextResponse.json({
            success: true,
            message: 'Đã cập nhật cấu hình thông báo thành công!',
            settings: updatedSettings,
            data: Object.entries(updatedSettings).map(([key, value]) => ({ key, value }))
        });
    } catch (err) {
        console.error('Error updating notification settings:', err);
        return NextResponse.json({ success: false, error: err.message }, { status: 500 });
    }
}

export async function POST(request) {
    return handleUpdateSettings(request);
}

export async function PUT(request) {
    return handleUpdateSettings(request);
}
