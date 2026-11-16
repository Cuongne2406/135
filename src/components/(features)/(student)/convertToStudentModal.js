'use client';

import { useState, useEffect } from 'react';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Title from '@/components/(features)/(popup)/title';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';

export default function ConvertToStudentModal({ open, onClose, leadData, onSuccess }) {
    const [courses, setCourses] = useState([]);
    const [areas, setAreas] = useState([]);
    const [loadingData, setLoadingData] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [noti, setNoti] = useState({ open: false, status: true, mes: '' });

    const [form, setForm] = useState({
        name: '',
        phone: '',
        parentName: '',
        email: '',
        courseId: '',
        areaId: ''
    });

    useEffect(() => {
        if (open) {
            setForm({
                name: leadData?.name || '',
                phone: leadData?.phone || '',
                parentName: leadData?.nameparent || leadData?.parentName || '',
                email: leadData?.email || '',
                courseId: '',
                areaId: ''
            });

            // Fetch available courses and areas
            setLoadingData(true);
            fetch('/api/student/convert-lead')
                .then(res => res.json())
                .then(data => {
                    if (data.status === 2) {
                        setCourses(data.courses || []);
                        setAreas(data.areas || []);
                        if (data.courses?.length > 0) {
                            setForm(prev => ({ ...prev, courseId: data.courses[0]._id }));
                        }
                        if (data.areas?.length > 0) {
                            setForm(prev => ({ ...prev, areaId: data.areas[0]._id }));
                        }
                    }
                })
                .catch(err => console.error('Fetch courses/areas error:', err))
                .finally(() => setLoadingData(false));
        }
    }, [open, leadData]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name || !form.phone || !form.courseId || !form.areaId) {
            setNoti({ open: true, status: false, mes: 'Vui lòng điền đầy đủ các thông tin bắt buộc (*)' });
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch('/api/student/convert-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    leadId: leadData?._id || leadData?.id || leadData?.studentId,
                    leadType: leadData?.leadType || 'customer',
                    name: form.name,
                    phone: form.phone,
                    parentName: form.parentName,
                    email: form.email,
                    courseId: form.courseId,
                    areaId: form.areaId
                })
            });

            const result = await res.json();
            if (res.ok && result.status === 2) {
                setNoti({ open: true, status: true, mes: result.mes || 'Chuyển đổi thành công!' });
                setTimeout(() => {
                    if (onSuccess) onSuccess(result.data);
                    if (onClose) onClose();
                }, 1000);
            } else {
                setNoti({ open: true, status: false, mes: result.mes || 'Chuyển đổi thất bại' });
            }
        } catch (err) {
            setNoti({ open: true, status: false, mes: err.message || 'Lỗi kết nối' });
        } finally {
            setSubmitting(false);
        }
    };

    if (!open) return null;

    return (
        <CenterPopup open={open} onClose={onClose}>
            <div className="bg-[var(--bg-primary)] rounded-lg p-5 w-[92vw] max-w-[480px] shadow-xl border border-[var(--border-color)]">
                <Title title="Chuyển đổi thành Học viên Chính thức" onClose={onClose} />

                {loadingData ? (
                    <div className="py-8 flex justify-center items-center">
                        <Loading />
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-3">
                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-[var(--text-secondary)]">Tên học sinh <span className="text-red-500">*</span></label>
                            <input
                                className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm outline-none text-slate-800 focus:border-[var(--main_d)]"
                                value={form.name}
                                onChange={e => setForm({ ...form, name: e.target.value })}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-[var(--text-secondary)]">SĐT phụ huynh <span className="text-red-500">*</span></label>
                                <input
                                    className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm outline-none text-slate-800 focus:border-[var(--main_d)]"
                                    value={form.phone}
                                    onChange={e => setForm({ ...form, phone: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-xs font-semibold text-[var(--text-secondary)]">Tên phụ huynh</label>
                                <input
                                    className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm outline-none text-slate-800 focus:border-[var(--main_d)]"
                                    value={form.parentName}
                                    onChange={e => setForm({ ...form, parentName: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-[var(--text-secondary)]">Khóa học chính quy tiếp nhận <span className="text-red-500">*</span></label>
                            <select
                                className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm outline-none text-slate-800 focus:border-[var(--main_d)]"
                                value={form.courseId}
                                onChange={e => setForm({ ...form, courseId: e.target.value })}
                                required
                            >
                                {courses.map(c => (
                                    <option key={c._id} value={c._id}>
                                        {c.name} {c.bookName ? `(${c.bookName})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-semibold text-[var(--text-secondary)]">Cơ sở / Khu vực đào tạo <span className="text-red-500">*</span></label>
                            <select
                                className="px-3 py-2 border border-slate-300 rounded-md bg-white text-sm outline-none text-slate-800 focus:border-[var(--main_d)]"
                                value={form.areaId}
                                onChange={e => setForm({ ...form, areaId: e.target.value })}
                                required
                            >
                                {areas.map(a => (
                                    <option key={a._id} value={a._id}>
                                        {a.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <p className="text-[11px] text-slate-500 italic mt-1">
                            * Sau khi chuyển đổi, học viên sẽ được tạo mã AI mới, tự động kích hoạt học vụ và khởi tạo công nợ học phí ở trạng thái &quot;Chưa nộp&quot;.
                        </p>

                        <div className="flex justify-end gap-2 mt-2 pt-3 border-t border-[var(--border-color)]">
                            <button
                                type="button"
                                onClick={onClose}
                                disabled={submitting}
                                className="px-3.5 py-1.5 text-xs font-medium rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                            >
                                Hủy bỏ
                            </button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className="px-4 py-1.5 text-xs font-semibold rounded-md text-white bg-[var(--main_d)] hover:opacity-90 transition-opacity flex items-center gap-1.5"
                            >
                                {submitting && <Loading size={14} />}
                                <span>Xác nhận nhập học</span>
                            </button>
                        </div>
                    </form>
                )}
            </div>
            <Noti noti={noti} setNoti={setNoti} />
        </CenterPopup>
    );
}
