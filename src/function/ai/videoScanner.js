import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostStudent from '@/models/student';
import { getDriveClient } from '@/function/drive/index';

// Helper tải ảnh thumbnail/chân dung local hoặc drive thành Base64 cho Gemini
async function getBase64Image(filePathOrUrl) {
    if (!filePathOrUrl || typeof filePathOrUrl !== 'string') return null;

    // 1. Nếu là đường dẫn file local trong public/
    if (filePathOrUrl.startsWith('/')) {
        try {
            const fullPath = path.join(process.cwd(), 'public', filePathOrUrl);
            if (fs.existsSync(fullPath)) {
                const buffer = fs.readFileSync(fullPath);
                const ext = path.extname(fullPath).toLowerCase();
                const mime = ext === '.png' ? 'image/png' : 'image/jpeg';
                return {
                    inlineData: {
                        data: buffer.toString('base64'),
                        mimeType: mime
                    }
                };
            }
        } catch (e) {
            console.warn('[VideoScanner] Lỗi đọc ảnh local:', e.message);
        }
    }

    // 2. Nếu là URL hoặc Google Drive ID
    try {
        const url = filePathOrUrl.startsWith('http')
            ? filePathOrUrl
            : `https://lh3.googleusercontent.com/d/${filePathOrUrl}=w800`;

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);
        const res = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        if (!res.ok) return null;

        const arrayBuffer = await res.arrayBuffer();
        return {
            inlineData: {
                data: Buffer.from(arrayBuffer).toString('base64'),
                mimeType: res.headers.get('content-type') || 'image/jpeg'
            }
        };
    } catch {
        return null;
    }
}

/**
 * Quét nhận diện khuôn mặt học sinh trong Video và cập nhật vào Database
 * @param {Object} params
 * @param {string} params.courseId - ID khóa học trong MongoDB
 * @param {string} params.lessonId - ID buổi học (Detail._id)
 * @param {Object} params.fileInfo - { id, name, mimeType }
 * @returns {Promise<{ success: boolean, taggedStudentIds: string[], isGeneral: boolean }>}
 */
