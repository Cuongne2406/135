import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostCourse from '@/models/course';
import PostStudent from '@/models/student';
import mongoose from 'mongoose';

export async function GET(req) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const courseId = searchParams.get('courseId');
        const studentId = searchParams.get('studentId');
        const preview = searchParams.get('preview') === 'true';

        if (!courseId || !studentId) {
            return NextResponse.json({ status: 1, mes: 'Thiếu thông tin khóa học hoặc học sinh.' }, { status: 400 });
        }

        // Tìm khóa học theo _id hoặc mã ID (VD: 24AIROBOT01)
        const isObjectId = mongoose.Types.ObjectId.isValid(courseId);
        const query = isObjectId ? { $or: [{ _id: courseId }, { ID: courseId }] } : { ID: courseId };
        const course = await PostCourse.findOne(query).select('_id ID Type isPublished publishedAt aiPortfolioDraft Detail').lean();

        if (!course) {
            return NextResponse.json({ status: 1, mes: 'Không tìm thấy khóa học.' }, { status: 404 });
        }

        // Kiểm tra trạng thái xuất bản
        if (!course.isPublished && !preview) {
            return NextResponse.json({
                status: 1,
                isPublished: false,
                mes: 'Hồ sơ ePortfolio của bé đang được thầy cô hoàn thiện. Vui lòng quay lại sau.'
            });
        }

        // Tìm thông tin học sinh trong bản nháp aiPortfolioDraft
        const drafts = Array.isArray(course.aiPortfolioDraft) ? course.aiPortfolioDraft : [];
        let stuDraft = drafts.find(d => d.ID === studentId || d.studentId === studentId);

        // Tìm thông tin hồ sơ học sinh từ bảng students
        const stuQuery = mongoose.Types.ObjectId.isValid(studentId)
            ? { $or: [{ _id: studentId }, { ID: studentId }] }
            : { ID: studentId };
        const stuDoc = await PostStudent.findOne(stuQuery).select('ID Name Avt avatar Profile').lean();

        if (!stuDraft && !stuDoc) {
            return NextResponse.json({ status: 1, mes: 'Không tìm thấy thông tin học sinh trong khóa học này.' }, { status: 404 });
        }

        // Nếu chưa có draft được lưu, fallback lấy dữ liệu cơ bản
        if (!stuDraft) {
            stuDraft = {
                ID: stuDoc?.ID || studentId,
                name: stuDoc?.Name || 'Học sinh',
                avatar: stuDoc?.Avt || stuDoc?.avatar || '',
                coverImg: stuDoc?.Avt || stuDoc?.avatar || '',
                projectImg1: '',
                projectImg2: '',
                comment: `Em ${stuDoc?.Name || 'học sinh'} đã hoàn thành đầy đủ các nội dung của chương trình học, nắm vững kiến thức cơ bản và hoàn thiện các sản phẩm thực hành.`,
                skills: {
                    'Tư duy Thuật toán & Logic': '95 %',
                    'Kỹ năng Thao tác & Lắp ráp': '92 %',
                    'Thuyết trình & Báo cáo': '90 %',
                    'Tinh thần Đồng đội': '94 %',
                    'Sáng tạo & Cải tiến': '96 %'
                }
            };
        }

        return NextResponse.json({
            status: 2,
            isPublished: !!course.isPublished,
            publishedAt: course.publishedAt || null,
            course: {
                id: course._id.toString(),
                code: course.ID,
                type: course.Type || 'STEM Innovation'
            },
            student: {
                ID: stuDraft.ID || stuDoc?.ID || studentId,
                name: stuDraft.name || stuDoc?.Name || 'Học sinh',
                avatar: stuDraft.avatar || stuDoc?.Avt || stuDoc?.avatar || '',
                coverImg: stuDraft.coverImg || stuDoc?.Avt || '',
                projectImg1: stuDraft.projectImg1 || '',
                projectImg2: stuDraft.projectImg2 || '',
                comment: stuDraft.comment || '',
                skills: stuDraft.skills || {},
                totalAttended: stuDraft.totalAttended ?? 3,
                totalLessons: stuDraft.totalLessons ?? 3
            }
        });

    } catch (error) {
        console.error('[SHARE_PORTFOLIO_API_ERROR]', error);
        return NextResponse.json({ status: 1, mes: error.message }, { status: 500 });
    }
}
