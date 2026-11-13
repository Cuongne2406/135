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

export default function SlaTab() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [seeding, setSeeding] = useState(false)

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

    const handleSeed = async () => {
        setSeeding(true)
        try {
            const res = await fetch('/api/test/sla')
            const json = await res.json()
            alert(json.message || 'Đã tạo dữ liệu SLA test')
            setLoading(true)
            fetchData()
        } catch (err) {
            alert('Lỗi: ' + err.message)
        } finally {
            setSeeding(false)
        }
    }

    const handleCleanup = async () => {
        setSeeding(true)
        try {
            const res = await fetch('/api/test/sla', { method: 'DELETE' })
            const json = await res.json()
            alert(json.message || 'Đã xoá dữ liệu SLA test')
            setLoading(true)
            fetchData()
        } catch (err) {
            alert('Lỗi: ' + err.message)
        } finally {
            setSeeding(false)
        }
    }

    if (loading) return <div className="flex items-center justify-center h-full"><p>Đang tải...</p></div>

    const items = data?.items || []

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
                <button
                    onClick={handleSeed}
                    disabled={seeding}
                    className="px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 cursor-pointer border-none"
                >
                    {seeding ? 'Đang xử lý...' : 'Tạo SLA test'}
                </button>
                <button
                    onClick={handleCleanup}
                    disabled={seeding}
                    className="px-3 py-1.5 text-xs font-medium rounded bg-rose-600 text-white hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer border-none"
                >
                    Xoá SLA test
                </button>
            </div>
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
