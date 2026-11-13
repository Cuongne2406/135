import path from 'path';
import fs from 'fs';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostStudent from '@/models/student';
import { scanMediaBiometrics } from '@/function/ai/faceBiometrics';

/**
 * Nhận diện sinh trắc học khuôn mặt học sinh trong 1 File (Ảnh hoặc Video)
 * Chạy 100% bằng mô hình sinh trắc học ResNet-34 Face-API & MobileNet SSD
 * Chi phí = 0đ, không phụ thuộc vào Gemini Vision API, không lo cạn quota hay lỗi 429
 */
export async function scanSingleMedia({ courseId, lessonId, fileItem, students }) {
    const fileId = fileItem.id || fileItem.driveFileId;
    const fileName = fileItem.name || '';
    const isVideo = fileItem.type === 'video' || fileItem.itemType === 'video';

    // BƯỚC 1: QUY TẮC ĐỊNH DANH THEO TÊN TỆP (NẾU GIÁO VIÊN ĐÃ ĐẶT TÊN CÓ MÃ BÉ)
    const taggedStudentIds = new Set();
    for (const stu of students) {
        if (fileName.includes(stu.ID)) {
            taggedStudentIds.add(stu.ID);
        }
    }

    // BƯỚC 2: CỔNG KIỂM SOÁT KÉP (Quality Gate & Identity Gate)
    try {
        const bioResult = await scanMediaBiometrics({
            fileId,
            fileName,
            enrolledStudents: students,
            threshold: 0.40
        });

        if (Array.isArray(bioResult.taggedStudentIds)) {
            bioResult.taggedStudentIds.forEach(id => taggedStudentIds.add(id));
        }

        const finalTagged = Array.from(taggedStudentIds);
        const isRejected = bioResult.isRejected === true && finalTagged.length === 0;

        return {
            taggedStudentIds: finalTagged,
            isGeneral: false, // Ảnh lớp học không tự ý gán là chung nếu không rõ ràng
            isRejected,
            confidence: bioResult.confidence || 0.95,
            aiScanned: true,
            reason: bioResult.reason || ''
        };
    } catch (err) {
        console.warn(`[MediaScanner] Lỗi quét sinh trắc học cho ${fileName}:`, err.message);
        return {
            taggedStudentIds: Array.from(taggedStudentIds),
            isGeneral: false,
            isRejected: taggedStudentIds.size === 0,
            confidence: 0.5,
            aiScanned: true,
            reason: err.message
        };
    }
}

/**
 * Xử lý hàng đợi điều tiết ngầm (Controlled Background Queue)
 * Tự động quét các ảnh/video chưa từng được quét (aiScanned !== true)
 */
export async function processMediaQueue({ courseId, lessonId, force = false }) {
    await connectDB();
    const course = await PostCourse.findById(courseId);
    if (!course) return { success: false, mes: 'Không tìm thấy khóa học' };

    const lesson = course.Detail.id(lessonId) || course.Detail.find(d => String(d._id) === String(lessonId));
    if (!lesson) return { success: false, mes: 'Không tìm thấy buổi học' };

    // Lấy thông tin học sinh kèm vector đặc trưng 128 chiều
    const studentIds = (course.Student || []).map(s => s.ID);
    const students = await PostStudent.find({ ID: { $in: studentIds } }).select('ID Name Avt faceDescriptor').lean();

    // Lọc các item cần quét (DetailImage và Videos)
    const imagesToScan = (lesson.DetailImage || []).filter(img => force || !img.aiScanned);
    const videosToScan = (lesson.Videos || []).filter(v => force || !v.aiScanned);

    const allItemsToScan = [
        ...imagesToScan.map(img => ({ ...img, itemType: 'image' })),
        ...videosToScan.map(v => ({ ...v, itemType: 'video' }))
    ];

    if (allItemsToScan.length === 0) {
        return { success: true, scannedCount: 0, mes: 'Tất cả file đều đã được quét trước đó' };
    }

    console.log(`[MediaQueue] Bắt đầu quét sinh trắc học ${allItemsToScan.length} file cho buổi ${lessonId}...`);

    let scannedCount = 0;
    const CONCURRENCY = 2;

    for (let i = 0; i < allItemsToScan.length; i += CONCURRENCY) {
        const batch = allItemsToScan.slice(i, i + CONCURRENCY);
        const batchPromises = batch.map(async (item) => {
            const scanResult = await scanSingleMedia({
                courseId,
                lessonId,
                fileItem: item,
                students
            });

            // Cập nhật lại vào lesson trong memory
            if (item.itemType === 'image') {
                const targetImg = lesson.DetailImage.find(img => img.id === item.id);
                if (targetImg) {
                    targetImg.taggedStudentIds = scanResult.taggedStudentIds;
                    targetImg.isGeneral = scanResult.isGeneral;
                    targetImg.isRejected = scanResult.isRejected;
                    targetImg.confidence = scanResult.confidence;
                    targetImg.aiScanned = true;
                }
            } else {
                const targetVid = lesson.Videos.find(v => (v.driveFileId || v.id) === item.id);
                if (targetVid) {
                    targetVid.taggedStudentIds = scanResult.taggedStudentIds;
                    targetVid.isGeneral = scanResult.isGeneral;
                    targetVid.isRejected = scanResult.isRejected;
                    targetVid.confidence = scanResult.confidence;
                    targetVid.aiScanned = true;
                    targetVid.scannedAt = new Date();
                }
                const targetImgInDetail = lesson.DetailImage.find(img => img.id === item.id);
                if (targetImgInDetail) {
                    targetImgInDetail.taggedStudentIds = scanResult.taggedStudentIds;
                    targetImgInDetail.isGeneral = scanResult.isGeneral;
                    targetImgInDetail.isRejected = scanResult.isRejected;
                    targetImgInDetail.confidence = scanResult.confidence;
                    targetImgInDetail.aiScanned = true;
                }
            }

            scannedCount++;
        });

        await Promise.all(batchPromises);

        // Lưu vào DB sau mỗi mẻ 2 file để dữ liệu được bảo lưu ngay lập tức
        await course.save();

        if (i + CONCURRENCY < allItemsToScan.length) {
            await new Promise(r => setTimeout(r, 200));
        }
    }

    console.log(`[MediaQueue] Hoàn thành quét sinh trắc học ${scannedCount} file cho buổi ${lessonId}!`);
    return { success: true, scannedCount };
}
