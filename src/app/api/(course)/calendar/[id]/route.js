// app/api/(course)/calendar/[id]/route.js
import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getLessonDetailData } from '@/data/database/lesson';
import { syncSessionDriveMedia } from '@/function/drive/syncMedia';

const isId = v => Types.ObjectId.isValid(v);

export async function GET(_req, { params }) {
    const { id } = await params;
    if (!isId(id)) {
        return NextResponse.json({ success: false, message: 'ID không hợp lệ' }, { status: 400 });
    }

    try {
        let data = await getLessonDetailData(id);
        if (!data) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy buổi học.' }, { status: 404 });
        }

        // Tự động đồng bộ từ Drive nếu buổi học có folder Drive nhưng DetailImage đang rỗng
        if (data.session?.Image && (!data.session?.DetailImage || data.session.DetailImage.length === 0)) {
            try {
                await syncSessionDriveMedia({ courseId: data.course?._id, lessonId: id });
                data = await getLessonDetailData(id);
            } catch (syncErr) {
                console.warn('[AutoSync GET error]', syncErr.message);
            }
        }

        return NextResponse.json({
            success: true,
            data
        });
    } catch (err) {
        console.error('[CALENDAR_LESSON_GET]', err);
        return NextResponse.json(
            { success: false, message: 'Đã xảy ra lỗi máy chủ.' },
            { status: 500 }
        );
    }
}

export async function POST(_req, { params }) {
    const { id } = await params;
    if (!isId(id)) {
        return NextResponse.json({ success: false, message: 'ID không hợp lệ' }, { status: 400 });
    }

    try {
        const syncResult = await syncSessionDriveMedia({ lessonId: id });
        return NextResponse.json({
            success: true,
            message: 'Đồng bộ Google Drive thành công!',
            data: syncResult
        });
    } catch (err) {
        console.error('[CALENDAR_LESSON_SYNC_POST]', err);
        return NextResponse.json(
            { success: false, message: err.message || 'Lỗi đồng bộ Google Drive.' },
            { status: 500 }
        );
    }
}
