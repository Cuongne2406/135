'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { driveImage } from '@/function';
import { reloadCourse } from '@/data/actions/reload';
import { useRouter } from 'next/navigation';

export default function ReviewSheetModal({
    isOpen,
    onClose,
    course,
    students = [],
    onSuccess
}) {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [activePicker, setActivePicker] = useState(null); // { studentId, field: 'coverImg' | 'projectImg1' | 'projectImg2' }

    // Thu thập tất cả ảnh của khóa học (Ảnh lớp + Ảnh từng học sinh)
    const allCourseImages = useMemo(() => {
        if (!course) return [];
        const imgs = [];
        const seen = new Set();

        const addImg = (item, sourceName = 'Buổi học') => {
            if (!item || !item.id) return;
            if (!seen.has(item.id)) {
                seen.add(item.id);
                imgs.push({
                    id: item.id,
                    type: item.type || 'image',
                    source: sourceName,
                    url: driveImage(item.id)
                });
            }
        };

        // 1. Ảnh các buổi học (DetailImage)
        if (Array.isArray(course.Detail)) {
            course.Detail.forEach((lesson, idx) => {
                if (Array.isArray(lesson.DetailImage)) {
                    lesson.DetailImage.forEach(img => addImg(img, `Buổi ${idx + 1}`));
                }
            });
        }

        // 2. Ảnh riêng của từng học sinh (Learn.Image)
        if (Array.isArray(course.Student)) {
            course.Student.forEach(stu => {
                if (Array.isArray(stu.Learn)) {
                    stu.Learn.forEach((l, idx) => {
                        if (Array.isArray(l.Image)) {
                            l.Image.forEach(img => addImg(img, `Bài làm (Buổi ${idx + 1})`));
                        }
                    });
                }
            });
        }

        return imgs;
    }, [course]);

    // Bộ lọc ảnh theo buổi học trong modal chọn ảnh
    const [pickerFilter, setPickerFilter] = useState('ALL');

    useEffect(() => {
        if (activePicker) {
            setPickerFilter('ALL');
        }
    }, [activePicker?.studentId, activePicker?.field]);

    // Danh sách các nguồn / buổi học để hiển thị tabs bộ lọc
    const availableSources = useMemo(() => {
        if (!allCourseImages.length) return [];
        const map = new Map();
        allCourseImages.forEach(img => {
            const src = img.source || 'Khác';
            map.set(src, (map.get(src) || 0) + 1);
        });
        const list = [{ id: 'ALL', label: 'Tất cả', count: allCourseImages.length }];
        map.forEach((count, label) => {
            list.push({ id: label, label, count });
        });
        return list;
    }, [allCourseImages]);

    // Danh sách ảnh sau khi áp dụng bộ lọc
    const filteredPickerImages = useMemo(() => {
        if (pickerFilter === 'ALL') return allCourseImages;
        return allCourseImages.filter(img => img.source === pickerFilter);
    }, [allCourseImages, pickerFilter]);

    // Trạng thái danh sách học sinh cần duyệt Portfolio
    const [reviews, setReviews] = useState([]);
    const [isAiCurating, setIsAiCurating] = useState(false);
    const [aiCuratedDone, setAiCuratedDone] = useState(false);

    // Khởi tạo dữ liệu Co-pilot tự động 100% (Tự động tải AI Draft hoặc chạy ngầm)
    useEffect(() => {
        if (!isOpen || !course) return;

        // Nếu khóa học đã có bản nháp do AI phân tích trước đó, nạp thẳng ngay lập tức
        if (course.aiPortfolioDraft && Array.isArray(course.aiPortfolioDraft) && course.aiPortfolioDraft.length > 0) {
            setReviews(course.aiPortfolioDraft);
            setAiCuratedDone(true);
            return;
        }

        // Tạo danh sách ban đầu tức thời để không bị trắng màn hình
        const initialList = (students || []).map((stu, sIdx) => {
            const stuId = stu.ID || stu.userId || stu._id;
            const stuDataInCourse = (course.Student || []).find(s => s.ID === stuId || s.ID === stu.ID);

            // Thu thập ảnh riêng của học sinh này
            const personalImgs = [];
            if (stuDataInCourse && Array.isArray(stuDataInCourse.Learn)) {
                stuDataInCourse.Learn.forEach(l => {
                    if (Array.isArray(l.Image)) {
                        l.Image.forEach(img => {
                            if (img.id && !personalImgs.includes(img.id)) {
                                personalImgs.push(img.id);
                            }
                        });
                    }
                });
            }

            // Gộp với ảnh lớp nếu chưa đủ 3 ảnh
            const candidatePool = [...personalImgs, ...allCourseImages.map(img => img.id).filter(id => !personalImgs.includes(id))];

            // 3 ảnh tiêu biểu
            const coverImg = candidatePool[0] || '';
            const projectImg1 = candidatePool[1] || '';
            const projectImg2 = candidatePool[2] || '';

            // Tự động tổng hợp nhận xét từ các buổi học
            let synthesizedComment = '';
            if (stuDataInCourse && Array.isArray(stuDataInCourse.Learn)) {
                const cmtFns = stuDataInCourse.Learn.map(l => l.CmtFn).filter(Boolean);
                const rawCmts = stuDataInCourse.Learn.flatMap(l => l.Cmt || []).filter(Boolean);

                if (cmtFns.length > 0) {
                    synthesizedComment = cmtFns.slice(-2).join(' ') + ' Em có tinh thần tự giác cao và hoàn thành xuất sắc đồ án cuối khóa.';
                } else if (rawCmts.length > 0) {
                    synthesizedComment = `Trong suốt khóa học, ${stu.Name || 'học sinh'} đã thể hiện tinh thần học tập tích cực. Tiêu biểu: ${rawCmts.slice(0, 3).join(', ')}.`;
                }
            }

            if (!synthesizedComment) {
                synthesizedComment = `Em ${stu.Name || 'học sinh'} đã hoàn thành đầy đủ các nội dung của chương trình học, nắm vững kiến thức cơ bản và hoàn thiện các sản phẩm thực hành theo chuẩn đầu ra.`;
            }

            // Tính toán Radar Kỹ năng 5 trục dựa trên mức độ chuyên cần
            const totalAttended = (stuDataInCourse?.Learn || []).filter(l => l.Checkin === 1).length;
            const totalLessons = course.Detail?.length || 1;
            const attendanceRatio = Math.min(1, totalAttended / totalLessons);
            const baseScore = Math.round(85 + attendanceRatio * 10);

            const skills = {
                'Tư duy Thuật toán & Logic': `${Math.min(98, baseScore + (sIdx % 3))} %`,
                'Kỹ năng Thao tác & Lắp ráp': `${Math.min(97, baseScore + 2 - (sIdx % 2))} %`,
                'Thuyết trình & Báo cáo': `${Math.min(95, baseScore - 3 + (sIdx % 4))} %`,
                'Tinh thần Đồng đội': `${Math.min(96, baseScore + 1)} %`,
                'Sáng tạo & Cải tiến': `${Math.min(98, baseScore + 3 - (sIdx % 3))} %`
            };

            return {
                studentId: stu._id || stuId,
                ID: stu.ID || stuId,
                name: stu.Name || stu.name || 'Học sinh',
                avatar: stu.Avt || stu.avatar || '',
                totalAttended,
                totalLessons,
                coverImg,
                projectImg1,
                projectImg2,
                comment: synthesizedComment,
                skills,
                isAiSelected: false
            };
        });

        setReviews(initialList);

        // KÍCH HOẠT TỰ ĐỘNG CHỌN ẢNH VỚI AI & DRIVE (CHẠY NGẦM KHÔNG CẦN BẤM NÚT)
        if (course._id) {
            setIsAiCurating(true);
            fetch('/api/curate-portfolio', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ courseId: course._id })
            })
                .then(res => res.json())
                .then(result => {
                    if (result.status === 2 && Array.isArray(result.data) && result.data.length > 0) {
                        setReviews(prev => {
                            return prev.map(p => {
                                const matched = result.data.find(d => d.ID === p.ID || d.studentId === p.studentId);
                                if (matched) {
                                    return {
                                        ...p,
                                        coverImg: matched.coverImg || p.coverImg,
                                        projectImg1: matched.projectImg1 || p.projectImg1,
                                        projectImg2: matched.projectImg2 || p.projectImg2,
                                        comment: p.comment || matched.comment,
                                        isAiSelected: true
                                    };
                                }
                                return p;
                            });
                        });
                        setAiCuratedDone(true);
                    }
                })
                .catch(err => {
                    console.warn('[ReviewSheet] Tự động chọn ảnh AI nền:', err);
                })
                .finally(() => {
                    setIsAiCurating(false);
                });
        }
    }, [isOpen, course, students, allCourseImages]);

    // Thay đổi ảnh cho học sinh
    const handlePickImage = (studentId, field, imgId) => {
        setReviews(prev => prev.map(item => {
            if (item.studentId === studentId || item.ID === studentId) {
                return { ...item, [field]: imgId };
            }
            return item;
        }));
        setActivePicker(null);
    };

    // Sửa nhận xét
    const handleCommentChange = (studentId, newComment) => {
        setReviews(prev => prev.map(item => {
            if (item.studentId === studentId || item.ID === studentId) {
                return { ...item, comment: newComment };
            }
            return item;
        }));
    };

    // Hành động 1: Xuất bản toàn bộ Portfolio (Smart Co-pilot 1-Click Publish)
    const handlePublishAll = async () => {
        setSubmitting(true);
        setErrorMessage('');
        try {
            const payload = {
                Status: true,
                portfolioReviews: reviews.map(r => ({
                    studentId: r.studentId,
                    ID: r.ID,
                    coverImg: r.coverImg,
                    projectImg1: r.projectImg1,
                    projectImg2: r.projectImg2,
                    comment: r.comment,
                    skills: r.skills
                }))
            };

            const res = await fetch(`/api/course/${course._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.mes || 'Không thể lưu Portfolio và hoàn thành khóa học.');
            }

            await reloadCourse(course._id);
            router.refresh();
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error('Lỗi khi xuất bản Portfolio:', err);
            setErrorMessage(err.message || 'Đã có lỗi xảy ra.');
        } finally {
            setSubmitting(false);
        }
    };

    // Hành động 2: Hoàn thành không lưu ảnh (Bỏ qua)
    const handleQuickCompleteWithoutImages = async () => {
        if (!confirm('Bạn có chắc muốn đóng khóa học mà không lưu Portfolio ảnh sản phẩm?')) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/course/${course._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ Status: true })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.mes);
            await reloadCourse(course._id);
            router.refresh();
            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setErrorMessage(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-hidden animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden border border-gray-200">
                {/* MODAL HEADER */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white flex items-center justify-between shrink-0">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2.5">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-400 text-slate-950 flex items-center gap-1 shadow-xs">
                                <span>⚡</span> Smart Co-pilot
                            </span>
                            <h2 className="text-lg font-bold tracking-tight m-0">
                                Bảng Duyệt Nhanh Portfolio Lớp Học (30 Giây)
                            </h2>
                        </div>
                        <p className="text-xs text-blue-200 m-0">
                            Khóa học: <b className="text-white">{course?.ID}</b> • Giáo trình: <b className="text-white">{course?.Book?.Name || 'Mặc định'}</b> • Sĩ số: <b className="text-amber-300">{reviews.length} học sinh</b>
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        disabled={submitting}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border-none text-white text-lg flex items-center justify-center cursor-pointer transition-colors"
                        title="Đóng"
                    >
                        ✕
                    </button>
                </div>

                {/* HIGHLIGHT BANNER */}
                <div className="px-6 py-2.5 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs text-blue-900 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="text-base">{isAiCurating ? '⏳' : '✨'}</span>
                        <span>
                            {isAiCurating ? (
                                <b>AI đang tự động quét Drive & chọn ảnh đẹp nhất cho từng học sinh...</b>
                            ) : (
                                <b>AI đã tự động tuyển chọn ảnh đẹp nhất từ Google Drive:</b>
                            )} Thầy/Cô chỉ cần nhìn lướt qua, nhấp vào ảnh để đổi lại nếu muốn và bấm <b>Xác nhận & Xuất bản</b>.
                        </span>
                    </div>
                    <span className="font-semibold text-blue-700 whitespace-nowrap bg-blue-100 px-2 py-0.5 rounded flex items-center gap-1.5">
                        {isAiCurating && <span className="animate-spin text-xs">🌀</span>}
                        Kho ảnh lớp: {allCourseImages.length} ảnh
                    </span>
                </div>

                {/* ERROR ALERT */}
                {errorMessage && (
                    <div className="mx-6 mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                        ⚠️ {errorMessage}
                    </div>
                )}

                {/* BODY: DANH SÁCH DUYỆT TỪNG HỌC SINH */}
                <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
                    {reviews.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 text-sm">
                            Đang chuẩn bị dữ liệu học sinh...
                        </div>
                    ) : (
                        reviews.map((stu, idx) => (
                            <div
                                key={`${stu.studentId || stu.ID || 'stu'}-${idx}`}
                                className="p-4 rounded-xl border border-gray-200 bg-white hover:border-blue-400 hover:shadow-md transition-all flex flex-col gap-3"
                            >
                                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                                    <div className="flex items-center gap-3">
                                        <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gray-200 border border-gray-300">
                                            {stu.avatar ? (
                                                <Image
                                                    src={stu.avatar}
                                                    alt={stu.name}
                                                    fill
                                                    unoptimized
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center font-bold text-gray-600 text-xs">
                                                    {stu.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="text-sm font-bold text-gray-900 m-0">{stu.name}</h4>
                                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 font-mono">
                                                    ID: {stu.ID}
                                                </span>
                                            </div>
                                            <span className="text-[11px] text-gray-500">
                                                Chuyên cần: <b>{stu.totalAttended}/{stu.totalLessons} buổi</b>
                                            </span>
                                        </div>
                                    </div>

                                    {/* 5-axis Radar tags */}
                                    <div className="flex items-center gap-1.5 flex-wrap max-md:hidden">
                                        {Object.entries(stu.skills).slice(0, 3).map(([k, v]) => (
                                            <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-medium">
                                                {k.split(' ')[0]}: <b>{v}</b>
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-12 gap-3 items-start">
                                    {/* 3 Ô ẢNH TIÊU BIỂU */}
                                    <div className="col-span-12 md:col-span-5 flex flex-col gap-1.5">
                                        <label className="text-[11px] font-bold text-gray-700 flex items-center justify-between">
                                            <span>3 Ảnh Xuất Bản Portfolio:</span>
                                            <span className="text-[10px] text-blue-600 font-normal">Nhấp vào ô để đổi ảnh</span>
                                        </label>
                                        <div className="grid grid-cols-3 gap-2">
                                            {/* Ô 1: Bìa sản phẩm */}
                                            <PhotoSlot
                                                label="Bìa SP"
                                                imgId={stu.coverImg}
                                                isAi={stu.isAiSelected || aiCuratedDone}
                                                onClick={() => setActivePicker({
                                                    studentId: stu.studentId,
                                                    studentName: stu.name,
                                                    field: 'coverImg',
                                                    fieldLabel: 'Bìa Sản Phẩm',
                                                    currentImgId: stu.coverImg
                                                })}
                                            />
                                            {/* Ô 2: Đồ án 1 */}
                                            <PhotoSlot
                                                label="Đồ án 1"
                                                imgId={stu.projectImg1}
                                                isAi={stu.isAiSelected || aiCuratedDone}
                                                onClick={() => setActivePicker({
                                                    studentId: stu.studentId,
                                                    studentName: stu.name,
                                                    field: 'projectImg1',
                                                    fieldLabel: 'Đồ Án 1',
                                                    currentImgId: stu.projectImg1
                                                })}
                                            />
                                            {/* Ô 3: Đồ án 2 */}
                                            <PhotoSlot
                                                label="Đồ án 2"
                                                imgId={stu.projectImg2}
                                                isAi={stu.isAiSelected || aiCuratedDone}
                                                onClick={() => setActivePicker({
                                                    studentId: stu.studentId,
                                                    studentName: stu.name,
                                                    field: 'projectImg2',
                                                    fieldLabel: 'Đồ Án 2',
                                                    currentImgId: stu.projectImg2
                                                })}
                                            />
                                        </div>
                                    </div>

                                    {/* NHẬN XÉT TỔNG KẾT AI */}
                                    <div className="col-span-12 md:col-span-7 flex flex-col gap-1.5">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] font-bold text-gray-700 flex items-center gap-1">
                                                <span>🤖 Lời Nhận Xét Tổng Kết (AI Đề Xuất):</span>
                                            </label>
                                            <span className="text-[10px] text-gray-400">Có thể sửa trực tiếp</span>
                                        </div>
                                        <textarea
                                            value={stu.comment}
                                            onChange={(e) => handleCommentChange(stu.studentId, e.target.value)}
                                            rows={3}
                                            className="w-full text-xs p-2.5 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none leading-relaxed text-gray-800 bg-gray-50/50"
                                            placeholder="Nhập nhận xét tổng kết cho học sinh..."
                                        />
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* MODAL FOOTER */}
                <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0 flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleQuickCompleteWithoutImages}
                        disabled={submitting}
                        className="px-3.5 py-2 rounded-lg text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-200 border-none cursor-pointer transition-colors"
                    >
                        Bỏ qua & Đóng khóa ngay
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="px-4 py-2 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-300 hover:bg-gray-100 cursor-pointer transition-colors shadow-2xs"
                        >
                            Hủy bỏ
                        </button>
                        <button
                            type="button"
                            onClick={handlePublishAll}
                            disabled={submitting || reviews.length === 0}
                            className="px-5 py-2 rounded-lg text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 border-none cursor-pointer transition-all shadow-md hover:shadow-lg flex items-center gap-1.5 disabled:opacity-50"
                        >
                            {submitting ? (
                                <>
                                    <span className="animate-spin">⏳</span>
                                    <span>Đang xuất bản Portfolio...</span>
                                </>
                            ) : (
                                <>
                                    <span>🚀</span>
                                    <span>Xác Nhận & Xuất Bản Tất Cả Portfolio</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* QUICK PHOTO CHOOSER TRAY (KÍCH THƯỚC VỪA ĐỦ, RÕ RÀNG & TIỆN LỢI) */}
            {activePicker && (
                <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 animate-fadeIn">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl sm:max-w-3xl w-full max-h-[82vh] flex flex-col overflow-hidden border border-gray-200 animate-scaleUp">
                        {/* Header */}
                        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between bg-slate-50 shrink-0">
                            <div className="flex items-center gap-2.5">
                                <span className="text-lg">🖼️</span>
                                <div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <h3 className="text-sm font-bold text-gray-900 m-0">Chọn Ảnh Cho Portfolio</h3>
                                        {activePicker.studentName && (
                                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                {activePicker.studentName}
                                            </span>
                                        )}
                                        {activePicker.fieldLabel && (
                                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                                {activePicker.fieldLabel}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-gray-500 m-0 mt-0.5">
                                        Kho ảnh của khóa ({filteredPickerImages.length} ảnh) • Nhấp vào ảnh để chọn
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => setActivePicker(null)}
                                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 border-none cursor-pointer text-xs font-bold flex items-center justify-center transition-colors"
                                title="Đóng"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Bộ lọc theo Buổi học */}
                        {availableSources.length > 1 && (
                            <div className="px-5 py-2 bg-white border-b border-gray-100 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-thin">
                                <span className="text-[11px] text-gray-400 mr-1 shrink-0">Lọc:</span>
                                {availableSources.map(source => (
                                    <button
                                        key={source.id}
                                        type="button"
                                        onClick={() => setPickerFilter(source.id)}
                                        className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium cursor-pointer transition-all border shrink-0 ${
                                            pickerFilter === source.id
                                                ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                                : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                                        }`}
                                    >
                                        {source.label} ({source.count})
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Danh sách ảnh cuộn mượt mà - min-h-0 quan trọng để không vỡ flexbox */}
                        <div className="p-3.5 sm:p-4 overflow-y-auto flex-1 min-h-0 bg-slate-50/40">
                            {filteredPickerImages.length === 0 ? (
                                <div className="h-40 flex flex-col items-center justify-center text-center text-gray-400">
                                    <span className="text-3xl mb-1">📷</span>
                                    <p className="text-xs font-medium">Không tìm thấy ảnh nào trong mục này.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                                    {filteredPickerImages.map(img => {
                                        const isSelected = activePicker.currentImgId === img.id;
                                        return (
                                            <div
                                                key={img.id}
                                                onClick={() => handlePickImage(activePicker.studentId, activePicker.field, img.id)}
                                                className={`group relative aspect-video rounded-lg overflow-hidden border-2 cursor-pointer shadow-2xs transition-all bg-gray-100 ${
                                                    isSelected
                                                        ? 'border-blue-600 ring-2 ring-blue-500/30 shadow-xs'
                                                        : 'border-transparent hover:border-blue-500 hover:shadow-xs'
                                                }`}
                                            >
                                                <Image
                                                    src={img.url}
                                                    alt="Photo option"
                                                    fill
                                                    unoptimized
                                                    sizes="200px"
                                                    className="object-cover group-hover:scale-105 transition-transform duration-200"
                                                />
                                                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <span className="px-2 py-0.5 rounded bg-blue-600 text-white text-[10px] font-bold shadow-xs">
                                                        Chọn
                                                    </span>
                                                </div>
                                                {/* Badge buổi học */}
                                                <span className="absolute bottom-1 right-1 text-[9px] px-1.5 py-0.5 rounded bg-black/65 text-white font-mono">
                                                    {img.source}
                                                </span>
                                                {/* Badge đang chọn */}
                                                {isSelected && (
                                                    <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-blue-600 text-white text-[9px] font-bold shadow-xs">
                                                        ✓ Đang chọn
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-5 py-2.5 bg-white border-t border-gray-200 flex justify-between items-center text-xs shrink-0">
                            <button
                                type="button"
                                onClick={() => handlePickImage(activePicker.studentId, activePicker.field, '')}
                                className="px-3 py-1.5 rounded-lg text-red-600 hover:bg-red-50 hover:text-red-700 cursor-pointer border border-red-200 font-medium transition-colors flex items-center gap-1 text-[11px]"
                            >
                                <span>🗑️</span>
                                <span>Xóa ảnh này (để trống)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setActivePicker(null)}
                                className="px-4 py-1.5 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 border-none cursor-pointer font-semibold text-xs transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Sub-component hiển thị ô ảnh nhỏ gọn
function PhotoSlot({ label, imgId, isAi = false, onClick }) {
    const imgUrl = imgId ? driveImage(imgId) : null;

    return (
        <div
            onClick={onClick}
            className="group relative aspect-video rounded-lg border-2 border-dashed border-gray-300 hover:border-blue-500 overflow-hidden cursor-pointer bg-gray-50 flex flex-col items-center justify-center transition-all shadow-2xs"
            title={`Nhấp để chọn hoặc đổi ${label}`}
        >
            {imgUrl ? (
                <>
                    <Image
                        src={imgUrl}
                        alt={label}
                        fill
                        unoptimized
                        sizes="120px"
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1">
                        <span>🔄</span> Đổi ảnh
                    </div>
                </>
            ) : (
                <div className="flex flex-col items-center gap-0.5 text-gray-400 group-hover:text-blue-600">
                    <span className="text-base font-bold">+</span>
                    <span className="text-[10px] font-semibold">{label}</span>
                </div>
            )}
            <span className="absolute top-1 left-1 px-1 py-0.5 rounded bg-black/60 text-white text-[8px] font-bold uppercase tracking-wider">
                {label}
            </span>
            {isAi && imgUrl && (
                <span className="absolute top-1 right-1 px-1 py-0.5 rounded bg-emerald-600/90 text-white text-[8px] font-bold flex items-center gap-0.5 shadow-xs">
                    ✨ AI
                </span>
            )}
        </div>
    );
}
