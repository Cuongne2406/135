'use client'

import { useState, useEffect, useCallback } from 'react'

const levelColors = {
    WARNING: 'bg-[#fff3e0] text-[#e65100]',
    VIOLATION: 'bg-[#ffebee] text-[#c62828]',
}

const missingLabels = {
    attendance: 'Điểm danh',
    journal: 'Nhật ký',
    resource: 'Tài nguyên',
}

export default function SlaPage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/academic/dashboard/sla-alerts')
            const json = await res.json()
            setData(json)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    if (loading) return <div className="flex items-center justify-center h-full"><p>Đang tải...</p></div>

    const items = data?.items || []

    return (
        <div className="flex flex-col gap-4 p-4">
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Dashboard cảnh báo SLA</h2>

            {items.length === 0 ? (
                <div className="flex items-center justify-center p-8 bg-[var(--bg-primary)] rounded border border-[var(--border-color)]">
                    <p className="text-[var(--text-secondary)]">Không có cảnh báo SLA nào hôm nay</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {items.map((item, i) => (
                        <div key={i} className="flex flex-col gap-2 p-4 bg-[var(--bg-primary)] rounded border border-[var(--border-color)]">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-[var(--text-primary)]">{item.class_name}</h3>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${levelColors[item.level] || ''}`}>
                                    {item.level === 'VIOLATION' ? 'Vi phạm' : 'Cảnh báo'}
                                </span>
                            </div>
                            {item.topic_name && <p className="text-xs text-[var(--text-secondary)]">Bài: {item.topic_name}</p>}
                            <p className="text-xs text-[var(--text-secondary)]">
                                Giáo viên: {item.teacher_name}
                            </p>
                            <p className="text-xs text-[var(--text-secondary)]">
                                Kết thúc: {new Date(item.ended_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                            <p className={`text-xs font-medium ${item.late_minutes > 120 ? 'text-[#c62828]' : 'text-[#e65100]'}`}>
                                Trễ: {item.late_minutes} phút
                            </p>
                            {item.missing_items.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                    {item.missing_items.map(m => (
                                        <span key={m} className="px-2 py-0.5 rounded text-xs bg-[#fef3cd] text-[#856404]">
                                            Thiếu {missingLabels[m] || m}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
