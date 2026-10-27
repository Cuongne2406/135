import React from 'react';
import Link from 'next/link';
import connectDB from '@/config/connectDB';
import PostStudent from '@/models/student';
import PostCourse from '@/models/course';
import Book from '@/models/book';
import User from '@/models/users';
import mongoose from 'mongoose';
import {
    GraduationCap,
    Award,
    Calendar,
    CheckCircle2,
    Clock,
    BookOpen,
    UserCheck,
    Phone,
    Mail,
    MapPin,
    ArrowLeft,
    Share2,
    Printer,
    Sparkles,
    Star,
    Layers,
    FileText
} from 'lucide-react';
import { driveImage } from '@/function';
import PrintButton from './ui/PrintButton';

// Radar Chart SVG Component
function RadarChartComponent({ skills }) {
    const axes = [
        { key: 'Tư duy Thuật toán & Logic', label: 'Logic & Thuật toán' },
        { key: 'Kỹ năng Thao tác & Lắp ráp', label: 'Kỹ năng Thao tác' },
        { key: 'Thuyết trình & Báo cáo', label: 'Thuyết trình' },
        { key: 'Tinh thần Đồng đội', label: 'Làm việc nhóm' },
        { key: 'Sáng tạo & Cải tiến', label: 'Sáng tạo' }
    ];

    const size = 260;
    const center = size / 2;
    const radius = 80;
    const total = axes.length;

    const getCoords = (index, percent) => {
        const angle = (Math.PI * 2 / total) * index - Math.PI / 2;
        const r = (radius * percent) / 100;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    };

    const points = axes.map((a, i) => {
        const raw = skills?.[a.key] || '85%';
        const val = parseInt(raw, 10) || 85;
        return getCoords(i, val);
    });
    const polygon = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size} className="overflow-visible">
                {[0.25, 0.5, 0.75, 1].map((level, idx) => {
                    const grid = axes.map((_, i) => {
                        const angle = (Math.PI * 2 / total) * i - Math.PI / 2;
                        const r = radius * level;
                        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                    }).join(' ');
                    return (
                        <polygon
                            key={idx}
                            points={grid}
                            fill={idx === 3 ? '#f8fafc' : 'none'}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                        />
                    );
                })}

                {axes.map((a, i) => {
                    const lineEnd = getCoords(i, 100);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={lineEnd.x}
                            y2={lineEnd.y}
                            stroke="#cbd5e1"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                        />
                    );
                })}

                <polygon
                    points={polygon}
                    fill="rgba(79, 70, 229, 0.2)"
                    stroke="#4f46e5"
                    strokeWidth="2.5"
                />

                {points.map((p, i) => (
                    <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="4"
                        fill="#4f46e5"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                    />
                ))}

                {axes.map((a, i) => {
                    const labelPt = getCoords(i, 130);
                    return (
                        <text
                            key={i}
                            x={labelPt.x}
                            y={labelPt.y}
                            textAnchor="middle"
                            dominantBaseline="central"
                            fontSize="10"
                            fontWeight="600"
                            fill="#475569"
                        >
                            {a.label}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}

export default async function StudentEPortfolioPage({ params }) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    await connectDB();

    // Tìm kiếm học sinh theo _id hoặc mã ID (VD: AI0001)
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
        query = { _id: id };
    } else {
        query = { ID: id.toUpperCase() };
    }

    const student = await PostStudent.findOne(query)
        .populate({
            path: 'Course.course',
            populate: [
                { path: 'Book', select: 'Name Type Describe Image Topics' },
                { path: 'TeacherHR', select: 'name phone' }
            ]
        })
        .lean();

    if (!student) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50 text-slate-800">
                <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-4">
                    <FileText className="w-8 h-8" />
                </div>
                <h1 className="text-xl font-bold">Không tìm thấy hồ sơ học sinh</h1>
                <p className="text-sm text-slate-500 mt-1">Học sinh với mã định danh "{id}" không tồn tại hoặc đã bị xóa.</p>
                <Link
                    href="/student"
                    className="mt-6 px-4 py-2 bg-[var(--main_d)] text-white rounded-xl text-sm font-semibold hover:bg-[var(--main_b)] transition-colors"
                >
                    ← Quay lại danh sách học viên
                </Link>
            </div>
        );
    }

    // Tính toán thống kê chuyên cần và khóa học
    const enrolledCourses = student.Course || [];
    const scores = student.Scores || [];
    let skillsMap = {
        'Tư duy Thuật toán & Logic': '90%',
        'Kỹ năng Thao tác & Lắp ráp': '88%',
        'Thuyết trình & Báo cáo': '85%',
        'Tinh thần Đồng đội': '92%',
        'Sáng tạo & Cải tiến': '87%'
    };
    if (student.Profile?.Skill) {
        if (student.Profile.Skill instanceof Map) {
            skillsMap = Object.fromEntries(student.Profile.Skill);
        } else if (typeof student.Profile.Skill === 'object') {
            skillsMap = student.Profile.Skill;
        }
    }

    const avgScore = scores.length > 0
        ? (scores.reduce((sum, s) => sum + (s.score / (s.maxScore || 10)) * 10, 0) / scores.length).toFixed(1)
        : 'N/A';

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 pb-16 print:bg-white print:p-0">
            {/* Top Navigation Bar */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs print:hidden">
                <div className="flex items-center gap-3">
                    <Link
                        href="/student"
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold no-underline transition-colors flex items-center gap-1.5"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Danh sách học viên
                    </Link>
                    <div className="h-4 w-px bg-slate-200" />
                    <div>
                        <h1 className="text-sm font-bold text-slate-900 m-0">Hồ sơ Năng lực Điện tử (e-Portfolio)</h1>
                        <p className="text-[11px] text-slate-500 m-0">{student.Name} &bull; Mã số: {student.ID}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <PrintButton />
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
                {/* 1. Profile Hero Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl -z-0 opacity-70 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-6 text-center md:text-left">
                        <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 p-1 shadow-md flex-shrink-0">
                            {student.Avt ? (
                                <img
                                    src={driveImage(student.Avt)}
                                    alt={student.Name}
                                    className="w-full h-full object-cover rounded-xl bg-slate-100"
                                />
                            ) : (
                                <div className="w-full h-full rounded-xl bg-white flex items-center justify-center text-3xl font-bold text-indigo-600">
                                    {student.Name?.charAt(0) || 'HV'}
                                </div>
                            )}
                        </div>

                        <div className="flex-1 space-y-3">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                <div>
                                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 mb-1">
                                        <Sparkles className="w-3 h-3" />
                                        Mã học viên: {student.ID}
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900">{student.Name}</h2>
                                    <p className="text-xs text-slate-500 font-medium">{student.School || 'Trường học: Đang cập nhật'}</p>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center min-w-[90px]">
                                        <div className="text-xs text-slate-400 font-medium">Khóa học</div>
                                        <div className="text-lg font-bold text-slate-800">{enrolledCourses.length}</div>
                                    </div>
                                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-center min-w-[90px]">
                                        <div className="text-xs text-slate-400 font-medium">Điểm TB</div>
                                        <div className="text-lg font-bold text-indigo-600">{avgScore}</div>
                                    </div>
                                </div>
                            </div>

                            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                                {student.Profile?.Intro || 'Học viên tích cực, chăm chỉ, luôn hoàn thành đầy đủ bài tập và tích cực tham gia các dự án nghiên cứu khoa học kỹ thuật tại trung tâm.'}
                            </p>

                            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs text-slate-500 border-t border-slate-100">
                                {student.Phone && (
                                    <span className="flex items-center gap-1.5">
                                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                                        {student.Phone}
                                    </span>
                                )}
                                {student.Email && (
                                    <span className="flex items-center gap-1.5">
                                        <Mail className="w-3.5 h-3.5 text-slate-400" />
                                        {student.Email}
                                    </span>
                                )}
                                {student.ParentName && (
                                    <span className="flex items-center gap-1.5">
                                        <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                                        Phụ huynh: {student.ParentName}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Grid Năng Lực & Bài Kiểm Tra */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Radar Chart Năng lực */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <Award className="w-4 h-4 text-indigo-600" />
                                Đánh giá Năng lực Toàn diện
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-400">Chuẩn STEM</span>
                        </div>
                        <RadarChartComponent skills={skillsMap} />
                        <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                            {Object.entries(skillsMap).slice(0, 4).map(([k, v]) => (
                                <div key={k} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between">
                                    <span className="text-slate-500 truncate mr-1">{k}</span>
                                    <span className="font-bold text-indigo-600">{v}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bảng điểm bài kiểm tra */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <GraduationCap className="w-4 h-4 text-indigo-600" />
                                Kết quả Kiểm tra & Đánh giá
                            </h3>
                            <span className="text-[11px] font-semibold text-indigo-600">{scores.length} bài test</span>
                        </div>

                        {scores.length === 0 ? (
                            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-slate-400">
                                <FileText className="w-8 h-8 mb-2 text-slate-300" />
                                <p className="text-xs font-medium">Chưa có bài kiểm tra nào được ghi nhận</p>
                            </div>
                        ) : (
                            <div className="space-y-2.5 flex-1 overflow-y-auto max-h-80 pr-1">
                                {scores.map((sc, idx) => (
                                    <div key={sc._id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                                        <div className="min-w-0">
                                            <div className="text-xs font-bold text-slate-800 truncate">{sc.testName}</div>
                                            <div className="text-[11px] text-slate-400 mt-0.5">
                                                {sc.date ? new Date(sc.date).toLocaleDateString('vi-VN') : 'Định kỳ'}
                                                {sc.note && ` &bull; ${sc.note}`}
                                            </div>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <span className="text-base font-bold text-indigo-600">{sc.score}</span>
                                            <span className="text-[11px] text-slate-400"> / {sc.maxScore || 10}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* 3. Lộ trình khóa học (Course Roadmap) */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-indigo-600" />
                        Lộ trình Khóa học & Kết quả Đào tạo
                    </h3>

                    {enrolledCourses.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">Học sinh chưa đăng ký khóa học nào.</p>
                    ) : (
                        <div className="space-y-4">
                            {enrolledCourses.map((c, i) => {
                                const courseData = c.course;
                                const isFinished = c.status === 2;
                                return (
                                    <div key={c._id || i} className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-slate-900">{courseData?.ID || 'Mã lớp N/A'}</span>
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    isFinished ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                    {isFinished ? 'Đã hoàn thành' : 'Đang theo học'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-600">{courseData?.Book?.Name || 'Chương trình chuẩn trung tâm'}</p>
                                            {courseData?.TeacherHR?.name && (
                                                <p className="text-[11px] text-slate-400">Giáo viên phụ trách: {courseData.TeacherHR.name}</p>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3">
                                            <Link
                                                href={`/course/${courseData?._id}`}
                                                className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                                            >
                                                Xem chi tiết lớp
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 4. Showcase Dự án & Báo cáo Sản phẩm */}
                {student.Profile?.Present && student.Profile.Present.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500" />
                            Dự án & Sản phẩm Tiêu biểu của Học viên
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {student.Profile.Present.map((p, idx) => (
                                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                                    <div className="text-xs font-bold text-slate-900">{p.bookName || `Dự án tốt nghiệp #${idx + 1}`}</div>
                                    {p.Comment && <p className="text-xs text-slate-600 italic">"{p.Comment}"</p>}
                                    {p.Img && (
                                        <img src={driveImage(p.Img)} alt="Project" className="w-full h-44 object-cover rounded-lg mt-2" />
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
