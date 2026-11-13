'use client'

import { useState, useEffect, useCallback } from 'react'

import SkeletonTable from '@/components/ui/SkeletonTable'
import EmptyState from '@/components/ui/EmptyState'

export default function AttendancePage() {
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

    if (loading) {
        return (
            <div className="flex flex-col gap-4 p-4">
                <div className="h-6 bg-slate-200 rounded w-48 animate-pulse" />
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs h-24 animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    if (!data) {
        return (
            <div className="p-4">
                <EmptyState
                    title="Không có dữ liệu chuyên cần"
                    description="Hệ thống chưa ghi nhận dữ liệu điểm danh nào trong ngày hôm nay."
                    actionText="Tải lại"
                    onAction={fetchData}
                />
            </div>
        )
    }

    const cards = [
        { label: 'Tổng lượt học sinh', value: data.total_student_turns, color: 'text-slate-900' },
        { label: 'Có mặt', value: data.present_turns, color: 'text-emerald-700' },
        { label: 'Vắng', value: data.absent_turns, color: 'text-rose-700' },
        { label: 'Tỷ lệ có mặt', value: `${data.present_rate}%`, color: 'text-emerald-700' },
        { label: 'Tỷ lệ vắng', value: `${data.absent_rate}%`, color: 'text-rose-700' },
        { label: 'Vắng có lý do', value: data.absence_with_reason, color: 'text-amber-700' },
        { label: 'Vắng chưa có lý do', value: data.absence_without_reason, color: 'text-rose-700' },
        { label: 'Cần học bù', value: data.makeup_required, color: 'text-slate-800' },
        { label: 'Đã xếp lịch bù', value: data.makeup_scheduled, color: 'text-blue-700' },
        { label: 'Đã học bù', value: data.makeup_completed, color: 'text-emerald-700' },
    ]

    return (
        <div className="flex flex-col gap-4 p-4 max-w-7xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Chuyên cần hôm nay</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Báo cáo tổng hợp số liệu điểm danh thời gian thực</p>
                </div>
                <div className="px-3 py-1 bg-white border border-slate-200 rounded-md text-xs font-mono text-slate-600 shadow-xs">
                    {data.date}
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                {cards.map(c => (
                    <div key={c.label} className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-slate-200 text-center gap-1 shadow-xs">
                        <span className="text-xs font-medium text-slate-500">{c.label}</span>
                        <strong className={`text-2xl font-bold tracking-tight ${c.color}`}>{c.value}</strong>
                    </div>
                ))}
            </div>
        </div>
    )
}
