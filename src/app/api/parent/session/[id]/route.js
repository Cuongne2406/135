export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostStudent from '@/models/student';
import PostCourse from '@/models/course';
import '@/models/book';
import '@/models/users';
import '@/models/area';
import { verifyParentToken, PARENT_COOKIE_NAME, isLeaveRequestAllowed } from '@/utils/parentAuth';
import { srcImage } from '@/function';
import { getFilesInDriveFolder } from '@/function/drive/image';
import { scanAndTagVideo } from '@/function/ai/videoScanner';

export async function GET(request, { params }) {
    try {
        const { id: lessonId } = await params;
        const token = request.cookies.get(PARENT_COOKIE_NAME)?.value;
        const decoded = verifyParentToken(token);

        if (!decoded || !decoded.phone) {
            return NextResponse.json({
                success: false,
                mes: 'Phiên đăng nhập đã hết hạn.'
            }, { status: 401 });
        }

        await connectDB();

        // Tìm khóa học chứa buổi học này
        const course = await PostCourse.findOne({ 'Detail._id': lessonId })
            .populate('Book', 'Name Cover Topics')
            .populate('TeacherHR', 'name phone avt')
            .populate('Area', 'name address')
            .populate('Detail.Teacher', 'name')
            .populate('Detail.TeachingAs', 'name')
            .populate('Detail.Room', 'name')
            .lean();

        if (!course) {
            return NextResponse.json({
                success: false,
                mes: 'Không tìm thấy thông tin buổi học.'
            }, { status: 404 });
        }

        const lessonIndex = course.Detail.findIndex(d => String(d._id) === String(lessonId));
        const lessonDetail = course.Detail[lessonIndex];

        if (!lessonDetail) {
            return NextResponse.json({
                success: false,
                mes: 'Buổi học không tồn tại trong khóa.'
            }, { status: 404 });
        }

        // Tìm thông tin học sinh
        const student = await PostStudent.findOne({ ID: decoded.activeStudentId })
            .select('ID Name Avt')
            .lean();

        const studentInCourse = course.Student?.find(s => s.ID === decoded.activeStudentId);
        const learnEntry = studentInCourse?.Learn?.find(lr => String(lr.Lesson) === String(lessonId)) || {};

        // Tìm thông tin chủ đề bài học
        const topicInfo = course.Book?.Topics?.find(t => String(t._id) === String(lessonDetail.Topic)) || {};

        // Xử lý danh sách hình ảnh & video thực hành
        let photos = [];
        let videos = [];

        // 1. Quét từ DetailImage (đã lưu trong MongoDB của buổi học)
        if (lessonDetail.DetailImage && lessonDetail.DetailImage.length > 0) {
            lessonDetail.DetailImage.forEach((item, i) => {
                const itemId = typeof item === 'string' ? item : (item?.id || item?.url || '');
                if (!itemId) return;
                const isVideo = item?.type === 'video' ||
                    /\.(mp4|mov|avi|wmv|mkv|webm)$/i.test(itemId) ||
                    itemId.includes('youtube.com') ||
                    itemId.includes('youtu.be') ||
                    itemId.includes('drive.google.com');

                if (isVideo) {
                    let embedUrl = itemId;
                    let thumb = '';
                    if (itemId.includes('drive.google.com')) {
                        const m = itemId.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || itemId.match(/id=([a-zA-Z0-9_-]+)/);
                        if (m) {
                            embedUrl = `https://drive.google.com/file/d/${m[1]}/preview`;
                            thumb = `https://drive.google.com/thumbnail?id=${m[1]}`;
                        }
                    } else if (!itemId.startsWith('http') && !itemId.startsWith('/')) {
                        embedUrl = `https://drive.google.com/file/d/${itemId}/preview`;
                        thumb = `https://drive.google.com/thumbnail?id=${itemId}`;
                    }

                    if (!videos.some(v => v.id === itemId)) {
                        videos.push({
                            id: itemId,
                            name: item?.name || `Video thực hành ${videos.length + 1}`,
                            embedUrl: embedUrl,
                            thumbnailUrl: thumb,
                            type: 'video',
                            taggedStudentIds: [],
                            isGeneral: true
                        });
                    }
                } else {
                    photos.push({
                        id: itemId,
                        url: itemId.startsWith('/') || itemId.startsWith('http') ? itemId : `https://lh3.googleusercontent.com/d/${itemId}`,
                        taggedStudentIds: item?.taggedStudentIds || [],
                        isGeneral: item?.isGeneral ?? (item?.taggedStudentIds?.length ? false : true),
                        isPersonal: item?.isPersonal || false,
                        isRejected: item?.isRejected === true
                    });
                }
            });
        }

        // 2. Lấy video đã lưu/quét sẵn trong lessonDetail.Videos từ MongoDB (0 tốn API Gemini)
        if (Array.isArray(lessonDetail.Videos)) {
            lessonDetail.Videos.forEach(v => {
                const vidId = v?.id || v?.driveFileId;
                if (vidId) {
                    const existingIdx = videos.findIndex(existing => existing.id === vidId);
                    const vidItem = {
                        id: vidId,
                        name: v.name || 'Video buổi học',
                        embedUrl: v.embedUrl || `https://drive.google.com/file/d/${vidId}/preview`,
                        thumbnailUrl: v.thumbnailUrl || `https://drive.google.com/thumbnail?id=${vidId}&sz=w600`,
                        taggedStudentIds: v.taggedStudentIds || [],
                        isGeneral: v.isGeneral ?? true,
                        isRejected: v.isRejected === true,
                        aiScanned: v.aiScanned || false,
                        type: 'video'
                    };
                    if (existingIdx >= 0) {
                        videos[existingIdx] = vidItem;
                    } else {
                        videos.push(vidItem);
                    }
                }
            });
        }

        // 3. Tự động đồng bộ 1 lần duy nhất nếu buổi học có folder Drive thật nhưng DB chưa có file
        if (lessonDetail.Image && typeof lessonDetail.Image === 'string' && lessonDetail.Image.length > 15 && (!lessonDetail.DetailImage || lessonDetail.DetailImage.length === 0)) {
            try {
                const { syncSessionDriveMedia } = await import('@/function/drive/syncMedia');
                const syncResult = await syncSessionDriveMedia({ courseId: course._id, lessonId: lessonDetail._id });
                if (syncResult?.success) {
                    if (Array.isArray(syncResult.detailImage)) {
                        syncResult.detailImage.forEach(img => {
                            if (img.type === 'image' && !photos.some(p => p.id === img.id)) {
                                photos.push({ id: img.id, url: `https://lh3.googleusercontent.com/d/${img.id}` });
                            }
                        });
                    }
                    if (Array.isArray(syncResult.videos)) {
                        syncResult.videos.forEach(v => {
                            if (!videos.some(existing => existing.id === v.id)) {
                                videos.push(v);
                            }
                        });
                    }
                }
            } catch (err) {
                console.warn('[ParentSession] Tự động đồng bộ Drive ban đầu thất bại:', err.message);
            }
        }

        // 3. Quét ảnh & video riêng của học sinh từ learnEntry.Image
        if (Array.isArray(learnEntry.Image)) {
            learnEntry.Image.forEach(item => {
                const itemId = typeof item === 'string' ? item : (item?.id || item?.url || '');
                if (!itemId) return;
                const isVideo = item?.type === 'video' ||
                    /\.(mp4|mov|avi|wmv|mkv|webm)$/i.test(itemId) ||
                    itemId.includes('youtube.com') ||
                    itemId.includes('youtu.be') ||
                    itemId.includes('drive.google.com');

                if (isVideo && !videos.some(v => v.id === itemId)) {
                    let embedUrl = itemId;
                    let thumb = '';
                    if (itemId.includes('drive.google.com')) {
                        const m = itemId.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) || itemId.match(/id=([a-zA-Z0-9_-]+)/);
                        if (m) {
                            embedUrl = `https://drive.google.com/file/d/${m[1]}/preview`;
                            thumb = `https://drive.google.com/thumbnail?id=${m[1]}`;
                        }
                    } else if (!itemId.startsWith('http') && !itemId.startsWith('/')) {
                        embedUrl = `https://drive.google.com/file/d/${itemId}/preview`;
                        thumb = `https://drive.google.com/thumbnail?id=${itemId}`;
                    }

                    videos.unshift({
                        id: itemId,
                        name: item?.name || `Video của bé ${student?.Name || ''}`,
                        embedUrl: embedUrl,
                        thumbnailUrl: thumb,
                        type: 'video',
                        isPersonal: true
                    });
                } else if (!isVideo && !photos.some(p => p.id === itemId)) {
                    photos.unshift({
                        id: itemId,
                        url: itemId.startsWith('/') || itemId.startsWith('http') ? itemId : `https://lh3.googleusercontent.com/d/${itemId}`,
                        isPersonal: true
                    });
                }
            });
        }

        // Lọc ảnh và video phân phối chính xác cho học sinh này (Phụ huynh chỉ xem ảnh/video có con mình hoặc toàn cảnh lớp)
        const activeStudentId = decoded.activeStudentId || student?.ID;
        const filteredPhotos = [];
        const filteredVideos = [];

        photos.forEach(p => {
            if (p.isRejected === true) return; // Tuyệt đối loại bỏ ảnh xấu/mờ/không rõ mặt
            const isTagged = Array.isArray(p.taggedStudentIds) && p.taggedStudentIds.includes(activeStudentId);
            const isPersonal = p.isPersonal === true || (Array.isArray(p.taggedStudentIds) && p.taggedStudentIds.length === 1 && isTagged);
            const isGroup = Array.isArray(p.taggedStudentIds) && p.taggedStudentIds.length >= 2 && isTagged;
            // Chỉ xem là ảnh chung nếu KHÔNG bị gắn thẻ độc quyền cho học sinh khác
            const isGeneral = p.isGeneral === true && (!Array.isArray(p.taggedStudentIds) || p.taggedStudentIds.length === 0);

            if (isTagged || isPersonal || isGeneral) {
                filteredPhotos.push({
                    ...p,
                    isPersonal,
                    isGroup,
                    isGeneral: !isTagged && isGeneral
                });
            }
        });

        videos.forEach(v => {
            if (v.isRejected === true) return; // Tuyệt đối loại bỏ video xấu/mờ/không rõ mặt
            const isTagged = Array.isArray(v.taggedStudentIds) && v.taggedStudentIds.includes(activeStudentId);
            const isPersonal = v.isPersonal === true || (Array.isArray(v.taggedStudentIds) && v.taggedStudentIds.length === 1 && isTagged);
            const isGroup = Array.isArray(v.taggedStudentIds) && v.taggedStudentIds.length >= 2 && isTagged;
            // Chỉ xem là video chung nếu KHÔNG bị gắn thẻ độc quyền cho học sinh khác
            const isGeneral = v.isGeneral === true && (!Array.isArray(v.taggedStudentIds) || v.taggedStudentIds.length === 0);

            if (isTagged || isPersonal || isGeneral) {
                filteredVideos.push({
                    ...v,
                    isPersonal,
                    isGroup,
                    isGeneral: !isTagged && isGeneral
                });
            }
        });

        const leaveCheck = isLeaveRequestAllowed(lessonDetail.Day, lessonDetail.Time);
        const prevLessonId = lessonIndex > 0 ? String(course.Detail[lessonIndex - 1]._id) : null;
        const nextLessonId = lessonIndex < course.Detail.length - 1 ? String(course.Detail[lessonIndex + 1]._id) : null;

        const allLessons = (course.Detail || []).map((d, idx) => {
            const tInfo = course.Book?.Topics?.find(t => String(t._id) === String(d.Topic)) || {};
            const stuLearn = studentInCourse?.Learn?.find(l => String(l.Lesson) === String(d._id)) || {};
            const lCheck = isLeaveRequestAllowed(d.Day, d.Time);
            return {
                _id: String(d._id),
                index: idx + 1,
                TopicName: tInfo.Name || `Buổi ${idx + 1}`,
                Day: d.Day,
                Time: d.Time || '08:00 - 10:00',
                Checkin: stuLearn.Checkin ?? 0,
                absenceReason: stuLearn.absenceReason || '',
                isCurrent: idx === lessonIndex,
                isPast: lCheck.isPast,
                canLeaveRequest: lCheck.allowed
            };
        });

        return NextResponse.json({
            success: true,
            lesson: {
                _id: String(lessonDetail._id),
                index: lessonIndex + 1,
                totalLessons: course.Detail.length,
                TopicName: topicInfo.Name || 'Chủ đề bài học Robotics',
                Day: lessonDetail.Day,
                Time: lessonDetail.Time || '08:00 - 10:00',
                Room: lessonDetail.Room?.name || 'Phòng Lab Robotics',
                Teacher: lessonDetail.Teacher?.name || course.TeacherHR?.name || 'Giáo viên hướng dẫn',
                TeachingAs: lessonDetail.TeachingAs?.name || '',
                Type: lessonDetail.Type || 'Chính thức',
                Checkin: learnEntry.Checkin ?? 0,
                Cmt: learnEntry.Cmt || [],
                CmtFn: learnEntry.CmtFn || '',
                Note: learnEntry.Note || '',
                absenceReason: learnEntry.absenceReason || '',
                canLeaveRequest: leaveCheck.allowed,
                isPast: leaveCheck.isPast,
                leaveDeadline: leaveCheck.deadline ? leaveCheck.deadline.toISOString() : null,
                photos: filteredPhotos,
                videos: filteredVideos
            },
            navigation: {
                prevLessonId,
                nextLessonId
            },
            allLessons,
            student: {
                ID: student?.ID,
                Name: student?.Name,
                Avt: srcImage(student?.Avt)
            },
            course: {
                _id: String(course._id),
                ID: course.ID,
                BookName: course.Book?.Name || 'Chương trình Robotics'
            }
        });
    } catch (error) {
        console.error('[API_PARENT_SESSION_DETAIL_ERROR]', error);
        return NextResponse.json({
            success: false,
            mes: error.message || 'Lỗi lấy chi tiết buổi học.'
        }, { status: 500 });
    }
}
