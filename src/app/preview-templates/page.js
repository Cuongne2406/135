'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { TEMPLATES, SUBJECT_CATEGORIES } from '@/lib/templates';

// Dữ liệu mô phỏng 1 khóa học chuẩn để test template
const MOCK_COURSE = {
    name: 'Robotics Khám Phá & Lập Trình Cơ Bản',
    code: 'ROBOT-EXP-01',
    statusText: 'Đang diễn ra',
    totalLessons: 8,
    completedLessons: 6,
    progress: 75,
    lessons: [
        {
            num: 1,
            title: 'Lắp ráp Mô hình Robot Cảm biến Khoảng cách',
            time: '08:00 - 09:30',
            date: '15/08/2026',
            statusText: 'Có mặt',
            statusClass: 'bg-emerald-100 text-emerald-700 border border-emerald-300'
        },
        {
            num: 2,
            title: 'Lập trình Thuật toán Dò đường & Tránh vật cản',
            time: '08:00 - 09:30',
            date: '22/08/2026',
            statusText: 'Có mặt',
            statusClass: 'bg-emerald-100 text-emerald-700 border border-emerald-300'
        },
        {
            num: 3,
            title: 'Tối ưu Cơ cấu Bánh răng & Tốc độ Di chuyển',
            time: '08:00 - 09:30',
            date: '29/08/2026',
            statusText: 'Có mặt',
            statusClass: 'bg-emerald-100 text-emerald-700 border border-emerald-300'
        },
        {
            num: 4,
            title: 'Thử nghiệm Chiến đấu Sa bàn & Báo cáo Dự án',
            time: '08:00 - 09:30',
            date: '05/09/2026',
            statusText: 'Chưa học',
            statusClass: 'bg-slate-100 text-slate-600 border border-slate-300'
        }
    ]
};

