import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostStudent from '@/models/student';
import { signParentToken, verifyParentToken, normalizePhone, PARENT_COOKIE_NAME } from '@/utils/parentAuth';
import { srcImage } from '@/function';

export async function POST(request) {
    try {
        const body = await request.json();
        const { phone, activeStudentId } = body;

        const cleanPhone = normalizePhone(phone);
        if (!cleanPhone || cleanPhone.length < 9) {
            return NextResponse.json({
                success: false,
                mes: 'Vui lòng nhập số điện thoại hợp lệ (từ 9 đến 11 số).'
            }, { status: 400 });
        }

        await connectDB();

        // Tìm kiếm theo 9 số cuối để khớp cả dạng 0912345678 và +84912345678
        const phoneSuffix = cleanPhone.slice(-9);
        const phoneRegex = new RegExp(`${phoneSuffix}$`);

        const students = await PostStudent.find({ Phone: phoneRegex })
            .select('ID Name ParentName Phone Avt BD Area Course')
            .lean();

        if (!students || students.length === 0) {
            return NextResponse.json({
                success: false,
                mes: `Không tìm thấy hồ sơ học viên với số điện thoại ${cleanPhone}. Ba/mẹ vui lòng kiểm tra lại số hoặc liên hệ trung tâm để được hỗ trợ!`
            }, { status: 404 });
        }

        const formattedStudents = students.map(s => ({
            _id: s._id.toString(),
            ID: s.ID,
            Name: s.Name,
            ParentName: s.ParentName || 'Quý phụ huynh',
            Phone: s.Phone,
            Avt: srcImage(s.Avt),
            CourseCount: s.Course?.length || 0
        }));

        let selectedId = activeStudentId;
        if (!selectedId || !formattedStudents.some(s => s.ID === selectedId)) {
            selectedId = formattedStudents[0].ID;
        }

        const tokenPayload = {
            phone: cleanPhone,
            activeStudentId: selectedId,
            studentIds: formattedStudents.map(s => s.ID)
        };

        const token = signParentToken(tokenPayload);

        const response = NextResponse.json({
            success: true,
            mes: `Đăng nhập thành công! Chào mừng phụ huynh ${formattedStudents[0].ParentName}.`,
            parentName: formattedStudents[0].ParentName,
            phone: cleanPhone,
            students: formattedStudents,
            activeStudentId: selectedId
        });

        // Set Cookie phiên 30 ngày
        response.cookies.set({
            name: PARENT_COOKIE_NAME,
            value: token,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 30 * 24 * 60 * 60,
            path: '/'
        });

        return response;
    } catch (error) {
        console.error('[API_PARENT_AUTH_POST_ERROR]', error);
        return NextResponse.json({
            success: false,
            mes: error.message || 'Lỗi hệ thống khi xác thực phụ huynh.'
        }, { status: 500 });
    }
}

export async function GET(request) {
    try {
        const token = request.cookies.get(PARENT_COOKIE_NAME)?.value;
        const decoded = verifyParentToken(token);

        if (!decoded || !decoded.phone) {
            return NextResponse.json({
                success: false,
                authenticated: false,
                mes: 'Chưa đăng nhập hoặc phiên làm việc đã hết hạn.'
            }, { status: 401 });
        }

        await connectDB();
        const phoneSuffix = decoded.phone.slice(-9);
        const phoneRegex = new RegExp(`${phoneSuffix}$`);

        const students = await PostStudent.find({ Phone: phoneRegex })
            .select('ID Name ParentName Phone Avt BD Area Course')
            .lean();

        if (!students || students.length === 0) {
            return NextResponse.json({
                success: false,
                authenticated: false,
                mes: 'Hồ sơ học viên không còn tồn tại trong hệ thống.'
            }, { status: 404 });
        }

        const formattedStudents = students.map(s => ({
            _id: s._id.toString(),
            ID: s.ID,
            Name: s.Name,
            ParentName: s.ParentName || 'Quý phụ huynh',
            Phone: s.Phone,
            Avt: srcImage(s.Avt),
            CourseCount: s.Course?.length || 0
        }));

        let activeStudent = formattedStudents.find(s => s.ID === decoded.activeStudentId) || formattedStudents[0];

        return NextResponse.json({
            success: true,
            authenticated: true,
            parentName: formattedStudents[0].ParentName,
            phone: decoded.phone,
            students: formattedStudents,
            activeStudent
        });
    } catch (error) {
        console.error('[API_PARENT_AUTH_GET_ERROR]', error);
        return NextResponse.json({
            success: false,
            authenticated: false,
            mes: 'Lỗi xác thực phiên phụ huynh.'
        }, { status: 500 });
    }
}

export async function DELETE() {
    const response = NextResponse.json({
        success: true,
        mes: 'Đã đăng xuất khỏi Sổ liên lạc điện tử.'
    });

    response.cookies.set({
        name: PARENT_COOKIE_NAME,
        value: '',
        httpOnly: true,
        maxAge: 0,
        path: '/'
    });

    return response;
}
