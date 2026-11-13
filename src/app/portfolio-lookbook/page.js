'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    ExternalLink,
    RefreshCw,
    School,
    Layers,
    X,
    Quote,
    Printer,
    Eye,
    Bot,
    Cpu,
    Code,
    Gamepad2,
    Sparkles
} from 'lucide-react';
import { driveImage } from '@/function';

// Component hiển thị hình ảnh an toàn theo tông sáng, chống lỗi vỡ ảnh
function SafeShowcaseImage({ src, alt, subject }) {
    const [imgError, setImgError] = useState(false);
    const resolvedUrl = driveImage(src);

    const getSubjectIcon = (subj) => {
        if (!subj) return <Cpu className="w-8 h-8 text-slate-500" />;
        const s = subj.toLowerCase();
        if (s.includes('robot') || s.includes('stem')) return <Bot className="w-8 h-8 text-blue-600" />;
        if (s.includes('ai') || s.includes('data')) return <Cpu className="w-8 h-8 text-emerald-600" />;
        if (s.includes('python')) return <Code className="w-8 h-8 text-amber-600" />;
        if (s.includes('game')) return <Gamepad2 className="w-8 h-8 text-purple-600" />;
        return <Layers className="w-8 h-8 text-slate-500" />;
    };

    if (imgError || !resolvedUrl) {
        return (
            <div className="w-full h-full bg-slate-100 border-b border-slate-200 flex flex-col items-center justify-center p-4 text-center">
                <div className="w-14 h-14 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center mb-2">
                    {getSubjectIcon(subject)}
                </div>
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">{subject || 'Đồ án công nghệ'}</span>
                <span className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{alt}</span>
            </div>
        );
    }

    return (
        <img
            src={resolvedUrl}
            alt={alt || 'Đồ án học viên'}
            onError={() => setImgError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-102"
        />
    );
}

function LookbookContent() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState(null);
    const [studentsList, setStudentsList] = useState([]);
    const [errorMsg, setErrorMsg] = useState('');

    // Form thêm tác phẩm
    const [newStudentId, setNewStudentId] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newImg, setNewImg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchShowcases = async () => {
        setLoading(true);
        setErrorMsg('');
        try {
            const res = await fetch(`/api/showcase?subject=${subjectFilter}`);
            const json = await res.json();
            if (json.success) {
                setItems(json.data || []);
            } else {
                setErrorMsg(json.message || json.mes || json.error || 'Không thể tải danh sách tác phẩm.');
            }
        } catch (e) {
            console.error('Lỗi tải showcase:', e);
            setErrorMsg('Không thể kết nối đến máy chủ. Vui lòng kiểm tra lại mạng.');
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/academic/test-reports');
            const json = await res.json();
            if (json.success && json.summary) {
                const uniqueStudents = [];
                const seen = new Set();
                json.scores.forEach(s => {
                    if (!seen.has(s.studentId)) {
                        seen.add(s.studentId);
                        uniqueStudents.push({ _id: s.studentId, name: s.studentName, code: s.studentCode });
                    }
                });
                setStudentsList(uniqueStudents);
            }
        } catch (e) {
            console.error('Lỗi tải danh sách học sinh:', e);
        }
    };

    useEffect(() => {
        fetchShowcases();
    }, [subjectFilter]);

    useEffect(() => {
        fetchStudents();
    }, []);

    const handleCreateShowcase = async (e) => {
        e.preventDefault();
        if (!newStudentId || !newTitle) {
            alert('Vui lòng chọn học sinh và nhập tên dự án!');
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/showcase', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: newStudentId,
                    title: newTitle,
                    desc: newDesc,
                    img: newImg
                })
            });
            const json = await res.json();
            if (json.success) {
                alert('Đã thêm tác phẩm vào Lookbook thành công!');
                setIsAddModalOpen(false);
                setNewTitle('');
                setNewDesc('');
                setNewImg('');
                fetchShowcases();
            } else {
                alert(json.error || 'Thêm tác phẩm thất bại');
            }
        } catch (e) {
            alert('Lỗi hệ thống khi thêm tác phẩm');
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredItems = useMemo(() => {
        if (!searchQuery.trim()) return items;
        const q = searchQuery.toLowerCase();
        return items.filter(it =>
            it.name?.toLowerCase().includes(q) ||
            it.title?.toLowerCase().includes(q) ||
            it.desc?.toLowerCase().includes(q) ||
            it.school?.toLowerCase().includes(q) ||
            it.studentCode?.toLowerCase().includes(q)
        );
    }, [items, searchQuery]);

    const categories = [
        { key: 'all', label: 'Tất cả lĩnh vực' },
        { key: 'Robotics', label: 'Robotics & STEM' },
        { key: 'AI', label: 'AI & Data Science' },
        { key: 'Python', label: 'Lập trình Python' },
        { key: 'Game', label: 'Thiết kế Game' }
    ];

    const handlePrintA4 = () => {
        window.print();
    };

    return (
        <div className="min-h-screen bg-slate-100/70 text-slate-800 pb-20">
            {/* Header thanh công cụ đồng bộ tông màu hệ thống (Ẩn khi in ấn A4) */}
            <header className="no-print border-b border-slate-200 bg-white/95 backdrop-blur-md sticky top-0 z-40 px-6 py-4 shadow-2xs">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-2xs">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2 m-0">
                                SYS-AIR LOOKBOOK &bull; <span className="text-slate-500 font-semibold text-xs uppercase tracking-wider">Kỷ Yếu Đồ Án</span>
                            </h1>
                            <p className="text-xs text-slate-500 m-0">Triển lãm dự án sáng tạo và sản phẩm tiêu biểu của học viên</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <button
                            onClick={handlePrintA4}
                            title="In Kỷ yếu hoặc lưu file PDF chuẩn khổ A4"
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                        >
                            <Printer className="w-4 h-4 text-slate-600" />
                            <span>In Kỷ yếu (A4)</span>
                        </button>
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer border-none"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Thêm tác phẩm</span>
                        </button>
                        <Link
                            href="/student"
                            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-medium transition-colors shadow-2xs"
                        >
                            Quản lý học viên
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
                {/* Banner cảnh báo lỗi nếu có */}
                {errorMsg && (
                    <div className="no-print p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm flex items-center justify-between shadow-2xs">
                        <span className="font-medium">⚠️ {errorMsg}</span>
                        <button
                            onClick={() => { setErrorMsg(''); fetchShowcases(); }}
                            className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer border-none transition-colors"
                        >
                            Thử lại
                        </button>
                    </div>
                )}

                {/* Thanh Lọc & Tìm kiếm nền trắng, viền thanh lịch, tương phản cao */}
                <div className="no-print flex flex-wrap items-center justify-between gap-4 p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs">
                    <div className="flex flex-wrap gap-1.5">
                        {categories.map(c => {
                            const isActive = subjectFilter === c.key;
                            return (
                                <button
                                    key={c.key}
                                    onClick={() => setSubjectFilter(c.key)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                                        isActive
                                            ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-xs'
                                            : 'bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border-slate-200'
                                    }`}
                                >
                                    {c.label}
                                </button>
                            );
                        })}
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm theo tên học viên, dự án, mã số..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs text-slate-900 placeholder-slate-400 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 w-72 transition-colors"
                        />
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                {/* Header in ấn A4 (Chỉ xuất hiện khi bấm In A4) */}
                <div className="print-only hidden p-6 text-center border-b-2 border-black mb-6">
                    <h1 className="text-2xl font-bold text-black uppercase tracking-wide">KỶ YẾU ĐỒ ÁN SÁNG TẠO - SYS-AIR</h1>
                    <p className="text-sm text-gray-700 mt-1">Bộ sưu tập dự án công nghệ & thành tích học tập tiêu biểu của học viên</p>
                </div>

                {/* Danh sách Thẻ Dự Án (Showcase Grid - Nền thẻ Trắng tinh tế) */}
                {loading ? (
                    <div className="flex items-center justify-center p-20 text-slate-600 gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                        <span className="text-sm font-medium">Đang tải danh sách tác phẩm...</span>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center p-20 bg-white rounded-xl border border-slate-200 text-slate-500 shadow-xs">
                        <Layers className="w-10 h-10 mx-auto mb-3 text-slate-400" />
                        <h3 className="text-base font-semibold text-slate-800">Không tìm thấy tác phẩm nào</h3>
                        <p className="text-xs text-slate-500 mt-1">Hãy thử đổi từ khóa tìm kiếm hoặc nhấn "Thêm tác phẩm".</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 print:grid-cols-2 print:gap-4">
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition-all group print:border-gray-400 print:bg-white print:text-black print:break-inside-avoid"
                            >
                                <div>
                                    {/* Ảnh dự án với bộ xử lý SafeImage */}
                                    <div
                                        onClick={() => setSelectedProject(item)}
                                        className="h-48 w-full bg-slate-100 relative overflow-hidden cursor-pointer"
                                    >
                                        <SafeShowcaseImage
                                            src={item.mainImage}
                                            alt={item.title}
                                            subject={item.subject}
                                        />
                                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-white/90 text-slate-800 border border-slate-200 shadow-xs backdrop-blur-xs print:bg-gray-200 print:text-black print:border-black">
                                            {item.subject}
                                        </span>
                                    </div>

                                    {/* Nội dung tác phẩm */}
                                    <div className="p-4 space-y-3">
                                        {/* Tiêu đề đồ án (Tương phản cao, chữ đậm sắc nét) */}
                                        <h2
                                            onClick={() => setSelectedProject(item)}
                                            className="text-base font-bold text-slate-900 print:text-black hover:text-blue-600 cursor-pointer transition-colors truncate m-0 block"
                                            title={item.title}
                                        >
                                            {item.title}
                                        </h2>

                                        {/* Tác giả & Trường học (Chỉ xuất hiện 1 lần duy nhất) */}
                                        <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2.5 print:border-gray-300">
                                            <span className="text-slate-600 print:text-gray-800 font-medium text-xs">
                                                Tác giả: <strong className="text-slate-900 print:text-black font-semibold text-sm">{item.name}</strong>
                                            </span>
                                            <span className="flex items-center gap-1 text-slate-500 print:text-gray-600 text-[11px] font-medium">
                                                <School className="w-3.5 h-3.5 text-slate-400" />
                                                {item.school}
                                            </span>
                                        </div>

                                        {/* Mô tả ngắn */}
                                        <p className="text-xs text-slate-600 print:text-gray-700 line-clamp-2 leading-relaxed m-0 font-normal">
                                            {item.desc}
                                        </p>

                                        {/* Thông tin kỹ thuật / Khóa học */}
                                        {item.metrics && item.metrics.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                                                {item.metrics.map((m, mIdx) => (
                                                    <span
                                                        key={mIdx}
                                                        className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[11px] text-slate-700 print:bg-gray-100 print:text-black print:border-gray-400 font-mono font-medium"
                                                    >
                                                        {m}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Lời nhận xét giáo viên */}
                                        {item.teacherQuote && (
                                            <div className="p-2.5 bg-slate-50 rounded-lg border-l-3 border-blue-500 text-[11px] text-slate-700 print:text-black print:border-black print:bg-gray-50 italic">
                                                <span className="line-clamp-2">❝ {item.teacherQuote} ❞</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer thẻ */}
                                <div className="p-3.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between print:border-gray-300">
                                    <span className="text-xs text-slate-500 print:text-gray-600 font-mono font-medium">
                                        Mã HV: {item.studentCode}
                                    </span>
                                    <div className="flex items-center gap-2 no-print">
                                        <button
                                            onClick={() => setSelectedProject(item)}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors cursor-pointer shadow-2xs"
                                        >
                                            <Eye className="w-3.5 h-3.5 text-slate-500" />
                                            <span>Xem</span>
                                        </button>
                                        <Link
                                            href={`/e-portfolio/${item.studentId || item.studentCode}`}
                                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors ml-1"
                                        >
                                            <span>e-Portfolio</span>
                                            <ExternalLink className="w-3.5 h-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Xem Chi Tiết Dự Án (Quick View Lightbox - Tông sáng thanh lịch) */}
            {selectedProject && (
                <div
                    onClick={() => setSelectedProject(null)}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full text-slate-800 shadow-2xl overflow-hidden relative"
                    >
                        {/* Nút đóng */}
                        <button
                            onClick={() => setSelectedProject(null)}
                            className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-white/90 hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 cursor-pointer shadow-2xs"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        {/* Ảnh phóng to */}
                        <div className="h-64 w-full bg-slate-100 relative overflow-hidden">
                            <SafeShowcaseImage
                                src={selectedProject.mainImage}
                                alt={selectedProject.title}
                                subject={selectedProject.subject}
                            />
                            <span className="absolute bottom-3 left-3 px-2.5 py-1 rounded text-xs font-semibold bg-white/90 text-slate-800 border border-slate-200 shadow-xs backdrop-blur-xs">
                                {selectedProject.subject}
                            </span>
                        </div>

                        {/* Thân Modal */}
                        <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto">
                            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900 m-0">{selectedProject.title}</h3>
                                    <p className="text-xs text-slate-500 mt-1 m-0">Tác giả: <strong className="text-slate-900">{selectedProject.name}</strong> • Trường: {selectedProject.school}</p>
                                </div>
                                <span className="text-xs font-mono px-2 py-1 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                                    {selectedProject.studentCode}
                                </span>
                            </div>

                            <div>
                                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Mô tả dự án</h4>
                                <p className="text-sm text-slate-700 leading-relaxed m-0">{selectedProject.desc}</p>
                            </div>

                            {selectedProject.metrics && selectedProject.metrics.length > 0 && (
                                <div>
                                    <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Thông tin kỹ thuật</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedProject.metrics.map((m, idx) => (
                                            <span key={idx} className="px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs text-slate-700 font-mono font-medium">
                                                {m}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {selectedProject.teacherQuote && (
                                <div className="p-3.5 bg-slate-50 rounded-xl border-l-4 border-blue-500">
                                    <h4 className="text-xs font-semibold text-blue-700 mb-1 flex items-center gap-1.5">
                                        <Quote className="w-3.5 h-3.5 text-blue-600" />
                                        Đánh giá của Giảng viên hướng dẫn
                                    </h4>
                                    <p className="text-xs text-slate-700 italic m-0">{selectedProject.teacherQuote}</p>
                                </div>
                            )}

                            <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
                                <span className="text-xs text-slate-500">Xem đầy đủ hồ sơ năng lực của học viên</span>
                                <Link
                                    href={`/e-portfolio/${selectedProject.studentId || selectedProject.studentCode}`}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                                >
                                    <span>Mở e-Portfolio</span>
                                    <ExternalLink className="w-3.5 h-3.5" />
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Thêm Tác phẩm mới (Tông sáng đồng bộ) */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 text-slate-800 shadow-2xl relative">
                        <button
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full hover:bg-slate-100"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-blue-600" />
                            Thêm Đồ án vào Lookbook
                        </h3>
                        <p className="text-xs text-slate-500 mb-5">Đăng tải dự án nổi bật của học viên lên bộ sưu tập tác phẩm</p>

                        <form onSubmit={handleCreateShowcase} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Chọn học sinh</label>
                                <select
                                    value={newStudentId}
                                    onChange={(e) => setNewStudentId(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                >
                                    <option value="">-- Chọn học viên --</option>
                                    {studentsList.map(s => (
                                        <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Tên dự án / Đồ án</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Xe Tự Hành Vượt Mê Cung Thông Minh"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Mô tả dự án & Đánh giá</label>
                                <textarea
                                    rows={3}
                                    placeholder="Mô tả công nghệ sử dụng, giải thuật và nhận xét của giáo viên..."
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Link hình ảnh hoặc Google Drive ID</label>
                                <input
                                    type="text"
                                    placeholder="https://... hoặc Google Drive File ID"
                                    value={newImg}
                                    onChange={(e) => setNewImg(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 outline-none focus:bg-white focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
                                />
                            </div>

                            <div className="pt-3 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50 shadow-xs"
                                >
                                    {isSubmitting ? 'Đang lưu...' : 'Lưu tác phẩm'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PortfolioLookbookPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-100 flex items-center justify-center text-slate-500">Đang tải Lookbook...</div>}>
            <LookbookContent />
        </Suspense>
    );
}
