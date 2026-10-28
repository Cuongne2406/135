'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
    CheckCircle2, 
    XCircle, 
    AlertCircle, 
    Clock, 
    MapPin, 
    User, 
    MessageSquare, 
    Image as ImageIcon, 
    ChevronRight, 
    Award, 
    Calendar, 
    BookOpen
} from 'lucide-react';
import { useParent } from './context';
import LeaveRequestModal from './ui/LeaveRequestModal';

export default function ParentDashboardPage() {
    const { 
        overviewData: data, 
        loading, 
        switching, 
        refreshOverview,
        selectCourse,
        selectedCourseId,
        courses = []
    } = useParent();
    const [leaveModalLesson, setLeaveModalLesson] = useState(null);

    if (loading) {
        return (
            <div className="space-y-4 animate-pulse">
                <div className="h-32 bg-slate-200/70 rounded-2xl" />
                <div className="h-48 bg-slate-200/70 rounded-2xl" />
                <div className="h-28 bg-slate-200/70 rounded-2xl" />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12 text-slate-500 text-xs">
                Không thể tải thông tin sổ liên lạc. Vui lòng thử lại sau.
            </div>
        );
    }

    const { student, course, stats, latestSession, nextSession, upcomingSessions = [] } = data;

    // Helper xác định trạng thái điểm danh
    const getAttendanceStatus = (checkin) => {
        switch (checkin) {
            case 1:
                return {
                    label: 'Có mặt',
                    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    icon: CheckCircle2
                };
            case 3:
                return {
                    label: 'Vắng có phép',
                    color: 'bg-amber-50 text-amber-700 border-amber-200',
                    icon: AlertCircle
                };
            case 2:
                return {
                    label: 'Vắng không phép',
                    color: 'bg-rose-50 text-rose-700 border-rose-200',
                    icon: XCircle
                };
            default:
                return {
                    label: 'Sắp diễn ra',
                    color: 'bg-blue-50 text-blue-700 border-blue-200',
                    icon: Clock
                };
        }
    };

    const statusInfo = latestSession ? getAttendanceStatus(latestSession.Checkin) : null;
    const StatusIcon = statusInfo ? statusInfo.icon : Clock;

    // Danh sách các buổi sắp tới (tổng hợp hoặc theo khóa)
    const sessionsToShow = upcomingSessions.length > 0 ? upcomingSessions : (nextSession ? [nextSession] : []);

    return (
        <div className={`space-y-4 transition-opacity duration-200 ${switching ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
            {/* THẺ 1: HỒ SƠ HỌC VIÊN */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs relative overflow-hidden">
                <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 relative shadow-xs">
                        {student?.Avt ? (
                            <img
                                key={student?.ID}
                                src={student?.Avt}
                                alt={student?.Name || 'Học viên'}
                                className="w-full h-full object-cover relative z-10"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : null}
                        <User className="w-7 h-7 text-slate-400 absolute" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-bold text-slate-900 leading-tight">
                            {student?.Name}
                        </h2>
                        <p className="text-xs text-slate-500 mt-1 font-mono">Mã học viên: {student?.ID}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 text-xs text-slate-600">
                            <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate font-medium">{course?.BookName || 'Chương trình Robotics'}</span>
                        </div>
                    </div>
                </div>

                {/* Thông tin giáo viên & cơ sở */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center gap-1.5 truncate">
                        <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>GVCN: <strong className="text-slate-700">{course?.TeacherHR?.name || 'ThS. Nguyễn Hoàng Long'}</strong></span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 text-slate-500">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{course?.Area || 'Trung tâm AIR'}</span>
                    </div>
                </div>
            </div>

            {/* BỘ CHỌN KHÓA HỌC (HIỂN THỊ KHI BÉ HỌC TỪ 2 KHÓA TRỞ LÊN) */}
            {courses && courses.length > 1 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs">
                    <div className="flex items-center justify-between mb-2 px-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                            Khóa học của bé ({courses.length})
                        </span>
                        <span className="text-[10px] text-blue-600 font-semibold">Chạm để chọn môn</span>
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
                        {courses.map((c) => {
                            const isSelected = c._id === course?._id;
                            return (
                                <button
                                    key={c._id}
                                    type="button"
                                    onClick={() => selectCourse(c._id)}
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

            {/* THẺ 2: LỊCH HỌC SẮP TỚI */}
            {sessionsToShow.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Lịch học sắp tới {sessionsToShow.length > 1 ? `(${sessionsToShow.length} buổi)` : ''}
                        </span>
                        {courses && courses.length > 1 && (
                            <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                                Lịch theo thời gian
                            </span>
                        )}
                    </div>

                    <div className="space-y-3.5 divide-y divide-slate-100">
                        {sessionsToShow.map((sess, idx) => {
                            const isExcused = sess.Checkin === 3;
                            return (
                                <div key={sess._id || idx} className={idx > 0 ? 'pt-3.5 space-y-2' : 'space-y-2'}>
                                    <div className="flex items-center justify-between gap-2">
                                        {sess.CourseName ? (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 truncate max-w-[190px]">
                                                {sess.CourseName}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-slate-400">
                                                Buổi {sess.index || 1}
                                            </span>
                                        )}

                                        {isExcused ? (
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-amber-50 text-amber-700 border-amber-200 flex items-center gap-1 shrink-0">
                                                <AlertCircle className="w-3.5 h-3.5" />
                                                Đã báo nghỉ
                                            </span>
                                        ) : (
                                            <span className="text-xs font-semibold px-2 py-0.5 rounded-full border bg-sky-50 text-sky-700 border-sky-200 flex items-center gap-1 shrink-0">
                                                <Clock className="w-3.5 h-3.5" />
                                                Sắp diễn ra
                                            </span>
                                        )}
                                    </div>

                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                                            {sess.TopicName}
                                        </h3>
                                        <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                {new Date(sess.Day).toLocaleDateString('vi-VN')}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                {sess.Time}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                {sess.Room}
                                            </span>
                                        </div>
                                    </div>

                                    {isExcused ? (
                                        <div className="p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between gap-2">
                                            <div className="min-w-0 text-xs">
                                                <span className="font-bold text-amber-800 block text-[11px]">Lý do nghỉ:</span>
                                                <span className="text-amber-900 truncate block text-[11px]">{sess.absenceReason || 'Phụ huynh xin nghỉ'}</span>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={() => setLeaveModalLesson(sess)}
                                                className="px-2.5 py-1 bg-white border border-amber-300 hover:bg-amber-100/50 text-amber-800 text-xs font-semibold rounded-lg transition-colors shrink-0 shadow-2xs cursor-pointer"
                                            >
                                                Xem / Hủy
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="pt-1.5 flex items-center justify-between">
                                            <span className="text-[11px] text-slate-500">
                                                Bận việc hoặc bé ốm?
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() => setLeaveModalLesson(sess)}
                                                className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold transition-colors shadow-2xs cursor-pointer"
                                            >
                                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                                <span>Báo nghỉ phép</span>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* THẺ 3: NHẬT KÝ BUỔI HỌC GẦN NHẤT */}
            {latestSession ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                            Buổi học gần nhất ({latestSession.index}/{stats.totalLessons})
                        </span>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${statusInfo.color}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusInfo.label}
                        </span>
                    </div>

                    <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">
                            {latestSession.TopicName}
                        </h3>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {new Date(latestSession.Day).toLocaleDateString('vi-VN')}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-slate-400" />
                                {latestSession.Time}
                            </span>
                        </div>
                    </div>

                    {/* Lời nhận xét của thầy cô */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 leading-relaxed">
                        <div className="flex items-center gap-1.5 text-blue-700 font-semibold mb-1">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span>Nhận xét của giáo viên:</span>
                        </div>
                        <p className="italic text-slate-600">
                            "{latestSession.CmtFn || (latestSession.Cmt && latestSession.Cmt.join(', ')) || 'Bé tham gia buổi học chăm chỉ, hoàn thành tốt mô hình robot được giao.'}"
                        </p>
                    </div>

                    {/* Nút xem chi tiết buổi học & ảnh */}
                    <Link
                        href={`/parent/session/${latestSession._id}`}
                        className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-blue-200/80"
                    >
                        <ImageIcon className="w-3.5 h-3.5" />
                        <span>Xem chi tiết buổi học & Album ảnh</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-xs text-slate-500">
                    Chưa có buổi học nào được ghi nhận.
                </div>
            )}

            {/* THẺ 3: TIẾN ĐỘ & CHUYÊN CẦN */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700">Tiến độ khóa học</span>
                    <span className="text-xs font-bold text-blue-600">
                        {stats.completedLessons} / {stats.totalLessons} buổi
                    </span>
                </div>
                {/* Progress bar */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200/60 mb-3.5">
                    <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500"
                        style={{ width: `${stats.totalLessons > 0 ? (stats.completedLessons / stats.totalLessons) * 100 : 0}%` }}
                    />
                </div>

                {/* Grid 3 chỉ số */}
                <div className="grid grid-cols-3 gap-2 text-center pt-1 border-t border-slate-100">
                    <div className="p-2 rounded-xl bg-slate-50">
                        <p className="text-[10px] text-slate-500 font-medium">Chuyên cần</p>
                        <p className="text-sm font-bold text-emerald-600 mt-0.5">{stats.attendanceRate}%</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50">
                        <p className="text-[10px] text-slate-500 font-medium">Có mặt</p>
                        <p className="text-sm font-bold text-slate-800 mt-0.5">{stats.presentCount} buổi</p>
                    </div>
                    <div className="p-2 rounded-xl bg-slate-50">
                        <p className="text-[10px] text-slate-500 font-medium">Có phép</p>
                        <p className="text-sm font-bold text-amber-600 mt-0.5">{stats.excusedCount} buổi</p>
                    </div>
                </div>
            </div>

            {/* THẺ 4: LỐI TẮT HỮU ÍCH */}
            <div className="grid grid-cols-2 gap-3">
                <Link
                    href="/parent/showcase"
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex flex-col justify-between shadow-xs group"
                >
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                        <Award className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600">Kỷ Yếu Lookbook</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Tải file in A4 & ePortfolio</p>
                    </div>
                </Link>

                <Link
                    href="/parent/timeline"
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 transition-all flex flex-col justify-between shadow-xs group"
                >
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-indigo-600">Lộ Trình Học</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5">Danh sách các buổi học</p>
                    </div>
                </Link>
            </div>

            {/* Modal Báo Nghỉ Phép */}
            <LeaveRequestModal
                isOpen={Boolean(leaveModalLesson)}
                onClose={() => setLeaveModalLesson(null)}
                lesson={leaveModalLesson}
                student={student}
                onSuccess={() => refreshOverview()}
            />
        </div>
    );
}
