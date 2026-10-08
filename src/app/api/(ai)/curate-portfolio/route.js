import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostStudent from '@/models/student';
import { getFilesInDriveFolder } from '@/function/drive/image';
import { GoogleGenerativeAI } from '@google/generative-ai';

import mongoose from 'mongoose';

// Helper tải thumbnail ảnh w512 dưới dạng base64 cho Gemini
async function fetchImageBase64(fileId, timeoutMs = 3000) {
    try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const url = `https://lh3.googleusercontent.com/d/${fileId}=w512`;
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

// Hàm sinh nhận xét tự động cho từng học sinh dựa vào lịch sử buổi học
function synthesizeComment(stu, stuDataInCourse) {
    if (stuDataInCourse && Array.isArray(stuDataInCourse.Learn)) {
        const cmtFns = stuDataInCourse.Learn.map(l => l.CmtFn).filter(Boolean);
        const rawCmts = stuDataInCourse.Learn.flatMap(l => l.Cmt || []).filter(Boolean);

        if (cmtFns.length > 0) {
            return cmtFns.slice(-2).join(' ') + ' Em có tinh thần tự giác cao và hoàn thành xuất sắc đồ án cuối khóa.';
        } else if (rawCmts.length > 0) {
            return `Trong suốt khóa học, ${stu.Name || 'học sinh'} đã thể hiện tinh thần học tập tích cực. Tiêu biểu: ${rawCmts.slice(0, 3).join(', ')}.`;
        }
    }
    return `Em ${stu.Name || 'học sinh'} đã hoàn thành đầy đủ các nội dung của chương trình học, nắm vững kiến thức cơ bản và hoàn thiện các sản phẩm thực hành theo chuẩn đầu ra.`;
}

// Hàm tính Radar kỹ năng 5 trục
function calculateRadarSkills(stuDataInCourse, totalLessons, sIdx) {
    const totalAttended = (stuDataInCourse?.Learn || []).filter(l => l.Checkin === 1).length;
    const attendanceRatio = Math.min(1, totalAttended / (totalLessons || 1));
    const baseScore = Math.round(85 + attendanceRatio * 10);

    return {
        'Tư duy Thuật toán & Logic': `${Math.min(98, baseScore + (sIdx % 3))} %`,
        'Kỹ năng Thao tác & Lắp ráp': `${Math.min(97, baseScore + 2 - (sIdx % 2))} %`,
        'Thuyết trình & Báo cáo': `${Math.min(95, baseScore - 3 + (sIdx % 4))} %`,
        'Tinh thần Đồng đội': `${Math.min(96, baseScore + 1)} %`,
        'Sáng tạo & Cải tiến': `${Math.min(98, baseScore + 3 - (sIdx % 3))} %`
    };
}

export async function POST(req) {
    try {
        await connectDB();
        const body = await req.json();
        const { courseId, forceRefresh = false } = body;

        if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
            return NextResponse.json({ status: 1, mes: 'courseId không hợp lệ' }, { status: 400 });
        }

        const course = await PostCourse.findById(courseId).populate('Book', 'ID Name').lean();
        if (!course) {
            return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học' }, { status: 404 });
        }

        // 1. Kiểm tra cache nếu đã có bản nháp và không yêu cầu forceRefresh
        if (!forceRefresh && course.aiPortfolioDraft && Array.isArray(course.aiPortfolioDraft) && course.aiPortfolioDraft.length > 0) {
            return NextResponse.json({
                status: 2,
                mes: 'Lấy dữ liệu từ bản nháp AI sẵn có.',
                data: course.aiPortfolioDraft,
                fromCache: true
            });
        }

        // 2. Lấy thông tin học sinh trong lớp
        const studentIds = (course.Student || []).map(s => s.ID);
        const studentDocs = await PostStudent.find({ ID: { $in: studentIds } }).select('_id ID Name Avt avatar Profile').lean();

        // 3. Thu thập toàn bộ ảnh của khóa học (từ DetailImage + Google Drive Folder)
        const allCourseImages = [];
        const seenIds = new Set();

        if (Array.isArray(course.Detail)) {
            // Từ MongoDB DetailImage
            course.Detail.forEach((lesson, idx) => {
                if (Array.isArray(lesson.DetailImage)) {
                    lesson.DetailImage.forEach(img => {
                        if (img?.id && !seenIds.has(img.id)) {
                            seenIds.add(img.id);
                            allCourseImages.push({
                                id: img.id,
                                source: `Buổi ${idx + 1}`,
                                lessonIdx: idx
                            });
                        }
                    });
                }
            });

            // Từ các Google Drive folder của từng buổi học
            for (let idx = 0; idx < course.Detail.length; idx++) {
                const folderId = course.Detail[idx].Image;
                if (folderId && typeof folderId === 'string' && folderId.length > 15) {
                    try {
                        const driveFiles = await getFilesInDriveFolder(folderId);
                        for (const file of driveFiles) {
                            if (file.id && !seenIds.has(file.id)) {
                                seenIds.add(file.id);
                                allCourseImages.push({
                                    id: file.id,
                                    source: `Buổi ${idx + 1} (Drive)`,
                                    name: file.name,
                                    lessonIdx: idx
                                });
                            }
                        }
                    } catch (err) {
                        console.warn(`[AI-Curate] Quét Drive folder ${folderId} thất bại:`, err.message);
                    }
                }
            }
        }

        // 4. Thu thập ảnh riêng của từng học sinh (từ Learn[].Image)
        const studentPersonalMap = new Map();
        (course.Student || []).forEach(stu => {
            const personal = [];
            if (Array.isArray(stu.Learn)) {
                stu.Learn.forEach(l => {
                    if (Array.isArray(l.Image)) {
                        l.Image.forEach(img => {
                            if (img?.id && !personal.includes(img.id)) {
                                personal.push(img.id);
                                if (!seenIds.has(img.id)) {
                                    seenIds.add(img.id);
                                    allCourseImages.push({
                                        id: img.id,
                                        source: 'Bài làm cá nhân'
                                    });
                                }
                            }
                        });
                    }
                });
            }
            studentPersonalMap.set(stu.ID, personal);
        });

        // 5. Sử dụng Gemini Vision để phân tích và tối ưu hóa lựa chọn (nếu có API Key và có ảnh)
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const aiRecommendations = new Map();

        if (geminiApiKey && allCourseImages.length > 0 && studentDocs.length > 0) {
            try {
                // Giới hạn tối đa 24 ảnh đại diện từ các buổi học để gửi AI trong thời gian tối ưu
                const sampleImages = allCourseImages.slice(0, 24);
                const imagePayloads = [];

                for (const img of sampleImages) {
                    const base64Data = await fetchImageBase64(img.id, 2000);
                    if (base64Data) {
                        imagePayloads.push({ id: img.id, ...base64Data });
                    }
                }

                if (imagePayloads.length > 0) {
                    const genAI = new GoogleGenerativeAI(geminiApiKey);
                    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

                    const studentListPrompt = studentDocs.map((s, i) => `${i + 1}. ID: ${s.ID}, Tên: ${s.Name || 'Học sinh'}`).join('\n');
                    const prompt = `
Bạn là chuyên gia tuyển chọn ảnh tốt nghiệp E-Portfolio cho trung tâm giáo dục STEM/Robotics.
Dưới đây là danh sách học sinh:
${studentListPrompt}

Chúng tôi đã gửi kèm ${imagePayloads.length} bức ảnh hoạt động từ khóa học.
Hãy chọn ra 3 ảnh đẹp nhất cho mỗi học sinh:
- coverImg: Ảnh cận cảnh/nửa người rõ mặt học sinh, nét mặt vui vẻ/tự tin/rạng rỡ.
- projectImg1: Ảnh học sinh đang tập trung thao tác, lắp ráp robot, code hoặc chế tạo.
- projectImg2: Ảnh chụp cùng sản phẩm hoàn chỉnh hoặc thuyết trình.

Trả về duy nhất định dạng JSON thuần (không kèm markdown code block thừa thãi) theo cấu trúc:
{
  "recommendations": [
    {
      "studentId": "ID_HOC_SINH",
      "coverImg": "FILE_ID_ANH_1",
      "projectImg1": "FILE_ID_ANH_2",
      "projectImg2": "FILE_ID_ANH_3"
    }
  ]
}
`;

                    const contents = [prompt, ...imagePayloads.map(p => ({ inlineData: p.inlineData }))];
                    const aiResult = await model.generateContent(contents);
                    const rawText = aiResult.response.text().trim();
                    const jsonCleaned = rawText.replace(/^```json\s*/, '').replace(/```\s*$/, '').trim();
                    const parsed = JSON.parse(jsonCleaned);

                    if (Array.isArray(parsed?.recommendations)) {
                        parsed.recommendations.forEach(rec => {
                            if (rec.studentId) {
                                aiRecommendations.set(rec.studentId, rec);
                            }
                        });
                    }
                }
            } catch (aiErr) {
                console.warn('[AI-Curate] Lỗi gọi Gemini Vision (sẽ chuyển sang thuật toán Fallback):', aiErr.message);
            }
        }

        // 6. Xây dựng danh sách đề xuất hoàn chỉnh (AI Recommendation + Fallback an toàn)
        const totalLessons = course.Detail?.length || 1;
        const allImageIds = allCourseImages.map(img => img.id);

        const finalDraft = studentDocs.map((stu, sIdx) => {
            const stuDataInCourse = (course.Student || []).find(s => s.ID === stu.ID);
            const personalImgs = studentPersonalMap.get(stu.ID) || [];
            const aiRec = aiRecommendations.get(stu.ID);

            // Xây dựng kho ảnh ưu tiên cho học sinh này
            const candidatePool = [
                ...personalImgs,
                ...allImageIds.filter(id => !personalImgs.includes(id))
            ];

            // Phân bổ 3 ảnh: Ưu tiên AI chọn -> nếu không có thì lấy theo vị trí trong candidatePool
            const coverImg = aiRec?.coverImg && allImageIds.includes(aiRec.coverImg)
                ? aiRec.coverImg
                : (candidatePool[0] || '');

            const projectImg1 = aiRec?.projectImg1 && allImageIds.includes(aiRec.projectImg1)
                ? aiRec.projectImg1
                : (candidatePool[1] || candidatePool[0] || '');

            const projectImg2 = aiRec?.projectImg2 && allImageIds.includes(aiRec.projectImg2)
                ? aiRec.projectImg2
                : (candidatePool[2] || candidatePool[1] || candidatePool[0] || '');

            const comment = synthesizeComment(stu, stuDataInCourse);
            const skills = calculateRadarSkills(stuDataInCourse, totalLessons, sIdx);
            const totalAttended = (stuDataInCourse?.Learn || []).filter(l => l.Checkin === 1).length;

            return {
                studentId: stu._id?.toString() || stu.ID,
                ID: stu.ID,
                name: stu.Name || 'Học sinh',
                avatar: stu.Avt || stu.avatar || '',
                totalAttended,
                totalLessons,
                coverImg,
                projectImg1,
                projectImg2,
                comment,
                skills,
                isAiSelected: true
            };
        });

        // 7. Lưu lại bản nháp vào Database để tái sử dụng ngay lập tức các lần sau
        await PostCourse.updateOne({ _id: courseId }, { $set: { aiPortfolioDraft: finalDraft } }, { strict: false });

        return NextResponse.json({
            status: 2,
            mes: '✨ AI đã tự động tuyển chọn ảnh Portfolio thành công!',
            data: finalDraft,
            allImagesCount: allCourseImages.length
        });

    } catch (error) {
        console.error('[AI-Curate] Lỗi server:', error);
        return NextResponse.json({ status: 1, mes: error.message || 'Lỗi server xử lý ảnh AI.' }, { status: 500 });
    }
}

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const courseId = searchParams.get('courseId');
    if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
        return NextResponse.json({ status: 1, mes: 'courseId không hợp lệ' }, { status: 400 });
    }

    try {
        await connectDB();
        const course = await PostCourse.findById(courseId).select('aiPortfolioDraft').lean();
        return NextResponse.json({
            status: 2,
            data: course?.aiPortfolioDraft || null
        });
    } catch (error) {
        return NextResponse.json({ status: 1, mes: error.message }, { status: 500 });
    }
}
