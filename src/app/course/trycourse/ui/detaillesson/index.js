'use client'

import { useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import Noti from '@/components/(features)/(noti)/noti'
import Loading from '@/components/(ui)/(loading)/loading'
import Menu from '@/components/(ui)/(button)/menu'
import WrapIcon from '@/components/(ui)/(button)/hoveIcon'
import { Svg_Add, Svg_Course, Svg_Delete, Svg_Pen, Svg_Profile, Svg_Student } from '@/components/(icon)/svg'
import { formatDate, truncateString } from '@/function'
import { attendInfo } from '../student'
import ResponsiveGrid from '@/components/(ui)/grid'
import ImageComponent from '@/components/(ui)/(image)'
import Link from 'next/link'

// Helper functions
const buildDate = (d, h, m) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m)
const statusOf = (session) => {
    if (!session.time || !session.day) return { weight: 2 };
    const [st, et] = session.time.split('-')
    const [sh, sm] = st.split(':').map(Number)
    const [eh, em] = et.split(':').map(Number)
    const base = new Date(session.day)
    const end = buildDate(base, eh, em)
    const now = new Date()
    if (now > end) return { weight: 2 }
    return { weight: 1 }
}

const Row = ({ icon, label, val }) => (
    <div className={'flex gap-2 items-center'}>
        {icon}
        <span className='text-sm font-semibold text-[var(--text-primary)]'>{label}:</span>
        <span className='text-sm font-normal text-[var(--text-primary)]'>{val || '–––'}</span>
    </div>
)

