'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TEMPLATES, SUBJECT_CATEGORIES } from '@/lib/templates';
import {
    Printer,
    ArrowLeft,
    CheckCircle2,
    Calendar,
    Award,
    FileText,
    Users,
    Filter,
    Layers,
    Sparkles,
    GraduationCap,
    Clock,
    School
} from 'lucide-react';

export default function PreviewTemplatesPage() {
    const [selectedTab, setSelectedTab] = useState('score-sheet'); // 'score-sheet' | 'certificate' | 'roster' | 'theme-studio'
    const [selectedId, setSelectedId] = useState('robot-mecha');
    const [viewMode, setViewMode] = useState('compare');
    const [subjectFilter, setSubjectFilter] = useState('all');

    // Dynamic Database Selections
    const [courses, setCourses] = useState([]);
    const [students, setStudents] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedStudentId, setSelectedStudentId] = useState('');
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        const loadInitialData = async () => {
            try {
                const res = await fetch('/api/academic/test-reports');
                const json = await res.json();
                if (json.success) {
                    setCourses(json.courses || []);
                    if (json.courses?.length > 0) {
                        setSelectedCourseId(json.courses[0]._id);
                    }
                    if (json.scores?.length > 0) {
                        const uniqueStudents = [];
                        const seen = new Set();
                        json.scores.forEach(s => {
                            if (!seen.has(s.studentId)) {
                                seen.add(s.studentId);
                                uniqueStudents.push({
                                    id: s.studentId,
                                    code: s.studentCode,
                                    name: s.studentName,
                                    courseName: s.courseName,
                                    score: s.score,
                                    maxScore: s.maxScore,
                                    rank: s.rank
                                });
                            }
                        });
                        setStudents(uniqueStudents);
                        if (uniqueStudents.length > 0) {
                            setSelectedStudentId(uniqueStudents[0].id);
                        }
                    }
                }
            } catch (e) {
                console.error('Lỗi nạp dữ liệu preview:', e);
            } finally {
                setLoadingData(false);
            }
        };
        loadInitialData();
    }, []);

    const selectedCourse = courses.find(c => c._id === selectedCourseId) || { name: 'Robotics Khám Phá & Lập Trình Cơ Bản' };
    const selectedStudent = students.find(s => s.id === selectedStudentId) || {
        code: 'AI0001',
        name: 'Nguyễn Văn An',
        courseName: selectedCourse.name,
        score: 9.2,
        maxScore: 10,
        rank: 'Xuất sắc'
    };

    const currentTmpl = TEMPLATES[selectedId] || TEMPLATES['robot-mecha'];
    const { tokens } = currentTmpl;

    const filteredTemplates = subjectFilter === 'all'
        ? Object.values(TEMPLATES)
        : Object.values(TEMPLATES).filter(t => t.subject === subjectFilter);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 pb-16 print:bg-white print:p-0">
            {/* Header Điều Hướng */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs print:hidden">
                <div className="flex items-center gap-3">
                    <Link
                        href={selectedCourseId ? `/course/${selectedCourseId}` : '/course'}
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold no-underline transition-colors flex items-center gap-1.5"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        Quay lại Lớp học
                    </Link>
                    <div className="h-4 w-px bg-slate-200" />
                    <div>
                        <h1 className="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
                            <span>📄</span> In Ấn Biểu Mẫu & Studio Template
                        </h1>
                        <p className="text-[11px] text-slate-500 m-0">
                            Xuất bản Phiếu điểm, Giấy chứng nhận và Danh sách lớp chuẩn A4 từ dữ liệu thật
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handlePrint}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[var(--main_d)] hover:bg-[var(--main_b)] text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
                    >
                        <Printer className="w-4 h-4" />
                        <span>In biểu mẫu (A4)</span>
                    </button>
                </div>
            </header>

            {/* Selector Toolbar - Dữ liệu thật từ Database */}
            <div className="max-w-7xl mx-auto px-6 pt-6 print:hidden">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                        {/* Tab chọn loại biểu mẫu */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                            <button
                                onClick={() => setSelectedTab('score-sheet')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                                    selectedTab === 'score-sheet' ? 'bg-white text-[var(--main_d)] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <FileText className="w-3.5 h-3.5" />
                                Phiếu Báo Điểm
                            </button>
                            <button
                                onClick={() => setSelectedTab('certificate')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                                    selectedTab === 'certificate' ? 'bg-white text-[var(--main_d)] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Award className="w-3.5 h-3.5" />
                                Chứng Chỉ Khóa Học
                            </button>
                            <button
                                onClick={() => setSelectedTab('roster')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                                    selectedTab === 'roster' ? 'bg-white text-[var(--main_d)] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Users className="w-3.5 h-3.5" />
                                Danh Sách Lớp
                            </button>
                            <button
                                onClick={() => setSelectedTab('theme-studio')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border-none flex items-center gap-1.5 ${
                                    selectedTab === 'theme-studio' ? 'bg-white text-[var(--main_d)] shadow-xs' : 'text-slate-600 hover:text-slate-900'
                                }`}
                            >
                                <Sparkles className="w-3.5 h-3.5" />
                                Studio 15 Môn Học
                            </button>
                        </div>

                        {/* Bộ chọn dữ liệu thực tế từ DB */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 text-xs">
                                <span className="font-semibold text-slate-500">Chọn Lớp:</span>
                                <select
                                    value={selectedCourseId}
                                    onChange={(e) => setSelectedCourseId(e.target.value)}
                                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
                                >
                                    {courses.map(c => (
                                        <option key={c._id} value={c._id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex items-center gap-1.5 text-xs">
                                <span className="font-semibold text-slate-500">Chọn Học viên:</span>
                                <select
                                    value={selectedStudentId}
                                    onChange={(e) => setSelectedStudentId(e.target.value)}
                                    className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 outline-none"
                                >
                                    {students.map(s => (
                                        <option key={s.id} value={s.id}>{s.code} - {s.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Lựa chọn 15 theme nếu đang ở tab theme-studio */}
                    {selectedTab === 'theme-studio' && (
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-slate-500 uppercase">Chọn Theme Môn học:</span>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => setSubjectFilter('all')}
                                        className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${subjectFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600'}`}
                                    >
                                        Tất cả
                                    </button>
                                    {SUBJECT_CATEGORIES.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setSubjectFilter(cat.id)}
                                            className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${subjectFilter === cat.id ? 'bg-indigo-600 text-white' : 'bg-white text-slate-600'}`}
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                                {filteredTemplates.map(tmpl => (
                                    <button
                                        key={tmpl.id}
                                        onClick={() => setSelectedId(tmpl.id)}
                                        className={`p-2 rounded-xl text-left border transition-all text-xs cursor-pointer ${
                                            selectedId === tmpl.id ? 'bg-indigo-50 border-indigo-500 font-bold text-indigo-900' : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                                        }`}
                                    >
                                        <span className="mr-1">{tmpl.icon}</span>
                                        <span>{tmpl.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Vùng Render Biểu Mẫu Chuẩn Khổ In A4 */}
            <div className="max-w-4xl mx-auto px-6 pt-6">
                {/* 1. MẪU PHIẾU BÁO ĐIỂM (SCORE REPORT) */}
                {selectedTab === 'score-sheet' && (
                    <div className="bg-white p-10 rounded-2xl border border-slate-300 shadow-md print:shadow-none print:border-none print:p-0 print:m-0 space-y-6">
                        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-slate-900 text-white flex items-center justify-center font-black text-xl">
                                    AIR
                                </div>
                                <div>
                                    <h2 className="text-lg font-black text-slate-900 tracking-tight m-0">SYS-AIR EDUCATION CENTER</h2>
                                    <p className="text-xs text-slate-500 m-0">Trung tâm Đào tạo Công nghệ & STEM Trẻ em</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 uppercase">
                                    Phiếu Báo Điểm & Đánh Giá
                                </span>
                                <p className="text-[11px] text-slate-400 mt-1">Ngày lập: {new Date().toLocaleDateString('vi-VN')}</p>
                            </div>
                        </div>

                        {/* Thông tin học viên */}
                        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                            <div>
                                <p className="text-slate-500">Học và tên học viên: <strong className="text-slate-900 text-sm">{selectedStudent.name}</strong></p>
                                <p className="text-slate-500 mt-1">Mã học viên: <strong className="text-slate-800">{selectedStudent.code}</strong></p>
                            </div>
                            <div>
                                <p className="text-slate-500">Khóa đào tạo: <strong className="text-slate-900">{selectedCourse.name}</strong></p>
                                <p className="text-slate-500 mt-1">Xếp loại chung: <strong className="text-indigo-600 font-bold">{selectedStudent.rank}</strong></p>
                            </div>
                        </div>

                        {/* Bảng điểm chi tiết */}
                        <div>
                            <h3 className="text-xs font-bold uppercase text-slate-700 mb-2">Chi tiết các bài kiểm tra định kỳ</h3>
                            <table className="w-full text-xs border border-slate-200 text-left">
                                <thead className="bg-slate-100 font-bold text-slate-700">
                                    <tr>
                                        <th className="p-2.5 border">STT</th>
                                        <th className="p-2.5 border">Nội dung bài kiểm tra</th>
                                        <th className="p-2.5 border text-center">Điểm số</th>
                                        <th className="p-2.5 border text-center">Thang điểm</th>
                                        <th className="p-2.5 border text-center">Xếp loại</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="p-2.5 border text-center">01</td>
                                        <td className="p-2.5 border font-medium">Kiểm tra Giữa khóa (Mid-term Project)</td>
                                        <td className="p-2.5 border text-center font-bold text-indigo-600">{selectedStudent.score}</td>
                                        <td className="p-2.5 border text-center">10.0</td>
                                        <td className="p-2.5 border text-center font-semibold text-emerald-600">{selectedStudent.rank}</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2.5 border text-center">02</td>
                                        <td className="p-2.5 border font-medium">Kỹ năng Thao tác & Lắp ráp Cơ cấu</td>
                                        <td className="p-2.5 border text-center font-bold text-indigo-600">9.0</td>
                                        <td className="p-2.5 border text-center">10.0</td>
                                        <td className="p-2.5 border text-center font-semibold text-emerald-600">Xuất sắc</td>
                                    </tr>
                                    <tr>
                                        <td className="p-2.5 border text-center">03</td>
                                        <td className="p-2.5 border font-medium">Báo cáo Thuyết trình & Làm việc nhóm</td>
                                        <td className="p-2.5 border text-center font-bold text-indigo-600">8.5</td>
                                        <td className="p-2.5 border text-center">10.0</td>
                                        <td className="p-2.5 border text-center font-semibold text-blue-600">Giỏi</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Nhận xét giáo viên */}
                        <div className="p-4 rounded-xl border border-dashed border-slate-300 text-xs space-y-1">
                            <span className="font-bold text-slate-700">Nhận xét của Giáo viên phụ trách:</span>
                            <p className="text-slate-600 italic">
                                "Em {selectedStudent.name} có tinh thần học tập rất nghiêm túc, khả năng tư duy logic và giải quyết vấn đề vượt trội. Em luôn chủ động hoàn thành các thử thách nâng cao."
                            </p>
                        </div>

                        {/* Chữ ký */}
                        <div className="pt-8 grid grid-cols-2 text-center text-xs">
                            <div>
                                <p className="font-bold text-slate-800">GIÁO VIÊN ĐỨNG LỚP</p>
                                <p className="text-[10px] text-slate-400 italic mt-1">(Ký và ghi rõ họ tên)</p>
                                <div className="h-16" />
                            </div>
                            <div>
                                <p className="font-bold text-slate-800">GIÁM ĐỐC ĐÀO TẠO</p>
                                <p className="text-[10px] text-slate-400 italic mt-1">(Ký, đóng dấu)</p>
                                <div className="h-16" />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. MẪU CHỨNG CHỈ KHÓA HỌC (CERTIFICATE OF COMPLETION) */}
                {selectedTab === 'certificate' && (
                    <div className="bg-white p-12 rounded-2xl border-8 border-double border-amber-600 shadow-xl text-center space-y-6 relative overflow-hidden print:border-amber-600 print:shadow-none">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-50 rounded-full blur-2xl -z-0 opacity-80" />
                        <div className="relative z-10 space-y-3">
                            <div className="w-16 h-16 mx-auto rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                                <Award className="w-8 h-8" />
                            </div>
                            <h2 className="text-xs font-black tracking-widest text-amber-700 uppercase">SYS-AIR SYSTEM EDUCATION</h2>
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">GIẤY CHỨNG NHẬN TỐT NGHIỆP</h1>
                            <p className="text-xs text-slate-500 uppercase tracking-widest">Certificate of Completion</p>

                            <p className="text-sm text-slate-600 pt-4">Chứng nhận học viên:</p>
                            <h2 className="text-2xl font-bold text-indigo-900 border-b-2 border-amber-400 pb-2 inline-block min-w-[280px]">
                                {selectedStudent.name}
                            </h2>
                            <p className="text-xs text-slate-500">Mã học viên: {selectedStudent.code}</p>

                            <p className="text-sm text-slate-700 max-w-lg mx-auto pt-2">
                                Đã hoàn thành xuất sắc chương trình đào tạo chuyên sâu:
                            </p>
                            <h3 className="text-lg font-bold text-slate-900">{selectedCourse.name}</h3>
                            <p className="text-xs text-slate-500">Xếp loại năng lực: <strong className="text-amber-700">{selectedStudent.rank}</strong></p>

                            <div className="pt-10 flex justify-between px-12 text-xs">
                                <div className="text-center">
                                    <p className="text-slate-400">Hà Nội, ngày {new Date().getDate()} tháng {new Date().getMonth() + 1} năm {new Date().getFullYear()}</p>
                                    <p className="font-bold text-slate-800 mt-2">HỘI ĐỒNG KHẢO THÍ</p>
                                </div>
                                <div className="text-center">
                                    <p className="font-bold text-slate-800">TRUNG TÂM SYS-AIR</p>
                                    <p className="text-[10px] text-slate-400 italic">Viện Đào tạo Công nghệ</p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. MẪU DANH SÁCH LỚP HỌC (CLASS ROSTER) */}
                {selectedTab === 'roster' && (
                    <div className="bg-white p-8 rounded-2xl border border-slate-300 shadow-md print:shadow-none print:border-none space-y-4 text-xs">
                        <div className="flex justify-between items-center border-b pb-3">
                            <div>
                                <h2 className="text-base font-bold text-slate-900">SỔ THEO DÕI & DANH SÁCH HỌC VIÊN LỚP</h2>
                                <p className="text-slate-500">{selectedCourse.name}</p>
                            </div>
                            <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-200">
                                Sĩ số: {students.length} học viên
                            </span>
                        </div>

                        <table className="w-full border border-slate-200 text-left">
                            <thead className="bg-slate-100 font-bold text-slate-700">
                                <tr>
                                    <th className="p-2 border text-center w-10">STT</th>
                                    <th className="p-2 border">Mã HV</th>
                                    <th className="p-2 border">Họ và Tên</th>
                                    <th className="p-2 border text-center">Buổi 1</th>
                                    <th className="p-2 border text-center">Buổi 2</th>
                                    <th className="p-2 border text-center">Buổi 3</th>
                                    <th className="p-2 border text-center">Buổi 4</th>
                                    <th className="p-2 border text-center">Điểm TB</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((stu, i) => (
                                    <tr key={stu.id || i} className="hover:bg-slate-50">
                                        <td className="p-2 border text-center">{i + 1}</td>
                                        <td className="p-2 border font-medium text-slate-600">{stu.code}</td>
                                        <td className="p-2 border font-bold text-slate-900">{stu.name}</td>
                                        <td className="p-2 border text-center text-emerald-600 font-bold">✓</td>
                                        <td className="p-2 border text-center text-emerald-600 font-bold">✓</td>
                                        <td className="p-2 border text-center text-emerald-600 font-bold">✓</td>
                                        <td className="p-2 border text-center text-slate-300">-</td>
                                        <td className="p-2 border text-center font-bold text-indigo-600">{stu.score}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* 4. THEME STUDIO MÔN HỌC (15 TEMPLATES) */}
                {selectedTab === 'theme-studio' && (
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b">
                            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                                <span>{currentTmpl.icon}</span>
                                <span>Giao diện: {currentTmpl.name}</span>
                            </h2>
                            <span className="text-xs text-slate-400 font-medium">Bố cục chủ đề theo môn học</span>
                        </div>
                        <div className="p-6 rounded-xl border border-slate-200 bg-slate-50 text-center space-y-3">
                            <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: tokens.badgeBg, color: tokens.badgeColor }}>
                                {currentTmpl.subject} &bull; {currentTmpl.style}
                            </span>
                            <h3 className="text-xl font-black text-slate-900">{selectedCourse.name}</h3>
                            <p className="text-xs text-slate-500 max-w-md mx-auto">
                                Mẫu giao diện tối ưu hóa cho học sinh môn {currentTmpl.subject}, với font chữ và bảng màu phối chuẩn nhận diện thương hiệu.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
