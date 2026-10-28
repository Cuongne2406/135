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
    BookOpen,
    UserCheck,
    Sparkles,
    Layers,
    FileText,
    ExternalLink,
    CheckCircle2,
    Compass
} from 'lucide-react';
import { driveImage } from '@/function';
import ZaloBrowserGuard from '@/components/ui/ZaloBrowserGuard';

// Component Radar 5 trục kỹ năng SVG thuần (nhẹ, sắc nét trên mọi thiết bị di động)
function SvgRadarChart({ skills }) {
    const skillList = [
        { key: 'Tư duy Thuật toán & Logic', label: 'Logic & Thuật toán' },
        { key: 'Kỹ năng Thao tác & Lắp ráp', label: 'Thao tác & Lắp ráp' },
        { key: 'Thuyết trình & Báo cáo', label: 'Thuyết trình' },
        { key: 'Tinh thần Đồng đội', label: 'Làm việc nhóm' },
        { key: 'Sáng tạo & Cải tiến', label: 'Sáng tạo' }
    ];

    const size = 260;
    const center = size / 2;
    const radius = 80;
    const totalAxes = skillList.length;

    const getCoordinates = (index, valuePercent) => {
        const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
        const r = (radius * valuePercent) / 100;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    };

    const points = skillList.map((s, i) => {
        const raw = skills?.[s.key] || '85%';
        const val = parseInt(raw, 10) || 85;
        return getCoordinates(i, val);
    });
    const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size} className="overflow-visible">
                {/* Lưới đa giác nền */}
                {[0.25, 0.5, 0.75, 1].map((level, lIdx) => {
                    const gridPts = skillList.map((_, i) => {
                        const angle = (Math.PI * 2 / totalAxes) * i - Math.PI / 2;
                        const r = radius * level;
                        return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
                    }).join(' ');
                    return (
                        <polygon
                            key={lIdx}
                            points={gridPts}
                            fill={lIdx === 3 ? '#f8fafc' : 'none'}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                        />
                    );
                })}

                {/* Các trục nối tâm */}
                {skillList.map((_, i) => {
                    const outer = getCoordinates(i, 100);
                    return (
                        <line
                            key={i}
                            x1={center}
                            y1={center}
                            x2={outer.x}
                            y2={outer.y}
                            stroke="#e2e8f0"
                            strokeWidth="1"
                            strokeDasharray="2 2"
                        />
                    );
                })}

                {/* Đa giác điểm của học sinh */}
                <polygon
                    points={polygonPoints}
                    fill="rgba(3, 116, 218, 0.2)"
                    stroke="#0374da"
                    strokeWidth="2.5"
                />

                {/* Điểm nút và nhãn */}
                {skillList.map((s, i) => {
                    const pt = points[i];
                    const labelPt = getCoordinates(i, 125);
                    const rawVal = skills?.[s.key] || '85%';
                    return (
                        <g key={i}>
                            <circle cx={pt.x} cy={pt.y} r="3.5" fill="#0374da" stroke="#ffffff" strokeWidth="1.5" />
                            <text
                                x={labelPt.x}
                                y={labelPt.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize="10"
                                fontWeight="600"
                                fill="#475569"
                            >
                                {s.label} ({rawVal.toString().replace('%', '').trim()}%)
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export default async function PublicStudentMasterPortfolioPage({ params }) {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    await connectDB();

    // 1. Tìm thông tin học sinh theo _id hoặc mã ID (VD: HS01, HS03)
    let query = {};
    if (mongoose.Types.ObjectId.isValid(id)) {
        query = { $or: [{ _id: id }, { ID: id }] };
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
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-slate-800">
                <div className="w-14 h-14 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mb-3">
                    <FileText className="w-7 h-7" />
                </div>
                <h1 className="text-base font-bold text-slate-900 mb-1">Không tìm thấy hồ sơ học sinh</h1>
                <p className="text-xs text-slate-500 text-center max-w-sm">
                    Mã học viên "{id}" không tồn tại hoặc đã được chuyển cơ sở. Vui lòng kiểm tra lại liên kết hoặc mã QR.
                </p>
            </div>
        );
    }

    // 2. Xử lý chuẩn hóa kỹ năng và thống kê học tập
    const enrolledCourses = Array.isArray(student.Course) ? student.Course : [];
    const completedCourses = enrolledCourses.filter(c => c.status === 2 || c.course?.Status === true);
    const scores = Array.isArray(student.Scores) ? student.Scores : [];

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
        : '9.0';

    const avatarSrc = driveImage(student.Avt || student.avatar);

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 py-6 px-3 sm:px-6">
            {/* Bộ chặn Zalo & Hướng dẫn mở trình duyệt ngoài */}
            <ZaloBrowserGuard />

            <div className="max-w-2xl mx-auto space-y-5">
                {/* 1. Header Khẳng Định Bản Quyền */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 text-center shadow-xs relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-56 h-56 bg-sky-100/50 rounded-full blur-3xl pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-44 h-44 bg-blue-50/50 rounded-full blur-2xl pointer-events-none" />
                    
                    <div className="relative z-10">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sky-50 text-[var(--main_d)] border border-sky-100 mb-2">
                            <Sparkles className="w-3.5 h-3.5 text-[var(--main_d)]" />
                            <span>SysAir STEM Education &bull; Lifelong e-Portfolio</span>
                        </div>
                        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 mb-1.5">
                            Hồ Sơ Năng Lực Học Tập Số
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-md mx-auto">
                            Theo dõi toàn diện quá trình trưởng thành và sản phẩm sáng tạo của học viên
                        </p>
                    </div>
                </div>

                {/* 2. Profile Hero Card */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs text-center sm:text-left flex flex-col sm:flex-row items-center gap-5">
                    <div className="relative">
                        {avatarSrc ? (
                            <img
                                src={avatarSrc}
                                alt={student.Name}
                                className="w-28 h-28 object-cover rounded-2xl border-4 border-slate-50 shadow-md mx-auto"
                            />
                        ) : (
                            <div className="w-28 h-28 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-3xl font-extrabold text-white shadow-md mx-auto">
                                {student.Name?.charAt(0) || 'HV'}
                            </div>
                        )}
                        <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500 text-white shadow-xs">
                            Active
                        </span>
                    </div>

                    <div className="flex-1 space-y-2">
                        <div>
                            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-sky-50 text-[var(--main_d)] border border-sky-100 mb-1">
                                <Sparkles className="w-3 h-3" />
                                <span>Mã học viên: {student.ID}</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 m-0">{student.Name}</h2>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                {student.School ? `Trường: ${student.School}` : 'Học viên STEM Sáng Tạo'}
                            </p>
                        </div>

                        {/* Thống kê nhanh */}
                        <div className="flex items-center justify-center sm:justify-start gap-3 pt-1">
                            <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                <span className="text-[10px] text-slate-400 block font-medium">Khóa học</span>
                                <span className="text-sm font-bold text-slate-800">{enrolledCourses.length}</span>
                            </div>
                            <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                <span className="text-[10px] text-slate-400 block font-medium">Hoàn thành</span>
                                <span className="text-sm font-bold text-emerald-600">{completedCourses.length}</span>
                            </div>
                            <div className="px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-100 text-center">
                                <span className="text-[10px] text-slate-400 block font-medium">Điểm TB</span>
                                <span className="text-sm font-bold text-[var(--main_d)]">{avgScore}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3. Đánh Giá Năng Lực 5 Trục STEM */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 m-0">
                            <Award className="w-4 h-4 text-[var(--main_d)]" />
                            Đánh Giá Năng Lực Tích Lũy (Chuẩn STEM)
                        </h3>
                        <span className="text-[11px] font-semibold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full">
                            Radar 5 Trục
                        </span>
                    </div>

                    <SvgRadarChart skills={skillsMap} />

                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                        {Object.entries(skillsMap).map(([k, v]) => (
                            <div key={k} className="p-2 bg-slate-50 rounded-lg flex items-center justify-between border border-slate-100">
                                <span className="text-slate-500 text-[11px] truncate mr-1">{k}</span>
                                <span className="font-bold text-[var(--main_d)] text-xs">{v}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 4. Kết Quả Bài Kiểm Tra & Đánh Giá */}
                {scores.length > 0 && (
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-3">
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 m-0">
                                <GraduationCap className="w-4 h-4 text-[var(--main_d)]" />
                                Kết Quả Đánh Giá & Bài Kiểm Tra
                            </h3>
                            <span className="text-[11px] font-semibold text-slate-500">{scores.length} bài thi</span>
                        </div>

                        <div className="space-y-2.5">
                            {scores.map((sc, idx) => (
                                <div key={sc._id || idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-bold text-slate-800 m-0 truncate">{sc.testName}</p>
                                        <p className="text-[11px] text-slate-400 m-0 mt-0.5">
                                            {sc.date ? new Date(sc.date).toLocaleDateString('vi-VN') : 'Đánh giá định kỳ'}
                                            {sc.note && ` • ${sc.note}`}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span className="text-sm font-extrabold text-[var(--main_d)]">{sc.score}</span>
                                        <span className="text-[10px] text-slate-400"> / {sc.maxScore || 10}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* 5. TRỌNG TÂM: DANH SÁCH KHÓA HỌC & NÚT MỞ TAB MỚI */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2 m-0">
                                <Layers className="w-4 h-4 text-[var(--main_d)]" />
                                Lộ Trình Khóa Học & Đồ Án Hoàn Thành
                            </h3>
                            <p className="text-[11px] text-slate-400 m-0 mt-0.5">
                                Bấm vào từng khóa học để xem hình ảnh sản phẩm và nhận xét chi tiết (mở tab mới)
                            </p>
                        </div>
                    </div>

                    {enrolledCourses.length === 0 ? (
                        <p className="text-xs text-slate-400 text-center py-6">Chưa có thông tin khóa học.</p>
                    ) : (
                        <div className="space-y-3.5">
                            {enrolledCourses.map((c, i) => {
                                const courseData = c.course;
                                const isFinished = c.status === 2 || courseData?.Status === true;
                                const courseId = courseData?._id?.toString() || courseData?.ID;

                                return (
                                    <div
                                        key={c._id || i}
                                        className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                                    >
                                        <div className="space-y-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-sm text-slate-900">
                                                    {courseData?.Type || courseData?.ID || `Khóa học #${i + 1}`}
                                                </span>
                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                        isFinished
                                                            ? 'bg-emerald-100 text-emerald-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}
                                                >
                                                    {isFinished ? 'Đã tốt nghiệp' : 'Đang theo học'}
                                                </span>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                                                <span>Mã lớp: <b>{courseData?.ID || '---'}</b></span>
                                                {courseData?.TeacherHR?.name && (
                                                    <span>GV: <b>{courseData.TeacherHR.name}</b></span>
                                                )}
                                                {courseData?.Book?.Name && (
                                                    <span>Giáo trình: <b>{courseData.Book.Name}</b></span>
                                                )}
                                            </div>
                                        </div>

                                        {/* NÚT MỞ PORTFOLIO KHÓA HỌC Ở TAB MỚI */}
                                        <div className="shrink-0 pt-2 sm:pt-0">
                                            <a
                                                href={`/share/portfolio/${courseId}/${student.ID}?preview=true`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-[var(--main_d)] hover:bg-[var(--main_b)] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer no-underline w-full sm:w-auto"
                                                title="Mở hồ sơ chi tiết của khóa học này ở tab mới"
                                            >
                                                <span>Xem Portfolio Khóa Học</span>
                                                <ExternalLink className="w-3.5 h-3.5" />
                                            </a>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 6. Footer */}
                <div className="p-4 text-center text-xs text-slate-400 border-t border-slate-200">
                    SysAir Education Platform &bull; Hồ sơ năng lực số học sinh &bull; Bảo mật & Bảo lưu kết quả
                </div>
            </div>
        </div>
    );
}
