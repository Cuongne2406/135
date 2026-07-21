'use client'

import { Svg_ArowRight, Svg_Left } from '@/components/(icon)/svg'
import Add from '../add'
const fmt = d =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

export default function More({
    data, weekStart, setWeekStart, book, student, teacher, area
}) {
    const prevWeek = () => setWeekStart(w => new Date(w.getTime() - 7 * 864e5))
    const nextWeek = () => setWeekStart(w => new Date(w.getTime() + 7 * 864e5))

    const weekLabel = `${fmt(weekStart)} - ${fmt(new Date(weekStart.getTime() + 6 * 864e5))}`

    return (
        <div className={'border border-[var(--border-color)] rounded-lg p-2 flex items-center justify-between'}>
            <div className={'flex gap-2'}>
                <div className={'flex bg-[#e9ecef] rounded-md p-1'}>
                    <button className={`${'p-[0.4rem_0.8rem] border-none bg-transparent cursor-pointer text-sm text-[var(--text-primary)] font-medium rounded transition-all duration-200 flex items-center'}`}>Tất cả</button>
                    <button className={`${'p-[0.4rem_0.8rem] border-none bg-transparent cursor-pointer text-sm text-[var(--text-primary)] font-medium rounded transition-all duration-200 flex items-center'} ${'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]'}`}>Theo tuần</button>
                </div>

                <div className={'flex bg-[#e9ecef] rounded-md p-1'}>
                    <button className={`${'p-[0.4rem_0.8rem] border-none bg-transparent cursor-pointer text-sm text-[var(--text-primary)] font-medium rounded transition-all duration-200 flex items-center'} ${'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]'}`} onClick={prevWeek}>
                        <Svg_Left w={16} h={16} c='var(--text-primary)' />
                    </button>

                    <button className={`${'p-[0.4rem_0.8rem] border-none bg-transparent cursor-pointer text-sm text-[var(--text-primary)] font-medium rounded transition-all duration-200 flex items-center'}`}>{weekLabel}</button>

                    <button className={`${'p-[0.4rem_0.8rem] border-none bg-transparent cursor-pointer text-sm text-[var(--text-primary)] font-medium rounded transition-all duration-200 flex items-center'} ${'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]'}`} onClick={nextWeek}>
                        <Svg_ArowRight w={16} h={16} c='var(--text-primary)' />
                    </button>
                </div>
            </div>

            <Add data={data} book={book} student={student} teacher={teacher} area={area} />
        </div>
    )
}
