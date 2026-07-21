'use client';

import { useState, useMemo, useCallback } from 'react';
import SessionPopup from '../detaillesson';
import CareSessionPopup from './item';
import { formatDate } from '@/function';
import Menu from '@/components/(ui)/(button)/menu'; // Import Menu component

/* helpers */
const toDate = (day, hm) => {
    const [h, m] = hm.split(':').map(Number);
    const d = new Date(day);
    d.setHours(h, m, 0, 0);
    return d;
};

export const attendInfo = (session, st) => {
    if (st.checkin) return { label: 'Có mặt', cls: 'bg-[#e8f9e5] border-l-5 border-[#4caf50]' };
    const [hStart] = session.time.split('-');
    return Date.now() < toDate(session.day, hStart)
        ? { label: 'Chưa điểm danh', cls: 'bg-[#fffbe1] border-l-5 border-[#f0a205]' }
        : { label: 'Vắng mặt', cls: 'bg-[#ffe9e9] border-l-5 border-[#9e9e9e]' };
};

const careTxt = s => (s === 2 ? 'Đã theo học' : s === 0 ? 'Không theo' : 'Chưa chăm sóc');

// Định nghĩa các tùy chọn cho bộ lọc trạng thái chăm sóc
const CARE_FILTER_OPTIONS = {
    'all': 'Tất cả trạng thái CS',
    '1': 'Chưa chăm sóc',
    '2': 'Theo học',
    '0': 'Không theo',
};


