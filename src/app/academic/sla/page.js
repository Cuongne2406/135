'use client'

import { useState, useEffect, useCallback } from 'react'
import SkeletonTable from '@/components/ui/SkeletonTable'
import EmptyState from '@/components/ui/EmptyState'

const levelColors = {
    WARNING: 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]',
    VIOLATION: 'bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]',
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

    if (loading) {
        return (
            <div className="flex flex-col gap-4 p-4 max-w-7xl">
                <div className="h-6 bg-slate-200 rounded w-52 animate-pulse" />
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="p-4 bg-white rounded-lg border border-slate-200 shadow-xs h-36 animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    const items = data?.items || []

    return (
        <div className="flex flex-col gap-4 p-4 max-w-7xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div>
                    <h1 className="text-xl font-semibold text-slate-900 tracking-tight">Dashboard Cảnh Báo SLA</h1>
                    <p className="text-xs text-slate-500 mt-0.5">Theo dõi vi phạm thời hạn hoàn thành điểm danh, nhật ký và minh chứng</p>
                </div>
                <div className="text-xs font-semibold px-2.5 py-1 bg-white border border-slate-200 rounded-md text-slate-700 shadow-xs">
                    {items.length} cảnh báo đang chờ
                </div>
            </div>

            {items.length === 0 ? (
                <EmptyState
                    title="Không có cảnh báo SLA nào hôm nay"
                    description="Tất cả các buổi học hôm nay đều đã hoàn thành đúng hạn điểm danh và cập nhật nhật ký đầy đủ."
                    actionText="Làm mới dữ liệu"
                    onAction={fetchData}
                />
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                    {items.map((item, i) => (
                        <div key={i} className="flex flex-col justify-between gap-2 p-4 bg-white rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-colors">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <h3 className="text-sm font-semibold text-slate-900">{item.class_name}</h3>
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${levelColors[item.level] || 'bg-slate-100 text-slate-700'}`}>
                                        {item.level === 'VIOLATION' ? 'Vi phạm' : 'Cảnh báo'}
                                    </span>
                                </div>
                                {item.topic_name && <p className="text-xs text-slate-600 mb-1">Chủ đề: <span className="font-medium text-slate-800">{item.topic_name}</span></p>}
                                <p className="text-xs text-slate-500">
                                    Giáo viên: <span className="text-slate-700 font-medium">{item.teacher_name}</span>
                                </p>
                                <p className="text-xs text-slate-500">
                                    Kết thúc: <span className="font-mono text-slate-700">{new Date(item.ended_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                                </p>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                                <span className={`text-xs font-semibold ${item.late_minutes > 120 ? 'text-rose-700' : 'text-amber-700'}`}>
                                    Trễ: {item.late_minutes} phút
                                </span>
                                {item.missing_items.length > 0 && (
                                    <div className="flex flex-wrap gap-1">
                                        {item.missing_items.map(m => (
                                            <span key={m} className="px-1.5 py-0.5 rounded text-[11px] bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                                                Thiếu {missingLabels[m] || m}
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}
