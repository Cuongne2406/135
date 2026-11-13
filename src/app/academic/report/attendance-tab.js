'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

import SkeletonTable from '@/components/ui/SkeletonTable'
import EmptyState from '@/components/ui/EmptyState'

function toDateStr(d) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `${y}-${m}-${day}`
}

function getDateContext(selected) {
    const today = toDateStr(new Date())
    if (selected === today) return { text: 'Hôm nay — dữ liệu thời gian thực', color: 'text-blue-600' }
    if (selected < today) return { text: 'Ngày trong quá khứ — hiển thị dữ liệu lịch sử', color: 'text-yellow-600' }
    return { text: 'Ngày trong tương lai — chưa có dữ liệu điểm danh', color: 'text-orange-600' }
}

const ITEMS_PER_PAGE = 10

export default function AttendanceTab() {
    const today = new Date()
    const [selectedDate, setSelectedDate] = useState(toDateStr(today))
    const [lessons, setLessons] = useState([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const d = new Date(selectedDate + 'T00:00:00')
            const month = d.getMonth() + 1
            const year = d.getFullYear()

            const res = await fetch(`/api/checkin?month=${month}&year=${year}`)
            const json = await res.json()
            const dayLessons = (json.data || []).filter(l => {
                const lDate = new Date(l.date)
                return toDateStr(lDate) === selectedDate
            })

            const enriched = dayLessons.map(l => {
                const students = l.students || []
                const total = students.length
                const present = students.filter(s => {
                    if (l.type === 'trial') return s.checkin === true
                    return s.Learn?.[0]?.Checkin === 1
                }).length
                const absent = students.filter(s => {
                    if (l.type === 'trial') return s.checkin === false
                    return [2, 3].includes(s.Learn?.[0]?.Checkin)
                }).length
                const unchecked = students.filter(s => {
                    if (l.type === 'trial') return s.checkin == null
                    return s.Learn?.[0]?.Checkin === 0 || s.Learn?.[0]?.Checkin == null
                }).length
                const typeLabel = l.type === 'trial' ? 'Lớp học thử' : 'Lớp thường'
                return { ...l, totalStudents: total, present, absent, unchecked, typeLabel }
            })

            setLessons(enriched)
            setPage(1)
        } catch (err) {
            console.error(err)
            setLessons([])
        } finally {
            setLoading(false)
        }
    }, [selectedDate])

    useEffect(() => { fetchData() }, [fetchData])

    const totalStudents = lessons.reduce((s, l) => s + l.totalStudents, 0)
    const totalPresent = lessons.reduce((s, l) => s + l.present, 0)
    const totalAbsent = lessons.reduce((s, l) => s + l.absent, 0)
    const totalRate = totalStudents > 0 ? Math.round(totalPresent / totalStudents * 100) : 0

    const totalPages = Math.ceil(lessons.length / ITEMS_PER_PAGE)
    const startIdx = (page - 1) * ITEMS_PER_PAGE
    const pageItems = lessons.slice(startIdx, startIdx + ITEMS_PER_PAGE)

    const dateCtx = getDateContext(selectedDate)

    return (
        <div className="flex flex-col gap-4 overflow-auto pb-4">
            <div className="flex items-center gap-3 flex-wrap">
                <label className="text-sm font-medium text-[var(--text-primary)]">Ngày:</label>
                <input
                    type="date"
                    value={selectedDate}
                    onChange={e => setSelectedDate(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded bg-white text-sm outline-none text-gray-700 font-medium"
                />
                <span className={`text-xs font-medium ${dateCtx.color}`}>{dateCtx.text}</span>
                <span className="text-xs text-[var(--text-secondary)] ml-auto">{lessons.length} lớp</span>
            </div>

            <div className="grid grid-cols-5 gap-3">
                {[
                    { label: 'Tổng số lớp', value: lessons.length, bg: 'bg-violet-50', border: 'border-violet-200', textColor: 'text-violet-700', valueColor: 'text-violet-800' },
                    { label: 'Tổng số học sinh', value: totalStudents, bg: 'bg-blue-50', border: 'border-blue-200', textColor: 'text-blue-700', valueColor: 'text-blue-800' },
                    { label: 'Học sinh có mặt', value: totalPresent, bg: 'bg-emerald-50', border: 'border-emerald-200', textColor: 'text-emerald-700', valueColor: 'text-emerald-800' },
                    { label: 'Học sinh vắng', value: totalAbsent, bg: 'bg-rose-50', border: 'border-rose-200', textColor: 'text-rose-700', valueColor: 'text-rose-800' },
                    { label: 'Tỉ lệ chuyên cần', value: `${totalRate}%`, bg: 'bg-amber-50', border: 'border-amber-200', textColor: 'text-amber-700', valueColor: totalRate >= 80 ? 'text-emerald-800' : totalRate >= 50 ? 'text-amber-800' : 'text-rose-800' },
                ].map(c => (
                    <div key={c.label} className={`flex flex-col items-center justify-center p-4 ${c.bg} ${c.border} border rounded-xl text-center gap-1`}>
                        <span className={`text-xs font-medium ${c.textColor}`}>{c.label}</span>
                        <strong className={`text-2xl font-bold ${c.valueColor}`}>{c.value}</strong>
                    </div>
                ))}
            </div>

            <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs min-h-[400px]">
                {loading ? (
                    <SkeletonTable rows={8} columns={9} headers={['STT', 'Lớp', 'Giáo viên', 'Phòng', 'Phân loại', 'Giờ', 'Sĩ số', 'Có mặt', 'Vắng']} />
                ) : lessons.length === 0 ? (
                    <EmptyState
                        title="Không có buổi học nào vào ngày đã chọn"
                        description="Vui lòng chọn ngày khác trên lịch để xem báo cáo điểm danh chuyên cần."
                        actionText="Chọn ngày hôm nay"
                        onAction={() => setSelectedDate(toDateStr(new Date()))}
                    />
                ) : (
                    <div className="overflow-auto max-h-[560px]">
                        <table className="w-full text-xs border-collapse">
                            <thead>
                                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider sticky top-0 z-10">
                                    <th className="p-3 text-center w-12">STT</th>
                                    <th className="p-3 text-left">Lớp / Khóa học</th>
                                    <th className="p-3 text-left">Giáo viên</th>
                                    <th className="p-3 text-left">Phòng</th>
                                    <th className="p-3 text-left">Phân loại</th>
                                    <th className="p-3 text-left">Giờ học</th>
                                    <th className="p-3 text-center">Sĩ số</th>
                                    <th className="p-3 text-center">Có mặt</th>
                                    <th className="p-3 text-center">Vắng</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {pageItems.map((l, i) => {
                                    const hasUnchecked = l.unchecked > 0;
                                    return (
                                        <tr key={l._id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-3 text-center text-slate-400 font-medium">{startIdx + i + 1}</td>
                                            <td className="p-3 font-medium text-slate-900">
                                                <div className="flex items-center gap-1.5">
                                                    <Link href={`/course/${l.courseId || l._id}`} className="font-semibold text-slate-900 hover:text-indigo-600 transition-colors no-underline">
                                                        {l.courseId || l.courseName}
                                                    </Link>
                                                    {hasUnchecked && (
                                                        <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                                                            Chưa ĐD
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3 text-slate-600">{l.teacher?.name || '—'}</td>
                                            <td className="p-3 text-slate-600">{l.room?.name || '—'}</td>
                                            <td className="p-3">
                                                <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                                    l.typeLabel === 'Lớp học thử'
                                                        ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                                        : 'bg-blue-50 text-blue-700 border border-blue-200'
                                                }`}>
                                                    {l.typeLabel === 'Lớp học thử' ? 'Học thử' : 'Chính thức'}
                                                </span>
                                            </td>
                                            <td className="p-3 text-slate-600 font-mono text-[11px]">{l.time || '—'}</td>
                                            <td className="p-3 text-center font-bold text-slate-900">{l.totalStudents}</td>
                                            <td className="p-3 text-center font-bold text-emerald-600">{l.present}</td>
                                            <td className="p-3 text-center font-bold text-rose-600">{l.absent}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {!loading && lessons.length > ITEMS_PER_PAGE && (
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}
                        className="px-3 py-1.5 rounded bg-gray-200 text-sm cursor-pointer border-none disabled:opacity-40 hover:bg-gray-100">
                        Trước
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                        <button key={p} onClick={() => setPage(p)}
                            className={`w-8 h-8 rounded text-sm cursor-pointer border-none ${
                                p === page ? 'bg-[var(--main_d)] text-white' : 'bg-gray-200 hover:bg-gray-100'
                            }`}>
                            {p}
                        </button>
                    ))}
                    <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}
                        className="px-3 py-1.5 rounded bg-gray-200 text-sm cursor-pointer border-none disabled:opacity-40 hover:bg-gray-100">
                        Sau
                    </button>
                </div>
            )}
        </div>
    )
}
