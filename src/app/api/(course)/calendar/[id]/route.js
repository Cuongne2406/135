// app/api/(course)/calendar/[id]/route.js
import { NextResponse } from 'next/server';
import { Types } from 'mongoose';
import { getLessonDetailData } from '@/data/database/lesson';

const isId = v => Types.ObjectId.isValid(v);

export async function GET(_req, { params }) {
    const { id } = await params;
    if (!isId(id)) {
        return NextResponse.json({ success: false, message: 'ID không hợp lệ' }, { status: 400 });
    }

    try {
        const data = await getLessonDetailData(id);
        if (!data) {
            return NextResponse.json({ success: false, message: 'Không tìm thấy buổi học.' }, { status: 404 });
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
