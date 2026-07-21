'use client'

import { useState, useMemo } from 'react'
import Menu from '@/components/(ui)/(button)/menu'
import TextNoti from '@/components/(features)/(noti)/textnoti'
import SessionPopup from './ui/detaillesson'
import { formatDate } from '@/function'
const buildDate = (d, h, m) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m)

const statusOf = s => {
    if (!s.time || !s.day) return { label: 'Lỗi dữ liệu', color: 'bg-[#9e9e9e] text-white', weight: 3, end: new Date() };
    const [st, et] = s.time.split('-')
    const [sh, sm] = st.split(':').map(Number)
    const [eh, em] = et.split(':').map(Number)
    const base = new Date(s.day)
    const start = buildDate(base, sh, sm)
    const end = buildDate(base, eh, em)
    const now = new Date()

    if (now < start) return { label: 'Chưa diễn ra', color: 'bg-[#ff9800] text-white', weight: 0, end }
    if (now > end) return { label: 'Đã diễn ra', color: 'bg-[#9e9e9e] text-white', weight: 2, end }
    return { label: 'Đang diễn ra', color: 'bg-[#2196F3] text-white', weight: 1, end }
}

export default function CourseTryFilter({ data, student, teacher = [], area = [], book = [] }) {
    console.log(data);

    const [statusFilter, setStatusFilter] = useState('all')
    const [teacherFilter, setTeacherFilter] = useState('all')
    const [activeSessionId, setActiveSessionId] = useState(null)

    const statusText = {
        all: 'Tất cả trạng thái',
        before: 'Chưa diễn ra',
        now: 'Đang diễn ra',
        done: 'Đã diễn ra'
    }

    const statusMenu = (
        <div className={'bg-[var(--bg-primary)] p-2 shadow-[var(--boxshaw2)] max-h-[200px] overflow-y-auto rounded-md'}>
            {Object.entries(statusText).map(([k, v]) => (
                <p key={k} className={'p-2 rounded cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)]'} onClick={() => setStatusFilter(k)}>
                    {v}
                </p>
            ))}
        </div>
    )

    const teacherMenu = (
        <div className={'bg-[var(--bg-primary)] p-2 shadow-[var(--boxshaw2)] max-h-[200px] overflow-y-auto rounded-md'}>
            <p className={'p-2 rounded cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)]'} onClick={() => setTeacherFilter('all')}>Tất cả giáo viên</p>
            {teacher.map(t => (
                <p key={t._id} className={'p-2 rounded cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)]'} onClick={() => setTeacherFilter(t._id)}>
                    {t.name}
                </p>
            ))}
        </div>
    )

    const Select = ({ value, menu }) => (
        <Menu
            buttonContent={value}
            menuItems={menu}
            customButton={
                <div className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' style={{ cursor: 'pointer' }}>
                    <span className='text-sm font-normal text-[var(--text-primary)]'>{value}</span>
                </div>
            }
        />
    )

    const sessionsSorted = useMemo(() => {
        const sessions = Array.isArray(data?.sessions) ? data.sessions : []
        return sessions
            .map(s => ({ ...s, _st: statusOf(s) }))
            .filter(s => {
                if (statusFilter === 'before' && s._st.weight !== 0) return false
                if (statusFilter === 'now' && s._st.weight !== 1) return false
                if (statusFilter === 'done' && s._st.weight !== 2) return false
                if (teacherFilter !== 'all' && String(s.teacher?._id) !== teacherFilter) return false
                return true
            })
            // --- DÒNG ĐÃ THAY ĐỔI ---
            .sort((a, b) => new Date(b.day) - new Date(a.day))
        // --- KẾT THÚC THAY ĐỔI ---
    }, [data, statusFilter, teacherFilter])

    const activeSession = useMemo(() => {
        if (!activeSessionId) return null
        return sessionsSorted.find(s => s._id === activeSessionId)
    }, [activeSessionId, sessionsSorted])

    return (
        <>
            {activeSession && (
                <SessionPopup
                    open
                    onClose={() => setActiveSessionId(null)}
                    session={activeSession}
                    student={student}
                    teacher={teacher}
                    area={area}
                    book={book}
                />
            )}

            <div className={'flex gap-3 my-2 p-2 rounded-md border border-[var(--border-color)]'}>
                <Select value={statusText[statusFilter]} menu={statusMenu} />
                <Select
                    value={
                        teacherFilter === 'all'
                            ? 'Tất cả giáo viên'
                            : teacher.find(t => t._id === teacherFilter)?.name
                    }
                    menu={teacherMenu}
                />
            </div>

            <div className={'flex-1 overflow-y-auto flex flex-col gap-2'}>
                {sessionsSorted.length === 0 ? (
                    <TextNoti
                        title='Không có buổi học phù hợp'
                        mes='Thay đổi bộ lọc để xem các buổi học khác.'
                        color='blue'
                    />
                ) : (
                    sessionsSorted.map(s => (
                        <div key={s._id} className={'p-2 rounded cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)]'} onClick={() => setActiveSessionId(s._id)}>
                            <div className={`${'inline-block px-[10px] py-1 rounded-md text-xs font-medium w-max'} ${s._st.color}`}>{s._st.label}</div>
                            <div className={'flex gap-2'}><p className='text-sm font-semibold text-[var(--text-primary)]'>Chủ đề:</p><span className='text-sm font-normal text-[var(--text-primary)]'>{s.topic?.Name || '---'}</span></div>
                            <div className={'flex gap-2'}><p className='text-sm font-semibold text-[var(--text-primary)]'>Số lượng học sinh:</p><span className='text-sm font-normal text-[var(--text-primary)]'>{s.students.length}</span></div>
                            <div className={'flex gap-2'}><p className='text-sm font-semibold text-[var(--text-primary)]'>Thời gian:</p><span className='text-sm font-normal text-[var(--text-primary)]'>{formatDate(new Date(s.day))} – {s.time} – {s.room?.name && !/^[0-9a-fA-F]{24}$/.test(s.room.name) ? s.room.name : '---'}</span></div>
                            <div className={'flex gap-2'}><p className='text-sm font-semibold text-[var(--text-primary)]'>Giáo viên:</p><span className='text-sm font-normal text-[var(--text-primary)]'>{s.teacher?.name || '---'}</span></div>
                        </div>
                    ))
                )}
            </div>
        </>
    )
}