'use client';

import React, { useState } from 'react';
import { TEMPLATES, SUBJECT_CATEGORIES, getTemplatesBySubject } from '@/lib/templates';
import { useRouter } from 'next/navigation';
import { reloadCourse } from '@/data/actions/reload';

export default function TemplateSelector({ course, book }) {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedTab, setSelectedTab] = useState(() => {
        const bookType = book?.Type || book?.Name || '';
        const lower = String(bookType).toLowerCase();
        if (lower.includes('toán') || lower.includes('math') || lower.includes('logic')) return 'math';
        if (lower.includes('anh') || lower.includes('eng') || lower.includes('skill')) return 'english';
        return 'robot';
    });
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const router = useRouter();

    const currentTemplateId = course?.template || 'robot-mecha';

    const templatesToDisplay = selectedTab === 'all'
        ? Object.values(TEMPLATES)
        : Object.values(TEMPLATES).filter(t => t.subject === selectedTab);

    const handleSelectTemplate = async (templateId) => {
        if (templateId === currentTemplateId) return;
        setLoading(true);
        setMessage('');

        try {
            const res = await fetch(`/api/course/${course._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ template: templateId }),
            });
            const resData = await res.json();
            if (res.ok) {
                setMessage('✅ Đã cập nhật giao diện lớp học thành công!');
                await reloadCourse(course._id);
                router.refresh();
                setTimeout(() => {
                    setIsOpen(false);
                    setMessage('');
                }, 1000);
            } else {
                setMessage(`❌ Lỗi: ${resData.mes || 'Không thể lưu giao diện'}`);
            }
        } catch (err) {
            setMessage(`❌ Lỗi kết nối: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="px-3 py-2 bg-[var(--bg-secondary)] flex items-center gap-2 rounded text-[var(--text-primary)] text-sm font-medium cursor-pointer border border-[var(--border-color)] transition-all duration-150 hover:bg-[var(--hover)] hover:-translate-y-0.5 whitespace-nowrap"
                style={{ marginTop: 8 }}
                title="Thay đổi giao diện ePortfolio của cả lớp"
            >
                <span className="text-base">🎨</span>
                <span>Giao diện lớp ({TEMPLATES[currentTemplateId]?.name || 'Mặc định'})</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-gray-200">
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50/30">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                    <span>🎨</span> Chọn Giao Diện Cho Lớp Học
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Giao diện được chọn sẽ áp dụng đồng nhất cho toàn bộ học sinh trong lớp <b>{course?.ID}</b> ({book?.Name})
                                </p>
                            </div>
                            <button
                                onClick={() => { setIsOpen(false); setMessage(''); }}
                                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors cursor-pointer border-none"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Subject Tabs */}
                        <div className="px-6 pt-3 pb-2 border-b border-gray-100 flex gap-2 overflow-x-auto">
                            <button
                                type="button"
                                onClick={() => setSelectedTab('all')}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all ${
                                    selectedTab === 'all'
                                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                        : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50'
                                }`}
                            >
                                🌟 Tất cả môn học ({Object.keys(TEMPLATES).length})
                            </button>
                            {SUBJECT_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    type="button"
                                    onClick={() => setSelectedTab(cat.id)}
                                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all flex items-center gap-1.5 ${
                                        selectedTab === cat.id
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                            : 'bg-white text-slate-600 border-gray-200 hover:bg-slate-50'
                                    }`}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.name} (5)</span>
                                </button>
                            ))}
                        </div>

                        {/* Quick Link to Preview Studio */}
                        <div className="mx-6 mt-3 px-4 py-3 rounded-xl bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50 border border-blue-200/80 flex items-center justify-between gap-3 flex-wrap shadow-2xs">
                            <div className="flex items-center gap-2.5">
                                <span className="text-xl">✨</span>
                                <div>
                                    <div className="text-xs font-bold text-slate-800">
                                        Bạn muốn xem trước chi tiết giao diện và bố cục?
                                    </div>
                                    <div className="text-[11px] text-slate-600">
                                        Mở Studio so sánh trực quan Cũ vs Mới (15 mẫu) hoặc xem ấn phẩm Kỷ yếu Tạp chí Lookbook A4.
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <a
                                    href="/preview-templates"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold no-underline transition-all shadow-xs flex items-center gap-1.5"
                                >
                                    <span>🎨</span>
                                    <span>Studio 15 Template ↗</span>
                                </a>
                                <a
                                    href="/portfolio-lookbook"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold no-underline transition-all shadow-xs flex items-center gap-1.5"
                                >
                                    <span>📖</span>
                                    <span>Kỷ Yếu Lookbook A4 ↗</span>
                                </a>
                            </div>
                        </div>

                        {/* Toast Message */}
                        {message && (
                            <div className="mx-6 mt-3 px-4 py-2.5 rounded-lg text-xs font-medium bg-slate-50 border border-slate-200 text-slate-800 flex items-center justify-between animate-fade-in">
                                <span>{message}</span>
                            </div>
                        )}

                        {/* Template Cards Grid */}
                        <div className="p-6 overflow-y-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                            {templatesToDisplay.map((tmpl) => {
                                const isCurrent = tmpl.id === currentTemplateId;
                                const { tokens } = tmpl;

                                return (
                                    <div
                                        key={tmpl.id}
                                        onClick={() => !loading && handleSelectTemplate(tmpl.id)}
                                        className={`group relative rounded-xl border-2 p-3.5 flex flex-col transition-all duration-200 cursor-pointer text-left ${
                                            isCurrent
                                                ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/20 shadow-md'
                                                : 'border-slate-200 hover:border-blue-400 hover:shadow-lg bg-white'
                                        }`}
                                    >
                                        {/* Current Active Badge */}
                                        {isCurrent && (
                                            <div className="absolute top-2.5 right-2.5 z-10 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-bold tracking-wide shadow-xs">
                                                ✓ ĐANG ÁP DỤNG
                                            </div>
                                        )}

                                        {/* Preview Card Mockup */}
                                        <div
                                            className="w-full h-28 rounded-lg mb-3 p-3 flex flex-col justify-between overflow-hidden relative shadow-inner"
                                            style={{ background: tmpl.previewGradient }}
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xl drop-shadow">{tmpl.icon}</span>
                                                <span
                                                    className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider"
                                                    style={{
                                                        backgroundColor: tokens.badgeBg,
                                                        color: tokens.badgeText,
                                                        border: `1px solid ${tokens.accentBorder}`
                                                    }}
                                                >
                                                    Buổi 1
                                                </span>
                                            </div>

                                            <div>
                                                <div
                                                    className="text-xs font-bold truncate drop-shadow-xs"
                                                    style={{ color: tokens.textPrimary }}
                                                >
                                                    {tmpl.name}
                                                </div>
                                                {/* Mini progress bar preview */}
                                                <div className="w-full h-1.5 rounded-full mt-1.5 overflow-hidden bg-black/20">
                                                    <div
                                                        className="h-full rounded-full"
                                                        style={{ width: '70%', background: tokens.progressBar }}
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 flex flex-col justify-between">
                                            <div>
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-base font-bold text-slate-800">{tmpl.name}</span>
                                                </div>
                                                <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                                                    {tmpl.tagline}
                                                </p>
                                            </div>

                                            {/* Action Button */}
                                            <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                                                <a
                                                    href={`/preview-templates`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold no-underline hover:underline flex items-center gap-1"
                                                    title="Mở Studio xem thử bố cục chi tiết"
                                                >
                                                    <span>👁️ Xem Studio</span>
                                                </a>
                                                <button
                                                    type="button"
                                                    disabled={loading || isCurrent}
                                                    className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all border-none ${
                                                        isCurrent
                                                            ? 'bg-blue-100 text-blue-700 cursor-default'
                                                            : 'bg-slate-900 hover:bg-blue-600 text-white cursor-pointer shadow-xs group-hover:bg-blue-600'
                                                    }`}
                                                >
                                                    {isCurrent ? 'Đang chọn' : 'Áp dụng mẫu này'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 bg-slate-50 border-t border-gray-200 flex items-center justify-between text-xs text-slate-500">
                            <span>💡 Bạn có thể đổi giao diện bất cứ lúc nào trong suốt khóa học.</span>
                            <button
                                onClick={() => { setIsOpen(false); setMessage(''); }}
                                className="px-4 py-1.5 rounded-md bg-white border border-gray-300 text-slate-700 hover:bg-gray-100 font-medium cursor-pointer"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
