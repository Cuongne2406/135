import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import { reloadCourse } from '@/data/actions/reload';
import mongoose from 'mongoose';

function extractFolderId(input) {
    if (!input || typeof input !== 'string') return null;
    input = input.trim();
    const match = input.match(/\/folders\/([a-zA-Z0-9_-]{20,})/);
    if (match) return match[1];
    if (/^[a-zA-Z0-9_-]{20,}$/.test(input)) return input;
    return null;
}

export async function POST(req) {
    try {
        await connectDB();
        const body = await req.json();
        const { courseId, driveUrlOrId } = body;

        if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
            return NextResponse.json({ status: 1, mes: 'courseId không hợp lệ' }, { status: 400 });
        }

        const folderId = extractFolderId(driveUrlOrId);
        if (!folderId) {
            return NextResponse.json({ status: 1, mes: 'Đường dẫn hoặc mã Folder ID Google Drive không hợp lệ.' }, { status: 400 });
        }

        const course = await PostCourse.findById(courseId);
        if (!course) {
            return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học.' }, { status: 404 });
        }

        // Cập nhật trường Image cho từng buổi học trong Detail
        if (Array.isArray(course.Detail)) {
            course.Detail.forEach(detail => {
                detail.Image = folderId;
            });
        }

        // Xóa cache AI draft để khi mở ReviewSheet sẽ quét lại kho ảnh mới
        course.aiPortfolioDraft = null;

        await course.save();
        await reloadCourse(courseId);

        return NextResponse.json({
            status: 2,
            mes: `Cập nhật thư mục Drive demo thành công! (ID: ${folderId})`,
            folderId
        });
    } catch (error) {
        console.error('Lỗi cập nhật drive folder demo:', error);
        return NextResponse.json({ status: 1, mes: error.message }, { status: 500 });
    }
}
