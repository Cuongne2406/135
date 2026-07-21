'use client'

import { useState, useEffect, useCallback } from 'react'

export default function TestTab() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/academic/dashboard/attendance-today')
            const json = await res.json()
            setData(json)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    if (loading) return <div className="flex items-center justify-center h-full"><p className="text-[var(--text-secondary)]">Đang tải...</p></div>
    if (!data) return <div className="flex items-center justify-center h-full"><p className="text-[var(--text-secondary)]">Không có dữ liệu</p></div>

    const cards = [
        { label: 'Tổng lượt học sinh', value: data.total_student_turns, color: 'text-[#1565c0]' },
        { label: 'Có mặt', value: data.present_turns, color: 'text-[#2e7d32]' },
        { label: 'Vắng', value: data.absent_turns, color: 'text-[#c62828]' },
        { label: 'Tỷ lệ có mặt', value: `${data.present_rate}%`, color: 'text-[#2e7d32]' },
        { label: 'Tỷ lệ vắng', value: `${data.absent_rate}%`, color: 'text-[#c62828]' },
        { label: 'Vắng có lý do', value: data.absence_with_reason, color: 'text-[#e65100]' },
        { label: 'Vắng chưa có lý do', value: data.absence_without_reason, color: 'text-[#c62828]' },
        { label: 'Cần học bù', value: data.makeup_required, color: 'text-[#6a1b9a]' },
        { label: 'Đã xếp lịch bù', value: data.makeup_scheduled, color: 'text-[#1565c0]' },
        { label: 'Đã học bù', value: data.makeup_completed, color: 'text-[#2e7d32]' },
    ]

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Chuyên cần hôm nay</h2>
                <p className="text-sm text-[var(--text-secondary)]">{data.date}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {cards.map(c => (
                    <div key={c.label} className="flex flex-col items-center justify-center p-4 bg-white rounded border border-[var(--border-color)] text-center gap-1 shadow-sm">
                        <span className="text-xs text-[var(--text-secondary)]">{c.label}</span>
                        <strong className={`text-2xl ${c.color}`}>{c.value}</strong>
                    </div>
                ))}
            </div>
        </div>
    )
}
