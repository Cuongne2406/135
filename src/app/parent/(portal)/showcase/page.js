'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
    Award,
    BookOpen,
    ExternalLink,
    Printer,
    Share2,
    Sparkles,
    GraduationCap,
    FileText,
    CheckCircle2
} from 'lucide-react';

import { useParent } from '../context';

export default function ParentShowcasePage() {
    const { overviewData, loading } = useParent();

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-28 bg-slate-200/70 rounded-2xl" />
                <div className="h-48 bg-slate-200/70 rounded-2xl" />
                <div className="h-48 bg-slate-200/70 rounded-2xl" />
            </div>
        );
    }

    const student = overviewData?.student;
    const course = overviewData?.course;

    return (
        <div className="space-y-4">
            {/* Header Kỷ yếu */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto mb-2 shadow-xs">
                    <Award className="w-6 h-6" />
                </div>
                <h2 className="text-base font-bold text-slate-900">Góc Sáng Tạo & Kỷ Yếu</h2>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                    Nơi lưu giữ toàn bộ sản phẩm thực hành, video thuyết trình và kỷ yếu tốt nghiệp của bé <strong>{student?.Name}</strong>.
                </p>
            </div>

            {/* CARD 1: KỶ YẾU LOOKBOOK TỐT NGHIỆP A4 */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                            A4
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">Kỷ Yếu Lookbook Tốt Nghiệp</h3>
                            <p className="text-[11px] text-slate-500">Thiết kế tiêu chuẩn in ấn A4 sắc nét</p>
                        </div>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Chính thức
                    </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    Kỷ yếu tổng hợp hình ảnh các dự án xe robot, cánh tay robot và mô hình sáng tạo của cả lớp. Ba mẹ có thể mở xem trực tuyến hoặc tải về in làm kỷ niệm cho con.
                </p>

                <div className="pt-1 flex gap-2">
                    <Link
                        href="/portfolio-lookbook"
                        target="_blank"
                        className="flex-1 py-2.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Mở Xem Kỷ Yếu A4</span>
                    </Link>
                </div>
            </div>

            {/* CARD 2: HỒ SƠ NĂNG LỰC ĐIỆN TỬ (ePORTFOLIO) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs">
                            <BookOpen className="w-4 h-4" />
                        </div>
                        <div>
                            <h3 className="text-sm font-bold text-slate-900">ePortfolio Cá Nhân Của Bé</h3>
                            <p className="text-[11px] text-slate-500">Biểu đồ 5 kỹ năng STEM & Video</p>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                    Trang hồ sơ số cá nhân ghi nhận hành trình tiến bộ của con qua từng cấp độ học, tích hợp biểu đồ mạng nhện năng lực tư duy thuật toán và kỹ năng thế kỷ 21.
                </p>

                <div className="pt-1 flex gap-2">
                    <Link
                        href={`/share/student/${student?.ID}`}
                        target="_blank"
                        className="flex-1 py-2.5 px-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Xem ePortfolio Của Con</span>
                    </Link>
                </div>
            </div>

            {/* Thông điệp từ trung tâm */}
            <div className="p-3.5 rounded-2xl bg-slate-100/70 border border-slate-200/80 text-center text-xs text-slate-500 space-y-1">
                <p className="font-semibold text-slate-700">Tự hào cùng sự trưởng thành của con</p>
                <p className="text-[11px]">Ba mẹ có thể chia sẻ các đường dẫn trên cho người thân cùng theo dõi.</p>
            </div>
        </div>
    );
}