export async function scanAndTagVideo({ courseId, lessonId, fileInfo }) {
    await connectDB();

    const fileId = fileInfo?.id;
    const fileName = fileInfo?.name || '';
    if (!fileId) {
        return { success: false, mes: 'Thiếu fileId video' };
    }

    // 1. Tìm khóa học và buổi học
    const course = await PostCourse.findById(courseId);
    if (!course) {
        return { success: false, mes: 'Không tìm thấy khóa học' };
    }

    const lesson = course.Detail.id(lessonId);
    if (!lesson) {
        return { success: false, mes: 'Không tìm thấy buổi học trong khóa' };
    }

    // 2. Lấy danh sách học sinh thực tế trong khóa học
    const studentIds = (course.Student || []).map(s => s.ID);
    const students = await PostStudent.find({ ID: { $in: studentIds } })
        .select('ID Name Avt')
        .lean();

    const taggedStudentIds = new Set();
    let isGeneral = false;
    let confidence = 0.85;

    // --- BƯỚC A: QUY TẮC NHẬN DIỆN QUA TÊN FILE (DETERMINISTIC MATCHING) ---
    const lowerName = fileName.toLowerCase();

    // Nếu tên file chứa từ khóa chung
    if (lowerName.startsWith('chung_') || lowerName.startsWith('all_') || lowerName.includes('toan_canh') || lowerName.includes('lop_hoc')) {
        isGeneral = true;
    }

    // Kiểm tra mã học sinh trong tên file (VD: HS01, HS02)
    for (const stu of students) {
        if (fileName.includes(stu.ID)) {
            taggedStudentIds.add(stu.ID);
        }
        // Kiểm tra tên học sinh không dấu trong tên file
        const cleanStudentName = (stu.Name || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/\s+/g, '_');
        if (cleanStudentName && cleanStudentName.length > 5 && lowerName.includes(cleanStudentName)) {
            taggedStudentIds.add(stu.ID);
        }
    }

    // --- BƯỚC B: GEMINI MULTIMODAL AI FACE MATCHING ---
    const geminiApiKey = process.env.GEMINI_API_KEY;
    if (geminiApiKey && students.length > 0) {
        try {
            // Lấy thumbnail video làm khung hình phân tích
            const videoThumbnailPayload = await getBase64Image(fileId);

            // Lấy ảnh chân dung của các học sinh trong lớp
            const studentPayloads = [];
            for (const stu of students) {
                const avtPayload = await getBase64Image(stu.Avt);
                if (avtPayload) {
                    studentPayloads.push({
                        studentId: stu.ID,
                        name: stu.Name,
                        payload: avtPayload
                    });
                }
            }

            if (videoThumbnailPayload && studentPayloads.length > 0) {
                const genAI = new GoogleGenerativeAI(geminiApiKey);
                const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

                const studentDescriptions = studentPayloads.map((s, idx) =>
                    `Ảnh tham chiếu ${idx + 1}: Học sinh mã "${s.studentId}", Họ tên "${s.name}".`
                ).join('\n');

                const prompt = `
Bạn là hệ thống AI phân tích khuôn mặt cho Trung tâm đào tạo Robotics/STEM AI Robotic.
Nhiệm vụ của bạn: Đối chiếu khuôn mặt học sinh xuất hiện trong khung hình video thực hành với danh sách ảnh chân dung tham chiếu của các học sinh trong lớp.

DANH SÁCH ẢNH THAM CHIẾU HỌC SINH:
${studentDescriptions}

ẢNH CUỐI CÙNG LÀ: Khung hình trích xuất từ Video thực hành lớp học (Tên video: "${fileName}").

HƯỚNG DẪN ĐỐI CHIẾU:
1. Quan sát kỹ tất cả khuôn mặt xuất hiện trong khung hình video.
2. So sánh với các ảnh chân dung tham chiếu đã cung cấp.
3. Nếu phát hiện học sinh nào xuất hiện trong video, ghi nhận studentId của học sinh đó. Có thể có 1 bé, hoặc nhóm từ 2 bé trở lên.
4. Nếu video quay toàn cảnh phòng học hoặc đông học sinh không rõ mặt cá nhân, đặt isGeneral: true.

Hãy trả về DUY NHẤT một chuỗi JSON thuần (không kèm markdown):
{
  "taggedStudentIds": ["MÃ_HỌC_SINH_1", "MÃ_HỌC_SINH_2"],
  "isGeneral": false,
  "confidence": 0.92,
  "reason": "Giải thích ngắn gọn em nào có mặt"
}
`;

                const contents = [
                    prompt,
                    ...studentPayloads.map(s => ({ inlineData: s.payload.inlineData })),
                    { inlineData: videoThumbnailPayload.inlineData }
                ];

                const resultPromise = model.generateContent(contents);
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('AI scan timeout sau 12s')), 12000)
                );
                const aiRes = await Promise.race([resultPromise, timeoutPromise]);
                const rawText = aiRes.response.text().trim();
                const cleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
                const parsed = JSON.parse(cleaned);

                if (Array.isArray(parsed?.taggedStudentIds)) {
                    parsed.taggedStudentIds.forEach(id => {
                        if (students.some(s => s.ID === id)) {
                            taggedStudentIds.add(id);
                        }
                    });
                }
                if (parsed?.isGeneral === true) {
                    isGeneral = true;
                }
                if (typeof parsed?.confidence === 'number') {
                    confidence = parsed.confidence;
                }
            }
        } catch (aiErr) {
            console.warn('[VideoScanner] Gemini face recognition fallback:', aiErr.message);
        }
    }

    // Nếu không nhận diện được riêng ai và tên file không chứa mã, mặc định xem là video chung của lớp
    if (taggedStudentIds.size === 0 && !isGeneral) {
        isGeneral = true;
    }

    const finalStudentIds = Array.from(taggedStudentIds);

    // --- BƯỚC C: LƯU TRỰC TIẾP VÀO MONGODB ---
    if (!Array.isArray(lesson.Videos)) {
        lesson.Videos = [];
    }

    const existingIndex = lesson.Videos.findIndex(v => v.driveFileId === fileId || v.id === fileId);
    const videoObject = {
        driveFileId: fileId,
        id: fileId,
        name: fileName || `Video buổi học`,
        embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
        thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w600`,
        taggedStudentIds: finalStudentIds,
        isGeneral: isGeneral,
        aiScanned: true,
        confidence: confidence,
        scannedAt: new Date()
    };

    if (existingIndex >= 0) {
        lesson.Videos[existingIndex] = videoObject;
    } else {
        lesson.Videos.push(videoObject);
    }

    await course.save();

    console.log(`[VideoScanner] Đã quét xong video ${fileName} (${fileId}):`, {
        taggedStudents: finalStudentIds,
        isGeneral,
        confidence
    });

    return {
        success: true,
        taggedStudentIds: finalStudentIds,
        isGeneral,
        video: videoObject
    };
}
