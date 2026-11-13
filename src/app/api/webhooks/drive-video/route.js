import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import { scanAndTagVideo } from '@/function/ai/videoScanner';
import { getDriveClient } from '@/function/drive/index';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        await connectDB();
        let body = {};
        try {
            body = await request.json();
        } catch {
            body = {};
        }

        const { searchParams } = new URL(request.url);
        const folderId = body.folderId || searchParams.get('folderId');
        let fileId = body.fileId || searchParams.get('fileId');
        let fileName = body.name || searchParams.get('name') || '';

        if (!folderId && !fileId) {
            return NextResponse.json({
                success: false,
                mes: 'Cần cung cấp folderId hoặc fileId của Google Drive'
            }, { status: 400 });
        }

        // Tìm khóa học và buổi học theo folderId
        let query = {};
        if (folderId) {
            query['Detail.Image'] = folderId;
        }

        const course = await PostCourse.findOne(query);
        if (!course) {
            return NextResponse.json({
                success: false,
                mes: `Không tìm thấy buổi học nào gắn với folderId: ${folderId}`
            }, { status: 404 });
        }

        // Tìm buổi học khớp với folderId
        const lesson = course.Detail.find(d => String(d.Image) === String(folderId));
        if (!lesson) {
            return NextResponse.json({
                success: false,
                mes: 'Không tìm thấy chi tiết buổi học trong khóa'
            }, { status: 404 });
        }

        // Nếu chỉ có folderId mà chưa có fileId, lấy các file video trong folder từ Google Drive
        let filesToScan = [];
        if (fileId) {
            filesToScan.push({ id: fileId, name: fileName });
        } else {
            try {
                const drive = await getDriveClient();
                const driveRes = await drive.files.list({
                    q: `'${folderId}' in parents and trashed = false and mimeType contains 'video/'`,
                    fields: 'files(id, name, mimeType)',
                    supportsAllDrives: true,
                    includeItemsFromAllDrives: true
                });
                filesToScan = driveRes.data.files || [];
            } catch (err) {
                console.warn('[Webhook-Drive] Lỗi quét drive folder:', err.message);
            }
        }

        const scanResults = [];
        for (const file of filesToScan) {
            const res = await scanAndTagVideo({
                courseId: course._id,
                lessonId: lesson._id,
                fileInfo: file
            });
            scanResults.push(res);
        }

        return NextResponse.json({
            success: true,
            mes: `Đã tự động quét và gắn thẻ thành công ${scanResults.length} video.`,
            data: scanResults
        });
    } catch (error) {
        console.error('[Webhook-Drive] Lỗi xử lý webhook:', error);
        return NextResponse.json({
            success: false,
            mes: error.message || 'Lỗi server khi xử lý webhook video'
        }, { status: 500 });
    }
}
