'use client';

import React, { useState } from 'react';
import { Calendar, Clock, User, AlertCircle, CheckCircle2, X, Send, RotateCcw } from 'lucide-react';

const PRESET_REASONS = [
    { id: 'sick', label: 'Bé bị ốm / sốt', icon: '🤒' },
    { id: 'family', label: 'Bận việc gia đình', icon: '👨‍👩‍👧' },
    { id: 'exam', label: 'Trùng lịch thi / học ở trường', icon: '🏫' },
    { id: 'other', label: 'Lý do khác', icon: '📝' },
];

export default function LeaveRequestModal({
    isOpen,
    onClose,
    lesson,
    student,
    onSuccess
}) {
    const isAlreadyExcused = lesson?.Checkin === 3 || Boolean(lesson?.absenceReason) || lesson?.makeupStatus === 'MAKEUP_PENDING';

    const [selectedReason, setSelectedReason] = useState(PRESET_REASONS[0].label);
    const [customReason, setCustomReason] = useState('');
    const [note, setNote] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [confirmCancel, setConfirmCancel] = useState(false);

    React.useEffect(() => {
        if (isOpen) {
            setSelectedReason(PRESET_REASONS[0].label);
            setCustomReason('');
            setNote('');
            setErrorMsg('');
            setConfirmCancel(false);
        }
    }, [isOpen, lesson?._id]);

    if (!isOpen || !lesson) return null;

    const effectiveReason = selectedReason === 'Lý do khác'
        ? (customReason.trim() || 'Lý do khác')
        : selectedReason;

    // Gửi đơn xin nghỉ
    const handleSubmit = async (e) => {
        e?.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/parent/leave-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId: lesson._id || lesson.lessonId,
                    reason: effectiveReason,
                    note: note.trim()
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.mes || 'Không thể gửi đơn xin nghỉ.');
            }

            if (onSuccess) onSuccess(data);
            onClose();
        } catch (err) {
            setErrorMsg(err.message || 'Đã có lỗi xảy ra.');
        } finally {
            setLoading(false);
        }
    };

    // Hủy đơn xin nghỉ (cho bé đi học lại bình thường)
    const executeCancelLeave = async () => {
        setLoading(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/parent/leave-request', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId: lesson._id || lesson.lessonId
                })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                throw new Error(data.mes || 'Không thể hủy đơn xin nghỉ.');
            }

            if (onSuccess) onSuccess(data);
            onClose();
        } catch (err) {
            setErrorMsg(err.message || 'Đã có lỗi xảy ra.');
        } finally {
            setLoading(false);
        }
    };

    const lessonDateStr = lesson.Day
        ? new Date(lesson.Day).toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
        : 'Chưa cập nhật ngày';

    return (
        <div 
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-3.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn"
        >
            <div className="bg-white w-full max-w-lg rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[min(90vh,calc(100dvh-2rem))] my-auto">
                
                {/* Header */}
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 shrink-0">
                    <div className="flex items-center gap-2.5">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                            isAlreadyExcused ? 'bg-amber-100 text-amber-700' : 'bg-sky-100 text-sky-700'
                        }`}>
                            {isAlreadyExcused ? <AlertCircle className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-slate-800 m-0 leading-tight">
                                {isAlreadyExcused ? 'Thông Tin Xin Nghỉ Phép' : 'Đơn Xin Nghỉ Phép'}
                            </h3>
                            <p className="text-xs text-slate-500 m-0 mt-0.5">
                                {isAlreadyExcused ? 'Buổi học này đã được ghi nhận xin nghỉ' : 'Báo trước cho Trung tâm & Thầy Cô'}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer border-none bg-transparent"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body & Footer */}
                {isAlreadyExcused ? (
                    <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                            {errorMsg && (
                                <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {/* Card tóm tắt buổi học */}
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1.5">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="font-medium">Học viên:</span>
                                    <span className="font-bold text-slate-800">{student?.Name} ({student?.ID})</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="font-medium">Buổi học:</span>
                                    <span className="font-bold text-slate-800">
                                        Buổi {lesson.index || '•'}: {lesson.TopicName || 'Bài học Robotics'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="font-medium">Thời gian:</span>
                                    <span className="text-slate-700">{lessonDateStr} • {lesson.Time || '08:00 - 10:00'}</span>
                                </div>
                            </div>

                            {/* Thông tin vắng */}
                            <div className="space-y-4 pt-1">
                                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2 text-amber-800 font-bold text-xs">
                                        <CheckCircle2 className="w-4 h-4 text-amber-600" />
                                        <span>Trạng thái: Vắng có phép (Đã ghi nhận)</span>
                                    </div>
                                    <p className="text-xs text-amber-900 m-0 pl-6">
                                        <b>Lý do ghi nhận:</b> {lesson.absenceReason || 'Phụ huynh xin nghỉ phép'}
                                    </p>
                                </div>

                                <p className="text-xs text-slate-500 leading-relaxed">
                                    Nếu gia đình sắp xếp được thời gian cho bé đi học bình thường, Ba/Mẹ có thể bấm nút bên dưới để khôi phục lịch học.
                                </p>

                                {!confirmCancel ? (
                                    <button
                                        type="button"
                                        onClick={() => setConfirmCancel(true)}
                                        disabled={loading}
                                        className="w-full py-2.5 px-4 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
                                    >
                                        <RotateCcw className="w-4 h-4 text-slate-500" />
                                        <span>Hủy báo nghỉ (Cho con đi học lại)</span>
                                    </button>
                                ) : (
                                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-2.5 animate-fadeIn">
                                        <p className="text-xs text-rose-800 font-medium m-0">
                                            Ba/Mẹ có chắc chắn muốn hủy đơn xin nghỉ và khôi phục lịch học bình thường cho bé?
                                        </p>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setConfirmCancel(false)}
                                                disabled={loading}
                                                className="flex-1 py-2 px-3 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                                            >
                                                Quay lại
                                            </button>
                                            <button
                                                type="button"
                                                onClick={executeCancelLeave}
                                                disabled={loading}
                                                className="flex-1 py-2 px-3 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer border-none transition-colors shadow-xs disabled:opacity-50"
                                            >
                                                <RotateCcw className="w-3.5 h-3.5" />
                                                <span>{loading ? 'Đang hủy...' : 'Xác nhận hủy'}</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Footer Đóng */}
                        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Trường hợp CHƯA BÁO NGHỈ: Form chọn lý do với body scrollable & footer cố định */
                    <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
                        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
                            {errorMsg && (
                                <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            {/* Card tóm tắt buổi học */}
                            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/70 text-xs space-y-1.5">
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="font-medium">Học viên:</span>
                                    <span className="font-bold text-slate-800">{student?.Name} ({student?.ID})</span>
                                </div>
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="font-medium">Buổi học:</span>
                                    <span className="font-bold text-slate-800">
                                        Buổi {lesson.index || '•'}: {lesson.TopicName || 'Bài học Robotics'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-slate-500">
                                    <span className="font-medium">Thời gian:</span>
                                    <span className="text-slate-700">{lessonDateStr} • {lesson.Time || '08:00 - 10:00'}</span>
                                </div>
                            </div>

                            {/* Bộ chọn lý do */}
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2">
                                    Lý do xin nghỉ phép:
                                </label>
                                <div className="grid grid-cols-2 gap-2">
                                    {PRESET_REASONS.map(r => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => setSelectedReason(r.label)}
                                            className={`p-2.5 rounded-xl border text-left text-xs font-medium flex items-center gap-2 transition-all cursor-pointer ${
                                                selectedReason === r.label
                                                    ? 'bg-sky-50 border-sky-300 text-sky-800 shadow-xs ring-1 ring-sky-300'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                            }`}
                                        >
                                            <span className="text-base shrink-0">{r.icon}</span>
                                            <span className="leading-snug">{r.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {selectedReason === 'Lý do khác' && (
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Nhập lý do cụ thể:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
                                        placeholder="Ví dụ: Bé bận lịch tiêm chủng..."
                                        value={customReason}
                                        onChange={e => setCustomReason(e.target.value)}
                                        required
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Ghi chú thêm cho Thầy/Cô (không bắt buộc):
                                </label>
                                <textarea
                                    rows={3}
                                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 resize-none"
                                    placeholder="Ví dụ: Bé bị sốt nhẹ từ tối qua, gia đình xin phép thầy cô cho con nghỉ hôm nay ạ..."
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    maxLength={250}
                                />
                                <span className="text-[10px] text-slate-400 block text-right mt-0.5">
                                    {note.length}/250 ký tự
                                </span>
                            </div>
                        </div>

                        {/* Footer với các nút bấm được tách biệt, viền sắc nét, không bị che/đè */}
                        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2.5 shrink-0">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={loading}
                                className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer border border-slate-200 transition-colors"
                            >
                                Đóng
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer border-none shadow-xs transition-colors disabled:opacity-50"
                            >
                                <Send className="w-3.5 h-3.5" />
                                <span>{loading ? 'Đang gửi...' : 'Gửi đơn xin nghỉ'}</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}
