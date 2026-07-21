'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import { Svg_Add, Svg_Delete } from '@/components/(icon)/svg';
import Menu from '@/components/(ui)/(button)/menu';
import Noti from '@/components/(features)/(noti)/noti';
import Loading from '@/components/(ui)/(loading)/loading';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';

export default function Add({ book = [], student = [], teacher = [], area = [], onCreate }) {
    const router = useRouter();
    const roomList = useMemo(() => {
        const m = new Map();
        area.forEach(a => (a.rooms || []).forEach(r => m.set(r._id, r.name)));
        return [...m].map(([id, name]) => ({ id, name }));
    }, [area]);

    const bookMap = useMemo(() => Object.fromEntries(book.map(b => [b._id, b])), [book]);
    const teacherRaw = useMemo(() => teacher.filter(t => t.role.includes('Teacher')), [teacher]);

    /* ---------- default selections ---------- */
    const defaultBook = useMemo(() => book.find(b => b._id === '685633c413427722b24c3892') || book[0], [book]);
    const defaultTopic = useMemo(() => defaultBook?.Topics?.find(t => t._id === '68565eaf13427722b24c3f50') || defaultBook?.Topics?.[0], [defaultBook]);
    const defaultTeacher = useMemo(() => teacher.find(t => /khắc\s*hoàng/i.test(t.name.toLowerCase())) || teacherRaw[0], [teacher, teacherRaw]);
    const defaultRoom = useMemo(() => roomList.find(r => r.name === 'B304') || roomList[0], [roomList]);

    /* ---------- state ---------- */
    const [open, setOpen] = useState(false);
    const [showStu, setShowStu] = useState(false);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    const [notification, setNoti] = useState({ open: false, status: false, mes: '' });
    const [form, setForm] = useState(() => ({
        day: new Date().toISOString().slice(0, 10),
        time: '08:00-10:00',
        room: defaultRoom?.id || '',
        book: defaultBook?._id || '',
        topicId: defaultTopic?._id || '',
        teacher: defaultTeacher?._id || '',
        teachingAs: '',
        studentIds: [],
        note: ''
    }));

    const topics = useMemo(() => bookMap[form.book]?.Topics ?? [], [form.book, bookMap]);

    const selectedStudents = useMemo(() => {
        const selectedIds = new Set(form.studentIds);
        return student.filter(s => selectedIds.has(s._id));
    }, [form.studentIds, student]);

    /* ---------- utils ---------- */
    const normalizeTime = useCallback(v => {
        const m = v.match(/^(\d{1,2})(?::?(\d{0,2}))?-(\d{1,2})(?::?(\d{0,2}))?$/);
        if (!m) return '08:00-10:00';
        const pad = (x, lim) => String(Math.min(lim, +x)).padStart(2, '0');
        const s = `${pad(m[1], 23)}:${pad(m[2] || 0, 59)}`;
        const e = `${pad(m[3], 23)}:${pad(m[4] || 0, 59)}`;
        return s < e ? `${s}-${e}` : `${s}-10:00`;
    }, []);

    const toggleStudent = id =>
        setForm(f =>
            f.studentIds.includes(id)
                ? { ...f, studentIds: f.studentIds.filter(x => x !== id) }
                : { ...f, studentIds: [...f.studentIds, id] }
        );

    /* ---------- submit ---------- */
    const save = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/coursetry', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            }).then(r => r.json());

            if (!res.status) {
                setNoti({ open: true, status: false, mes: res.mes || 'Tạo buổi thất bại' });
            } else {
                setNoti({ open: true, status: true, mes: 'Thêm buổi học thử thành công!' });
                setOpen(false);
                onCreate && onCreate(res.data);
            }
        } catch (e) {
            setNoti({ open: true, status: false, mes: 'Lỗi mạng hoặc máy chủ' });
        } finally {
            router.refresh();
            setLoading(false);
        }
    };

    /* ---------- dropdown menus ---------- */
    const wrap = arr => <div className={'bg-[var(--bg-primary)] p-2 shadow-[var(--boxshaw2)] mt-[5px] rounded-md max-h-[200px] overflow-y-auto'}>{arr}</div>;
    const bookM = wrap(book.map(b => <p key={b._id} className={'rounded transition-all duration-300 cursor-pointer p-[10px] flex gap-2 items-center hover:bg-[var(--hover)]'} onClick={() => setForm({ ...form, book: b._id, topicId: '' })}>{b.Name}</p>));
    const topicM = wrap(topics.map(t => <p key={t._id} className={'rounded transition-all duration-300 cursor-pointer p-[10px] flex gap-2 items-center hover:bg-[var(--hover)]'} onClick={() => setForm({ ...form, topicId: t._id })}>{t.Name}</p>));
    const roomM = wrap(roomList.map(r => <p key={r.id} className={'rounded transition-all duration-300 cursor-pointer p-[10px] flex gap-2 items-center hover:bg-[var(--hover)]'} onClick={() => setForm({ ...form, room: r.id })}>{r.name}</p>));
    const teachM = wrap(teacherRaw.map(t => <p key={t._id} className={'rounded transition-all duration-300 cursor-pointer p-[10px] flex gap-2 items-center hover:bg-[var(--hover)]'} onClick={() => setForm({ ...form, teacher: t._id })}>{t.name}</p>));
    const asstM = wrap(teacherRaw.map(t => <p key={t._id} className={'rounded transition-all duration-300 cursor-pointer p-[10px] flex gap-2 items-center hover:bg-[var(--hover)]'} onClick={() => setForm({ ...form, teachingAs: t._id })}>{t.name}</p>));

    /* ---------- students popup ---------- */
    const filteredStu = useMemo(() => {
        const q = search.toLowerCase();
        return student.filter(s => s.Name.toLowerCase().includes(q) || s.ID.toLowerCase().includes(q));
    }, [search, student]);

    const stuList = (
        <div className={'flex flex-col gap-2.5 p-4 h-[calc(100%-32px)]'}>
            <input className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' placeholder='Tìm tên/ID …' value={search} onChange={e => setSearch(e.target.value)} />
            <div className={'overflow-y-auto border border-[#e0e0e0] rounded p-1.5 flex flex-col flex-1'}>
                {filteredStu.map(s => (
                    <label key={s._id} className={'flex gap-2 items-center text-sm cursor-pointer p-2 hover:bg-[#f5f5f5] hover:rounded'}>
                        <input type='checkbox' checked={form.studentIds.includes(s._id)} onChange={() => toggleStudent(s._id)} />
                        <span>{s.ID} – {s.Name}</span>
                    </label>
                ))}
            </div>
            <button className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ width: '100%', marginTop: 12, justifyContent: 'center', borderRadius: 5 }} onClick={() => setShowStu(false)}>Xong</button>
        </div>
    );

    /* ---------- select wrapper ---------- */
    const Select = ({ label, value, menu }) => (
        <div className={'flex flex-col gap-2 mb-3'}>
            <p className='text-sm font-semibold text-[var(--text-primary)]'>{label}</p>
            <Menu buttonContent={value} menuItems={menu} customButton={<div className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' style={{ cursor: 'pointer' }}><span className='text-sm font-normal text-[var(--text-primary)]'>{value || 'Tùy chọn'}</span></div>} />
        </div>
    );

    /* ---------- main popup ---------- */
    const body = (
        <div className={'p-4'}>
            <div className={'flex flex-col gap-2 mb-3'}><p className='text-sm font-semibold text-[var(--text-primary)]'>Ngày học:</p><input type='date' className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} /></div>
            <div className={'flex flex-col gap-2 mb-3'}><p className='text-sm font-semibold text-[var(--text-primary)]'>Giờ:</p><input className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} onBlur={e => setForm({ ...form, time: normalizeTime(e.target.value) })} /></div>
            <Select label='Chương trình' value={bookMap[form.book]?.Name} menu={bookM} />
            <Select label='Chủ đề' value={topics.find(t => t._id === form.topicId)?.Name} menu={topicM} />
            <Select label='Phòng' value={roomList.find(r => r.id === form.room)?.name} menu={roomM} />
            <Select label='Giáo viên' value={teacher.find(t => t._id === form.teacher)?.name} menu={teachM} />
            <Select label='Trợ giảng' value={teacher.find(t => t._id === form.teachingAs)?.name} menu={asstM} />

            <div className={'flex flex-col gap-2 mb-3'}>
                <div className={'flex justify-between items-center w-full mb-2'}>
                    <p className='text-sm font-semibold text-[var(--text-primary)]'>Học sinh đã chọn ({selectedStudents.length})</p>
                    <button className={'flex items-center gap-1.5 bg-transparent border border-[var(--border-color)] p-[4px_10px] rounded-md cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)]'} onClick={() => setShowStu(true)}>
                        <Svg_Add w={14} h={14} c="var(--main_b)" />
                        <span>Thêm</span>
                    </button>
                </div>
                <div className={'w-full max-h-[120px] overflow-y-auto border border-[var(--border-color)] rounded-md p-1 bg-[var(--bg-secondary)]'}>
                    {selectedStudents.length > 0 ? (
                        selectedStudents.map(s => (
                            <div key={s._id} className={'flex justify-between items-center p-[6px_8px] rounded hover:bg-[var(--hover)]'}>
                                <span className={'text-xs text-[var(--text-primary)]'}>{s.ID} – {s.Name}</span>
                                <WrapIcon
                                    icon={<Svg_Delete w={12} h={12} c="white" />}
                                    click={() => toggleStudent(s._id)}
                                    content="Xóa"
                                    style={{ padding: 8, background: 'var(--red)', borderRadius: 5 }}
                                />
                            </div>
                        ))
                    ) : (
                        <p className={`${'text-center p-4 text-[var(--text-secondary)] italic'} text-sm font-normal text-[var(--text-primary)]`}>Chưa có học sinh nào được chọn.</p>
                    )}
                </div>
            </div>

            <div className={'flex flex-col gap-2 mb-3'}><p className='text-sm font-semibold text-[var(--text-primary)]'>Ghi chú:</p><textarea rows={3} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} /></div>
            <button className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ width: '100%', marginTop: 16, borderRadius: 5, justifyContent: 'center' }} onClick={save}>Thêm buổi học thử</button>
        </div>
    );

    return (
        <>
            <div className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ margin: 0, borderRadius: 5 }} onClick={() => setOpen(true)}>
                <Svg_Add w={16} h={16} c='#fff' /><p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: '#fff' }}>Thêm buổi học thử</p>
            </div>
            <FlexiblePopup
                open={open}
                onClose={() => setOpen(false)}
                title='Tạo buổi học thử'
                renderItemList={() => body}
                secondaryOpen={showStu}
                onCloseSecondary={() => setShowStu(false)}
                renderSecondaryList={() => stuList}
                secondaryTitle='Danh sách học sinh'
                width={480}
                globalZIndex={1200}
            />
            {loading && (
                <div className={'fixed inset-0 bg-black/60 flex justify-center items-center z-[9999] backdrop-blur-[4px]'}>
                    <Loading content={<p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Đang thực thi...</p>} />
                </div>
            )}
            <Noti
                open={notification.open}
                status={notification.status}
                mes={notification.mes}
                onClose={() => setNoti(prev => ({ ...prev, open: false }))}
                button={
                    <div className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ width: 'calc(100% - 24px)', justifyContent: 'center' }} onClick={() => setNoti(prev => ({ ...prev, open: false }))}>
                        <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Tắt thông báo</p>
                    </div>
                }
            />
        </>
    )
}