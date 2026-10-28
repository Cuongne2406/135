import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostStudent from '@/models/student';
import PostCourse from '@/models/course';
import Customer from '@/models/customer';
import TrialCourse from '@/models/coursetry';
import Area from '@/models/area';
import authenticate from '@/utils/authenticate';
import { writeSystemLog } from '@/utils/auditLog';
import { ProfileDefault, statusStudent } from '@/data/default';
import { reloadStudent, reloadCourse } from '@/data/actions/reload';
import { getNextStudentId } from '@/utils/studentIdGenerator';
import mongoose from 'mongoose';

export async function GET(req) {
    try {
        await connectDB();
        const [courses, areas] = await Promise.all([
            PostCourse.find({}).select('ID Book').populate('Book', 'Name').lean(),
            Area.find({}).select('name rooms').lean()
        ]);
        return NextResponse.json({
            status: 2,
            courses: courses.map(c => ({
                _id: c._id.toString(),
                name: c.ID,
                bookName: c.Book?.Name || ''
            })),
            areas: areas.map(a => ({
                _id: a._id.toString(),
                name: a.name || 'Khu vực'
            }))
        });
    } catch (err) {
        return NextResponse.json({ status: 1, mes: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { user } = await authenticate(req);
        if (!user) {
            return NextResponse.json({ status: 1, mes: 'Chưa đăng nhập' }, { status: 401 });
        }

        const body = await req.json();
        const {
            leadId,
            leadType = 'customer', // 'customer' | 'coursetry'
            name,
            phone,
            parentName = '',
            email = '',
            areaId,
            courseId,
            birthDate,
            school = '',
            address = ''
        } = body;

        if (!name || !phone || !courseId || !areaId) {
            return NextResponse.json({ status: 1, mes: 'Vui lòng điền đủ Tên, SĐT, Khóa học và Khu vực.' }, { status: 400 });
        }

        await connectDB();

        // 1. Kiểm tra khóa học mục tiêu
        const course = await PostCourse.findById(courseId);
        if (!course) {
            return NextResponse.json({ status: 1, mes: 'Khóa học không tồn tại.' }, { status: 404 });
        }

        // 2. Kiểm tra trùng số điện thoại
        const existingStudent = await PostStudent.findOne({ Phone: phone.trim() }).select('ID Name').lean();
        if (existingStudent) {
            return NextResponse.json({
                status: 1,
                mes: `Số điện thoại ${phone} đã thuộc về học sinh ${existingStudent.Name} (Mã: ${existingStudent.ID}). Không thể tạo học sinh trùng lặp.`
            }, { status: 400 });
        }

        // 3. Tạo mã học viên tự động nguyên tử (AI0001, AI0002, ...)
        const newStudentId = await getNextStudentId();

        // 3. Khởi tạo mảng buổi học cho học sinh trong Course.Detail
        const learnEntries = (course.Detail || [])
            .filter(d => !d.Type || d.Type === '')
            .map(d => ({
                Lesson: d._id,
                Checkin: 0,
                Cmt: [],
                CmtFn: '',
                Note: '',
                Image: []
            }));

        // 4. Tạo bản ghi Student mới (Khởi tạo công nợ tuition: null)
        const newStudent = new PostStudent({
            ID: newStudentId,
            Name: name.trim(),
            Phone: phone.trim(),
            ParentName: parentName ? parentName.trim() : '',
            Email: email ? email.trim() : '',
            Area: new mongoose.Types.ObjectId(areaId),
            BD: birthDate ? new Date(birthDate) : undefined,
            School: school || '',
            Address: address || '',
            Course: [{
                course: course._id,
                tuition: null, // Khởi tạo công nợ Chưa nộp
                status: 0
            }],
            Status: [{
                status: 2,
                act: 'nhập học',
                date: new Date(),
                note: `Chuyển đổi từ ${leadType === 'coursetry' ? 'Lớp học thử' : 'CRM Khách hàng'}`
            }],
            Profile: ProfileDefault ? ProfileDefault(name.trim()) : { Present: [] }
        });

        const savedStudent = await newStudent.save();

        // 5. Gán học sinh vào Khóa học
        await PostCourse.findByIdAndUpdate(courseId, {
            $push: {
                Student: {
                    ID: newStudentId,
                    Learn: learnEntries
                }
            }
        });

        // 6. Cập nhật trạng thái lead bên Customer / TrialCourse thành Đã nhập học (status: 1)
        if (leadId && mongoose.Types.ObjectId.isValid(leadId)) {
            if (leadType === 'customer') {
                await Customer.findByIdAndUpdate(leadId, {
                    $set: { status: 1 } // 1: nhập học
                });
            } else if (leadType === 'coursetry') {
                // Cập nhật trạng thái trong TrialCourse
                await TrialCourse.updateOne(
                    { 'sessions.students.studentId': leadId },
                    { $set: { 'sessions.$[].students.$[st].note': `Đã nhập học lớp chính thức ${course.ID} (${newStudentId})` } },
                    { arrayFilters: [{ 'st.studentId': leadId }] }
                ).catch(() => {});
            }
        }

        // 7. Ghi Audit Log hệ thống
        await writeSystemLog({
            type: 'CONVERT_LEAD',
            status: true,
            createBy: user._id,
            student: savedStudent._id,
            customer: leadType === 'customer' && leadId ? leadId : null,
            note: `Chuyển đổi thành công học viên ${name} (${newStudentId}) vào khóa học ${course.ID}`,
            details: {
                studentId: newStudentId,
                courseId: course._id,
                courseName: course.ID,
                leadType,
                leadId
            }
        });

        reloadStudent();
        reloadCourse(courseId);

        return NextResponse.json({
            status: 2,
            mes: `🎉 Chuyển đổi thành công! Mã học viên mới: ${newStudentId}`,
            data: {
                studentId: newStudentId,
                _id: savedStudent._id,
                name: savedStudent.Name
            }
        });

    } catch (err) {
        console.error('Lỗi [POST /api/student/convert-lead]:', err);
        return NextResponse.json({ status: 1, mes: err.message || 'Lỗi máy chủ' }, { status: 500 });
    }
}
