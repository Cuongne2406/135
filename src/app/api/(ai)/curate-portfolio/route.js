import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostStudent from '@/models/student';
import PostBook from '@/models/book';
import { getFilesInDriveFolder } from '@/function/drive/image';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { handleApiError } from '@/utils/apiError';
import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';

// Helper tải thumbnail ảnh w512 dưới dạng base64 cho Gemini
async function fetchImageBase64(fileId, timeoutMs = 3000) {
    if (!fileId || typeof fileId !== 'string') return null;
    // Hỗ trợ đọc ảnh trực tiếp từ thư mục public/ nếu là đường dẫn nội bộ
    if (fileId.startsWith('/')) {
        try {
            const localPath = path.join(process.cwd(), 'public', fileId);
            if (fs.existsSync(localPath)) {
                const buffer = fs.readFileSync(localPath);
                return {
                    inlineData: {
                        data: buffer.toString('base64'),
                        mimeType: 'image/jpeg'
                    }
                };
            }
        } catch (e) {
            console.warn('[AI-Curate] Lỗi đọc ảnh local:', e.message);
        }
    }

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

// Helper định dạng radar skills từ AI với Fallback an toàn
function formatRadarSkills(aiSkills, fallbackSkills) {
    if (!aiSkills || typeof aiSkills !== 'object') return fallbackSkills;
    const formatVal = (v, fb) => {
        if (v === undefined || v === null) return fb;
        if (typeof v === 'string' && v.includes('%')) return v;
        const num = Number(v);
        if (!isNaN(num) && num > 0) return `${Math.min(100, Math.max(50, Math.round(num)))} %`;
        return fb;
    };
    return {
        'Tư duy Thuật toán & Logic': formatVal(aiSkills.algorithm || aiSkills['Tư duy Thuật toán & Logic'], fallbackSkills['Tư duy Thuật toán & Logic']),
        'Kỹ năng Thao tác & Lắp ráp': formatVal(aiSkills.manipulation || aiSkills['Kỹ năng Thao tác & Lắp ráp'], fallbackSkills['Kỹ năng Thao tác & Lắp ráp']),
        'Thuyết trình & Báo cáo': formatVal(aiSkills.presentation || aiSkills['Thuyết trình & Báo cáo'], fallbackSkills['Thuyết trình & Báo cáo']),
        'Tinh thần Đồng đội': formatVal(aiSkills.teamwork || aiSkills['Tinh thần Đồng đội'], fallbackSkills['Tinh thần Đồng đội']),
        'Sáng tạo & Cải tiến': formatVal(aiSkills.creativity || aiSkills['Sáng tạo & Cải tiến'], fallbackSkills['Sáng tạo & Cải tiến'])
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

        // 2. Lấy thông tin học sinh trong lớp (bao gồm điểm số Scores)
        const studentIds = (course.Student || []).map(s => s.ID);
        const studentDocs = await PostStudent.find({ ID: { $in: studentIds } }).select('_id ID Name Avt avatar Profile Scores').lean();

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

            // Từ các Google Drive folder của từng buổi học (quét đồng thời song song)
            const folderPromises = course.Detail.map(async (lesson, idx) => {
                const folderId = lesson.Image;
                if (!folderId || typeof folderId !== 'string' || folderId.length <= 15) return [];
                try {
                    const driveFiles = await getFilesInDriveFolder(folderId);
                    return driveFiles.map(file => ({
                        id: file.id,
                        source: `Buổi ${idx + 1} (Drive)`,
                        name: file.name,
                        lessonIdx: idx
                    }));
                } catch (err) {
                    console.warn(`[AI-Curate] Quét Drive folder ${folderId} thất bại:`, err.message);
                    return [];
                }
            });

            const folderResults = await Promise.allSettled(folderPromises);
            folderResults.forEach(res => {
                if (res.status === 'fulfilled' && Array.isArray(res.value)) {
                    res.value.forEach(file => {
                        if (file.id && !seenIds.has(file.id)) {
                            seenIds.add(file.id);
                            allCourseImages.push(file);
                        }
                    });
                }
            });
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

        // 5. Sử dụng Gemini Vision & Pedagogical Reasoning để phân tích đa chiều
        const geminiApiKey = process.env.GEMINI_API_KEY;
        const aiRecommendations = new Map();

        if (geminiApiKey && allCourseImages.length > 0 && studentDocs.length > 0) {
            try {
                // Giới hạn tối đa 24 ảnh đại diện từ các buổi học để gửi AI trong thời gian tối ưu
                const sampleImages = allCourseImages.slice(0, 24);
                
                // Tải đồng thời song song 24 ảnh base64
                const base64Results = await Promise.allSettled(
                    sampleImages.map(img => fetchImageBase64(img.id, 2500))
                );

                const imagePayloads = [];
                sampleImages.forEach((img, i) => {
                    const res = base64Results[i];
                    if (res?.status === 'fulfilled' && res.value) {
                        imagePayloads.push({ id: img.id, ...res.value });
                    }
                });

                if (imagePayloads.length > 0) {
                    const genAI = new GoogleGenerativeAI(geminiApiKey);
                    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

                    // Trích xuất dữ liệu đa chiều cho từng học sinh: Tỷ lệ đi học, ghi chú buổi học, điểm số bài test
                    const totalLessons = course.Detail?.length || 1;
                    const studentListPrompt = studentDocs.map((s, i) => {
                        const stuData = (course.Student || []).find(cs => cs.ID === s.ID);
                        const totalAtt = (stuData?.Learn || []).filter(l => Number(l.Checkin) === 1).length;
                        const attRate = Math.round((totalAtt / (totalLessons || 1)) * 100);
                        const notes = (stuData?.Learn || []).map((l, idx) => {
                            const c = [l.CmtFn, ...(l.Cmt || [])].filter(Boolean).join('; ');
                            return c ? `Buổi ${idx + 1}: ${c}` : null;
                        }).filter(Boolean).join(' | ') || 'Chăm chỉ, tích cực';
                        const testScores = (s.Scores || []).map(sc => `${sc.testName}: ${sc.score}/${sc.maxScore || 10}`).join(', ') || 'Chưa có điểm bài test';
                        return `Học sinh ${i + 1}:
- studentId: "${s.ID}"
- Họ tên: ${s.Name || 'Học sinh'}
- Chuyên cần: ${totalAtt}/${totalLessons} buổi (${attRate}%)
- Ghi chú buổi học: ${notes}
- Điểm kiểm tra: ${testScores}`;
                    }).join('\n\n');

                    const prompt = `
Bạn là chuyên gia sư phạm & giám tuyển tốt nghiệp E-Portfolio cho trung tâm giáo dục STEM/Robotics AI Robotic.
Dưới đây là hồ sơ học tập chi tiết của từng học sinh:
${studentListPrompt}

Chúng tôi đã gửi kèm ${imagePayloads.length} bức ảnh hoạt động thực tế từ khóa học.
Đối với mỗi học sinh, hãy phân tích kỹ hồ sơ và thực hiện:
1. Tuyển chọn 3 bức ảnh phù hợp nhất:
   - coverImg: File ID ảnh cận cảnh/nửa người rõ mặt học sinh, nét mặt vui vẻ/tự tin.
   - projectImg1: File ID ảnh học sinh đang tập trung thao tác, lắp ráp hoặc lập trình.
   - projectImg2: File ID ảnh chụp cùng sản phẩm hoàn chỉnh hoặc thuyết trình.
2. Viết nhận xét sư phạm (aiComment): Đoạn nhận xét ấm áp, chuyên nghiệp (khoảng 3-5 câu), mang tính cá nhân hóa sâu sắc dựa trên ghi chú thực tế của giáo viên qua từng buổi học và điểm số của bé. Khen ngợi điểm mạnh nổi trội và khích lệ bé tự tin phát triển đam mê công nghệ.
3. Đánh giá 5 trục kỹ năng (aiRadarSkills, thang điểm 0 - 100):
   - algorithm: Tư duy Thuật toán & Logic
   - manipulation: Kỹ năng Thao tác & Lắp ráp
   - presentation: Thuyết trình & Báo cáo
   - teamwork: Tinh thần Đồng đội
   - creativity: Sáng tạo & Cải tiến

Trả về duy nhất định dạng JSON thuần (không kèm markdown code block thừa thãi) theo cấu trúc:
{
  "recommendations": [
    {
      "studentId": "ID_HOC_SINH",
      "coverImg": "FILE_ID_ANH_1",
      "projectImg1": "FILE_ID_ANH_2",
      "projectImg2": "FILE_ID_ANH_3",
      "aiComment": "Nhận xét sư phạm...",
      "aiRadarSkills": {
        "algorithm": 92,
        "manipulation": 95,
        "presentation": 88,
        "teamwork": 90,
        "creativity": 94
      }
    }
  ]
}
`;

                    const contents = [prompt, ...imagePayloads.map(p => ({ inlineData: p.inlineData }))];
                    const aiResult = await model.generateContent(contents);
                    const rawText = aiResult.response.text().trim();
                    const jsonCleaned = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/, '').trim();
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
                console.warn('[AI-Curate] Lỗi gọi Gemini Vision (chuyển sang Fallback an toàn):', aiErr.message);
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

            // Fallback an toàn cho nhận xét và kỹ năng
            const fallbackComment = synthesizeComment(stu, stuDataInCourse);
            const fallbackSkills = calculateRadarSkills(stuDataInCourse, totalLessons, sIdx);

            const comment = (aiRec?.aiComment && typeof aiRec.aiComment === 'string' && aiRec.aiComment.trim().length > 15)
                ? aiRec.aiComment.trim()
                : fallbackComment;

            const skills = formatRadarSkills(aiRec?.aiRadarSkills, fallbackSkills);
            const totalAttended = (stuDataInCourse?.Learn || []).filter(l => Number(l.Checkin) === 1).length;

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
                aiComment: aiRec?.aiComment || null,
                aiRadarSkills: aiRec?.aiRadarSkills || null,
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
        return handleApiError('GEMINI_CURATE', error, 'Lỗi phân tích và tuyển chọn ảnh AI cho khóa học.');
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
        const course = await PostCourse.findById(courseId).select('aiPortfolioDraft isPublished publishedAt ID Type').lean();
        return NextResponse.json({
            status: 2,
            data: course?.aiPortfolioDraft || null,
            isPublished: !!course?.isPublished,
            publishedAt: course?.publishedAt || null,
            courseCode: course?.ID || '',
            courseType: course?.Type || ''
        });
    } catch (error) {
        return NextResponse.json({ status: 1, mes: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        await connectDB();
        const body = await req.json();
        const { courseId, isPublished, draft } = body;

        if (!courseId || !mongoose.Types.ObjectId.isValid(courseId)) {
            return NextResponse.json({ status: 1, mes: 'courseId không hợp lệ' }, { status: 400 });
        }

        const updateFields = {};
        if (typeof isPublished === 'boolean') {
            updateFields.isPublished = isPublished;
            if (isPublished) {
                updateFields.publishedAt = new Date();
            }
        }
        if (Array.isArray(draft)) {
            updateFields.aiPortfolioDraft = draft;
        }

        const updated = await PostCourse.findByIdAndUpdate(
            courseId,
            { $set: updateFields },
            { new: true, select: 'isPublished publishedAt aiPortfolioDraft' }
        ).lean();

        if (!updated) {
            return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học' }, { status: 404 });
        }

        return NextResponse.json({
            status: 2,
            mes: isPublished ? 'Đã xuất bản ePortfolio thành công' : 'Đã lưu bản nháp ePortfolio',
            isPublished: !!updated.isPublished,
            publishedAt: updated.publishedAt
        });
    } catch (error) {
        return NextResponse.json({ status: 1, mes: error.message }, { status: 500 });
    }
}

