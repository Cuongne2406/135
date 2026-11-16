'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import * as XLSX from 'xlsx';
import {
    Award,
    FileSpreadsheet,
    Search,
    Filter,
    RefreshCw,
    TrendingUp,
    CheckCircle2,
    AlertTriangle,
    BarChart3,
    GraduationCap,
    Calendar,
    ChevronDown
} from 'lucide-react';
import SkeletonTable from '@/components/ui/SkeletonTable';
import EmptyState from '@/components/ui/EmptyState';

export default function TestTab() {
    const [loading, setLoading] = useState(true);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [summary, setSummary] = useState(null);
    const [scores, setScores] = useState([]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (selectedCourse) params.append('courseId', selectedCourse);
            if (searchTerm) params.append('search', searchTerm);

            const res = await fetch(`/api/academic/test-reports?${params.toString()}`);
            const data = await res.json();

            if (data.success) {
                setSummary(data.summary);
                setCourses(data.courses || []);
                setScores(data.scores || []);
            }
        } catch (err) {
            console.error('Lỗi khi tải báo cáo điểm:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedCourse, searchTerm]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Xuất file Excel (.xlsx)
    const exportToExcel = () => {
        if (!scores || scores.length === 0) {
            alert('Không có dữ liệu bài test để xuất file Excel!');
            return;
        }

        const excelRows = scores.map((item, index) => ({
            'STT': index + 1,
            'Mã học viên': item.studentCode,
            'Họ và tên': item.studentName,
            'Số điện thoại': item.phone || '',
            'Khóa học / Lớp': item.courseName,
            'Tên bài kiểm tra': item.testName,
            'Điểm số': item.score,
            'Thang điểm': item.maxScore,
            'Tỷ lệ (%)': `${item.percentage}%`,
            'Xếp loại': item.rank,
            'Ngày kiểm tra': item.date ? new Date(item.date).toLocaleDateString('vi-VN') : '',
            'Ghi chú': item.note || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(excelRows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Bảng Điểm');

        // Định dạng độ rộng cột
        worksheet['!cols'] = [
            { wch: 6 },  // STT
            { wch: 14 }, // Mã học viên
            { wch: 22 }, // Họ và tên
            { wch: 14 }, // Số điện thoại
            { wch: 20 }, // Khóa học
            { wch: 25 }, // Tên bài kiểm tra
            { wch: 10 }, // Điểm số
            { wch: 12 }, // Thang điểm
            { wch: 12 }, // Tỷ lệ
            { wch: 14 }, // Xếp loại
            { wch: 14 }, // Ngày kiểm tra
            { wch: 25 }  // Ghi chú
        ];

        const dateStr = new Date().toISOString().slice(0, 10);
        XLSX.writeFile(workbook, `Bao_Cao_Diem_Thi_${dateStr}.xlsx`);
    };

    return (
        <div className="flex flex-col gap-6 w-full">
            {/* Header & Filter Controls */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900 m-0">Báo cáo Kết quả Kiểm tra & Đánh giá</h2>
                        <p className="text-xs text-slate-500 m-0">Theo dõi năng lực học tập, điểm thi định kỳ và xếp loại học viên</p>
                    </div>
                </div>

                <div className="flex items-center flex-wrap gap-2.5">
                    {/* Bộ lọc Khóa học */}
                    <div className="relative">
                        <select
                            value={selectedCourse}
                            onChange={(e) => setSelectedCourse(e.target.value)}
                            className="appearance-none pl-8 pr-8 h-9 bg-white border border-slate-300 rounded-md text-xs font-medium text-slate-800 outline-none hover:bg-slate-50 focus:ring-2 focus:ring-[var(--main_d)]/15 focus:border-[var(--main_d)] cursor-pointer transition-colors"
                        >
                            <option value="">Tất cả khóa học</option>
                            {courses.map(c => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                            ))}
                        </select>
                        <Filter className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    </div>

                    {/* Ô tìm kiếm */}
                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Tìm học viên, bài test..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 pr-3 h-9 bg-white border border-slate-300 rounded-md text-xs text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-[var(--main_d)]/15 focus:border-[var(--main_d)] w-48 sm:w-60 transition-all"
                        />
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    </div>

                    {/* Nút Làm mới */}
                    <button
                        onClick={fetchData}
                        title="Tải lại dữ liệu"
                        className="h-9 px-2.5 rounded-md border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors cursor-pointer shadow-xs"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    </button>

                    {/* Nút Xuất Excel */}
                    <button
                        onClick={exportToExcel}
                        className="flex items-center gap-2 h-9 px-3.5 bg-[var(--main_d)] hover:bg-[var(--main_b)] text-white rounded-md text-xs font-medium shadow-xs transition-colors cursor-pointer"
                    >
                        <FileSpreadsheet className="w-4 h-4" />
                        <span>Xuất Excel (.xlsx)</span>
                    </button>
                </div>
            </div>

            {/* KPI Summary Cards */}
            {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                            <BarChart3 className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-medium">Tổng bài kiểm tra</span>
                            <div className="text-2xl font-bold text-slate-900 mt-0.5">{summary.totalTests}</div>
                        </div>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
                            <TrendingUp className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-medium">Điểm trung bình</span>
                            <div className="text-2xl font-bold text-indigo-600 mt-0.5">{summary.averageScore} <span className="text-xs font-normal text-slate-400">/ 10</span></div>
                        </div>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-medium">Tỷ lệ Đạt (≥ 5.0)</span>
                            <div className="text-2xl font-bold text-emerald-600 mt-0.5">{summary.passRate}% <span className="text-xs font-normal text-slate-400">({summary.passCount}/{summary.totalTests})</span></div>
                        </div>
                    </div>

                    <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3.5">
                        <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
                            <Award className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 font-medium">Xuất sắc & Giỏi</span>
                            <div className="text-2xl font-bold text-amber-600 mt-0.5">{summary.distribution.excellent + summary.distribution.good} <span className="text-xs font-normal text-slate-400">học viên</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Phân bố xếp loại học lực */}
            {summary && summary.totalTests > 0 && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Phân loại học lực</h3>
                    <div className="grid grid-cols-5 gap-2 text-center text-xs">
                        <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-lg border border-emerald-200">
                            <div className="font-bold text-base text-emerald-700">{summary.distribution.excellent}</div>
                            <div className="text-[11px] font-medium mt-0.5">Xuất sắc (≥ 9.0)</div>
                        </div>
                        <div className="p-2.5 bg-blue-50 text-blue-800 rounded-lg border border-blue-200">
                            <div className="font-bold text-base text-blue-700">{summary.distribution.good}</div>
                            <div className="text-[11px] font-medium mt-0.5">Giỏi (8.0 - 8.9)</div>
                        </div>
                        <div className="p-2.5 bg-amber-50 text-amber-800 rounded-lg border border-amber-200">
                            <div className="font-bold text-base text-amber-700">{summary.distribution.fair}</div>
                            <div className="text-[11px] font-medium mt-0.5">Khá (6.5 - 7.9)</div>
                        </div>
                        <div className="p-2.5 bg-orange-50 text-orange-800 rounded-lg border border-orange-200">
                            <div className="font-bold text-base text-orange-700">{summary.distribution.average}</div>
                            <div className="text-[11px] font-medium mt-0.5">Trung bình (5.0 - 6.4)</div>
                        </div>
                        <div className="p-2.5 bg-rose-50 text-rose-800 rounded-lg border border-rose-200">
                            <div className="font-bold text-base text-rose-700">{summary.distribution.poor}</div>
                            <div className="text-[11px] font-medium mt-0.5">Chưa đạt (&lt; 5.0)</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Bảng chi tiết điểm số */}
            <div className="bg-white rounded-lg border border-slate-200 shadow-xs overflow-hidden">
                {loading ? (
                    <SkeletonTable rows={6} columns={8} headers={['STT', 'Học viên', 'Khóa học', 'Bài kiểm tra', 'Điểm số', 'Xếp loại', 'Ngày kiểm tra', 'Ghi chú']} />
                ) : scores.length === 0 ? (
                    <EmptyState
                        title="Chưa có bài kiểm tra nào được ghi nhận"
                        description="Vui lòng chọn lớp học hoặc thêm điểm kiểm tra thực tế cho học viên trong hệ thống."
                        actionText={selectedCourse || searchTerm ? "Xóa bộ lọc" : undefined}
                        onAction={selectedCourse || searchTerm ? () => { setSelectedCourse(''); setSearchTerm(''); } : undefined}
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                                    <th className="p-3 text-center w-12">STT</th>
                                    <th className="p-3">Học viên</th>
                                    <th className="p-3">Khóa học / Lớp</th>
                                    <th className="p-3">Bài kiểm tra</th>
                                    <th className="p-3 text-center">Điểm số</th>
                                    <th className="p-3 text-center">Xếp loại</th>
                                    <th className="p-3 text-center">Ngày kiểm tra</th>
                                    <th className="p-3">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {scores.map((item, idx) => (
                                    <tr key={item._id || idx} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                                        <td className="p-3 font-medium text-slate-900">
                                            <div>{item.studentName}</div>
                                            <div className="text-[11px] text-slate-400 font-mono mt-0.5">{item.studentCode}</div>
                                        </td>
                                        <td className="p-3 text-slate-700 font-medium">{item.courseName}</td>
                                        <td className="p-3 text-slate-800 font-medium">{item.testName}</td>
                                        <td className="p-3 text-center">
                                            <span className="font-bold text-sm text-slate-900">{item.score}</span>
                                            <span className="text-[11px] text-slate-400"> / {item.maxScore}</span>
                                        </td>
                                        <td className="p-3 text-center">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${
                                                item.rankKey === 'excellent' ? 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]' :
                                                item.rankKey === 'good' ? 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]' :
                                                item.rankKey === 'fair' ? 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]' :
                                                item.rankKey === 'average' ? 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]' :
                                                'bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]'
                                            }`}>
                                                {item.rank}
                                            </span>
                                        </td>
                                        <td className="p-3 text-center text-slate-600 font-mono text-[11px] whitespace-nowrap">
                                            {item.date ? new Date(item.date).toLocaleDateString('vi-VN') : '—'}
                                        </td>
                                        <td className="p-3 text-slate-500 max-w-xs truncate" title={item.note}>
                                            {item.note || '—'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
