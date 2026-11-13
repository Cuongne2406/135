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
    Camera,
    Check,
    Video,
    Play,
    ChevronLeft,
    ChevronRight
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
    const [activeVideo, setActiveVideo] = useState(null);
    const [showLeaveModal, setShowLeaveModal] = useState(false);

    const fetchSession = React.useCallback(async () => {
        if (!lessonId) return;
        try {
            const res = await fetch(`/api/parent/session/${lessonId}`, { cache: 'no-store' });
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
    const allLessons = data.allLessons || [];
    const { prevLessonId, nextLessonId } = data.navigation || {};

    const handleBack = () => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
        } else {
            router.push('/parent');
        }
    };

    const getStatusBadge = (checkin, isPast, canLeaveRequest) => {
        switch (checkin) {
            case 1:
                return { label: 'Có mặt tại lớp', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 };
            case 3:
                return { label: 'Vắng có phép', color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertCircle };
            case 2:
                return { label: 'Vắng', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: XCircle };
            default:
                if (isPast || canLeaveRequest === false) {
                    return { label: 'Vắng', color: 'bg-rose-50 text-rose-600 border-rose-200', icon: XCircle };
                }
                return { label: 'Sắp diễn ra', color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Clock };
        }
    };

    const statusBadge = getStatusBadge(lesson.Checkin, lesson.isPast, lesson.canLeaveRequest);
    const StatusIcon = statusBadge.icon;

    return (
        <div className="space-y-4">
            {/* Thanh quay lại & Điều hướng */}
            <div className="flex items-center justify-between">
                <button
                    type="button"
                    onClick={handleBack}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 transition-colors py-1 cursor-pointer bg-transparent border-none p-0"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Quay lại</span>
                </button>
                <span className="text-[11px] font-mono text-slate-400">
                    Lớp: {course.ID}
                </span>
            </div>

            {/* BỘ CHUYỂN NHANH BUỔI HỌC (Horizontal Session Strip & Prev/Next) */}
            {allLessons.length > 1 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Chuyển nhanh buổi học:
                        </span>
                        <div className="flex items-center gap-1">
                            {prevLessonId ? (
                                <Link
                                    href={`/parent/session/${prevLessonId}`}
                                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold transition-colors"
                                    title="Buổi trước"
                                >
                                    <ChevronLeft className="w-3.5 h-3.5" />
                                    <span>B{lesson.index - 1}</span>
                                </Link>
                            ) : null}
                            <span className="text-[11px] font-bold text-blue-600 px-1">
                                Buổi {lesson.index}/{lesson.totalLessons}
                            </span>
                            {nextLessonId ? (
                                <Link
                                    href={`/parent/session/${nextLessonId}`}
                                    className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-semibold transition-colors"
                                    title="Buổi kế tiếp"
                                >
                                    <span>B{lesson.index + 1}</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                </Link>
                            ) : null}
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
                        {allLessons.map((item) => {
                            const isCurrent = item._id === lesson._id;
                            const isAttended = item.Checkin === 1;
                            const isExcused = item.Checkin === 3 || Boolean(item.absenceReason);
                            const isAbsent = item.Checkin === 2 || (item.isPast && item.Checkin === 0);

                            let badgeCls = "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100";
                            if (isCurrent) {
                                badgeCls = "bg-blue-600 text-white border-blue-600 shadow-xs";
                            } else if (isAttended) {
                                badgeCls = "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70";
                            } else if (isExcused) {
                                badgeCls = "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70";
                            } else if (isAbsent) {
                                badgeCls = "bg-rose-50 text-rose-600 border-rose-200 hover:bg-rose-100/70";
                            }

                            return (
                                <Link
                                    key={item._id}
                                    href={`/parent/session/${item._id}`}
                                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border shrink-0 ${badgeCls}`}
                                >
                                    <span>B{item.index}</span>
                                    {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />}
                                    {!isCurrent && isAttended && <span className="text-[10px]">✓</span>}
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}

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
                {lesson.Checkin === 3 || Boolean(lesson.absenceReason) ? (
                    <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                            <span className="font-bold text-amber-800 flex items-center gap-1">
                                <AlertCircle className="w-3.5 h-3.5" /> Trạng thái: Đã xin nghỉ phép
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
                            {lesson.canLeaveRequest === false ? 'Xem lý do' : 'Xem / Hủy'}
                        </button>
                    </div>
                ) : lesson.Checkin === 0 && (
                    <div className="pt-2.5 border-t border-slate-100">
                        {lesson.canLeaveRequest !== false ? (
                            <div className="flex items-center justify-between">
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
                        ) : (
                            <p className="text-[11px] text-slate-400 italic m-0">
                                Đã quá thời hạn báo nghỉ online (sau 1 tiếng giờ học). Quý phụ huynh vui lòng liên hệ phòng Học vụ nếu cần hỗ trợ.
                            </p>
                        )}
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
                        <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                            <Camera className="w-3.5 h-3.5" />
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

            {/* THẺ 4: VIDEO THỰC HÀNH & THUYẾT TRÌNH */}
            {lesson.videos && lesson.videos.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-900 font-bold text-xs">
                            <div className="w-6 h-6 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                                <Video className="w-3.5 h-3.5" />
                            </div>
                            <span>Video Thực Hành & Thuyết Trình ({lesson.videos.length})</span>
                        </div>
                        <span className="text-[11px] text-slate-400">Bấm để phát video</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {lesson.videos.map((vid, idx) => (
                            <div
                                key={vid.id || idx}
                                onClick={() => setActiveVideo(vid)}
                                className="relative aspect-video rounded-xl overflow-hidden bg-slate-900 border border-slate-200 cursor-pointer group shadow-2xs hover:border-rose-400 transition-all flex items-center justify-center"
                            >
                                {vid.thumbnailUrl && (
                                    <Image
                                        src={vid.thumbnailUrl}
                                        alt={vid.name || `Video ${idx + 1}`}
                                        fill
                                        className="object-cover opacity-80 group-hover:opacity-95 transition-opacity"
                                        unoptimized
                                    />
                                )}
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                    <div className="w-11 h-11 rounded-full bg-rose-600/90 text-white flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                        <Play className="w-5 h-5 ml-0.5 fill-white" />
                                    </div>
                                </div>
                                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5">
                                    <p className="text-white text-xs font-semibold truncate">{vid.name || `Video buổi học ${idx + 1}`}</p>
                                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                        {vid.isPersonal && (
                                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/90 text-white shadow-xs">Video của con</span>
                                        )}
                                        {vid.isGroup && (
                                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/90 text-white shadow-xs">Video hoạt động nhóm</span>
                                        )}
                                        {vid.isGeneral && (
                                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-500/90 text-white shadow-xs">Toàn cảnh lớp học</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

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

            {/* MODAL PHÁT VIDEO THỰC HÀNH */}
            {activeVideo && (
                <div
                    className="fixed inset-0 bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150"
                    onClick={() => setActiveVideo(null)}
                >
                    <div className="relative max-w-2xl w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setActiveVideo(null)}
                            className="absolute -top-10 right-0 p-2 text-white hover:text-slate-300 transition-colors cursor-pointer"
                        >
                            <X className="w-6 h-6" />
                        </button>
                        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black shadow-2xl border border-white/10">
                            <iframe
                                src={activeVideo.embedUrl}
                                title={activeVideo.name}
                                className="w-full h-full border-0"
                                allow="autoplay; encrypted-media; fullscreen"
                                allowFullScreen
                            />
                        </div>
                        <div className="mt-3 flex items-center justify-between w-full text-white px-2">
                            <p className="text-xs font-medium truncate max-w-md">{activeVideo.name}</p>
                            <a
                                href={`https://drive.google.com/uc?id=${activeVideo.id}&export=download`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-1.5 bg-white/90 hover:bg-white text-slate-900 rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow-md transition-colors"
                            >
                                <Download className="w-3.5 h-3.5" /> Tải video
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
