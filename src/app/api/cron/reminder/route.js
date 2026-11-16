import { NextResponse } from 'next/server';
import { sendSmartScheduleReminders } from '@/services/zaloAutomation.service';

/**
 * API Quét và gửi Nhắc lịch học thông minh (Smart Schedule Reminder)
 * - Tự động quét các buổi học diễn ra vào ngày mai
 * - Bỏ qua học sinh đã có phép (Checkin === 3)
 * - Bỏ qua nếu hôm nay đã gửi nhắc lịch buổi đó rồi
 * - Gửi tin nhắn Zalo kèm link xem chi tiết & báo nghỉ
 */
export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const targetDate = searchParams.get('date') || null;

        const result = await sendSmartScheduleReminders(targetDate);
        return NextResponse.json(result);
    } catch (error) {
        console.error('[CRON_REMINDER_GET_ERROR]', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Lỗi khi quét lịch nhắc học tự động'
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json().catch(() => ({}));
        const targetDate = body.targetDate || null;

        const result = await sendSmartScheduleReminders(targetDate);
        return NextResponse.json(result);
    } catch (error) {
        console.error('[CRON_REMINDER_POST_ERROR]', error);
        return NextResponse.json({
            success: false,
            message: error.message || 'Lỗi khi quét lịch nhắc học tự động'
        }, { status: 500 });
    }
}
