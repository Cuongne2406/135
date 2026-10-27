import { NextResponse } from 'next/server';
import connectDB from '@/config/connectDB';
import PostStudent from '@/models/student';
import PostCourse from '@/models/course';
import authenticate from '@/utils/authenticate';
import mongoose from 'mongoose';

// Lấy danh sách tác phẩm showcase từ DB
export async function GET(request) {
    try {
        await connectDB();
        const { searchParams } = new URL(request.url);
        const subject = searchParams.get('subject') || 'all';

        // Lấy danh sách học sinh có tác phẩm trong Profile.Present hoặc có thành tích
        const students = await PostStudent.find({
            $or: [
                { 'Profile.Present.0': { $exists: true } },
                { 'Profile.ImgPJ.0': { $exists: true } },
                { 'Scores.0': { $exists: true } }
            ]
        })
        .populate('Course.course', 'ID Book Type')
        .select('ID Name School Avt Profile Scores Course')
        .limit(20)
        .lean();

        // Biến đổi thành danh sách showcase chuẩn
        let showcases = [];

        students.forEach((stu, sIdx) => {
            const presents = stu.Profile?.Present || [];
            if (presents.length > 0) {
                presents.forEach((p, pIdx) => {
                    showcases.push({
                        id: `${stu._id}-${pIdx}`,
                        studentId: stu._id,
                        studentCode: stu.ID,
                        name: stu.Name,
                        school: stu.School || 'Trung tâm SYS-AIR',
                        subject: stu.Course?.[0]?.course?.Type || 'Robotics & STEM',
                        avatar: stu.Avt || '',
                        title: p.bookName || `Dự án sáng tạo #${pIdx + 1}`,
                        desc: p.Comment || 'Dự án nghiên cứu kỹ thuật và giải pháp công nghệ do học sinh tự lên ý tưởng và chế tạo.',
                        mainImage: p.Img || '',
                        subImage: p.Video || '',
                        teacherQuote: p.Comment ? `Nhận xét: ${p.Comment}` : 'Học viên thể hiện tư duy sáng tạo xuất sắc trong suốt quá trình hoàn thiện đồ án.',
                        metrics: [
                            `Học viên: ${stu.Name}`,
                            `Mã số: ${stu.ID}`,
                            `Khóa học: ${stu.Course?.[0]?.course?.ID || 'SYS-AIR'}`
                        ]
                    });
                });
            } else {
                // Nếu chưa có Presentation chi tiết, lấy sản phẩm đại diện
                showcases.push({
                    id: `${stu._id}-default`,
                    studentId: stu._id,
                    studentCode: stu.ID,
                    name: stu.Name,
                    school: stu.School || 'Trung tâm SYS-AIR',
                    subject: stu.Course?.[0]?.course?.Type || 'Robotics & STEM',
                    avatar: stu.Avt || '',
                    title: `Đồ án Ứng dụng Thực tế - ${stu.Name}`,
                    desc: stu.Profile?.Intro || 'Sản phẩm sáng tạo ứng dụng thuật toán và mô hình lắp ráp cơ cấu động lực học.',
                    mainImage: stu.Profile?.ImgPJ?.[0] || '',
                    subImage: stu.Profile?.ImgSkill || '',
                    teacherQuote: 'Học viên nắm vững kiến thức nền tảng và có khả năng áp dụng linh hoạt vào mô hình thực tế.',
                    metrics: [
                        `Học viên: ${stu.Name}`,
                        `Mã số: ${stu.ID}`,
                        `Khóa học: ${stu.Course?.[0]?.course?.ID || 'SYS-AIR'}`
                    ]
                });
            }
        });

        // Nếu DB chưa có học sinh nào có profile, cung cấp dữ liệu seed mẫu
        if (showcases.length === 0) {
            showcases = [
                {
                    id: 'seed-1',
                    studentId: 'seed-an',
                    studentCode: 'AI0001',
                    name: 'Nguyễn Văn An',
                    school: 'Archimedes Academy',
                    subject: 'Robotics & STEM',
                    title: 'Xe Tự Hành Dò Đường & Tránh Vật Cản',
                    desc: 'Dự án chế tạo xe 3 bánh tự hành ứng dụng cảm biến siêu âm quét vật cản và sa bàn tự động.',
                    mainImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
                    teacherQuote: 'An có tư duy phân tích bài toán rất mạch lạc, kiên trì thử nghiệm đến khi đạt độ chính xác cao nhất.',
                    metrics: ['Thời gian hoàn thiện: 3 tuần', 'Số linh kiện: 142 chi tiết', 'Tỷ lệ né vật cản: 98%']
                },
                {
                    id: 'seed-2',
                    studentId: 'seed-phuonganh',
                    studentCode: 'AI0002',
                    name: 'Trần Phương Anh',
                    school: 'Vinschool Times City',
                    subject: 'AI & Data Science',
                    title: 'Mô hình Nhận diện Cảm xúc Khuôn mặt AI',
                    desc: 'Ứng dụng thị giác máy tính Computer Vision phân tích biểu cảm gương mặt học sinh trong lớp học.',
                    mainImage: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?auto=format&fit=crop&w=800&q=80',
                    teacherQuote: 'Phương Anh có niềm say mê đặc biệt với thuật toán phân loại dữ liệu và học máy.',
                    metrics: ['Độ chính xác mô hình: 94.2%', 'Bộ dữ liệu: 1,200 ảnh', 'Ngôn ngữ: Python']
                }
            ];
        }

        if (subject && subject !== 'all') {
            showcases = showcases.filter(s => s.subject.toLowerCase().includes(subject.toLowerCase()));
        }

        return NextResponse.json({ success: true, count: showcases.length, data: showcases });

    } catch (error) {
        console.error('Error fetching showcase projects:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

// Thêm hoặc cập nhật tác phẩm showcase cho học viên
export async function POST(request) {
    try {
        const { user } = await authenticate(request);
        if (!user || (!user.role?.includes('Admin') && !user.role?.includes('Teacher') && !user.role?.includes('Academic'))) {
            return NextResponse.json({ success: false, error: 'Bạn không có quyền thêm tác phẩm showcase.' }, { status: 403 });
        }

        await connectDB();
        const body = await request.json();
        const { studentId, title, desc, img, video, bookId } = body;

        if (!studentId || !title) {
            return NextResponse.json({ success: false, error: 'Thiếu thông tin bắt buộc (studentId, title).' }, { status: 400 });
        }

        const student = await PostStudent.findById(studentId);
        if (!student) {
            return NextResponse.json({ success: false, error: 'Không tìm thấy học sinh để gán tác phẩm.' }, { status: 404 });
        }

        if (!student.Profile) {
            student.Profile = { Present: [] };
        }
        if (!student.Profile.Present) {
            student.Profile.Present = [];
        }

        student.Profile.Present.push({
            course: student.Course?.[0]?.course || null,
            bookId: bookId || 'SHOWCASE-CUSTOM',
            bookName: title.trim(),
            Video: video || '',
            Img: img || '',
            Comment: desc || ''
        });

        await student.save();

        return NextResponse.json({
            success: true,
            message: 'Đã thêm tác phẩm vào Lookbook thành công!'
        });

    } catch (error) {
        console.error('Error adding showcase item:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
