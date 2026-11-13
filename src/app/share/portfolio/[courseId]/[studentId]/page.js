'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { driveImage } from '@/function';
import ZaloBrowserGuard from '@/components/ui/ZaloBrowserGuard';

// Component vẽ biểu đồ Radar 5 trục bằng SVG thuần (nhẹ, sắc nét, không vỡ hạt trên điện thoại)
function SvgRadarChart({ skills }) {
    const skillList = [
        { key: 'Tư duy Thuật toán & Logic', label: 'Logic' },
        { key: 'Kỹ năng Thao tác & Lắp ráp', label: 'Thao tác' },
        { key: 'Thuyết trình & Báo cáo', label: 'Thuyết trình' },
        { key: 'Tinh thần Đồng đội', label: 'Đồng đội' },
        { key: 'Sáng tạo & Cải tiến', label: 'Sáng tạo' }
    ];

    const size = 260;
    const center = size / 2;
    const radius = 85;
    const totalAxes = skillList.length;

    // Tính tọa độ các đỉnh
    const getCoordinates = (index, valuePercent) => {
        const angle = (Math.PI * 2 / totalAxes) * index - Math.PI / 2;
        const r = (radius * valuePercent) / 100;
        return {
            x: center + r * Math.cos(angle),
            y: center + r * Math.sin(angle)
        };
    };

    // Điểm của học sinh
    const points = skillList.map((s, i) => {
        const raw = skills?.[s.key] || '85%';
        const val = parseInt(raw, 10) || 85;
        return getCoordinates(i, val);
    });
    const polygonPoints = points.map(p => `${p.x},${p.y}`).join(' ');

    return (
        <div className="flex flex-col items-center">
            <svg width={size} height={size} className="overflow-visible">
                {/* Lưới đa giác nền (25%, 50%, 75%, 100%) */}
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
                        />
                    );
                })}

                {/* Đa giác điểm của học sinh */}
                <polygon
                    points={polygonPoints}
                    fill="rgba(14, 165, 233, 0.2)"
                    stroke="#0284c7"
                    strokeWidth="2"
                />

                {/* Điểm nút và nhãn */}
                {skillList.map((s, i) => {
                    const pt = points[i];
                    const labelPt = getCoordinates(i, 120);
                    const rawVal = skills?.[s.key] || '85%';
                    return (
                        <g key={i}>
                            <circle cx={pt.x} cy={pt.y} r="3.5" fill="#0284c7" />
                            <text
                                x={labelPt.x}
                                y={labelPt.y}
                                textAnchor="middle"
                                dominantBaseline="central"
                                fontSize="11"
                                fontWeight="600"
                                fill="#475569"
                            >
                                {s.label} ({rawVal.replace('%', '').trim()}%)
                            </text>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
}

export default function StudentPortfolioSharePage({ params }) {
    // Un-wrap params theo chuẩn Next.js 15+
    const resolvedParams = use(params);
    const { courseId, studentId } = resolvedParams;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        async function fetchPortfolio() {
            try {
                setLoading(true);
                const res = await fetch(`/api/share/portfolio?courseId=${courseId}&studentId=${studentId}`);
                const json = await res.json();

                if (!res.ok || json.status !== 2) {
                    setErrorMsg(json.mes || 'Không thể tải hồ sơ học sinh.');
                    setData(null);
                } else {
                    setData(json);
                }
            } catch (err) {
                setErrorMsg('Lỗi kết nối máy chủ, vui lòng thử lại sau.');
            } finally {
                setLoading(false);
            }
        }
        if (courseId && studentId) {
            fetchPortfolio();
        }
    }, [courseId, studentId]);

    const handleDownloadImage = (url, name) => {
        if (!url) return;
        const link = document.createElement('a');
        link.href = driveImage(url);
        link.target = '_blank';
        link.download = `${name || 'portfolio'}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-sm text-slate-600">Đang tải hồ sơ ePortfolio...</p>
                </div>
            </div>
        );
    }

    if (errorMsg || !data) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white max-w-md w-full p-6 rounded-xl border border-slate-200 shadow-sm text-center">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 text-slate-400">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    </div>
                    <h2 className="text-base font-bold text-slate-800 mb-1">Thông báo</h2>
                    <p className="text-sm text-slate-600 leading-relaxed">{errorMsg}</p>
                </div>
            </div>
        );
    }

    const { student, course } = data;

    return (
        <div className="min-h-screen bg-slate-100 text-slate-800 py-6 px-3 sm:px-6">
            <ZaloBrowserGuard />
            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                {/* Header Thông Tin Khóa Học */}
                <div className="bg-slate-900 text-white p-6 text-center">
                    <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-1">
                        Hồ Sơ Năng Lực Học Viên
                    </p>
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight mb-1">
                        {course.type} ({course.code})
                    </h1>
                    <p className="text-xs text-slate-300">
                        Chứng nhận hoàn thành chương trình đào tạo
                    </p>
                </div>

                {/* Thanh điều hướng quay về Hồ sơ Năng lực Tổng thể */}
                <div className="bg-sky-50/80 border-b border-sky-100 px-4 py-2.5 flex items-center justify-between">
                    <Link
                        href={`/share/student/${student.ID || studentId}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--main_d)] hover:underline no-underline"
                    >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>← Xem Hồ Sơ Năng Lực Tổng Thể Của Bé</span>
                    </Link>
                    <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                        Master Portfolio
                    </span>
                </div>

                {/* Chân Dung Học Sinh */}
                <div className="p-6 border-b border-slate-100 text-center">
                    <div className="relative inline-block mb-3">
                        <img
                            src={driveImage(student.coverImg || student.avatar) || '/assets/default-avatar.png'}
                            alt={student.name}
                            className="w-36 h-36 object-cover rounded-2xl border-4 border-white shadow-md mx-auto"
                            onError={(e) => {
                                e.target.src = '/assets/default-avatar.png';
                            }}
                        />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-0.5">{student.name}</h2>
                    <p className="text-xs font-medium text-slate-500">Mã học viên: {student.ID}</p>
                </div>

                {/* Nhận Xét Giáo Viên */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-2">
                        Nhận xét từ giáo viên
                    </h3>
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 text-sm leading-relaxed text-slate-700 italic">
                        "{student.comment}"
                    </div>
                </div>

                {/* Biểu Đồ Kỹ Năng 5 Trục */}
                <div className="p-6 border-b border-slate-100">
                    <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4 text-center">
                        Đánh giá năng lực & Kỹ năng
                    </h3>
                    <SvgRadarChart skills={student.skills} />
                </div>

                {/* Khoảnh Khắc Học Tập & Sản Phẩm */}
                <div className="p-6">
                    <h3 className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-4">
                        Hình ảnh hoạt động & Dự án
                    </h3>

                    <div className="flex flex-col gap-5">
                        {student.projectImg1 && (
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                                <p className="text-xs font-semibold text-slate-700 mb-2">1. Quá trình thao tác kỹ thuật</p>
                                <img
                                    src={driveImage(student.projectImg1)}
                                    alt="Quá trình thao tác"
                                    className="w-full h-56 object-cover rounded-lg mb-2"
                                />
                                <button
                                    onClick={() => handleDownloadImage(student.projectImg1, `${student.ID}_thao_tac`)}
                                    className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer"
                                >
                                    Tải ảnh
                                </button>
                            </div>
                        )}

                        {student.projectImg2 && (
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                                <p className="text-xs font-semibold text-slate-700 mb-2">2. Thành phẩm & Báo cáo đồ án</p>
                                <img
                                    src={driveImage(student.projectImg2)}
                                    alt="Thành phẩm đồ án"
                                    className="w-full h-56 object-cover rounded-lg mb-2"
                                />
                                <button
                                    onClick={() => handleDownloadImage(student.projectImg2, `${student.ID}_thanh_pham`)}
                                    className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer"
                                >
                                    Tải ảnh
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 text-center text-xs text-slate-400">
                    Hệ thống Quản lý ePortfolio • SysAir Education
                </div>
            </div>
        </div>
    );
}
