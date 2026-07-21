'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import { formatDate } from '@/function';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import { IconSuccess, IconFailure } from '@/components/(features)/(noti)/noti';

const CARE_STATUS_OPTIONS = [
    { value: 1, label: 'Chưa chăm sóc' },
    { value: 2, label: 'Theo học' },
    { value: 0, label: 'Không theo' }
];

const updateCareInfo = async (payload) => {
    const response = await fetch('/api/student', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    });
    return response.json();
};

export default function CareSessionPopup({ open, onClose, session }) {
    console.log(session);
    
    const router = useRouter();

    // 1. Tìm đúng đối tượng status/note từ mảng statuses dựa trên ID của buổi học
    const careInfo = useMemo(() => {
        if (!session?.statuses || !session?.ids) return null;
        return session.statuses.find(s => String(s.topic) === String(session.ids));
    }, [session]);

    // 2. Khởi tạo state từ đối tượng careInfo đã tìm được
    const [status, setStatus] = useState(careInfo?.status ?? 1);
    const [note, setNote] = useState(careInfo?.note || '');
    const [loading, setLoading] = useState(false);
    const [noti, setNoti] = useState({ open: false, ok: false, msg: '' });

    // Đồng bộ state khi props `session` thay đổi
    useEffect(() => {
        if (session) {
            const currentCareInfo = session.statuses?.find(s => String(s.topic) === String(session.ids));
            setStatus(currentCareInfo?.status ?? 1);
            setNote(currentCareInfo?.note || '');
        }
    }, [session]);

    const handleApiCall = async (payload, successMsg) => {
        setLoading(true);
        try {
            const res = await updateCareInfo(payload);
            setNoti({
                open: true,
                ok: res.success,
                msg: res.message || (res.success ? successMsg : "Thao tác thất bại.")
            });
            if (res.success) {
                router.refresh();
            }
        } catch (error) {
            setNoti({ open: true, ok: false, msg: 'Lỗi kết nối hoặc máy chủ.' });
        } finally {
            setLoading(false);
        }
    };

    const handleChangeStatus = (newStatus) => {
        if (newStatus === status) return;
        setStatus(newStatus);
        const payload = {
            topicId: session.ids,
            studentId: session.studentId,
            status: newStatus
        };
        handleApiCall(payload, 'Cập nhật trạng thái thành công!');
    };

    const handleSaveNote = () => {
        // 3. So sánh với note gốc từ careInfo
        if (note === (careInfo?.note || '')) {
            setNoti({ open: true, ok: false, msg: 'Bạn chưa thay đổi nội dung ghi chú.' });
            return;
        }
        const payload = {
            topicId: session.ids,
            studentId: session.studentId,
            note: note
        };
        handleApiCall(payload, 'Cập nhật ghi chú thành công!');
    };

    
    const renderForm = useCallback(([s]) => {
        if (!s) return null;
        return (
            <div className={'flex flex-col gap-2 p-2 bg-[var(--bg-secondary)]'}>
                <section className={'flex flex-col gap-2 bg-[var(--bg-primary)] p-4 rounded-md border border-[var(--border-color)]'}>
                    <p className='text-base font-semibold text-[var(--text-primary)]'><b>Chủ đề:</b> {s.topic?.Name}</p>
                    <p className='text-xs font-medium text-[var(--text-primary)]'><b>Thời gian:</b> {s.time} – {formatDate(new Date(s.day))}</p>
                    <p className='text-xs font-medium text-[var(--text-primary)]'><b>Giáo viên:</b> {s.teacher?.name || '---'}</p>
                </section>

                <section className={'flex flex-col gap-2 bg-[var(--bg-primary)] p-4 rounded-md border border-[var(--border-color)]'}>
                    <p className='text-base font-semibold text-[var(--text-primary)]'><b>Thông tin buổi học của học sinh</b></p>
                    <p className='text-xs font-medium text-[var(--text-primary)]'><b>Điểm danh:</b> {s.attendLabel}</p>

                    <p className='text-xs font-medium text-[var(--text-primary)]' style={{ marginTop: 8 }}><b>Nhận xét từ giáo viên:</b></p>
                    {s.cmt && s.cmt.length > 0 ? (
                        <ul className={'list-none pl-2 flex flex-col gap-1.5 text-[var(--text-secondary)]'}>
                            {s.cmt.map((comment, index) => <li key={index}>{comment}</li>)}
                        </ul>
                    ) : (
                        <p className='text-sm font-normal text-[var(--text-primary)]' style={{ fontStyle: 'italic' }}>Chưa có nhận xét.</p>
                    )}

                    <p className='text-xs font-medium text-[var(--text-primary)]' style={{ marginTop: 12 }}><b>Hình ảnh trong buổi học:</b></p>
                    {s.images && s.images.length > 0 ? (
                        <div className={'grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2'}>
                            {s.images.map(img => (
                                <img key={img.id} src={`https://lh3.googleusercontent.com/d/${img.id}`} alt='Ảnh buổi học' />
                            ))}
                        </div>
                    ) : (
                        <p className='text-sm font-normal text-[var(--text-primary)]' style={{ fontStyle: 'italic' }}>Chưa có hình ảnh.</p>
                    )}
                </section>

                <section className={'flex flex-col gap-2 bg-[var(--bg-primary)] p-4 rounded-md border border-[var(--border-color)]'}>
                    <p className='text-base font-semibold text-[var(--text-primary)]'><b>Trạng thái chăm sóc</b></p>
                    <div className={'grid grid-cols-3 gap-2.5'}>
                        {CARE_STATUS_OPTIONS.map(st => (
                            <button
                                key={st.value}
                                className={`${'p-[10px] border border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-md cursor-pointer font-medium transition-all duration-200 hover:bg-[var(--hover)] hover:border-[var(--main_a)]'} ${status === st.value ? 'bg-[var(--main_b)] text-white border-[var(--main_b)] -translate-y-0.5 shadow-[0_4px_10px_rgba(0,123,255,0.2)]' : ''}`}
                                onClick={() => handleChangeStatus(st.value)}
                            >
                                {st.label}
                            </button>
                        ))}
                    </div>
                </section>

                <section className={'flex flex-col gap-2 bg-[var(--bg-primary)] p-4 rounded-md border border-[var(--border-color)]'}>
                    <p className='text-base font-semibold text-[var(--text-primary)]'><b>Ghi chú nội bộ</b></p>
                    <textarea
                        className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none'
                        rows={4}
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder='Nhập ghi chú...'
                    />
                    <div className={'flex justify-end mt-2'}>
                        <button className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ background: 'var(--main_b)', color: '#fff' }} onClick={handleSaveNote}>
                            Lưu ghi chú
                        </button>
                    </div>
                </section>
            </div>
        )
    }, [session, status, note]);

    if (!session) return null;

    return (
        <>
            {loading && <div className={'fixed inset-0 bg-black/40 flex items-center justify-center z-[9999]'}><Loading content="Đang xử lý..." /></div>}
            <Noti
                open={noti.open}
                onClose={() => setNoti(prev => ({ ...prev, open: false }))}
                status={noti.ok}
                mes={noti.msg}
                button={<button className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ width: 'calc(100% - 24px)', justifyContent: 'center' }} onClick={() => setNoti(prev => ({ ...prev, open: false }))}>Đóng</button>}
            />
            <FlexiblePopup
                open={open}
                onClose={onClose}
                data={[session]}
                title={`Chăm sóc: ${session.name}`}
                renderItemList={renderForm}
                width={520}
                globalZIndex={1200}
            />
        </>
    )
}