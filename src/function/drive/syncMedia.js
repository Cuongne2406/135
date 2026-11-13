import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import { getDriveClient } from '@/function/drive/index';
import { processMediaQueue } from '@/function/ai/mediaScanner';

/**
 * Đồng bộ ảnh và video từ Google Drive Folder của một buổi học vào MongoDB
 * Áp dụng cơ chế Diff: Chỉ xử lý file mới, Video và Ảnh quét AI Gemini có hàng đợi điều tiết
 * 
 * @param {Object} params
 * @param {string} params.courseId - _id hoặc ID của khóa học
 * @param {string} params.lessonId - _id của buổi học (Detail._id)
 * @param {boolean} [params.force=false] - Buộc quét lại dù vừa quét gần đây
 * @param {boolean} [params.backgroundQueue=true] - Cho phép hàng đợi AI chạy nền không chặn UI
 * @returns {Promise<{ success: boolean, totalFiles: number, newFiles: number, detailImage: any[], videos: any[] }>}
 */
export async function syncSessionDriveMedia({ courseId, lessonId, force = false, backgroundQueue = true }) {
    await connectDB();

    // 1. Tìm khóa học và buổi học
    const query = courseId ? { _id: courseId } : { 'Detail._id': lessonId };
    const course = await PostCourse.findOne(query);
    if (!course) {
        return { success: false, mes: 'Không tìm thấy khóa học' };
    }

    const lesson = course.Detail.id(lessonId) || course.Detail.find(d => String(d._id) === String(lessonId));
    if (!lesson) {
        return { success: false, mes: 'Không tìm thấy buổi học' };
    }

    const folderId = lesson.Image?.trim();
    if (!folderId || folderId.startsWith('158109')) {
        return { success: false, mes: 'Buổi học chưa có Google Drive Folder hợp lệ' };
    }

    try {
        const drive = await getDriveClient();
        const driveRes = await drive.files.list({
            q: `'${folderId}' in parents and trashed = false`,
            fields: 'files(id, name, mimeType, createdTime, webViewLink)',
            supportsAllDrives: true,
            includeItemsFromAllDrives: true
        });

        const driveFiles = driveRes.data.files || [];

        // Khởi tạo mảng nếu chưa có
        if (!Array.isArray(lesson.DetailImage)) lesson.DetailImage = [];
        if (!Array.isArray(lesson.Videos)) lesson.Videos = [];

        const existingImageIds = new Set(lesson.DetailImage.map(img => img.id));
        const existingVideoIds = new Set(lesson.Videos.map(v => v.driveFileId || v.id));

        let newFilesCount = 0;

        // 2. Phân loại và thêm file mới (Pha 1: Fast Ingestion)
        for (const file of driveFiles) {
            const isVideo = file.mimeType?.startsWith('video/') || /\.(mp4|mov|avi|wmv|mkv|webm)$/i.test(file.name);
            const type = isVideo ? 'video' : 'image';

            if (!existingImageIds.has(file.id)) {
                lesson.DetailImage.push({
                    id: file.id,
                    type: type,
                    name: file.name,
                    taggedStudentIds: [],
                    isGeneral: true,
                    aiScanned: false,
                    create: file.createdTime ? new Date(file.createdTime) : new Date()
                });
                existingImageIds.add(file.id);
                newFilesCount++;
            }

            if (isVideo && !existingVideoIds.has(file.id)) {
                const vidObj = {
                    driveFileId: file.id,
                    id: file.id,
                    name: file.name,
                    embedUrl: `https://drive.google.com/file/d/${file.id}/preview`,
                    thumbnailUrl: `https://drive.google.com/thumbnail?id=${file.id}&sz=w600`,
                    taggedStudentIds: [],
                    isGeneral: true,
                    aiScanned: false,
                    scannedAt: new Date()
                };
                lesson.Videos.push(vidObj);
                existingVideoIds.add(file.id);
            }
        }

        // Lưu vào DB ngay lập tức để giao diện hiển thị tức thì (< 1.5s)
        await course.save();

        // 3. Pha 2: Chạy hàng đợi AI nhận diện khuôn mặt (Queue Concurrency = 2)
        const hasUnscannedFiles = lesson.DetailImage.some(img => !img.aiScanned) || lesson.Videos.some(v => !v.aiScanned);
        if (hasUnscannedFiles || force) {
            if (backgroundQueue) {
                // Chạy nền không chặn kết quả trả về của HTTP Request
                processMediaQueue({ courseId: course._id.toString(), lessonId: lesson._id.toString(), force })
                    .catch(e => console.warn('[Background AI Queue Error]', e.message));
            } else {
                // Chạy đợi tuần tự nếu được yêu cầu
                await processMediaQueue({ courseId: course._id.toString(), lessonId: lesson._id.toString(), force });
            }
        }

        return {
            success: true,
            totalFiles: driveFiles.length,
            newFiles: newFilesCount,
            detailImage: lesson.DetailImage,
            videos: lesson.Videos
        };
    } catch (error) {
        console.error('[SyncSessionDriveMedia Error]', error);
        return { success: false, mes: error.message };
    }
}

