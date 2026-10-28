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

        // Ảnh mẫu tiêu chuẩn theo từng chuyên môn nếu học sinh chưa có ảnh
        const DEFAULT_SUBJECT_IMAGES = {
            'Robotics & STEM': 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
            'AI & Data Science': 'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=800&q=80',
            'Lập trình Python': 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
            'Thiết kế Game': 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
            'default': 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'
        };

        const getFallbackImage = (subj) => {
            if (!subj) return DEFAULT_SUBJECT_IMAGES.default;
            if (subj.includes('Robot') || subj.includes('STEM')) return DEFAULT_SUBJECT_IMAGES['Robotics & STEM'];
            if (subj.includes('AI') || subj.includes('Data')) return DEFAULT_SUBJECT_IMAGES['AI & Data Science'];
            if (subj.includes('Python')) return DEFAULT_SUBJECT_IMAGES['Lập trình Python'];
            if (subj.includes('Game')) return DEFAULT_SUBJECT_IMAGES['Thiết kế Game'];
            return DEFAULT_SUBJECT_IMAGES.default;
        };

        students.forEach((stu, sIdx) => {
            const presents = stu.Profile?.Present || [];
            const subject = stu.Course?.[0]?.course?.Type || 'Robotics & STEM';
            const courseCode = stu.Course?.[0]?.course?.ID || 'SYS-AIR';

            if (presents.length > 0) {
                presents.forEach((p, pIdx) => {
                    const hasValidImg = p.Img && typeof p.Img === 'string' && p.Img.trim().length > 5 && !p.Img.includes('Tiếng Anh');
                    const mainImg = hasValidImg ? p.Img : getFallbackImage(subject);

                    showcases.push({
                        id: `${stu._id}-${pIdx}`,
                        studentId: stu._id,
                        studentCode: stu.ID,
                        name: stu.Name,
                        school: stu.School || 'Trung tâm SYS-AIR',
                        subject: subject,
                        avatar: stu.Avt || '',
                        title: p.bookName || `Đồ án ${subject} #${pIdx + 1}`,
                        desc: 'Dự án nghiên cứu kỹ thuật và giải pháp công nghệ do học sinh tự lên ý tưởng, thiết kế và hoàn thiện.',
                        mainImage: mainImg,
                        subImage: p.Video || '',
                        teacherQuote: p.Comment ? p.Comment.replace(/^Nhận xét:\s*/i, '') : 'Học viên thể hiện tư duy sáng tạo xuất sắc trong suốt quá trình thực hiện đồ án.',
                        metrics: [
                            `Khóa: ${courseCode}`,
                            `Môn học: ${subject}`
                        ]
                    });
                });
            } else {
                // Nếu chưa có Presentation chi tiết, lấy sản phẩm đại diện
                const hasValidImg = stu.Profile?.ImgPJ?.[0] && typeof stu.Profile.ImgPJ[0] === 'string' && stu.Profile.ImgPJ[0].trim().length > 5 && !stu.Profile.ImgPJ[0].includes('Tiếng Anh');
                const mainImg = hasValidImg ? stu.Profile.ImgPJ[0] : getFallbackImage(subject);

                showcases.push({
                    id: `${stu._id}-default`,
                    studentId: stu._id,
                    studentCode: stu.ID,
                    name: stu.Name,
                    school: stu.School || 'Trung tâm SYS-AIR',
                    subject: subject,
                    avatar: stu.Avt || '',
                    title: `Đồ án Ứng dụng Thực tế - ${subject}`,
                    desc: stu.Profile?.Intro || 'Sản phẩm sáng tạo ứng dụng thuật toán và mô hình kỹ thuật động lực học.',
                    mainImage: mainImg,
                    subImage: stu.Profile?.ImgSkill || '',
                    teacherQuote: 'Học viên nắm vững kiến thức nền tảng và có khả năng áp dụng linh hoạt vào mô hình thực tế.',
                    metrics: [
                        `Khóa: ${courseCode}`,
                        `Môn học: ${subject}`
                    ]
                });
            }
        });

        // Nếu DB chưa có học sinh nào có profile, cung cấp dữ liệu seed mẫu đa dạng
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
                    desc: 'Dự án chế tạo xe 3 bánh tự hành ứng dụng cảm biến siêu âm quét vật cản và sa bàn tự động bằng thuật toán PID.',
                    mainImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
                    teacherQuote: 'An có tư duy phân tích bài toán rất mạch lạc, kiên trì thử nghiệm đến khi đạt độ chính xác cao nhất.',
                    metrics: ['Khóa học: ROBOT-PRO-01', 'Thời gian: 8 tuần', 'Cảm biến: Siêu âm HC-SR04']
                },
                {
                    id: 'seed-2',
                    studentId: 'seed-phuonganh',
                    studentCode: 'AI0002',
                    name: 'Trần Phương Anh',
                    school: 'Vinschool Times City',
                    subject: 'AI & Data Science',
                    title: 'Mô hình Nhận diện Cảm xúc Khuôn mặt AI',
                    desc: 'Ứng dụng thị giác máy tính Computer Vision phân tích biểu cảm gương mặt học sinh trong lớp học và đánh giá mức độ tập trung.',
                    mainImage: 'https://images.unsplash.com/photo-1555255707-c07966088b7b?auto=format&fit=crop&w=800&q=80',
                    teacherQuote: 'Phương Anh có niềm say mê đặc biệt với thuật toán phân loại dữ liệu và học máy, hoàn thành xuất sắc đồ án.',
                    metrics: ['Khóa học: AI-CORE-02', 'Độ chính xác: 94.2%', 'Ngôn ngữ: Python / OpenCV']
                },
                {
                    id: 'seed-3',
                    studentId: 'seed-minhduc',
                    studentCode: 'AI0003',
                    name: 'Lê Minh Đức',
                    school: 'THCS Giảng Võ',
                    subject: 'Lập trình Python',
                    title: 'Hệ thống Quản lý Thư viện Mini & Chatbot Tự Động',
                    desc: 'Phần mềm desktop quản lý đầu sách, mượn trả tự động kết hợp chatbot hỗ trợ tìm kiếm tài liệu học tập.',
                    mainImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=800&q=80',
                    teacherQuote: 'Đức tổ chức cấu trúc dữ liệu rất bài bản, tư duy lập trình hướng đối tượng vững vàng.',
                    metrics: ['Khóa học: PY-APP-01', 'Giao diện: CustomTkinter', 'CSDL: SQLite']
                },
                {
                    id: 'seed-4',
                    studentId: 'seed-baongoc',
                    studentCode: 'AI0004',
                    name: 'Phạm Bảo Ngọc',
                    school: 'THCS Đoàn Thị Điểm',
                    subject: 'Thiết kế Game',
                    title: 'Trò Chơi 2D Vượt Chướng Ngại Vật "Eco Adventure"',
                    desc: 'Tựa game phiêu lưu truyền tải thông điệp bảo vệ môi trường, vượt mê cung và thu thập rác tái chế với hiệu ứng vật lý tùy chỉnh.',
                    mainImage: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&w=800&q=80',
                    teacherQuote: 'Bảo Ngọc có gu thẩm mỹ đồ họa rất tốt và khả năng thiết kế cơ chế gameplay cuốn hút.',
                    metrics: ['Khóa học: GAME-2D-03', 'Engine: Pygame', 'Màn chơi: 5 levels']
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
