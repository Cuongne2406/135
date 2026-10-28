'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
    ArrowLeft, 
    Calendar, 
    Clock, 
    MapPin, 
    User, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    MessageSquare, 
    Download, 
    X, 
    ZoomIn,
    Sparkles,
    Check
} from 'lucide-react';
import LeaveRequestModal from '../../ui/LeaveRequestModal';

export default function ParentSessionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const lessonId = params?.id;

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState('');
    const [lightboxImage, setLightboxImage] = useState(null);
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    const fetchSession = React.useCallback(async () => {
        if (!lessonId) return;
        try {
            const res = await fetch(`/api/parent/session/${lessonId}`);
            if (res.status === 401) {
                router.push('/parent/login');
                return;
            }
            const json = await res.json();
            if (json.success) {
                setData(json);
            } else {
                setErrorMsg(json.mes || 'Không tìm thấy thông tin buổi học.');
            }
        } catch (err) {
            setErrorMsg('Lỗi tải dữ liệu buổi học.');
        } finally {
            setLoading(false);
        }
    }, [lessonId, router]);

    useEffect(() => {
        fetchSession();
    }, [fetchSession]);

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-8 w-32 bg-slate-200/70 rounded-lg" />
                <div className="h-40 bg-slate-200/70 rounded-2xl" />
                <div className="h-44 bg-slate-200/70 rounded-2xl" />
                <div className="h-60 bg-slate-200/70 rounded-2xl" />
            </div>
        );
    }

    if (errorMsg || !data) {
        return (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3">
                <p className="text-xs text-rose-600">{errorMsg || 'Không thể tải buổi học.'}</p>
                <Link
                    href="/parent"
                    className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-semibold hover:underline"
                >
                    <ArrowLeft className="w-3.5 h-3.5" /> Trở về Sổ liên lạc
                </Link>
            </div>
        );
    }

    const { lesson, student, course } = data;

    const getStatusBadge = (checkin) => {
        switch (checkin) {
            case 1:
                return { label: 'Có mặt tại lớp', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
            case 3:
                return { label: 'Vắng có phép', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle };
            case 2:
                return { label: 'Vắng không phép', color: 'bg-rose-50 text-rose-700 border-rose-200', icon: XCircle };
            default:
                return { label: 'Sắp diễn ra', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock };
        }
    };

    const statusBadge = getStatusBadge(lesson.Checkin);
    const StatusIcon = statusBadge.icon;

    return (
        <div className="space-y-4">
            {/* Thanh quay lại */}
            <div className="flex items-center justify-between">
                <Link
                    href="/parent"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors py-1"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại Trang chủ</span>
                </Link>
                <span className="text-[11px] font-mono text-slate-400">
                    Lớp: {course.ID}
                </span>
            </div>

            {/* THẺ 1: THÔNG TIN TỔNG QUAN BUỔI HỌC */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                        Buổi {lesson.index} / {lesson.totalLessons}
                    </span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${statusBadge.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {statusBadge.label}
                    </span>
                </div>

                <div>
                    <h2 className="text-base font-bold text-slate-900 leading-snug">
                        {lesson.TopicName}
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">{course.BookName}</p>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{new Date(lesson.Day).toLocaleDateString('vi-VN')}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{lesson.Time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">GV: <strong>{lesson.Teacher}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{lesson.Room}</span>
                    </div>
                </div>

                {/* Phần Báo Nghỉ Phép dành cho phụ huynh nếu buổi học chưa diễn ra */}
                {lesson.Checkin === 3 ? (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                            <span className="font-bold text-amber-800 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Trạng thái: Vắng có phép
                            </span>
                            <span className="text-amber-900 truncate block mt-0.5">
                                <b>Lý do:</b> {lesson.absenceReason || 'Phụ huynh xin nghỉ phép'}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => setShowLeaveModal(true)}
                            className="px-3 py-1.5 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-800 text-xs font-semibold rounded-lg transition-colors shrink-0 shadow-2xs cursor-pointer"
                        >
                            Xem / Hủy
                        </button>
                    </div>
                ) : lesson.Checkin === 0 && (
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                            Bận việc gia đình hoặc bé bị ốm?
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowLeaveModal(true)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                        >
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            <span>Báo nghỉ buổi này</span>
                        </button>
                    </div>
                )}
            </div>

            {/* THẺ 2: NHẬN XÉT CỦA GIÁO VIÊN */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                    <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                        <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                    <span>Lời Nhận Xét Từ Thầy/Cô Hướng Dẫn</span>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed space-y-2.5">
                    <p className="italic text-slate-700 font-medium">
                        "{lesson.CmtFn || 'Bé tham gia lớp học rất hăng hái, chủ động phối hợp thực hành cùng các bạn và hoàn thành sản phẩm đúng giờ.'}"
                    </p>

                    {lesson.Cmt && lesson.Cmt.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60 space-y-1.5">
                            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                                Tiêu chí đánh giá buổi học:
                            </span>
                            {lesson.Cmt.map((cmtItem, idx) => (
                                <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-600">
                                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                                    <span>{cmtItem}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* THẺ 3: ALBUM ẢNH & VIDEO THỰC HÀNH */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                        <div className="w-6 h-6 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                            <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <span>Hình Ảnh Thực Hành Tại Lớp ({lesson.photos?.length || 0})</span>
                    </div>
                    <span className="text-[11px] text-slate-400">Chạm để phóng to</span>
                </div>

                {lesson.photos && lesson.photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-2.5">
                        {lesson.photos.map((photo, i) => (
                            <div
                                key={photo.id || i}
                                onClick={() => setLightboxImage(photo.url)}
                                className="relative aspect-4/3 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/80 cursor-pointer group shadow-2xs hover:border-blue-400 transition-all"
                            >
                                <Image
                                    src={photo.url}
                                    alt={`Ảnh thực hành ${i + 1}`}
                                    fill
                                    sizes="(max-width: 768px) 50vw, 200px"
                                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    unoptimized
                                />
                                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                                    <div className="w-8 h-8 rounded-full bg-white/90 text-slate-800 flex items-center justify-center shadow-sm">
                                        <ZoomIn className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        Chưa có ảnh nào được tải lên cho buổi học này.
                    </div>
                )}
            </div>

            {/* LIGHTBOX PHÓNG TO ẢNH */}
            {lightboxImage && (
                <div 
                    className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
                    onClick={() => setLightboxImage(null)}
                >
                    <div className="relative max-w-lg w-full max-h-[85vh] flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setLightboxImage(null)}
                            className="absolute -top-10 right-0 p-2 text-white hover:text-slate-300 transition-colors cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="relative w-full aspect-4/3 rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
                            <Image
                                src={lightboxImage}
                                alt="Ảnh phóng to"
                                fill
                                sizes="(max-width: 768px) 100vw, 600px"
                                className="object-contain"
                                unoptimized
                            />
                        </div>

                        <div className="mt-3 flex gap-2">
                            <a
                                href={lightboxImage}
                                download={`AIR_Robotic_${student.Name}.jpg`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-4 py-2 bg-white/90 hover:bg-white text-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
                            >
                                <Download className="w-4 h-4" /> Tải ảnh gốc về máy
                            </a>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Báo Nghỉ Phép */}
            <LeaveRequestModal
                isOpen={showLeaveModal}
                onClose={() => setShowLeaveModal(false)}
                lesson={lesson}
                student={student}
                onSuccess={() => fetchSession()}
            />
        </div>
    );
}
