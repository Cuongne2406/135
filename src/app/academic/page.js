'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const statusColors = {
    scheduled: 'bg-[#e3f2fd] text-[#1565c0]',
    in_progress: 'bg-[#fff3e0] text-[#e65100]',
    ended: 'bg-[#f3e5f5] text-[#6a1b9a]',
    waiting_report: 'bg-[#fef3cd] text-[#856404]',
    completed: 'bg-[#e8f5e9] text-[#2e7d32]',
}

const statusLabels = {
    scheduled: 'Chưa diễn ra',
    in_progress: 'Đang diễn ra',
    ended: 'Đã kết thúc',
    waiting_report: 'Chờ báo cáo',
    completed: 'Hoàn thành',
}

function getStatus(session, now) {
    const start = new Date(session.lessonDay)
    const end = new Date(start.getTime() + 90 * 60 * 1000)
    if (now < start) return 'scheduled'
    if (now >= start && now <= end) return 'in_progress'
    return session.checkedStudents > 0 ? 'completed' : 'waiting_report'
}

export default function AcademicDashboardPage() {
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)

    const fetchData = useCallback(async () => {
        try {
            const res = await fetch('/api/academic/dashboard/today')
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
    if (!data) return <div className="flex items-center justify-center h-full"><p>Không có dữ liệu</p></div>

    const now = new Date()
    const enrichedSessions = (data.sessions || []).map(s => ({ ...s, _status: getStatus(s, now) }))

    const cards = [
        { label: 'Tổng buổi học hôm nay', value: data.total_sessions, color: 'text-[#1565c0]' },
        { label: 'Chưa diễn ra', value: data.scheduled_sessions, color: 'text-[#1565c0]' },
        { label: 'Đang diễn ra', value: data.in_progress_sessions, color: 'text-[#e65100]' },
        { label: 'Đã kết thúc', value: data.ended_sessions, color: 'text-[#6a1b9a]' },
        { label: 'Chờ báo cáo', value: data.waiting_report_sessions, color: 'text-[#856404]' },
        { label: 'Hoàn thành', value: data.completed_sessions, color: 'text-[#2e7d32]' },
        { label: 'Cảnh báo SLA', value: data.sla_warning_sessions, color: 'text-[#e65100]' },
        { label: 'Vi phạm SLA', value: data.sla_violation_sessions, color: 'text-[#c62828]' },
    ]

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Dashboard tổng quan hôm nay</h2>
                <p className="text-sm text-[var(--text-secondary)]">{data.date}</p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {cards.map(c => (
                    <div key={c.label} className="flex flex-col items-center justify-center p-4 bg-[var(--bg-primary)] rounded border border-[var(--border-color)] text-center gap-1">
                        <span className="text-xs text-[var(--text-secondary)]">{c.label}</span>
                        <strong className={`text-2xl ${c.color}`}>{c.value}</strong>
                    </div>
                ))}
            </div>

            <div className="flex gap-2">
                <Link href="/academic/sla" className="text-sm px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:opacity-80">
                    Xem cảnh báo SLA
                </Link>
                <Link href="/academic/attendance" className="text-sm px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:opacity-80">
                    Chuyên cần hôm nay
                </Link>
                <Link href="/academic/makeup" className="text-sm px-4 py-2 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] text-[var(--text-primary)] hover:opacity-80">
                    Quản lý học bù
                </Link>
            </div>

            <div className="overflow-x-auto bg-[var(--bg-primary)] rounded border border-[var(--border-color)]">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-[var(--border-color)] text-left">
                            <th className="p-3 font-medium text-[var(--text-primary)]">Lớp</th>
                            <th className="p-3 font-medium text-[var(--text-primary)]">Giáo viên</th>
                            <th className="p-3 font-medium text-[var(--text-primary)]">Giờ học</th>
                            <th className="p-3 font-medium text-[var(--text-primary)]">Trạng thái</th>
                            <th className="p-3 font-medium text-[var(--text-primary)]">Điểm danh</th>
                            <th className="p-3 font-medium text-[var(--text-primary)]">Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {enrichedSessions.map((s, i) => (
                            <tr key={i} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                                <td className="p-3 text-[var(--text-primary)]">{s.courseName || s.ID}</td>
                                <td className="p-3 text-[var(--text-primary)]">{s.teacherName || 'N/A'}</td>
                                <td className="p-3 text-[var(--text-primary)]">{s.lessonTime || new Date(s.lessonDay).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[s._status] || ''}`}>
                                        {statusLabels[s._status] || s._status}
                                    </span>
                                </td>
                                <td className="p-3 text-[var(--text-primary)]">{s.checkedStudents}/{s.totalStudents}</td>
                                <td className="p-3">
                                    <Link href={`/calendar/${s._id}`} className="text-xs text-[#1565c0] hover:underline">Xem chi tiết</Link>
                                </td>
                            </tr>
                        ))}
                        {enrichedSessions.length === 0 && (
                            <tr><td colSpan={6} className="p-6 text-center text-[var(--text-secondary)]">Không có buổi học nào hôm nay</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