// Component chính
export default function SessionPopup({ open, onClose, session, student = [], teacher = [], area = [], book = [] }) {
    const router = useRouter()
    const [sec, setSec] = useState(null)
    const [loading, setLoading] = useState(false);
    const [noti, setNoti] = useState({ open: false, ok: false, msg: '' });

    const isPastSession = useMemo(() => statusOf(session).weight === 2, [session]);
    const timeLabel = useMemo(() => `${formatDate(new Date(session.day))} – ${session.time} – ${session.room?.name && !/^[0-9a-fA-F]{24}$/.test(session.room.name) ? session.room.name : '–––'}`, [session])
    const images = useMemo(() => session.students.flatMap(st => st.images || []), [session])

    const handleSave = async (payload) => {
        if (isPastSession) {
            setNoti({ open: true, ok: false, msg: 'Buổi học đã kết thúc, không thể chỉnh sửa.' });
            return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/coursetry', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: session._id, ...payload })
            }).then(r => r.json());
            setNoti({ open: true, ok: res.status, msg: res.message || (res.status ? 'Cập nhật thành công!' : 'Thao tác thất bại.') });
        } catch (error) {
            setNoti({ open: true, ok: false, msg: 'Lỗi kết nối hoặc máy chủ.' });
        } finally {
            router.refresh();
            setLoading(false);
        }
    };

    const handleCloseNoti = () => {
        setNoti({ ...noti, open: false });
    };

    const InfoBlock = () => (
        <section className={'bg-white rounded border border-[var(--border-color)] p-4'}>
            <div style={{ display: 'flex' }}>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <p className='text-base font-semibold text-[var(--text-primary)]' style={{ marginBottom: 8 }}>Thông tin buổi học</p>
                    <Row icon={<Svg_Course w={16} h={16} c='var(--text-primary)' />} label='Chương trình' val={session.book?.name} />
                    <Row icon={<Svg_Course w={16} h={16} c='var(--text-primary)' />} label='Chủ đề' val={session.topic?.Name} />
                    <Row icon={<Svg_Profile w={16} h={16} c='var(--text-primary)' />} label='Giáo viên' val={`${session.teacher?.name || '–––'} – ${session.teacher?.phone || ''}`} />
                    <Row icon={<Svg_Student w={18} h={18} c='var(--text-primary)' />} label='Số học sinh' val={session.students.length} />
                    <Row icon={<Svg_Course w={16} h={16} c='var(--text-primary)' />} label='Thời gian' val={timeLabel} />
                    <div style={{ display: 'flex', gap: 16 }}>
                        <Row icon={<Svg_Course w={16} h={16} c='var(--text-primary)' />} label='Link drive' val={truncateString(`https://drive.google.com/drive/folders/${session.folderId}`, 20, 1) || 'Không có'} />
                        <Link target='_blank' className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' style={{ padding: '5px 16px' }} href={`https://drive.google.com/drive/folders/${session.folderId}` || '#'}>Đi đến</Link>
                    </div>
                </div>
                <div style={{ flex: 0.5, display: 'flex', gap: 8, height: '100%', justifyContent: 'end' }}>
                    <div className={'flex items-center flex-col justify-center gap-2 rounded-md cursor-pointer w-[86px] h-[86px] bg-[#dde5ff] transition-all duration-100 hover:-translate-y-0.5 hover:bg-[#c4d2ff]'} style={isPastSession ? { opacity: 0.5, cursor: 'not-allowed' } : {}} onClick={() => !isPastSession && setSec('stu')}><Svg_Student w={24} h={24} c='var(--text-primary)' /><p className="text-xs font-semibold text-[var(--text-primary)]">Học sinh</p></div>
                    <div className={'flex items-center flex-col justify-center gap-2 rounded-md cursor-pointer w-[86px] h-[86px] bg-[#dde5ff] transition-all duration-100 hover:-translate-y-0.5 hover:bg-[#c4d2ff]'} style={isPastSession ? { opacity: 0.5, cursor: 'not-allowed' } : {}} onClick={() => !isPastSession && setSec('info')}><Svg_Pen w={24} h={24} c='var(--text-primary)' /><p className="text-xs font-semibold text-[var(--text-primary)]">Thông tin</p></div>
                </div>
            </div>
        </section>
    );

    const StudentTable = () => (
        <section className={'bg-white rounded border border-[var(--border-color)] p-4'}>
            <header className={'bg-white rounded border border-[var(--border-color)] p-4'}><p className='text-base font-semibold'>Danh sách học sinh</p></header>
            {session.students.length === 0 ? <p className='text-sm font-normal' style={{ paddingTop: 16 }}>Chưa có học sinh.</p> : (
                <div className={'w-full mt-4 border border-[var(--border-color)] rounded'}>
                    <div className={'flex justify-between w-full border-b border-[var(--border-color)]'} style={{ background: 'var(--hover)', borderRadius: '5px 5px 0 0' }}>
                        <p className='text-sm font-semibold'>ID</p><p className='text-sm font-semibold'>Họ và tên</p><p className='text-sm font-semibold'>Liên hệ</p>
                        <p className='text-sm font-semibold'>Trạng thái học</p><p className='text-sm font-semibold'>Chăm sóc</p><p className='text-sm font-semibold'>Hđ</p>
                    </div>
                    {session.students.map(st => {
                        const care = st.statuses?.find(v => v.topic === session._id)?.status ?? 1;
                        const careTxt = care === 2 ? 'Đã theo học' : care === 0 ? 'Không theo' : 'Chưa chăm sóc';
                        const stt = attendInfo(session, st).label;
                        return (
                            <div className={'flex justify-between w-full border-b border-[var(--border-color)]'} key={st.studentId}>
                                <p className='text-sm font-normal text-[var(--text-primary)]'>{st.id}</p><p className='text-sm font-normal text-[var(--text-primary)]'>{st.name}</p><p className='text-sm font-normal text-[var(--text-primary)]'>{st.phone || ''}</p>
                                <p className='text-sm font-normal text-[var(--text-primary)]'>{stt}</p><p className='text-sm font-normal text-[var(--text-primary)]'>{careTxt}</p><p className='text-sm font-normal text-[var(--text-primary)]'>–</p>
                            </div>
                        )
                    })}
                </div>
            )}
        </section>
    );

    const ImageBlock = () => {
        const listColumnsConfig = { mobile: 2, tablet: 4, desktop: 6 };
        const reload = () => router.refresh();
        const imageItems = images.map((item) => (
            <ImageComponent key={item.id} imageInfo={item} refreshData={reload} width="100%" width2={500} />
        ));

        return (
            <section className={'bg-white rounded border border-[var(--border-color)] p-4'}>
                <header className={'bg-white rounded border border-[var(--border-color)] p-4'}>
                    <p className='text-base font-semibold' style={{ marginBottom: 16 }}>Hình ảnh buổi học ({images.length})</p>
                </header>
                {images.length > 0 ? (
                    <ResponsiveGrid items={imageItems} columns={listColumnsConfig} type="list" width={500} />
                ) : (
                    <p className='text-sm font-normal text-[var(--text-primary)]' style={{ paddingTop: 16 }}>Không có hình ảnh nào.</p>
                )}
            </section>
        )
    };

    const EditStudents = ({ onSave, loading, isPast }) => {
        const original = useMemo(() => new Set(session.students.map(s => s.studentId)), [session]);
        const [pick, setPick] = useState(original);
        const [filter, setFilter] = useState('');
        const hasChange = useMemo(() => { if (isPast) return false; if (pick.size !== original.size) return true; for (const id of pick) if (!original.has(id)) return true; return false; }, [pick, original, isPast]);
        const toggle = id => setPick(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
        const addStu = id => setPick(prev => new Set(prev).add(id));
        const candidates = useMemo(() => student.filter(st => !pick.has(st._id) && st.Name.toLowerCase().includes(filter.toLowerCase().trim())), [student, pick, filter]);
        const save = () => { if (hasChange) onSave({ students: [...pick] }); };

        return (
            <div className={'p-4'} style={{ opacity: loading ? 0.5 : 1 }}>
                {isPast && <p className={'text-[var(--red)] text-sm italic mb-4'}>Buổi học đã kết thúc, không thể chỉnh sửa.</p>}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1 }}>
                        <Menu disabled={isPast} customButton={<div className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none" style={{ display: 'flex', gap: 8, cursor: isPast ? 'not-allowed' : 'pointer', opacity: isPast ? 0.6 : 1 }}><Svg_Add w={16} h={16} c='var(--text-primary)' /><p className="text-sm font-normal text-[var(--text-primary)]">Thêm học sinh</p></div>} menuItems={<div className={'bg-[var(--bg-primary)] p-2 shadow-[var(--boxshaw2)] max-h-[400px] overflow-y-auto rounded-md'}><input className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none" placeholder="Tìm theo tên…" value={filter} onChange={e => setFilter(e.target.value)} style={{ marginBottom: 6, width: '100%' }} />{candidates.length > 0 ? candidates.map(st => <p key={st._id} className={'p-2 rounded cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)]'} onClick={() => addStu(st._id)}>{st.ID} – {st.Name}</p>) : <p className="text-sm font-normal text-[var(--text-primary)]" style={{ padding: 4 }}>Không có kết quả</p>}</div>} />
                    </div>
                    <button className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none" style={{ background: 'var(--red)', display: 'flex', gap: 8, cursor: 'pointer' }} onClick={() => setPick(new Set())} disabled={loading || isPast}><Svg_Delete w={16} h={16} c="white" /><p className="text-sm font-normal text-[var(--text-primary)]" style={{ color: 'white' }}>Bỏ chọn tất cả</p></button>
                </div>
                <p className="text-base font-semibold text-[var(--text-primary)]" style={{ margin: '16px 0' }}>Danh sách học sinh tham gia buổi học</p>
                <div className={'max-h-[200px] overflow-y-auto'}>
                    {[...pick].map(id => {
                        const info = student.find(s => s._id === id) || {};
                        return (<div key={id} className={'p-[6px_16px] rounded-md border border-[var(--border-color)] flex justify-between mb-1 items-center'}><span className="text-sm font-normal text-[var(--text-primary)]">{info.ID} – {info.Name}</span><WrapIcon icon={<Svg_Delete w={16} h={16} c="white" />} click={() => !(loading || isPast) && toggle(id)} content="Bỏ khỏi danh sách" placement="left" style={{ padding: 8, background: 'var(--red)', cursor: 'pointer' }} /></div>);
                    })}
                    {pick.size === 0 && <p className="text-sm font-normal text-[var(--text-primary)]" style={{ padding: 8 }}>Chưa chọn học sinh.</p>}
                </div>
                <button className="px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5" disabled={!hasChange || loading || isPast} style={{ marginTop: 16, borderRadius: 5, width: '100%', padding: '10px 0', justifyContent: 'center', background: hasChange && !isPast ? 'var(--green)' : 'var(--text-disabled)', cursor: hasChange && !isPast ? 'pointer' : 'not-allowed', opacity: hasChange && !isPast ? 1 : 0.6 }} onClick={save}>{isPast ? 'Buổi học đã kết thúc' : (loading ? 'Đang lưu...' : 'Lưu thay đổi')}</button>
            </div>
        );
    };

    const EditInfo = ({ onSave, loading, isPast }) => {
        const roomList = useMemo(() => { const m = new Map(); area.forEach(a => (a.rooms || []).forEach(r => m.set(r._id, r.name))); return [...m].map(([id, name]) => ({ id, name })); }, [area]);
        const bookMap = useMemo(() => Object.fromEntries(book.map(b => [b._id, b])), [book]);
        const teacherRaw = useMemo(() => teacher.filter(t => t.role.includes('Teacher')), [teacher]);
        const [form, setForm] = useState(() => ({ day: session.day.slice(0, 10), time: session.time || '08:00-10:00', room: session.room?._id || '', book: session.book?._id || '', topicId: session.topic?._id || '', teacher: session.teacher?._id || '', teachingAs: session.teachingAs?._id || '', note: session.note || '' }));
        const topics = useMemo(() => bookMap[form.book]?.Topics ?? [], [form.book, bookMap]);
        const normalizeTime = useCallback((v) => { const m = v.match(/^(\d{1,2})(?::?(\d{0,2}))?-(\d{1,2})(?::?(\d{0,2}))?$/); if (!m) return form.time; const pad = (x, lim) => String(Math.min(lim, +x)).padStart(2, '0'); const s = `${pad(m[1], 23)}:${pad(m[2] || 0, 59)}`; const e = `${pad(m[3], 23)}:${pad(m[4] || 0, 59)}`; return s < e ? `${s}-${e}` : `${s}-${e}`; }, [form.time]);
        const save = () => onSave(form);

        const Select = ({ label, value, menu }) => (
            <div className={'flex flex-col gap-2 mb-3'}><p className='text-sm font-semibold text-[var(--text-primary)]'>{label}</p>
                <Menu buttonContent={value} menuItems={menu} disabled={loading || isPast} customButton={<div className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' style={{ cursor: 'pointer' }}><span className='text-sm font-normal text-[var(--text-primary)]'>{value || 'Tùy chọn'}</span></div>} />
            </div>
        );
        const wrap = arr => <div className={'bg-[var(--bg-primary)] p-2 shadow-[var(--boxshaw2)] mt-[5px] rounded-md max-h-[200px] overflow-y-auto'}>{arr}</div>;
        const bookM = wrap(book.map(b => <p key={b._id} className={'p-2 rounded cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)]'} onClick={() => setForm({ ...form, book: b._id, topicId: '' })}>{b.Name}</p>));
        const topicM = wrap(topics.map(t => <p key={t._id} className={'p-2 rounded cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)]'} onClick={() => setForm({ ...form, topicId: t._id })}>{t.Name}</p>));
        const roomM = wrap(roomList.map(r => <p key={r.id} className={'p-2 rounded cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)]'} onClick={() => setForm({ ...form, room: r.id })}>{r.name}</p>));
        const teachM = wrap(teacherRaw.map(t => <p key={t._id} className={'p-2 rounded cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)]'} onClick={() => setForm({ ...form, teacher: t._id })}>{t.name}</p>));
        const asstM = wrap(teacherRaw.map(t => <p key={t._id} className={'p-2 rounded cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)]'} onClick={() => setForm({ ...form, teachingAs: t._id })}>{t.name}</p>));

        return (
            <div className={'p-4'} style={{ opacity: loading ? 0.5 : 1 }}>
                {isPast && <p className={'text-[var(--red)] text-sm italic mb-4'}>Buổi học đã kết thúc, không thể chỉnh sửa.</p>}
                <div className={'flex flex-col gap-2 mb-3'}><p className='text-sm font-semibold text-[var(--text-primary)]'>Ngày học:</p><input type='date' className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' value={form.day} onChange={e => setForm({ ...form, day: e.target.value })} disabled={loading || isPast} /></div>
                <div className={'flex flex-col gap-2 mb-3'}><p className='text-sm font-semibold text-[var(--text-primary)]'>Giờ:</p><input className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' value={form.time} onChange={e => setForm({ ...form, time: e.target.value })} onBlur={e => setForm({ ...form, time: normalizeTime(e.target.value) })} disabled={loading || isPast} /></div>
                <Select label='Chương trình' value={bookMap[form.book]?.Name} menu={bookM} />
                <Select label='Chủ đề' value={topics.find(t => t._id === form.topicId)?.Name} menu={topicM} />
                <Select label='Phòng' value={roomList.find(r => r.id === form.room)?.name} menu={roomM} />
                <Select label='Giáo viên' value={teacher.find(t => t._id === form.teacher)?.name} menu={teachM} />
                <Select label='Trợ giảng' value={teacher.find(t => t._id === form.teachingAs)?.name} menu={asstM} />
                <div className={'flex flex-col gap-2 mb-3'}><p className='text-sm font-semibold text-[var(--text-primary)]'>Ghi chú:</p><textarea rows={3} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} disabled={loading || isPast} /></div>
                <button className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ width: '100%', marginTop: 16, borderRadius: 5, justifyContent: 'center', cursor: isPast ? 'not-allowed' : 'pointer' }} onClick={save} disabled={loading || isPast}>
                    {isPast ? 'Buổi học đã kết thúc' : (loading ? 'Đang lưu...' : 'Lưu thay đổi')}
                </button>
            </div>
        );
    };

    const renderSecondaryView = () => {
        let content;
        let loadingMessage = "Đang xử lý...";
        if (sec === 'stu') { content = <EditStudents onSave={handleSave} loading={loading} isPast={isPastSession} />; loadingMessage = "Đang lưu danh sách..."; }
        if (sec === 'info') { content = <EditInfo onSave={handleSave} loading={loading} isPast={isPastSession} />; loadingMessage = "Đang cập nhật..."; }
        if (!content) return null;
        return (
            <>
                <Noti open={noti.open} onClose={handleCloseNoti} status={noti.ok} mes={noti.msg} button={<button className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ width: '100%', justifyContent: 'center', borderRadius: 5 }} onClick={handleCloseNoti}>Đóng</button>} width={500} />
                {loading && <div className={'fixed top-0 left-[-100vw+500px] bg-black/80 w-screen h-screen flex justify-center items-center z-[9999]'}><Loading content={<p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>{loadingMessage}</p>} /></div>}
                {content}
            </>
        )
    };

    return (
        <FlexiblePopup
            open={open}
            onClose={onClose}
            title='Chi tiết buổi học'
            renderItemList={() => (<div className={'flex flex-col gap-2 p-4'}><InfoBlock /><StudentTable /><ImageBlock /></div>)}
            secondaryOpen={!!sec}
            onCloseSecondary={() => setSec(null)}
            secondaryTitle={sec === 'stu' ? 'Chỉnh sửa học sinh' : 'Cập nhật buổi học'}
            renderSecondaryList={renderSecondaryView}
            width={'calc(100vw - 500px)'}
            globalZIndex={1400}
        />
    )
}