export default function PreviewTemplatesPage() {
    const [selectedId, setSelectedId] = useState('robot-mecha');
    const [viewMode, setViewMode] = useState('compare'); // 'compare' | 'single'
    const [subjectFilter, setSubjectFilter] = useState('all');

    const currentTmpl = TEMPLATES[selectedId] || TEMPLATES['robot-mecha'];
    const { tokens } = currentTmpl;

    const filteredTemplates = subjectFilter === 'all'
        ? Object.values(TEMPLATES)
        : Object.values(TEMPLATES).filter(t => t.subject === subjectFilter);

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 pb-16">
            {/* Header Điều Hướng */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3">
                    <Link
                        href="/course/6a97af613b1fbc04f1ca4d7c"
                        className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold no-underline transition-colors flex items-center gap-1.5"
                    >
                        ← Quay lại Lớp học
                    </Link>
                    <div className="h-4 w-px bg-slate-200" />
                    <div>
                        <h1 className="text-base font-bold text-slate-900 m-0 flex items-center gap-2">
                            <span>🎨</span> Studio Trưng Bày & So Sánh Template
                        </h1>
                        <p className="text-[11px] text-slate-500 m-0">
                            So sánh trực tiếp Giao diện Cũ vs Mới và xem trước bố cục 15 template theo môn học
                        </p>
                    </div>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200">
                    <button
                        onClick={() => setViewMode('compare')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all border-none ${viewMode === 'compare'
                                ? 'bg-white text-blue-600 shadow-xs'
                                : 'bg-transparent text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        ⚖️ So sánh Cũ vs Mới
                    </button>
                    <button
                        onClick={() => setViewMode('single')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all border-none ${viewMode === 'single'
                                ? 'bg-white text-blue-600 shadow-xs'
                                : 'bg-transparent text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        👁️ Xem Độc Lập
                    </button>
                </div>
            </header>

            {/* Thanh chọn 15 Template */}
            <div className="max-w-7xl mx-auto px-6 pt-6">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                    <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">Chọn Template để xem thử:</span>
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold">
                                {currentTmpl.name} ({currentTmpl.icon})
                            </span>
                        </div>

                        {/* Subject filter */}
                        <div className="flex gap-1.5">
                            <button
                                onClick={() => setSubjectFilter('all')}
                                className={`px-2.5 py-1 rounded-md text-xs font-semibold border cursor-pointer ${subjectFilter === 'all'
                                        ? 'bg-slate-900 text-white border-slate-900'
                                        : 'bg-white text-slate-600 border-slate-200'
                                    }`}
                            >
                                Tất cả (15)
                            </button>
                            {SUBJECT_CATEGORIES.map(cat => (
                                <button
                                    key={cat.id}
                                    onClick={() => setSubjectFilter(cat.id)}
                                    className={`px-2.5 py-1 rounded-md text-xs font-semibold border cursor-pointer flex items-center gap-1 ${subjectFilter === cat.id
                                            ? 'bg-blue-600 text-white border-blue-600'
                                            : 'bg-white text-slate-600 border-slate-200'
                                        }`}
                                >
                                    <span>{cat.icon}</span>
                                    <span>{cat.name}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Danh sách 15 template dạng chips */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5 pt-3">
                        {filteredTemplates.map(tmpl => {
                            const isAct = tmpl.id === selectedId;
                            return (
                                <button
                                    key={tmpl.id}
                                    onClick={() => setSelectedId(tmpl.id)}
                                    className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center gap-2.5 ${isAct
                                            ? 'border-blue-600 ring-2 ring-blue-500/20 bg-blue-50/40 shadow-xs'
                                            : 'border-slate-200 hover:border-slate-300 bg-white hover:bg-slate-50'
                                        }`}
                                >
                                    <div
                                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-2xs shrink-0"
                                        style={{ background: tmpl.previewGradient }}
                                    >
                                        <span>{tmpl.icon}</span>
                                    </div>
                                    <div className="truncate">
                                        <p className="text-xs font-bold text-slate-800 truncate m-0 leading-tight">
                                            {tmpl.name}
                                        </p>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold m-0 mt-0.5">
                                            {tmpl.subject}
                                        </p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Khu Vực Hiển Thị Trực Quan */}
                <div className="mt-6">
                    {viewMode === 'compare' ? (
                        /* CHẾ ĐỘ SO SÁNH SONG SONG */
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* CỘT 1: GIAO DIỆN CŨ (BEFORE) */}
                            <div className="flex flex-col">
                                <div className="mb-2 flex items-center justify-between px-1">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                                        1. Giao Diện Trước Đó
                                    </span>
                                </div>

                                <div className="bg-white rounded-lg border border-[#e0e0e0] overflow-hidden shadow-xs">
                                    {/* Header Cũ */}
                                    <div className="grid grid-cols-[3fr_2fr_auto] items-center gap-4 w-full px-5 py-4 bg-white border-b border-[#e0e0e0]">
                                        <div className="flex items-center gap-4">
                                            <div className="w-[60px] h-[60px] rounded-lg bg-slate-200 flex items-center justify-center text-2xl text-slate-400">
                                                📚
                                            </div>
                                            <div className="flex flex-col gap-0.5">
                                                <p className="text-sm font-semibold text-slate-700 m-0">
                                                    {MOCK_COURSE.name}
                                                </p>
                                                <p className="text-sm text-slate-700 m-0">
                                                    Khóa: <span className="font-normal text-slate-600">{MOCK_COURSE.code}</span>
                                                </p>
                                                <p className="text-sm text-slate-700 m-0">
                                                    Trạng thái: <span className="font-normal text-slate-600">{MOCK_COURSE.statusText}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-sm text-slate-500">
                                            <span>{MOCK_COURSE.completedLessons}/{MOCK_COURSE.totalLessons} buổi</span>
                                            <div className="w-full h-1.5 bg-slate-200 rounded overflow-hidden mt-1">
                                                <div
                                                    className="h-full bg-blue-600 rounded"
                                                    style={{ width: `${MOCK_COURSE.progress}%` }}
                                                />
                                            </div>
                                        </div>

                                        <span className="text-slate-400 text-sm">▼</span>
                                    </div>

                                    {/* Danh sách buổi học Cũ */}
                                    <div className="flex flex-col bg-[#fdfdfd] p-1">
                                        {MOCK_COURSE.lessons.map((lesson) => (
                                            <div
                                                key={lesson.num}
                                                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 w-full px-4 py-3 rounded-md bg-white border-b border-[#e0e0e0] hover:bg-[#f8f9fa] transition-colors"
                                            >
                                                <p className="font-bold text-blue-600 text-sm m-0">
                                                    Buổi {lesson.num}
                                                </p>
                                                <div>
                                                    <p className="font-medium text-slate-700 text-sm m-0">
                                                        {lesson.title}
                                                    </p>
                                                    <p className="text-xs text-slate-400 m-0 mt-0.5">
                                                        Thời gian: {lesson.time} {lesson.date}
                                                    </p>
                                                </div>
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded ${lesson.statusClass}`}>
                                                    {lesson.statusText}
                                                </span>
                                                <span className="text-slate-400">›</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* CỘT 2: GIAO DIỆN MỚI (AFTER) */}
                            <div className="flex flex-col">
                                <div className="mb-2 flex items-center justify-between px-1">
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                                        2. Giao Diện Mới: {currentTmpl.name}
                                    </span>
                                    <span className="text-[11px] text-blue-600 font-semibold">
                                        Thích hợp theo môn {currentTmpl.subject}
                                    </span>
                                </div>

                                <div
                                    className="rounded-xl overflow-hidden shadow-md transition-all duration-300"
                                    style={{
                                        backgroundColor: tokens.cardBg,
                                        border: `1.5px solid ${tokens.cardBorder}`
                                    }}
                                >
                                    {/* Header Mới */}
                                    <div
                                        className="grid grid-cols-[3fr_2fr_auto] items-center gap-4 w-full px-5 py-4 border-b transition-colors"
                                        style={{
                                            background: tokens.headerBg,
                                            borderColor: tokens.cardBorder
                                        }}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="w-[60px] h-[60px] rounded-xl flex items-center justify-center text-3xl shadow-sm shrink-0"
                                                style={{ background: currentTmpl.previewGradient }}
                                            >
                                                {currentTmpl.icon}
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className="text-base font-bold m-0 leading-snug" style={{ color: tokens.textPrimary }}>
                                                        {MOCK_COURSE.name}
                                                    </p>
                                                    <span
                                                        className="text-[11px] px-2.5 py-0.5 rounded-full font-bold inline-flex items-center gap-1 shadow-2xs"
                                                        style={{
                                                            backgroundColor: tokens.badgeBg,
                                                            color: tokens.badgeText,
                                                            border: `1px solid ${tokens.accentBorder}`
                                                        }}
                                                    >
                                                        {currentTmpl.icon} {currentTmpl.name}
                                                    </span>
                                                </div>
                                                <p className="text-xs font-medium m-0" style={{ color: tokens.textSecondary }}>
                                                    Mã lớp: <span className="font-bold">{MOCK_COURSE.code}</span> • Trạng thái: <span className="font-bold">{MOCK_COURSE.statusText}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="text-sm" style={{ color: tokens.textSecondary }}>
                                            <span className="font-semibold">{MOCK_COURSE.completedLessons}/{MOCK_COURSE.totalLessons} buổi học</span>
                                            <div className="w-full h-2 rounded-full overflow-hidden mt-1.5 bg-black/15">
                                                <div
                                                    className="h-full rounded-full transition-all duration-500 ease-in-out"
                                                    style={{ width: `${MOCK_COURSE.progress}%`, background: tokens.progressBar }}
                                                />
                                            </div>
                                        </div>

                                        <span style={{ color: tokens.textSecondary }} className="font-bold text-sm">
                                            ▼
                                        </span>
                                    </div>

                                    {/* Danh sách buổi học Mới */}
                                    <div
                                        className="flex flex-col p-2.5 gap-2"
                                        style={{ backgroundColor: tokens.cardBg }}
                                    >
                                        {MOCK_COURSE.lessons.map((lesson) => (
                                            <div
                                                key={lesson.num}
                                                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 w-full px-4 py-3 rounded-lg border transition-all duration-150 shadow-2xs"
                                                style={{
                                                    backgroundColor: tokens.lessonBg,
                                                    borderColor: tokens.cardBorder
                                                }}
                                            >
                                                <p
                                                    className="font-bold text-sm tracking-wide m-0"
                                                    style={{ color: tokens.primary }}
                                                >
                                                    Buổi {lesson.num}
                                                </p>
                                                <div>
                                                    <p
                                                        className="font-semibold text-sm m-0"
                                                        style={{ color: tokens.textPrimary }}
                                                    >
                                                        {lesson.title}
                                                    </p>
                                                    <p
                                                        className="text-xs m-0 mt-0.5"
                                                        style={{ color: tokens.textSecondary }}
                                                    >
                                                        Thời gian: {lesson.time} • {lesson.date}
                                                    </p>
                                                </div>
                                                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${lesson.statusClass}`}>
                                                    {lesson.statusText}
                                                </span>
                                                <span style={{ color: tokens.textSecondary }} className="font-bold text-base">
                                                    ›
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* CHẾ ĐỘ XEM ĐỘC LẬP TOÀN CẢNH */
                        <div className="max-w-4xl mx-auto">
                            <div className="mb-3 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-slate-800 m-0 flex items-center gap-2">
                                    <span>{currentTmpl.icon}</span> {currentTmpl.name}
                                </h3>
                                <span className="text-xs text-slate-500 font-medium italic">
                                    {currentTmpl.tagline}
                                </span>
                            </div>

                            <div
                                className="rounded-2xl overflow-hidden shadow-xl"
                                style={{
                                    backgroundColor: tokens.cardBg,
                                    border: `1.5px solid ${tokens.cardBorder}`
                                }}
                            >
                                <div
                                    className="p-6 border-b flex items-center justify-between"
                                    style={{
                                        background: tokens.headerBg,
                                        borderColor: tokens.cardBorder
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl shadow-sm"
                                            style={{ background: currentTmpl.previewGradient }}
                                        >
                                            {currentTmpl.icon}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h2 className="text-xl font-bold m-0" style={{ color: tokens.textPrimary }}>
                                                    {MOCK_COURSE.name}
                                                </h2>
                                                <span
                                                    className="text-xs px-3 py-1 rounded-full font-bold inline-flex items-center gap-1 shadow-2xs"
                                                    style={{
                                                        backgroundColor: tokens.badgeBg,
                                                        color: tokens.badgeText,
                                                        border: `1px solid ${tokens.accentBorder}`
                                                    }}
                                                >
                                                    {currentTmpl.name}
                                                </span>
                                            </div>
                                            <p className="text-sm mt-1 m-0" style={{ color: tokens.textSecondary }}>
                                                Mã khóa: <b>{MOCK_COURSE.code}</b> • 8 bài học chuyên sâu
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <span className="text-sm font-semibold" style={{ color: tokens.textSecondary }}>
                                            Tiến độ: {MOCK_COURSE.progress}% ({MOCK_COURSE.completedLessons}/{MOCK_COURSE.totalLessons} buổi)
                                        </span>
                                        <div className="w-48 h-2.5 rounded-full overflow-hidden mt-1.5 bg-black/15">
                                            <div
                                                className="h-full rounded-full"
                                                style={{ width: `${MOCK_COURSE.progress}%`, background: tokens.progressBar }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-4 flex flex-col gap-2.5" style={{ backgroundColor: tokens.cardBg }}>
                                    {MOCK_COURSE.lessons.map(lesson => (
                                        <div
                                            key={lesson.num}
                                            className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 px-5 py-3.5 rounded-xl border"
                                            style={{
                                                backgroundColor: tokens.lessonBg,
                                                borderColor: tokens.cardBorder
                                            }}
                                        >
                                            <span className="font-bold text-sm" style={{ color: tokens.primary }}>
                                                Buổi {lesson.num}
                                            </span>
                                            <div>
                                                <p className="font-bold text-sm m-0" style={{ color: tokens.textPrimary }}>
                                                    {lesson.title}
                                                </p>
                                                <p className="text-xs m-0 mt-0.5" style={{ color: tokens.textSecondary }}>
                                                    {lesson.time} • {lesson.date}
                                                </p>
                                            </div>
                                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-md ${lesson.statusClass}`}>
                                                {lesson.statusText}
                                            </span>
                                            <span style={{ color: tokens.textSecondary }}>›</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
