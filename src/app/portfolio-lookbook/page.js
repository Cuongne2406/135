'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import {
    Sparkles,
    Filter,
    Plus,
    Search,
    ExternalLink,
    RefreshCw,
    Award,
    School,
    Layers,
    X,
    Quote
} from 'lucide-react';
import { driveImage } from '@/function';

function LookbookContent() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [subjectFilter, setSubjectFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [studentsList, setStudentsList] = useState([]);

    // Form thêm tác phẩm
    const [newStudentId, setNewStudentId] = useState('');
    const [newTitle, setNewTitle] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [newImg, setNewImg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchShowcases = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/showcase?subject=${subjectFilter}`);
            const json = await res.json();
            if (json.success) {
                setItems(json.data || []);
            }
        } catch (e) {
            console.error('Lỗi tải showcase:', e);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const res = await fetch('/api/academic/test-reports');
            const json = await res.json();
            if (json.success && json.summary) {
                // Lấy danh sách học sinh từ API
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
        } catch (e) {}
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
            it.school?.toLowerCase().includes(q)
        );
    }, [items, searchQuery]);

    const categories = [
        { key: 'all', label: 'Tất cả lĩnh vực' },
        { key: 'Robotics', label: 'Robotics & STEM' },
        { key: 'AI', label: 'AI & Data Science' },
        { key: 'Python', label: 'Lập trình Python' },
        { key: 'Game', label: 'Thiết kế Game' }
    ];

    return (
        <div className="min-h-screen bg-slate-900 text-slate-100 pb-20">
            {/* Top Showcase Banner */}
            <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4">
                <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Sparkles className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-white tracking-tight flex items-center gap-2 m-0">
                                SYS-AIR LOOKBOOK &bull; <span className="text-indigo-400 font-normal text-sm">Portfolio Showcase</span>
                            </h1>
                            <p className="text-xs text-slate-400 m-0">Triển lãm các dự án sáng tạo và thành tích nổi bật của học viên</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold shadow-md transition-colors cursor-pointer"
                        >
                            <Plus className="w-4 h-4" />
                            <span>Thêm tác phẩm</span>
                        </button>
                        <Link
                            href="/student"
                            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-colors"
                        >
                            Quản lý học viên
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
                {/* Filter and Search Bar */}
                <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 backdrop-blur-md">
                    <div className="flex flex-wrap gap-2">
                        {categories.map(c => (
                            <button
                                key={c.key}
                                onClick={() => setSubjectFilter(c.key)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer border-none ${
                                    subjectFilter === c.key
                                        ? 'bg-indigo-600 text-white shadow-xs'
                                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                {c.label}
                            </button>
                        ))}
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm dự án, học viên..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 pr-4 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-indigo-500 w-64 transition-colors"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                    </div>
                </div>

                {/* Showcase Cards Grid */}
                {loading ? (
                    <div className="flex items-center justify-center p-20 text-slate-400 gap-2">
                        <RefreshCw className="w-5 h-5 animate-spin text-indigo-400" />
                        <span>Đang tải các tác phẩm từ hệ thống...</span>
                    </div>
                ) : filteredItems.length === 0 ? (
                    <div className="text-center p-20 bg-slate-800/30 rounded-2xl border border-slate-800 text-slate-400">
                        <Layers className="w-10 h-10 mx-auto mb-3 text-slate-600" />
                        <h3 className="text-base font-semibold text-slate-300">Chưa có tác phẩm nào phù hợp</h3>
                        <p className="text-xs text-slate-500 mt-1">Hãy nhấn "Thêm tác phẩm" để cập nhật dự án tiêu biểu cho học viên.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map(item => (
                            <div
                                key={item.id}
                                className="bg-slate-800/80 rounded-2xl border border-slate-700/80 overflow-hidden shadow-lg flex flex-col justify-between hover:border-indigo-500/50 transition-all group"
                            >
                                <div>
                                    {/* Ảnh dự án */}
                                    <div className="h-52 w-full bg-slate-900 relative overflow-hidden">
                                        <img
                                            src={driveImage(item.mainImage) || 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80'}
                                            alt={item.title}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-900/80 text-indigo-300 backdrop-blur-md border border-slate-700">
                                            {item.subject}
                                        </span>
                                    </div>

                                    {/* Nội dung tác phẩm */}
                                    <div className="p-5 space-y-3">
                                        <div className="flex items-center justify-between text-xs text-slate-400">
                                            <span className="flex items-center gap-1">
                                                <School className="w-3.5 h-3.5 text-slate-500" />
                                                {item.school}
                                            </span>
                                            <span className="font-semibold text-indigo-400">{item.name}</span>
                                        </div>

                                        <h2 className="text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                                            {item.title}
                                        </h2>

                                        <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                                            {item.desc}
                                        </p>

                                        {/* Metrics */}
                                        {item.metrics && item.metrics.length > 0 && (
                                            <div className="pt-2 flex flex-wrap gap-1.5">
                                                {item.metrics.map((m, mIdx) => (
                                                    <span key={mIdx} className="px-2 py-0.5 rounded-md bg-slate-900/70 text-[10px] text-slate-400 border border-slate-700/50">
                                                        {m}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {/* Lời nhận xét */}
                                        {item.teacherQuote && (
                                            <div className="p-2.5 bg-slate-900/60 rounded-xl border border-slate-700/50 flex items-start gap-2 text-[11px] text-slate-300 italic">
                                                <Quote className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0 mt-0.5" />
                                                <span className="line-clamp-2">{item.teacherQuote}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer link e-Portfolio */}
                                <div className="p-4 bg-slate-900/60 border-t border-slate-700/50 flex items-center justify-between">
                                    <span className="text-[11px] text-slate-500 font-medium">Mã HV: {item.studentCode}</span>
                                    <Link
                                        href={`/e-portfolio/${item.studentId || item.studentCode}`}
                                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
                                    >
                                        <span>Xem e-Portfolio</span>
                                        <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal Thêm Tác phẩm mới */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 text-slate-200 shadow-2xl relative">
                        <button
                            onClick={() => setIsAddModalOpen(false)}
                            className="absolute top-4 right-4 text-slate-400 hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
                            <Plus className="w-5 h-5 text-indigo-400" />
                            Thêm Đồ án vào Lookbook
                        </h3>
                        <p className="text-xs text-slate-400 mb-6">Đăng tải dự án nổi bật của học viên lên bộ sưu tập tác phẩm</p>

                        <form onSubmit={handleCreateShowcase} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Chọn học sinh</label>
                                <select
                                    value={newStudentId}
                                    onChange={(e) => setNewStudentId(e.target.value)}
                                    required
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500"
                                >
                                    <option value="">-- Chọn học viên --</option>
                                    {studentsList.map(s => (
                                        <option key={s._id} value={s._id}>{s.code} - {s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Tên dự án / Đồ án</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Ví dụ: Cánh tay robot 3 bậc tự do"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Mô tả dự án & Nhận xét</label>
                                <textarea
                                    rows={3}
                                    placeholder="Mô tả công nghệ sử dụng, chức năng và đánh giá của giáo viên..."
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500 resize-none"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-slate-300 mb-1">Google Drive ID hoặc Link hình ảnh</label>
                                <input
                                    type="text"
                                    placeholder="Google Drive File ID hoặc URL ảnh..."
                                    value={newImg}
                                    onChange={(e) => setNewImg(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-xl text-xs text-slate-200 outline-none focus:border-indigo-500"
                                />
                            </div>

                            <div className="pt-4 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddModalOpen(false)}
                                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
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
        <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center text-slate-400">Đang tải Lookbook...</div>}>
            <LookbookContent />
        </Suspense>
    );
}
