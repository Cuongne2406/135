'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    Calendar, 
    Clock, 
    MapPin, 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    ChevronRight, 
    BookOpen,
    Sparkles,
    Check,
    MessageSquare
} from 'lucide-react';

import { useParent } from '../context';

export default function ParentTimelinePage() {
    const { activeStudentId, selectedCourseId, selectCourse } = useParent();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchTimeline = React.useCallback(async (courseIdOverride) => {
        setLoading(true);
        try {
            const cId = courseIdOverride !== undefined ? courseIdOverride : selectedCourseId;
            const url = cId ? `/api/parent/timeline?courseId=${cId}` : '/api/parent/timeline';
            const res = await fetch(url);
            const json = await res.json();
            if (json.success) {
                setData(json);
            }
        } catch (err) {
            console.error('Lỗi tải lộ trình:', err);
        } finally {
            setLoading(false);
        }
    }, [selectedCourseId]);

    useEffect(() => {
        fetchTimeline(selectedCourseId);
    }, [activeStudentId, selectedCourseId, fetchTimeline]);

    if (loading) {
        return (
            <div className="space-y-3 animate-pulse">
                <div className="h-20 bg-slate-200/70 rounded-2xl" />
                <div className="h-28 bg-slate-200/70 rounded-2xl" />
                <div className="h-28 bg-slate-200/70 rounded-2xl" />
                <div className="h-28 bg-slate-200/70 rounded-2xl" />
            </div>
        );
    }

    const lessons = data?.lessons || [];
    const course = data?.course;
    const courses = data?.courses || [];
    const activeCourseId = data?.activeCourseId || selectedCourseId || course?._id;
    const completedCount = lessons.filter(l => l.Checkin > 0 || l.isPast).length;

    const getStatusProps = (checkin) => {
        switch (checkin) {
            case 1:
                return {
                    label: 'Có mặt',
                    badgeCls: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    dotCls: 'bg-emerald-500 border-emerald-200'
                };
            case 3:
                return {
                    label: 'Có phép',
                    badgeCls: 'bg-amber-50 text-amber-700 border-amber-200',
                    dotCls: 'bg-amber-500 border-amber-200'
                };
            case 2:
                return {
                    label: 'Vắng mặt',
                    badgeCls: 'bg-rose-50 text-rose-700 border-rose-200',
                    dotCls: 'bg-rose-500 border-rose-200'
                };
            default:
                return {
                    label: 'Sắp học',
                    badgeCls: 'bg-slate-100 text-slate-600 border-slate-200',
                    dotCls: 'bg-slate-300 border-slate-100'
                };
        }
    };

    return (
        <div className="space-y-4">
            {/* BỘ CHỌN KHÓA HỌC (NẾU HỌC NHIỀU MÔN) */}
            {courses.length > 1 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Chọn lộ trình môn học:
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold">{courses.length} môn</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
                        {courses.map((c) => {
                            const isSelected = c._id === activeCourseId;
                            return (
                                <button
                                    key={c._id}
                                    type="button"
                                    onClick={() => {
                                        selectCourse?.(c._id);
                                        fetchTimeline(c._id);
                                    }}
                                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer shrink-0 border ${
                                        isSelected
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                                    }`}
                                >
                                    <BookOpen className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-white' : 'text-blue-600'}`} />
                                    <span className="truncate max-w-[170px]">{c.BookName}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Header Tổng quan Lộ trình */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                        {course?.ID || 'Lớp học'}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                        Đã học <strong className="text-slate-900">{completedCount}</strong> / {lessons.length} buổi
                    </span>
                </div>
                <h2 className="text-base font-bold text-slate-900">Lộ Trình Học Tập & Điểm Danh</h2>
                <p className="text-xs text-slate-500 mt-0.5">{course?.BookName}</p>
            </div>

            {/* Trục dòng thời gian (Vertical Timeline) */}
            <div className="relative pl-5 space-y-4 before:absolute before:left-2 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {lessons.map((lesson) => {
                    const status = getStatusProps(lesson.Checkin);
                    return (
                        <div key={lesson._id} className="relative group">
                            {/* Chấm tròn mốc thời gian */}
                            <div className={`absolute -left-5 top-4 w-4 h-4 rounded-full border-2 ${status.dotCls} shadow-xs z-10 transition-transform group-hover:scale-125`} />

                            <Link
                                href={`/parent/session/${lesson._id}`}
                                className="block bg-white border border-slate-200 hover:border-blue-300 hover:shadow-sm rounded-2xl p-3.5 transition-all shadow-2xs"
                            >
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-xs font-bold text-slate-400">
                                        Buổi {lesson.index}
                                    </span>
                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${status.badgeCls}`}>
                                        {status.label}
                                    </span>
                                </div>

                                <h3 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                                    {lesson.TopicName}
                                </h3>

                                <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                        {new Date(lesson.Day).toLocaleDateString('vi-VN')}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                        {lesson.Time}
                                    </span>
                                </div>

                                {lesson.Checkin === 3 && (
                                    <p className="mt-2 text-xs text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200">
                                        <b>Đã xin nghỉ:</b> {lesson.absenceReason || 'Phụ huynh xin nghỉ phép'}
                                    </p>
                                )}

                                {lesson.CmtFn && (
                                    <div className="mt-2.5 text-xs text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80 leading-relaxed shadow-2xs">
                                        <div className="flex items-center gap-1.5 text-blue-700 font-semibold mb-1 text-[11px]">
                                            <MessageSquare className="w-3.5 h-3.5" />
                                            <span>Nhận xét của giáo viên:</span>
                                        </div>
                                        <p className="italic text-slate-700 whitespace-pre-line leading-relaxed">
                                            "{lesson.CmtFn}"
                                        </p>
                                    </div>
                                )}

                                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-blue-600 font-semibold">
                                    <span>Xem chi tiết & album ảnh</span>
                                    <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                                </div>
                            </Link>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