export default function Student({ data, student, teacher = [], area = [], book = [] }) {
    const [q, setQ] = useState('');
    const [detailId, setDetailId] = useState(null);
    const [careOpen, setCareOpen] = useState(false);
    const [careSession, setCareSession] = useState(null);

    // 1. Thêm state cho bộ lọc trạng thái chăm sóc
    const [careFilter, setCareFilter] = useState('all');

    /* build rows */
    const rows = useMemo(() => {
        let out = [];
        const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
        sessions.forEach(session => {
            session.students.forEach(st => {
                const careObj = st.statuses?.find(v => String(v.topic) === String(session._id));
                out.push({
                    id: `${session._id}-${st.studentId}`,
                    session,
                    studentRaw: st,
                    studentId: st.studentId,
                    name: st.name,
                    phone: st.phone || '',
                    attend: attendInfo(session, st),
                    careStatus: careObj?.status ?? 1,
                    note: careObj?.note || ''
                });
            });
        });

        // Sắp xếp để ưu tiên "Chưa chăm sóc" (careStatus === 1) lên đầu
        out.sort((a, b) => (b.careStatus === 1) - (a.careStatus === 1));

        // 2. Áp dụng bộ lọc trạng thái chăm sóc
        let filteredRows = careFilter === 'all'
            ? out
            : out.filter(r => r.careStatus === parseInt(careFilter));

        // Áp dụng bộ lọc tìm kiếm theo tên/sdt
        if (!q) return filteredRows;

        const kw = q.toLowerCase();
        return filteredRows.filter(r => r.name.toLowerCase().includes(kw) || r.phone.includes(kw));

    }, [data.sessions, q, careFilter]); // 3. Thêm careFilter vào dependency array

    const detailSession = useMemo(() => {
        if (!detailId) return null;
        const sessions = Array.isArray(data?.sessions) ? data.sessions : [];
        return sessions.find(s => String(s._id) === detailId);
    }, [detailId, data.sessions]);

    /* counters */
    const total = rows.length;
    const follow = rows.filter(r => r.careStatus === 2).length;
    const no = rows.filter(r => r.careStatus === 0).length;
    const wait = rows.filter(r => r.careStatus === 1).length;

    const changeCareStatus = useCallback(
        (nextStatus) =>
            setCareSession(cs => (cs ? { ...cs, careStatus: nextStatus } : cs)),
        []
    );

    // 4. Tạo JSX cho menu của bộ lọc
    const careFilterMenu = (
        <div className={'bg-[var(--bg-primary)] p-2 shadow-[var(--boxshaw2)] max-h-[200px] overflow-y-auto rounded-md'}>
            {Object.entries(CARE_FILTER_OPTIONS).map(([value, label]) => (
                <p key={value} className={'flex-1 grid grid-cols-3 gap-3 p-[10px] rounded-md relative bg-[#f5f5f5] cursor-pointer'} onClick={() => setCareFilter(value)}>
                    {label}
                </p>
            ))}
        </div>
    );

    return (
        <>
            <div className={'border border-[var(--border-color)] rounded-lg p-2 flex-1 flex flex-col gap-3'}>
                <div className={'flex justify-between items-center gap-1.5'}>
                    <input
                        className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none'
                        style={{ width: 220 }}
                        placeholder='Tìm học sinh theo tên hoặc sđt...'
                        value={q}
                        onChange={e => setQ(e.target.value)}
                    />


                    <div className={'flex gap-2 flex-1'} style={{ justifyContent: 'space-between' }}>
                        <div style={{ flex: 1 }}>
                            <Menu
                                customButton={
                                    <div className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' style={{ cursor: 'pointer' }}>
                                        <span className='text-sm font-normal text-[var(--text-primary)]'>{CARE_FILTER_OPTIONS[careFilter]}</span>
                                    </div>
                                }
                                menuItems={careFilterMenu}
                            />
                        </div>
                        <span className={'p-[8px_10px] rounded text-white text-xs flex items-center'} style={{ background: 'var(--main_b)' }}>Tổng: {total}</span>
                        <span className={'p-[8px_10px] rounded text-white text-xs flex items-center'} style={{ background: 'var(--green)' }}>Theo học: {follow}</span>
                        <span className={'p-[8px_10px] rounded text-white text-xs flex items-center'} style={{ background: 'var(--red)' }}>Không học: {no}</span>
                        <span className={'p-[8px_10px] rounded text-white text-xs flex items-center'} style={{ background: 'var(--yellow)' }}>Chưa CS: {wait}</span>
                    </div>
                </div>

                <div className={'flex flex-col gap-2 mt-[6px] max-h-[calc(100vh-280px)] overflow-auto'}>
                    {rows.map(r => (
                        <div key={r.id} className={'flex gap-1.5'}>
                            <div
                                className={`${'flex-1 grid grid-cols-3 gap-3 p-[10px] rounded-md relative bg-[#f5f5f5] cursor-pointer'} ${r.attend.cls}`}
                                style={r.careStatus === 2 ? { opacity: .55, background: '#fefefe' } : undefined}
                                onClick={() => {
                                    setCareSession({
                                        ...r.session,
                                        ...r.studentRaw,
                                        ids: r.session._id,
                                        attendLabel: r.attend.label,
                                        careStatus: r.careStatus,
                                        note: r.note
                                    });
                                    setCareOpen(true);
                                }}
                            >
                                {r.careStatus === 2 && <div className={'absolute inset-0 bg-black/35 text-white text-sm font-semibold flex items-center justify-center rounded-sm pointer-events-none'} style={{ justifyContent: 'center' }}>
                                    <p className='text-xs font-semibold text-[var(--text-primary)]' style={{ background: 'var(--green)', padding: 8, borderRadius: 5, color: 'white' }}>{careTxt(r.careStatus)}</p>
                                </div>}
                                <div className={'flex flex-col gap-0.5'}><p className='text-sm font-normal text-[var(--text-primary)]'>Tên học sinh</p><p className='text-sm font-semibold text-[var(--text-primary)]'>{r.name}</p></div>
                                <div className={'flex flex-col gap-0.5'}><p className='text-sm font-normal text-[var(--text-primary)]'>Trạng thái học thử</p><p className='text-sm font-semibold text-[var(--text-primary)]'>{r.attend.label}</p></div>
                                <div className={'flex flex-col gap-0.5'}><p className='text-sm font-normal text-[var(--text-primary)]'>Trạng thái chăm sóc</p><p className='text-sm font-semibold text-[var(--text-primary)]'>{careTxt(r.careStatus)}</p></div>
                            </div>

                            <div
                                className={'cursor-pointer min-w-[220px] border-r-6 border-[#9e9e9e] bg-[#fafafa] rounded-md p-[10px] flex flex-col justify-center hover:bg-[#f0f8ff]'}
                                onClick={() => setDetailId(r.session._id)}
                            >
                                <p className='text-sm font-semibold text-[var(--text-primary)]'>Chủ đề: {r.session.topic?.Name || 'Chưa có'}</p>
                                <p className='text-sm font-normal text-[var(--text-primary)]'>Thời gian: {r.session.time} – {formatDate(new Date(r.session.day))}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {detailSession && (
                <SessionPopup
                    open
                    onClose={() => setDetailId(null)}
                    session={detailSession}
                    student={student}
                    teacher={teacher}
                    area={area}
                    book={book}
                />
            )}

            {careSession && (
                <CareSessionPopup
                    open={careOpen}
                    onClose={() => setCareOpen(false)}
                    session={careSession}
                    onChangeStatus={changeCareStatus}
                />
            )}
        </>
    )
}