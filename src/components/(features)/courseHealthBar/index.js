'use client';

import React, { useState, useMemo } from 'react';
import { calculateCourseHealth } from '@/utils/courseHealth';

export default function CourseHealthBar({ course, mode = 'full', className = '' }) {
    const [showModal, setShowModal] = useState(false);

    const health = useMemo(() => {
        return calculateCourseHealth(course);
    }, [course]);

    if (!course) return null;

    // Chế độ thu gọn (dùng cho card danh sách khóa học)
    if (mode === 'compact') {
        return (
            <div className={`flex flex-col gap-1 w-full ${className}`}>
                <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-600 flex items-center gap-1">
                        <span>🩺 Sức khỏe:</span>
                        <span style={{ color: health.color }} className="font-bold">
                            {health.overallScore}%
                        </span>
                    </span>
                    <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                        style={{ backgroundColor: health.bgLight, color: health.color }}
                    >
                        {health.label}
                    </span>
                </div>
                {/* Thanh tiến độ đa màu */}
                <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden flex">
                    <div
                        className="h-full transition-all duration-300 rounded-full"
                        style={{
                            width: `${health.overallScore}%`,
                            backgroundColor: health.color
                        }}
                    />
                </div>
            </div>
        );
    }

    // Chế độ đầy đủ (dùng cho trang chi tiết khóa học)
    return (
        <>
            <div className={`bg-white rounded-xl border border-gray-200 p-4 shadow-xs flex flex-col gap-3 ${className}`}>
                {/* Header thanh sức khỏe */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gray-100 pb-2.5">
                    <div className="flex items-center gap-2.5">
                        <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold shadow-xs"
                            style={{ backgroundColor: health.bgLight, color: health.color }}
                        >
                            🩺
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold text-gray-800 m-0">
                                    Thanh Sức Khỏe Khóa Học (Course Health)
                                </h4>
                                <span
                                    className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                                    style={{ backgroundColor: health.bgLight, color: health.color }}
                                >
                                    {health.label} • {health.overallScore}%
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 m-0 mt-0.5">
                                Đo lường mức độ hoàn thiện dữ liệu: Điểm danh, Minh chứng Drive, Nhận xét & Portfolio
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowModal(true)}
                        className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 cursor-pointer flex items-center gap-1.5 transition-colors"
                    >
                        <span>📋 Xem Checklist</span>
                        {health.totalIssuesCount > 0 && (
                            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                                {health.totalIssuesCount}
                            </span>
                        )}
                    </button>
                </div>

                {/* 4 Chỉ số thành phần */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {/* Điểm danh */}
                    <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 font-medium">📋 Điểm danh</span>
                            <span className="font-bold text-gray-800">{health.metrics.attendance.score}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                            <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${health.metrics.attendance.score}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-gray-400">
                            {health.metrics.attendance.done}/{health.metrics.attendance.total} buổi
                        </span>
                    </div>

                    {/* Minh chứng ảnh */}
                    <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 font-medium">📸 Minh chứng</span>
                            <span className="font-bold text-gray-800">{health.metrics.media.score}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                            <div
                                className="h-full bg-emerald-500 rounded-full"
                                style={{ width: `${health.metrics.media.score}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-gray-400">
                            {health.metrics.media.done}/{health.metrics.media.total} buổi có ảnh
                        </span>
                    </div>

                    {/* Nhận xét */}
                    <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 font-medium">✍️ Nhận xét</span>
                            <span className="font-bold text-gray-800">{health.metrics.journal.score}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                            <div
                                className="h-full bg-amber-500 rounded-full"
                                style={{ width: `${health.metrics.journal.score}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-gray-400">
                            {health.metrics.journal.done}/{health.metrics.journal.total} buổi có cmt
                        </span>
                    </div>

                    {/* ePortfolio */}
                    <div className="bg-gray-50/70 p-2.5 rounded-lg border border-gray-100 flex flex-col gap-1.5">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-600 font-medium">🎓 ePortfolio</span>
                            <span className="font-bold text-gray-800">{health.metrics.portfolio.score}%</span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-gray-200 overflow-hidden">
                            <div
                                className="h-full bg-indigo-500 rounded-full"
                                style={{ width: `${health.metrics.portfolio.score}%` }}
                            />
                        </div>
                        <span className="text-[10px] text-gray-400 truncate">
                            {health.checklist.find(c => c.key === 'portfolio')?.detail}
                        </span>
                    </div>
                </div>
            </div>

            {/* Modal Checklist chi tiết */}
            {showModal && (
                <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 border border-gray-100 animate-scaleUp">
                        {/* Header modal */}
                        <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                            <div className="flex items-center gap-2.5">
                                <div
                                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
                                    style={{ backgroundColor: health.bgLight, color: health.color }}
                                >
                                    📋
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-gray-800 m-0">
                                        Checklist Sức Khỏe Khóa Học
                                    </h3>
                                    <p className="text-xs text-gray-500 m-0 mt-0.5">
                                        Điểm hoàn thiện: <strong style={{ color: health.color }}>{health.overallScore}% ({health.label})</strong>
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="text-gray-400 hover:text-gray-600 text-xl font-bold bg-transparent border-none cursor-pointer p-1"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Danh sách 4 hạng mục */}
                        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1">
                            {health.checklist.map((item) => (
                                <div
                                    key={item.key}
                                    className={`p-3 rounded-xl border ${
                                        item.status === 'pass'
                                            ? 'bg-emerald-50/50 border-emerald-200'
                                            : item.status === 'warn'
                                            ? 'bg-amber-50/50 border-amber-200'
                                            : 'bg-red-50/50 border-red-200'
                                    }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-base">{item.icon}</span>
                                            <span className="text-sm font-bold text-gray-800">{item.name}</span>
                                        </div>
                                        <span
                                            className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                                                item.status === 'pass'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : item.status === 'warn'
                                                    ? 'bg-amber-100 text-amber-800'
                                                    : 'bg-red-100 text-red-800'
                                            }`}
                                        >
                                            {item.score}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-600 m-0 mt-1">{item.detail}</p>

                                    {/* Danh sách lỗi nếu có */}
                                    {item.issues && item.issues.length > 0 && (
                                        <ul className="mt-2 mb-0 pl-4 text-xs text-red-600 list-disc space-y-0.5">
                                            {item.issues.map((issue, idx) => (
                                                <li key={idx}>{issue}</li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Footer modal */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                            <span className="text-xs text-gray-500">
                                {health.totalIssuesCount === 0
                                    ? '🎉 Tất cả dữ liệu đã hoàn thiện 100%!'
                                    : `Cần bổ sung ${health.totalIssuesCount} đầu việc trước khi đóng lớp.`}
                            </span>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-xs font-semibold cursor-pointer border-none transition-colors"
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
