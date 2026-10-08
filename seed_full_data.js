// scripts/seed_full_data.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sys-air';

async function seedData() {
    console.log('Connecting to MongoDB at:', MONGODB_URI);
    await mongoose.connect(MONGODB_URI);
    const db = mongoose.connection.db;

    console.log('--- Cleaning previous test data while preserving fixed IDs ---');
    
    // Hash password
    const hashPass = await bcrypt.hash('123456', 10);

    // ==========================================
    // 1. TEACHERS & ADMINS (USERS)
    // ==========================================
    const usersCol = db.collection('users');
    
    const adminId = new mongoose.Types.ObjectId();
    const teacherLongId = new mongoose.Types.ObjectId();
    const teacherLinhId = new mongoose.Types.ObjectId();
    const teacherSarahId = new mongoose.Types.ObjectId();

    await usersCol.deleteMany({ email: { $in: ['admin@test.com', 'gvtest@test.com', 'linh.tm@test.com', 'sarah.eng@test.com'] } });

    await usersCol.insertMany([
        {
            _id: adminId,
            name: 'Admin Sys',
            email: 'admin@test.com',
            phone: '0999999999',
            uid: hashPass,
            role: ['Admin'],
            status: true,
            createdAt: new Date()
        },
        {
            _id: teacherLongId,
            name: 'ThS. Nguyễn Hoàng Long',
            email: 'gvtest@test.com', // Keep gvtest@test.com as default teacher for login
            phone: '0901234567',
            uid: hashPass,
            role: ['Teacher'],
            status: true,
            createdAt: new Date()
        },
        {
            _id: teacherLinhId,
            name: 'Cô Trần Mai Linh (Toán Tư Duy)',
            email: 'linh.tm@test.com',
            phone: '0908889999',
            uid: hashPass,
            role: ['Teacher'],
            status: true,
            createdAt: new Date()
        },
        {
            _id: teacherSarahId,
            name: 'Ms. Sarah Jenkins (Global English)',
            email: 'sarah.eng@test.com',
            phone: '0907776666',
            uid: hashPass,
            role: ['Teacher'],
            status: true,
            createdAt: new Date()
        }
    ]);
    console.log('✓ Seeded 4 Users (Admin + 3 Teachers)');

    // ==========================================
    // 2. AREAS & ROOMS
    // ==========================================
    const areaCol = db.collection('areas');
    await areaCol.deleteMany({});

    const roomCauGiay1 = new mongoose.Types.ObjectId();
    const roomCauGiay2 = new mongoose.Types.ObjectId();
    const roomBaDinh1 = new mongoose.Types.ObjectId();
    const roomBaDinh2 = new mongoose.Types.ObjectId();
    const roomDongDa1 = new mongoose.Types.ObjectId();

    const areaCauGiayId = new mongoose.Types.ObjectId();
    const areaBaDinhId = new mongoose.Types.ObjectId();
    const areaDongDaId = new mongoose.Types.ObjectId();

    await areaCol.insertMany([
        {
            _id: areaCauGiayId,
            name: 'Cơ sở Cầu Giấy - Innovation Lab',
            color: '#0284c7',
            rooms: [
                { _id: roomCauGiay1, name: 'Phòng Robotics Lab A1' },
                { _id: roomCauGiay2, name: 'Phòng AI Maker Space A2' }
            ]
        },
        {
            _id: areaBaDinhId,
            name: 'Cơ sở Ba Đình - Academic Hub',
            color: '#d97706',
            rooms: [
                { _id: roomBaDinh1, name: 'Phòng Toán Tư Duy M1' },
                { _id: roomBaDinh2, name: 'Phòng Tranh Biện Logic M2' }
            ]
        },
        {
            _id: areaDongDaId,
            name: 'Cơ sở Đống Đa - Global Campus',
            color: '#059669',
            rooms: [
                { _id: roomDongDa1, name: 'Phòng Studio Podcast & Thuyết Trình E1' }
            ]
        }
    ]);
    console.log('✓ Seeded 3 Areas & 5 Rooms');

    // ==========================================
    // 3. BOOKS & TOPICS (5 SÁCH GIÁO TRÌNH)
    // ==========================================
    const bookCol = db.collection('books');
    await bookCol.deleteMany({});

    const fixedBookId = new mongoose.Types.ObjectId('6a97aecd3b1fbc04f1ca4d20');
    const bookMathId = new mongoose.Types.ObjectId();
    const bookEngId = new mongoose.Types.ObjectId();
    const bookAdvRobotId = new mongoose.Types.ObjectId();

    // Helper tạo topics cho từng sách
    const createTopics = (prefix, names) => {
        return names.map((name, idx) => ({
            _id: new mongoose.Types.ObjectId(),
            Name: name,
            Period: idx + 1,
            Slide: `https://slides.sysair.edu.vn/${prefix}-lesson-${idx + 1}`,
            Content: `Nội dung chi tiết buổi ${idx + 1}: ${name}. Học sinh thực hành và hoàn thiện báo cáo kết quả.`,
            Status: true
        }));
    };

    const robotTopics = createTopics('robot', [
        'Nhập môn Cơ điện tử & Cảm biến cơ bản',
        'Thiết kế Hệ thống Bánh răng & Động cơ DC',
        'Lắp ráp Xe Robot 3 Bánh Dò Đường & Tránh Vật Cản',
        'Lập trình Thuật toán Vi điều khiển & Cảm biến Siêu âm',
        'Tối ưu Cơ chế Bánh lái & Vượt Sa Bàn Mê Cung',
        'Chế tạo Cánh Tay Robot Khớp Động 3 Bậc Tự Do',
        'Lập trình Điều khiển Joystick 2 Trục & Động Cơ Servo',
        'Đồ án Sa Bàn Robot Chiến Đấu & Báo Cáo Tốt Nghiệp'
    ]);

    const mathTopics = createTopics('math', [
        'Tư duy Tập hợp & Quy luật Dãy số Fibonacci',
        'Đa giác 3D & Nghệ thuật Gấp giấy Origami Không gian',
        'Hình học Không gian & Bài toán Tối ưu Hóa Diện tích',
        'Đại số Boole & Thuật toán Đường đi Ngắn nhất',
        'Giải mã Mật mã Caesar & Mật thư Cổ điển',
        'Trục Tọa độ Descartes & Thiết kế Đồ họa Hình học',
        'Xác suất Thực nghiệm & Chiến lược Trò chơi Toán học',
        'Báo cáo Chuyên đề Đồ Án Toán Tư Duy & Tranh Biện Logic'
    ]);

    const engTopics = createTopics('eng', [
        'Khởi động Dự án: Hộ Chiếu Toàn Cầu (Global Passport)',
        'Kỹ thuật Diễn đạt & Ngôn ngữ Cơ thể (Body Language)',
        'Thiết kế Slide Thuyết Trình Chuẩn Phong Cách TED Talks',
        'Ghi âm Số 1: Podcast Radio "Thế Giới Quanh Em"',
        'Tư duy Phản biện & Nghệ thuật Tranh biện Đa chiều',
        'Khám phá Đa Văn Hóa & Phóng sự Ảnh Quốc Tế',
        'Mô phỏng Hội nghị Liên Hợp Quốc Trẻ (Mini Model UN)',
        'Gala Báo Cáo Tốt Nghiệp & Thuyết Trình Sân Khấu Lớn'
    ]);

    await bookCol.insertMany([
        {
            _id: fixedBookId,
            ID: 'TEST-BOOK-01',
            Name: 'Robotics Khám Phá & Lập Trình Cơ Bản',
            Type: 'AI Robotic',
            Price: 3500000,
            Image: '1485827404703-89b55fcc595e',
            Badge: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=300&q=80',
            Describe: 'Chương trình chuẩn hóa Robotics STEM dành cho học sinh lứa tuổi 9-14 tuổi.',
            Topics: robotTopics
        },
        {
            _id: bookMathId,
            ID: 'BOOK-MATH-201',
            Name: 'Toán Tư Duy Không Gian & Giải Mã Mật Mã',
            Type: 'Toán Tư Duy',
            Price: 2800000,
            Image: '1509228468518-180dd4864904',
            Badge: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=300&q=80',
            Describe: 'Rèn luyện tư duy logic toán học, khả năng suy luận và hình học không gian đa chiều.',
            Topics: mathTopics
        },
        {
            _id: bookEngId,
            ID: 'BOOK-ENG-301',
            Name: 'Tiếng Anh Thuyết Trình & Kỹ Năng Toàn Cầu',
            Type: 'Tiếng Anh',
            Price: 3200000,
            Image: '1523240795612-9a054b0db644',
            Badge: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=300&q=80',
            Describe: 'Phát triển kỹ năng hùng biện, tranh luận và tư duy công dân toàn cầu.',
            Topics: engTopics
        }
    ]);
    console.log('✓ Seeded 3 Books with 24 Detailed Topics');

    // ==========================================
    // 4. STUDENTS (12 HỌC SINH VỚI HỒ SƠ PHONG PHÚ)
    // ==========================================
    const studentCol = db.collection('students');
    await studentCol.deleteMany({});

    const fixedStudentId = new mongoose.Types.ObjectId('6a97c3f3839d6a2be13faa49');

    const sampleStudents = [
        {
            _id: fixedStudentId,
            ID: 'HS-2026-001',
            Name: 'Nguyễn Văn An',
            BD: new Date('2014-05-15'),
            School: 'Archimedes Academy',
            Area: areaCauGiayId,
            Address: 'Cầu Giấy, Hà Nội',
            ParentName: 'Nguyễn Văn Hùng',
            Phone: '0912345678',
            Email: 'phuhuynh.an@gmail.com',
            Avt: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80',
            Profile: {
                Intro: 'Em là một học sinh đam mê công nghệ, yêu thích việc tìm tòi cơ chế chuyển động cơ học và lập trình vi điều khiển. Em đặt mục tiêu chế tạo các hệ thống robot tự hành giúp ích cho cuộc sống hàng ngày.',
                Avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80',
                ImgSkill: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80',
                ImgPJ: [
                    'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80'
                ],
                Skill: {
                    "Sự tiến bộ và Phát triển": "94",
                    "Kỹ năng giao tiếp": "88",
                    "Diễn giải vấn đề": "90",
                    "Tự tin năng động": "92",
                    "Đổi mới sáng tạo": "95",
                    "Giao lưu hợp tác": "89"
                },
                Present: [
                    {
                        course: new mongoose.Types.ObjectId('6a97af613b1fbc04f1ca4d7c'),
                        bookId: 'TEST-BOOK-01',
                        bookName: 'Robotics Khám Phá & Lập Trình Cơ Bản',
                        Comment: 'Nguyễn Văn An thể hiện tư duy thuật toán vượt trội trong suốt khóa học. Em luôn chủ động tìm tòi giải pháp khi hệ thống cảm biến gặp sự cố sa bàn, hoàn thành xuất sắc đồ án Xe tự hành và Cánh tay robot 3 bậc tự do.',
                        Video: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
                        Img: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80'
                    }
                ]
            }
        },
        {
            _id: new mongoose.Types.ObjectId(),
            ID: 'HS-2026-002',
            Name: 'Trần Minh Đức',
            BD: new Date('2014-08-20'),
            School: 'THCS Đoàn Thị Điểm',
            Area: areaCauGiayId,
            Address: 'Nam Từ Liêm, Hà Nội',
            ParentName: 'Trần Minh Tuấn',
            Phone: '0988776655',
            Email: 'phuhuynh.duc@gmail.com',
            Avt: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=500&q=80',
            Profile: {
                Intro: 'Em thích lắp ráp các cỗ máy phức tạp và lập trình chuyển động bánh răng.',
                Avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=500&q=80',
                Skill: { "Sự tiến bộ và Phát triển": "90", "Đổi mới sáng tạo": "92", "Kỹ năng giao tiếp": "84", "Tự tin năng động": "88", "Giao lưu hợp tác": "90", "Diễn giải vấn đề": "86" },
                Present: []
            }
        },
        {
            _id: new mongoose.Types.ObjectId(),
            ID: 'HS-2026-003',
            Name: 'Lê Phương Anh',
            BD: new Date('2013-11-10'),
            School: 'THCS Giảng Võ',
            Area: areaBaDinhId,
            Address: 'Ba Đình, Hà Nội',
            ParentName: 'Lê Hoàng Sơn',
            Phone: '0977112233',
            Email: 'phuhuynh.pa@gmail.com',
            Avt: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
            Profile: {
                Intro: 'Toán học và hình học không gian là niềm đam mê lớn nhất của em.',
                Avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
                Skill: { "Sự tiến bộ và Phát triển": "96", "Diễn giải vấn đề": "95", "Đổi mới sáng tạo": "90", "Tự tin năng động": "89", "Kỹ năng giao tiếp": "88", "Giao lưu hợp tác": "92" },
                Present: []
            }
        },
        {
            _id: new mongoose.Types.ObjectId(),
            ID: 'HS-2026-004',
            Name: 'Phạm Hoàng Nam',
            BD: new Date('2014-02-28'),
            School: 'Vinschool The Harmony',
            Area: areaDongDaId,
            Address: 'Long Biên, Hà Nội',
            ParentName: 'Phạm Thanh Long',
            Phone: '0919283746',
            Email: 'phuhuynh.nam@gmail.com',
            Avt: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
            Profile: {
                Intro: 'Em mong muốn trở thành một diễn giả truyền cảm hứng và tranh biện quốc tế.',
                Avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
                Skill: { "Kỹ năng giao tiếp": "98", "Tự tin năng động": "96", "Diễn giải vấn đề": "92", "Giao lưu hợp tác": "94", "Sự tiến bộ và Phát triển": "91", "Đổi mới sáng tạo": "90" },
                Present: []
            }
        },
        {
            _id: new mongoose.Types.ObjectId(),
            ID: 'HS-2026-005',
            Name: 'Vũ Bảo Châu',
            BD: new Date('2015-04-12'),
            School: 'Tiểu học Lê Quý Đôn',
            Area: areaCauGiayId,
            Address: 'Mỹ Đình, Hà Nội',
            ParentName: 'Vũ Quốc Huy',
            Phone: '0904567890',
            Email: 'phuhuynh.chau@gmail.com',
            Avt: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=500&q=80',
            Profile: { Intro: 'Em yêu thích khoa học thực nghiệm và những con số kỳ diệu.', Skill: { "Sự tiến bộ và Phát triển": "88", "Kỹ năng giao tiếp": "86" }, Present: [] }
        },
        {
            _id: new mongoose.Types.ObjectId(),
            ID: 'HS-2026-006',
            Name: 'Đặng Gia Huy',
            BD: new Date('2014-09-05'),
            School: 'Newton Grammar School',
            Area: areaCauGiayId,
            Address: 'Bắc Từ Liêm, Hà Nội',
            ParentName: 'Đặng Thành Đạt',
            Phone: '0936123456',
            Email: 'phuhuynh.huy@gmail.com',
            Avt: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=500&q=80',
            Profile: { Intro: 'Em đam mê chế tạo xe đua thông minh và bay lượn drone.', Skill: { "Sự tiến bộ và Phát triển": "89", "Đổi mới sáng tạo": "93" }, Present: [] }
        },
        {
            _id: new mongoose.Types.ObjectId(),
            ID: 'HS-2026-007',
            Name: 'Bùi Thảo My',
            BD: new Date('2015-01-22'),
            School: 'Tiểu học Chu Văn An',
            Area: areaBaDinhId,
            Address: 'Tây Hồ, Hà Nội',
            ParentName: 'Bùi Đức Anh',
            Phone: '0981223344',
            Email: 'phuhuynh.my@gmail.com',
            Avt: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=500&q=80',
            Profile: { Intro: 'Em thích vẽ sơ đồ tư duy và thuyết trình trước đám đông.', Skill: { "Kỹ năng giao tiếp": "92", "Tự tin năng động": "90" }, Present: [] }
        },
        {
            _id: new mongoose.Types.ObjectId(),
            ID: 'HS-2026-008',
            Name: 'Hoàng Tuấn Khôi',
            BD: new Date('2013-07-19'),
            School: 'THCS Cầu Giấy',
            Area: areaCauGiayId,
            Address: 'Cầu Giấy, Hà Nội',
            ParentName: 'Hoàng Văn Nam',
            Phone: '0966554433',
            Email: 'phuhuynh.khoi@gmail.com',
            Avt: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=500&q=80',
            Profile: { Intro: 'Thành viên câu lạc bộ Robot trường THCS Cầu Giấy.', Skill: { "Sự tiến bộ và Phát triển": "95", "Đổi mới sáng tạo": "94" }, Present: [] }
        },
        {
            _id: new mongoose.Types.ObjectId(),
            ID: 'HS-2026-009',
            Name: 'Nguyễn Khánh Vy',
            BD: new Date('2014-12-03'),
            School: 'Hà Nội Academy',
            Area: areaBaDinhId,
            Address: 'Ba Đình, Hà Nội',
            ParentName: 'Nguyễn Minh Quân',
            Phone: '0978998877',
            Email: 'phuhuynh.vy@gmail.com',
            Avt: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
            Profile: { Intro: 'Yêu thích toán logic và mật mã học.', Skill: { "Diễn giải vấn đề": "93", "Tự tin năng động": "91" }, Present: [] }
        },
        {
            _id: new mongoose.Types.ObjectId(),
            ID: 'HS-2026-010',
            Name: 'Đỗ Minh Quân',
            BD: new Date('2014-06-30'),
            School: 'THCS Thăng Long',
            Area: areaCauGiayId,
            Address: 'Cầu Giấy, Hà Nội',
            ParentName: 'Đỗ Quang Dũng',
            Phone: '0912998877',
            Email: 'phuhuynh.quan@gmail.com',
            Avt: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=500&q=80',
            Profile: { Intro: 'Lập trình viên nhí đam mê thuật toán.', Skill: { "Sự tiến bộ và Phát triển": "92", "Đổi mới sáng tạo": "91" }, Present: [] }
        },
        {
            _id: new mongoose.Types.ObjectId(),
            ID: 'HS-2026-011',
            Name: 'Phan Anh Tuấn',
            BD: new Date('2015-03-14'),
            School: 'Tiểu học Thực Nghiệm',
            Area: areaBaDinhId,
            Address: 'Ba Đình, Hà Nội',
            ParentName: 'Phan Văn Hiếu',
            Phone: '0987112244',
            Email: 'phuhuynh.tuan@gmail.com',
            Avt: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=500&q=80',
            Profile: { Intro: 'Yêu thích khoa học không gian và các vì sao.', Skill: { "Sự tiến bộ và Phát triển": "87" }, Present: [] }
        },
        {
            _id: new mongoose.Types.ObjectId(),
            ID: 'HS-2026-012',
            Name: 'Vũ Thùy Dương',
            BD: new Date('2013-10-25'),
            School: 'THCS Ngô Sĩ Liên',
            Area: areaDongDaId,
            Address: 'Hoàn Kiếm, Hà Nội',
            ParentName: 'Vũ Trọng Phụng',
            Phone: '0909112233',
            Email: 'phuhuynh.duong@gmail.com',
            Avt: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=500&q=80',
            Profile: { Intro: 'Say mê viết kịch bản và dẫn chương trình tiếng Anh.', Skill: { "Kỹ năng giao tiếp": "96", "Tự tin năng động": "95" }, Present: [] }
        }
    ];

    // ==========================================
    // 5. COURSES (5 KHÓA HỌC PHONG PHÚ ĐA DẠNG MÔN HỌC & TEMPLATE)
    // ==========================================
    const courseCol = db.collection('courses');
    await courseCol.deleteMany({});

    const fixedCourseId = new mongoose.Types.ObjectId('6a97af613b1fbc04f1ca4d7c');
    const courseRobotProId = new mongoose.Types.ObjectId();
    const courseMathLogicId = new mongoose.Types.ObjectId();
    const courseEngGlobalId = new mongoose.Types.ObjectId();
    const courseRobotJuniorId = new mongoose.Types.ObjectId();

    // Helper tạo mảng 8 buổi học chi tiết cho 1 khóa
    const createLessons = (prefix, topics, teacherId, roomId) => {
        const baseDate = new Date('2026-07-04T08:00:00Z');
        return topics.map((top, idx) => {
            const lessonDate = new Date(baseDate.getTime() + idx * 7 * 24 * 60 * 1000);
            return {
                _id: new mongoose.Types.ObjectId(),
                Topic: top._id,
                Day: lessonDate,
                Room: roomId,
                Time: '08:30 - 10:00',
                Teacher: teacherId,
                TeachingAs: teacherId,
                Image: '1581092160607-ee22621dd758',
                DetailImage: [
                    { id: `detail_${prefix}_les${idx}_1_${new mongoose.Types.ObjectId()}`, type: 'image', create: lessonDate },
                    { id: `detail_${prefix}_les${idx}_2_${new mongoose.Types.ObjectId()}`, type: 'image', create: lessonDate }
                ],
                Type: 'Chính thức',
                Note: `Buổi ${idx + 1} diễn ra sôi nổi, học sinh đạt yêu cầu thực hành.`
            };
        });
    };

    // Tạo danh sách buổi cho từng khóa
    const lessonsTestOfficial = createLessons('test_off', robotTopics, teacherLongId, roomCauGiay1);
    const lessonsRobotPro = createLessons('rob_pro', robotTopics, teacherLongId, roomCauGiay2);
    const lessonsMathLogic = createLessons('math_log', mathTopics, teacherLinhId, roomBaDinh1);
    const lessonsEngGlobal = createLessons('eng_glo', engTopics, teacherSarahId, roomDongDa1);
    const lessonsRobotJunior = createLessons('rob_jun', robotTopics, teacherLongId, roomCauGiay1);

    // Helper sinh dữ liệu học sinh trong lớp (Learn array)
    const createStudentLearn = (coursePrefix, studentList, lessons) => {
        return studentList.map((stu, sIdx) => {
            const learnRecords = lessons.map((les, lIdx) => {
                // Điểm danh: hầu hết có mặt (1), một vài buổi vắng có phép (3)
                const isAbsent = (sIdx + lIdx) % 7 === 0;
                const checkin = isAbsent ? 3 : 1;
                const comments = [
                    'Tiếp thu kiến thức bài giảng rất nhanh',
                    'Thao tác lắp ráp mạch cẩn thận, tỉ mỉ',
                    'Tích cực trao đổi nhóm và chia sẻ ý tưởng'
                ];
                return {
                    Lesson: les._id,
                    Checkin: checkin,
                    Cmt: comments,
                    CmtFn: `${stu.Name} học tập rất tích cực trong buổi học này, hoàn thành bài tập sớm và hỗ trợ các bạn cùng bàn.`,
                    Note: 'Thực hành đạt loại Giỏi',
                    Image: [
                        { id: `stu_img_${coursePrefix}_${stu.ID}_les${lIdx}_1_${new mongoose.Types.ObjectId()}`, type: 'image', create: les.Day },
                        { id: `stu_img_${coursePrefix}_${stu.ID}_les${lIdx}_2_${new mongoose.Types.ObjectId()}`, type: 'image', create: les.Day }
                    ],
                    absenceReason: isAbsent ? 'Bận việc gia đình có phép' : '',
                    makeupStatus: isAbsent ? 'MAKEUP_COMPLETED' : 'NOT_REQUIRED'
                };
            });
            return {
                ID: stu.ID,
                Learn: learnRecords
            };
        });
    };

    // Tạo 5 Khóa học
    const coursesData = [
        {
            _id: fixedCourseId,
            ID: 'TEST-OFFICIAL-01',
            Book: fixedBookId,
            Status: true,
            Type: 'AI Robotic',
            Area: areaCauGiayId,
            TeacherHR: teacherLongId,
            template: 'robot-mecha',
            Detail: lessonsTestOfficial,
            Student: createStudentLearn('test_off', sampleStudents.slice(0, 8), lessonsTestOfficial)
        },
        {
            _id: courseRobotProId,
            ID: 'ROBOT-PRO-01',
            Book: fixedBookId,
            Status: true,
            Type: 'AI Robotic',
            Area: areaCauGiayId,
            TeacherHR: teacherLongId,
            template: 'robot-space',
            Detail: lessonsRobotPro,
            Student: createStudentLearn('rob_pro', sampleStudents.slice(0, 10), lessonsRobotPro)
        },
        {
            _id: courseMathLogicId,
            ID: 'MATH-LOGIC-01',
            Book: bookMathId,
            Status: false,
            Type: 'Toán Tư Duy',
            Area: areaBaDinhId,
            TeacherHR: teacherLinhId,
            template: 'math-chalkboard',
            Detail: lessonsMathLogic,
            Student: createStudentLearn('math_log', sampleStudents.slice(0, 8), lessonsMathLogic)
        },
        {
            _id: courseEngGlobalId,
            ID: 'ENG-GLOBAL-01',
            Book: bookEngId,
            Status: true,
            Type: 'Tiếng Anh',
            Area: areaDongDaId,
            TeacherHR: teacherSarahId,
            template: 'eng-passport',
            Detail: lessonsEngGlobal,
            Student: createStudentLearn('eng_glo', sampleStudents.slice(2, 10), lessonsEngGlobal)
        },
        {
            _id: courseRobotJuniorId,
            ID: 'ROBOT-JUNIOR-02',
            Book: fixedBookId,
            Status: false,
            Type: 'AI Robotic',
            Area: areaCauGiayId,
            TeacherHR: teacherLongId,
            template: 'robot-blueprint',
            Detail: lessonsRobotJunior,
            Student: createStudentLearn('rob_jun', sampleStudents.slice(4, 12), lessonsRobotJunior)
        }
    ];

    await courseCol.insertMany(coursesData);
    console.log('✓ Seeded 5 Full Courses with 40 Detailed Lessons & Attendance');

    // ==========================================
    // 5b. TRIAL COURSE (KHÓA HỌC THỬ)
    // ==========================================
    const trialCol = db.collection('trialcourses');
    await trialCol.deleteMany({});

    const fixedTrialCourseId = new mongoose.Types.ObjectId('6871bc14ada3650715efc786');
    await trialCol.insertOne({
        _id: fixedTrialCourseId,
        name: 'Khóa Học Thử Trải Nghiệm AI Robotic & STEM',
        rootFolderId: '1Ri-Cl-R7Exl7vP6Qy8tDHtoiSqMXVmhf',
        sessions: [
            {
                _id: new mongoose.Types.ObjectId(),
                day: new Date('2026-09-15'),
                room: roomCauGiay1,
                time: '09:00 - 10:30',
                folderId: 'folder_trial_caugiay_01',
                images: { id: `trial_cover_${new mongoose.Types.ObjectId()}`, type: 'image', created: new Date() },
                book: fixedBookId,
                topicId: robotTopics[0]._id,
                teacher: teacherLongId,
                teachingAs: teacherLinhId,
                status: true,
                note: 'Buổi học thử Robotics lắp ráp xe thông minh',
                students: [
                    {
                        studentId: sampleStudents[0]._id.toString(),
                        checkin: true,
                        cmt: ['Hào hứng tham gia trải nghiệm', 'Lắp ráp nhanh nhẹn'],
                        images: [],
                        note: 'Rất tiềm năng'
                    },
                    {
                        studentId: sampleStudents[1]._id.toString(),
                        checkin: true,
                        cmt: ['Tập trung lắng nghe thầy hướng dẫn'],
                        images: [],
                        note: 'Muốn đăng ký khóa chính thức'
                    }
                ]
            }
        ]
    });
    console.log('✓ Seeded Trial Course (Khóa Học Thử ID 6871bc14ada3650715efc786)');

    // ==========================================
    // 6. GẮN KHÓA HỌC VÀO HỌC SINH (ENROLLMENT)
    // ==========================================
    sampleStudents.forEach((stu, idx) => {
        stu.Course = [];
        // Gán 1 đến 3 khóa cho từng em
        stu.Course.push({
            course: fixedCourseId,
            status: 2, // Hoàn thành
            tuition: null
        });
        if (idx < 6) {
            stu.Course.push({
                course: courseMathLogicId,
                status: 0, // Đang học
                tuition: null
            });
        }
        if (idx >= 2 && idx <= 8) {
            stu.Course.push({
                course: courseEngGlobalId,
                status: 2, // Hoàn thành
                tuition: null
            });
        }
    });

    await studentCol.insertMany(sampleStudents);
    console.log('✓ Seeded 12 Students with Profiles, Skills & Course Enrollments');

    console.log('=====================================================');
    console.log('🎉 SEED DỮ LIỆU MẪU TOÀN DIỆN THÀNH CÔNG 100%!');
    console.log('👉 Bạn có thể đăng nhập ngay:');
    console.log('   - Admin: admin@test.com / 123456');
    console.log('   - Giáo viên: gvtest@test.com / 123456');
    console.log('👉 Test các đường link quan trọng:');
    console.log('   - Xem hồ sơ khóa học của em An: http://localhost:3000/6a97c3f3839d6a2be13faa49/courses');
    console.log('   - Quản lý lớp TEST-OFFICIAL-01: http://localhost:3000/course/6a97af613b1fbc04f1ca4d7c');
    console.log('   - Studio Xem trước 15 Template: http://localhost:3000/preview-templates');
    console.log('=====================================================');

    await mongoose.disconnect();
    process.exit(0);
}

seedData().catch(err => {
    console.error('Lỗi khi seed data:', err);
    process.exit(1);
});
