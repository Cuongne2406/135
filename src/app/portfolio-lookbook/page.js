'use client';

import React, { useState, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// Kho dữ liệu 3 Học sinh mẫu đại diện cho 3 môn học (Robot, Toán, Tiếng Anh)
const STUDENTS_CATALOG = {
    an: {
        id: 'an',
        name: 'Nguyễn Văn An',
        title: 'Junior Robotics & STEM Innovator',
        subject: 'Robotics & STEM',
        age: '11 tuổi • Lớp 6',
        school: 'Archimedes Academy',
        center: 'System AI Robotic Center',
        cohort: 'Niên khóa 2025 - 2026',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=500&q=80',
        coverImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
        bio: 'Em là một học sinh đam mê công nghệ, yêu thích việc tìm tòi cơ chế chuyển động cơ học và lập trình vi điều khiển. Em đặt mục tiêu chế tạo các hệ thống robot tự hành giúp ích cho cuộc sống hàng ngày.',
        skills: [
            { name: 'Tư duy Thuật toán & Logic', score: '94%' },
            { name: 'Lắp ráp Cơ cấu Động lực học', score: '90%' },
            { name: 'Lập trình Vi điều khiển', score: '88%' },
            { name: 'Thuyết trình & Làm việc nhóm', score: '92%' },
        ],
        projects: [
            {
                num: '01',
                title: 'Xe Tự Hành Dò Đường & Tránh Vật Cản',
                category: 'Robotics & Cảm Biến Siêu Âm',
                desc: 'Dự án chế tạo xe 3 bánh tự hành ứng dụng cảm biến siêu âm HC-SR04 để quét vật cản trong phạm vi 30cm. Xe có khả năng tự động tính toán góc quay tối ưu để vượt qua sa bàn mê cung.',
                metrics: ['Thời gian hoàn thiện: 3 tuần', 'Số linh kiện cơ khí: 142 chi tiết', 'Tỷ lệ né vật cản: 98%'],
                teacherQuote: 'An có tư duy phân tích bài toán rất mạch lạc, kiên trì thử nghiệm đến khi thuật toán đạt độ chính xác cao nhất.',
                mainImage: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80',
                subImage: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
            },
            {
                num: '02',
                title: 'Cánh Tay Robot Khớp Động 3 Bậc Tự Do',
                category: 'Cơ Khí Động Học & Động Cơ Servo',
                desc: 'Mô hình cánh tay gắp vật thể sử dụng 3 động cơ Servo SG90 kết hợp cơ chế đòn bẩy kẹp gắp. Sản phẩm được điều khiển qua joystick 2 trục với độ chính xác gắp thả đồ vật dưới 50g.',
                metrics: ['Tải trọng tối đa: 50 gram', 'Bán kính hoạt động: 25 cm', 'Thời gian lập trình: 12 giờ'],
                teacherQuote: 'Khâu cân chỉnh góc quay của servo rất khó nhưng em đã kiên trì thử nghiệm đến khi hoàn hảo.',
                mainImage: 'https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=800&q=80',
                subImage: 'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=600&q=80'
            },
            {
                num: '03',
                title: 'Hệ Thống Phân Loại Màu Sắc Sa Bàn',
                category: 'Đồ Án Tốt Nghiệp Khóa Chuyên Sâu',
                desc: 'Dự án quy mô kết hợp băng chuyền mini và cảm biến nhận diện màu sắc RGB. Khi phát hiện bóng màu tương ứng, cần gạt sẽ tự động đẩy bóng vào đúng khay chứa quy định.',
                metrics: ['Tốc độ phân loại: 15 vật phẩm/phút', 'Độ chính xác: 96%', 'Thuyết trình: Xuất sắc'],
                teacherQuote: 'Đây là một trong những đồ án xuất sắc nhất khóa học, thể hiện toàn diện kỹ năng STEM của học sinh.',
                mainImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=800&q=80',
                subImage: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80'
            }
        ]
    },
    phuonganh: {
        id: 'phuonganh',
        name: 'Lê Phương Anh',
        title: 'Math & Logic Olympiad Innovator',
        subject: 'Toán & Tư Duy Logic',
        age: '12 tuổi • Lớp 7',
        school: 'THCS Giảng Võ',
        center: 'System AI Academic Hub',
        cohort: 'Niên khóa 2025 - 2026',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=500&q=80',
        coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=800&q=80',
        bio: 'Toán học không phải là những con số khô khan mà là một ngôn ngữ tuyệt đẹp của tự nhiên. Em yêu thích việc giải mã các quy luật hình học không gian và ứng dụng thuật toán vào trò chơi chiến thuật.',
        skills: [
            { name: 'Tư duy Không gian & Đa giác', score: '96%' },
            { name: 'Giải thuật Mật mã & Logic', score: '93%' },
            { name: 'Phân tích & Tối ưu Dữ liệu', score: '91%' },
            { name: 'Thuyết trình Chuyên đề Toán', score: '89%' },
        ],
        projects: [
            {
                num: '01',
                title: 'Đa Giác 3D & Origami Hình Học Không Gian',
                category: 'Hình Học Không Gian & Khối Đa Diện',
                desc: 'Chuyên đề nghiên cứu và chế tác mô hình 5 khối đa diện đều Platon bằng phương pháp Origami module. Phân tích mối tương quan giữa số đỉnh, cạnh và mặt theo định lý Euler.',
                metrics: ['Số mô hình lắp ráp: 12 khối', 'Thời gian nghiên cứu: 4 tuần', 'Độ chính xác góc: 99%'],
                teacherQuote: 'Phương Anh có khả năng tưởng tượng hình học không gian xuất sắc, trình bày bài toán logic rất khúc chiết.',
                mainImage: 'https://images.unsplash.com/photo-1606326608606-aa0b62935f2b?auto=format&fit=crop&w=800&q=80',
                subImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80'
            },
            {
                num: '02',
                title: 'Giải Mã Mật Thư & Thuật Toán Euclid',
                category: 'Đại Số Boole & Mật Mã Học',
                desc: 'Ứng dụng thuật toán chia Euclid mở rộng để xây dựng và giải mã hệ thống mật thư cổ điển kết hợp mật mã khóa đối xứng. Lập sơ đồ cây suy luận tìm quy luật khóa nhanh nhất.',
                metrics: ['Số dạng mật mã giải mã: 8 loại', 'Tốc độ giải trung bình: 4 phút', 'Xếp loại: Xuất sắc'],
                teacherQuote: 'Khả năng tư duy phản biện và truy vết logic của em rất đáng nể, luôn tìm ra lời giải ngắn gọn nhất.',
                mainImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
                subImage: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=600&q=80'
            },
            {
                num: '03',
                title: 'Mô Phỏng Trò Chơi Chiến Thuật & Xác Suất',
                category: 'Đồ Án Tốt Nghiệp Toán Tư Duy',
                desc: 'Đồ án mô phỏng lý thuyết trò chơi trên bàn cờ ngũ giác. Áp dụng xác suất Bayes để dự đoán nước đi của đối thủ và xây dựng thuật toán cây quyết định (Minimax Tree).',
                metrics: ['Số ván cờ mô phỏng: 150 ván', 'Tỷ lệ thắng tối ưu: 87%', 'Báo cáo: Xuất sắc'],
                teacherQuote: 'Một đề tài học thuật rất sâu sắc, thể hiện tinh thần đam mê nghiên cứu khoa học từ rất sớm.',
                mainImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80',
                subImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=600&q=80'
            }
        ]
    },
    nam: {
        id: 'nam',
        name: 'Phạm Hoàng Nam',
        title: 'Global Citizen & Youth Speaker',
        subject: 'Tiếng Anh & Kỹ Năng',
        age: '11 tuổi • Lớp 6',
        school: 'Vinschool The Harmony',
        center: 'System AI Global Campus',
        cohort: 'Niên khóa 2025 - 2026',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=500&q=80',
        coverImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=800&q=80',
        bio: 'Em tin rằng tiếng Anh là chìa khóa mở cánh cửa bước ra thế giới. Em mong muốn dùng tiếng nói và kỹ năng tranh biện của mình để lan tỏa những thông điệp tích cực về bảo vệ môi trường và đổi mới giáo dục.',
        skills: [
            { name: 'Kỹ năng Hùng biện & Diễn thuyết', score: '97%' },
            { name: 'Tư duy Tranh biện Phản biện', score: '94%' },
            { name: 'Ngữ điệu & Body Language', score: '95%' },
            { name: 'Kỹ năng Lãnh đạo Đội nhóm', score: '91%' },
        ],
        projects: [
            {
                num: '01',
                title: 'Hộ Chiếu Toàn Cầu & Bài Hùng Biện TEDx',
                category: 'Storytelling & Public Speaking',
                desc: 'Thực hiện bài diễn thuyết tiếng Anh dài 5 phút theo chuẩn format TED Talks với chủ đề "Smart Cities of Tomorrow". Ứng dụng kỹ thuật kể chuyện tương tác và làm chủ sân khấu.',
                metrics: ['Thời lượng nói liên tục: 5:20', 'Từ vựng học thuật C1: 42 từ', 'Lượt bình chọn: Hạng Nhất'],
                teacherQuote: 'Nam có ngữ điệu tự nhiên như người bản xứ, phong thái đĩnh đạc và ánh mắt truyền lửa tuyệt vời.',
                mainImage: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
                subImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80'
            },
            {
                num: '02',
                title: 'Chuỗi Radio Podcast: "Voices of Tomorrow"',
                category: 'Media Production & Interview Skills',
                desc: 'Tự lên kịch bản, dẫn dắt và biên tập tập Podcast radio tiếng Anh phỏng vấn các bạn học sinh quốc tế về lối sống xanh. Sử dụng phần mềm xử lý âm thanh chuyên nghiệp.',
                metrics: ['Số tập phát sóng: 3 tập', 'Khách mời quốc tế: 4 bạn', 'Điểm phát âm: 98/100'],
                teacherQuote: 'Khả năng ứng biến tình huống và lối phỏng vấn thông minh của Nam khiến chương trình rất cuốn hút.',
                mainImage: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?auto=format&fit=crop&w=800&q=80',
                subImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80'
            },
            {
                num: '03',
                title: 'Mô Phỏng Hội Nghị Liên Hợp Quốc Trẻ (Model UN)',
                category: 'Đồ Án Tốt Nghiệp Hùng Biện Quốc Tế',
                desc: 'Đảm nhiệm vai trò Đại sứ đại diện quốc gia tham gia phiên tranh biện giả lập về Biến đổi khí hậu toàn cầu. Soạn thảo dự thảo nghị quyết bằng tiếng Anh học thuật.',
                metrics: ['Số vòng tranh luận: 4 phiên', 'Nghị quyết thông qua: 100%', 'Giải thưởng: Best Delegate'],
                teacherQuote: 'Một màn trình diễn xuất sắc, chứng minh năng lực của một nhà lãnh đạo trẻ tương lai.',
                mainImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80',
                subImage: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=600&q=80'
            }
        ]
    }
};

// 3 Tone màu chuẩn Tạp chí Quốc tế cao cấp
const THEMES = {
    peach: {
        id: 'peach',
        name: 'Warm Editorial (Mẫu gốc)',
        icon: '🍑',
        bg: '#ffffff',
        outerBg: '#eceae6',
        accentBg: '#fce3d6',
        accentBorder: '#f8c7b0',
        textPrimary: '#1e1e1e',
        textSecondary: '#666666',
        cardBg: '#faf8f5',
        crossColor: '#d6967a',
        badgeBg: '#fae0d3',
        badgeText: '#944b2c',
        shadow: '0 20px 40px -15px rgba(214, 150, 122, 0.25)'
    },
    cyber: {
        id: 'cyber',
        name: 'Tech Studio / Cyber Engineer',
        icon: '⚡',
        bg: '#ffffff',
        outerBg: '#0b132b',
        accentBg: '#e0f2fe',
        accentBorder: '#bae6fd',
        textPrimary: '#0f172a',
        textSecondary: '#475569',
        cardBg: '#f8fafc',
        crossColor: '#0284c7',
        badgeBg: '#e0f2fe',
        badgeText: '#0369a1',
        shadow: '0 20px 40px -15px rgba(2, 132, 199, 0.25)'
    },
    academic: {
        id: 'academic',
        name: 'Oxford Prestige & Math Gold',
        icon: '🏛️',
        bg: '#0f172a',
        outerBg: '#070b14',
        accentBg: '#1e293b',
        accentBorder: '#d97706',
        textPrimary: '#f8fafc',
        textSecondary: '#cbd5e1',
        cardBg: '#1e293b',
        crossColor: '#f59e0b',
        badgeBg: 'rgba(217, 119, 6, 0.2)',
        badgeText: '#fcd34d',
        shadow: '0 20px 40px -15px rgba(217, 119, 6, 0.3)'
    }
};

function PortfolioLookbookContent() {
    const searchParams = useSearchParams();
    const queryStudentName = searchParams?.get('studentName');
    const querySubject = searchParams?.get('subject');
    const queryCourseId = searchParams?.get('courseId');

    const [selectedStudentKey, setSelectedStudentKey] = useState('an');
    const [currentThemeKey, setCurrentThemeKey] = useState('peach');
    const [spreadIndex, setSpreadIndex] = useState(0); // 0: Bìa & About, 1: Project 1 & 2, 2: Project 3 & Kết
    const [viewMode, setViewMode] = useState('spread'); // 'spread' (sách lật) | 'scroll' (cuộn tạp chí)

    const rawStudent = STUDENTS_CATALOG[selectedStudentKey] || STUDENTS_CATALOG['an'];
    const student = useMemo(() => {
        if (!queryStudentName) return rawStudent;
        return {
            ...rawStudent,
            name: decodeURIComponent(queryStudentName),
            subject: querySubject ? decodeURIComponent(querySubject) : rawStudent.subject
        };
    }, [rawStudent, queryStudentName, querySubject]);

    const theme = THEMES[currentThemeKey];

    return (
        <div
            className="min-h-screen transition-colors duration-500 pb-20"
            style={{ backgroundColor: theme.outerBg }}
        >
            {/* THANH ĐIỀU HƯỚNG & CÔNG CỤ THỬ NGHIỆM */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200 px-6 py-3 shadow-xs flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <Link
                        href={queryCourseId ? `/course/${queryCourseId}` : '/course'}
                        className="px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold no-underline transition-colors flex items-center gap-1.5"
                    >
                        ← Về Lớp Học
                    </Link>
                    <div className="h-4 w-px bg-gray-300" />
                    <div>
                        <h1 className="text-sm font-bold text-gray-900 m-0 flex items-center gap-2">
                            <span>📖</span> Portfolio Lookbook — Hồ Sơ Năng Lực Tạp Chí
                        </h1>
                        <p className="text-[11px] text-gray-500 m-0">
                            Chuẩn ấn phẩm A4 Booklet Magazine • Đầy đủ dữ liệu mẫu 3 môn học
                        </p>
                    </div>
                </div>

                {/* KHU VỰC CHỌN HỌC SINH & TONE MÀU */}
                <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Chọn Học sinh mẫu */}
                    <div className="flex items-center gap-1.5 bg-gray-100 px-2.5 py-1 rounded-lg">
                        <span className="text-xs font-semibold text-gray-600">Học sinh:</span>
                        <select
                            value={selectedStudentKey}
                            onChange={(e) => setSelectedStudentKey(e.target.value)}
                            className="bg-white border border-gray-200 rounded px-2 py-0.5 text-xs font-bold text-gray-800 outline-none cursor-pointer"
                        >
                            <option value="an">🤖 An (Robotics & STEM)</option>
                            <option value="phuonganh">📐 Phương Anh (Toán Logic)</option>
                            <option value="nam">🌍 Nam (Tiếng Anh Hùng Biện)</option>
                        </select>
                    </div>

                    {/* Bộ chọn Theme màu */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        {Object.values(THEMES).map((t) => (
                            <button
                                key={t.id}
                                onClick={() => setCurrentThemeKey(t.id)}
                                className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer border-none transition-all flex items-center gap-1 ${currentThemeKey === t.id
                                        ? 'bg-white text-gray-900 shadow-xs font-bold'
                                        : 'bg-transparent text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                <span>{t.icon}</span>
                                <span className="max-lg:hidden">{t.name.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>

                    {/* View mode */}
                    <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
                        <button
                            onClick={() => setViewMode('spread')}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer border-none transition-all ${viewMode === 'spread' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-gray-600'
                                }`}
                        >
                            📖 Lật Trang Đôi
                        </button>
                        <button
                            onClick={() => setViewMode('scroll')}
                            className={`px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer border-none transition-all ${viewMode === 'scroll' ? 'bg-white text-blue-600 shadow-xs font-bold' : 'text-gray-600'
                                }`}
                        >
                            📜 Cuộn Tạp Chí
                        </button>
                    </div>

                    {/* Nút In ấn A4 */}
                    <button
                        onClick={() => window.print()}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer border-none transition-all shadow-xs flex items-center gap-1"
                    >
                        <span>🖨️</span> Xuất A4 / In
                    </button>
                </div>
            </header>

            {/* ĐIỀU HƯỚNG TRANG ĐÔI */}
            {viewMode === 'spread' && (
                <div className="max-w-6xl mx-auto px-6 pt-4 flex items-center justify-between text-xs font-medium text-gray-600 flex-wrap gap-2">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setSpreadIndex(0)}
                            className={`px-3 py-1.5 rounded-full cursor-pointer border transition-all ${spreadIndex === 0
                                    ? 'bg-gray-900 text-white border-gray-900 font-bold shadow-xs'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            1. Trang Bìa & About Me
                        </button>
                        <button
                            onClick={() => setSpreadIndex(1)}
                            className={`px-3 py-1.5 rounded-full cursor-pointer border transition-all ${spreadIndex === 1
                                    ? 'bg-gray-900 text-white border-gray-900 font-bold shadow-xs'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            2. Dự Án 01 & Dự Án 02
                        </button>
                        <button
                            onClick={() => setSpreadIndex(2)}
                            className={`px-3 py-1.5 rounded-full cursor-pointer border transition-all ${spreadIndex === 2
                                    ? 'bg-gray-900 text-white border-gray-900 font-bold shadow-xs'
                                    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                }`}
                        >
                            3. Đồ Án Tốt Nghiệp & Chứng Nhận
                        </button>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-xs">
                        <button
                            disabled={spreadIndex === 0}
                            onClick={() => setSpreadIndex((p) => Math.max(0, p - 1))}
                            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 border-none flex items-center justify-center cursor-pointer font-bold"
                        >
                            ←
                        </button>
                        <span className="font-bold text-gray-800">Trang đôi {spreadIndex + 1} / 3</span>
                        <button
                            disabled={spreadIndex === 2}
                            onClick={() => setSpreadIndex((p) => Math.min(2, p + 1))}
                            className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-30 border-none flex items-center justify-center cursor-pointer font-bold"
                        >
                            →
                        </button>
                    </div>
                </div>
            )}

            {/* KHU VỰC HIỂN THỊ CUỐN SÁCH LOOKBOOK */}
            <main className="max-w-6xl mx-auto px-6 mt-6">
                {viewMode === 'spread' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-transparent">
                        {spreadIndex === 0 && (
                            <>
                                <CoverPage theme={theme} student={student} pageNum="01" />
                                <AboutSpread theme={theme} student={student} pageNum="02 - 03" />
                            </>
                        )}
                        {spreadIndex === 1 && (
                            <>
                                <ProjectSpreadPage
                                    theme={theme}
                                    project={student.projects[0]}
                                    pageNum="04 - 05"
                                />
                                <ProjectSpreadPage
                                    theme={theme}
                                    project={student.projects[1]}
                                    pageNum="06 - 07"
                                />
                            </>
                        )}
                        {spreadIndex === 2 && (
                            <>
                                <ProjectSpreadPage
                                    theme={theme}
                                    project={student.projects[2]}
                                    pageNum="08"
                                />
                                <ClosingSpreadPage theme={theme} student={student} pageNum="09" />
                            </>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col gap-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CoverPage theme={theme} student={student} pageNum="01" />
                            <AboutSpread theme={theme} student={student} pageNum="02 - 03" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ProjectSpreadPage
                                theme={theme}
                                project={student.projects[0]}
                                pageNum="04 - 05"
                            />
                            <ProjectSpreadPage
                                theme={theme}
                                project={student.projects[1]}
                                pageNum="06 - 07"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <ProjectSpreadPage
                                theme={theme}
                                project={student.projects[2]}
                                pageNum="08"
                            />
                            <ClosingSpreadPage theme={theme} student={student} pageNum="09" />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// 1. TRANG BÌA (COVER PAGE)
function CoverPage({ theme, student, pageNum }) {
    return (
        <div
            className="aspect-[1/1.414] rounded-2xl p-8 lg:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden border transition-all duration-300"
            style={{
                backgroundColor: theme.bg,
                borderColor: theme.accentBorder,
                color: theme.textPrimary
            }}
        >
            <div
                className="absolute top-0 right-0 w-3/5 h-2/5 -z-0 opacity-90 transition-colors duration-300 rounded-bl-[100px]"
                style={{ backgroundColor: theme.accentBg }}
            />

            <div className="relative z-10">
                <div className="flex items-center justify-between">
                    <h2 className="text-4xl lg:text-5xl font-black tracking-tight m-0 flex items-center gap-2">
                        <span>PORTFOLIO</span>
                        <span className="font-light" style={{ color: theme.crossColor }}>
                            +
                        </span>
                    </h2>
                    <span
                        className="text-[11px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wider"
                        style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
                    >
                        {student.subject}
                    </span>
                </div>
                <div className="w-16 h-1 mt-3 rounded-full" style={{ backgroundColor: theme.crossColor }} />
            </div>

            <div className="relative z-10 my-4 flex-1 flex flex-col justify-center">
                <div className="relative w-full h-[260px] lg:h-[300px] rounded-xl overflow-hidden shadow-lg border-4 border-white">
                    <img
                        src={student.coverImage}
                        alt="Cover Highlight"
                        className="w-full h-full object-cover"
                    />
                    <div
                        className="absolute bottom-3 left-3 px-3 py-1 rounded-md text-xs font-bold shadow-md"
                        style={{ backgroundColor: theme.bg, color: theme.textPrimary }}
                    >
                        {student.cohort}
                    </div>
                </div>
            </div>

            <div className="relative z-10 border-t pt-4" style={{ borderColor: theme.accentBorder }}>
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-2xl font-black m-0 tracking-tight" style={{ color: theme.textPrimary }}>
                            {student.name}
                        </h3>
                        <p className="text-xs font-bold uppercase tracking-wider mt-1" style={{ color: theme.crossColor }}>
                            {student.title}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-900" />
                        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: theme.crossColor }} />
                        <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
                    </div>
                </div>
                <p className="text-xs mt-3 leading-relaxed line-clamp-2" style={{ color: theme.textSecondary }}>
                    {student.bio}
                </p>
                <div className="mt-2 flex justify-between text-[10px] text-gray-400 font-semibold">
                    <span>{student.center}</span>
                    <span>P. {pageNum}</span>
                </div>
            </div>
        </div>
    );
}

// 2. ABOUT ME & MỤC LỤC
function AboutSpread({ theme, student, pageNum }) {
    return (
        <div
            className="aspect-[1/1.414] rounded-2xl p-8 lg:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden border transition-all duration-300"
            style={{
                backgroundColor: theme.bg,
                borderColor: theme.accentBorder,
                color: theme.textPrimary
            }}
        >
            <div className="grid grid-cols-2 gap-6 relative z-10 border-b pb-4" style={{ borderColor: theme.accentBorder }}>
                <div>
                    <h3 className="text-2xl font-extrabold m-0 flex items-center gap-1.5">
                        <span>About</span>
                        <br />
                        <span>Me</span>
                        <span className="font-light text-xl ml-1" style={{ color: theme.crossColor }}>
                            +
                        </span>
                    </h3>
                </div>
                <div>
                    <h3 className="text-2xl font-extrabold m-0 leading-tight">
                        Table of
                        <br />
                        Content
                    </h3>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6 my-auto relative z-10">
                <div className="flex flex-col gap-3">
                    <div className="relative w-full h-36 rounded-lg overflow-hidden border-2 border-white shadow-sm">
                        <img
                            src={student.avatar}
                            alt="Portrait"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold m-0">{student.name}</h4>
                        <p className="text-[11px] mt-1 leading-relaxed line-clamp-3" style={{ color: theme.textSecondary }}>
                            {student.bio}
                        </p>
                    </div>

                    <div className="mt-1 flex flex-col gap-1.5">
                        {student.skills.map((s) => (
                            <div key={s.name} className="flex flex-col">
                                <div className="flex justify-between text-[10px] font-semibold">
                                    <span style={{ color: theme.textPrimary }}>{s.name}</span>
                                    <span style={{ color: theme.crossColor }}>{s.score}</span>
                                </div>
                                <div className="w-full h-1.5 bg-gray-200/80 rounded-full mt-0.5 overflow-hidden">
                                    <div
                                        className="h-full rounded-full transition-all duration-500"
                                        style={{ width: s.score, backgroundColor: theme.crossColor }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div
                    className="p-4 rounded-xl flex flex-col justify-between"
                    style={{ backgroundColor: theme.cardBg, border: `1px solid ${theme.accentBorder}` }}
                >
                    <div className="flex flex-col gap-4">
                        {student.projects.map((p, idx) => (
                            <div key={p.num} className="flex flex-col">
                                <div className="flex items-center justify-between text-xs font-bold">
                                    <span>PROJECT {p.num}</span>
                                    <span style={{ color: theme.crossColor }}>P. 0{idx * 2 + 4}</span>
                                </div>
                                <p className="text-[11px] font-medium truncate mt-0.5" style={{ color: theme.textSecondary }}>
                                    {p.title}
                                </p>
                                <div className="w-full border-b border-dashed border-gray-300 mt-2" />
                            </div>
                        ))}
                    </div>

                    <div className="relative w-full h-24 rounded-lg overflow-hidden mt-3 shadow-inner">
                        <img
                            src={student.projects[0].subImage}
                            alt="Project snapshot"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>
            </div>

            <div className="relative z-10 flex justify-between items-center text-[10px] pt-2 border-t text-gray-400" style={{ borderColor: theme.accentBorder }}>
                <span>{student.school}</span>
                <span>P. {pageNum}</span>
            </div>
        </div>
    );
}

// 3. TRANG DỰ ÁN CHI TIẾT
function ProjectSpreadPage({ theme, project, pageNum }) {
    return (
        <div
            className="aspect-[1/1.414] rounded-2xl p-8 lg:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden border transition-all duration-300"
            style={{
                backgroundColor: theme.bg,
                borderColor: theme.accentBorder,
                color: theme.textPrimary
            }}
        >
            <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: theme.accentBorder }}>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded" style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}>
                        Dự Án {project.num}
                    </span>
                    <h3 className="text-xl font-black m-0 tracking-tight">Project {project.num}</h3>
                </div>
                <span className="text-xl font-light" style={{ color: theme.crossColor }}>
                    +
                </span>
            </div>

            <div className="my-auto flex flex-col gap-3.5">
                <div>
                    <h4 className="text-lg font-bold m-0 leading-snug">{project.title}</h4>
                    <p className="text-xs font-semibold uppercase tracking-wider mt-1" style={{ color: theme.crossColor }}>
                        {project.category}
                    </p>
                </div>

                <div className="grid grid-cols-12 gap-3 h-48 lg:h-52">
                    <div className="col-span-8 h-full rounded-xl overflow-hidden shadow-md relative">
                        <img
                            src={project.mainImage}
                            alt={project.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="col-span-4 h-full rounded-xl overflow-hidden shadow-md relative">
                        <img
                            src={project.subImage}
                            alt="Sub detail"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                <div className="p-3.5 rounded-xl text-xs leading-relaxed" style={{ backgroundColor: theme.cardBg }}>
                    <p className="m-0 font-medium" style={{ color: theme.textPrimary }}>
                        {project.desc}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-200">
                        {project.metrics.map((m, i) => (
                            <span
                                key={i}
                                className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-white border border-gray-200"
                            >
                                ✓ {m}
                            </span>
                        ))}
                    </div>
                </div>

                <div
                    className="p-3 rounded-lg text-xs italic border-l-4"
                    style={{
                        backgroundColor: theme.accentBg,
                        borderColor: theme.crossColor,
                        color: theme.textPrimary
                    }}
                >
                    <span className="font-bold not-italic">Đánh giá Giáo viên: </span>"{project.teacherQuote}"
                </div>
            </div>

            <div className="flex justify-between items-center text-[10px] pt-2 border-t text-gray-400" style={{ borderColor: theme.accentBorder }}>
                <span>PROJECT SHOWCASE</span>
                <span>P. {pageNum}</span>
            </div>
        </div>
    );
}

// 4. TRANG KẾT BÌA & CHỨNG NHẬN
function ClosingSpreadPage({ theme, student, pageNum }) {
    return (
        <div
            className="aspect-[1/1.414] rounded-2xl p-8 lg:p-10 flex flex-col justify-between shadow-2xl relative overflow-hidden border transition-all duration-300"
            style={{
                backgroundColor: theme.bg,
                borderColor: theme.accentBorder,
                color: theme.textPrimary
            }}
        >
            <div
                className="absolute bottom-0 right-0 w-2/3 h-1/2 -z-0 opacity-80 rounded-tl-[120px]"
                style={{ backgroundColor: theme.accentBg }}
            />

            <div className="relative z-10 flex items-center justify-between border-b pb-4" style={{ borderColor: theme.accentBorder }}>
                <h3 className="text-3xl font-black tracking-tight m-0">PORTFOLIO</h3>
                <span className="text-2xl font-light" style={{ color: theme.crossColor }}>
                    +
                </span>
            </div>

            <div className="relative z-10 my-auto flex flex-col gap-6">
                <div className="p-6 rounded-2xl bg-white/95 shadow-lg border border-gray-100 flex flex-col gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
                        ✓ BẢNG CHỨNG NHẬN NĂNG LỰC
                    </span>
                    <h4 className="text-xl font-bold text-gray-900 m-0">
                        Chứng Nhận Tốt Nghiệp Khóa Chuyên Sâu
                    </h4>
                    <p className="text-xs text-gray-600 leading-relaxed m-0">
                        Học sinh <b>{student.name}</b> đã hoàn thành xuất sắc lộ trình đào tạo chuyên sâu môn <b>{student.subject}</b> với tổng cộng 3 đồ án ứng dụng thực tiễn đạt loại Giỏi.
                    </p>

                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div>
                            <p className="text-[10px] text-gray-400 font-semibold uppercase">Giáo Viên Phụ Trách</p>
                            <p className="text-xs font-bold text-gray-800 m-0 mt-0.5">ThS. Nguyễn Hoàng Long</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] text-gray-400 font-semibold uppercase">Ngày Cấp Chứng Nhận</p>
                            <p className="text-xs font-bold text-gray-800 m-0 mt-0.5">09/09/2026</p>
                        </div>
                    </div>
                </div>

                <div className="text-center px-4">
                    <p className="text-xs italic leading-relaxed" style={{ color: theme.textSecondary }}>
                        "Công nghệ là công cụ, sự sáng tạo và đam mê mới là chìa khóa mở ra tương lai."
                    </p>
                </div>
            </div>

            <div className="relative z-10 flex justify-between items-center text-[10px] pt-3 border-t text-gray-400" style={{ borderColor: theme.accentBorder }}>
                <span>{student.center} • {student.cohort}</span>
                <span>P. {pageNum}</span>
            </div>
        </div>
    );
}

export default function PortfolioLookbookPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm text-gray-500 font-medium">Đang chuẩn bị Kỷ yếu Lookbook...</div>}>
            <PortfolioLookbookContent />
        </Suspense>
    );
}

