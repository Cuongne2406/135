'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

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
            let dayLessons = (json.data || []).filter(l => {
                const lDate = new Date(l.date)
                return toDateStr(lDate) === selectedDate
            })

            if (dayLessons.length === 0) {
                const testRes = await fetch('/api/test/attendance')
                const testJson = await testRes.json()
                dayLessons = (testJson.data || []).filter(l => {
                    const lDate = new Date(l.date)
                    return toDateStr(lDate) === selectedDate
                })
            }

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

            <div className="bg-white border border-[var(--border-color)] rounded-lg" style={{ height: 560 }}>
                <div className="overflow-auto h-full">
                <table className="w-full text-sm table-fixed" style={{ minWidth: 800 }}>
                    <colgroup>
                        <col style={{ width: 56 }} />
                        <col style={{ width: 130 }} />
                        <col style={{ width: 130 }} />
                        <col style={{ width: 90 }} />
                        <col style={{ width: 110 }} />
                        <col style={{ width: 100 }} />
                        <col style={{ width: 70 }} />
                        <col style={{ width: 70 }} />
                        <col style={{ width: 70 }} />
                    </colgroup>
                    <thead className="sticky top-0 z-10">
                        <tr className="bg-[var(--main_d)] text-white">
                            <th className="p-2 font-medium text-center">STT</th>
                            <th className="p-2 font-medium text-left">Lớp</th>
                            <th className="p-2 font-medium text-left">Giáo viên</th>
                            <th className="p-2 font-medium text-left">Phòng</th>
                            <th className="p-2 font-medium text-left">Phân loại</th>
                            <th className="p-2 font-medium text-left">Giờ</th>
                            <th className="p-2 font-medium text-center">Sĩ số</th>
                            <th className="p-2 font-medium text-center">Có mặt</th>
                            <th className="p-2 font-medium text-center">Vắng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={9} className="p-8 text-center text-sm text-[var(--text-secondary)]">Đang tải...</td>
                            </tr>
                        ) : (
                            (() => {
                                const rows = []
                                if (lessons.length === 0) {
                                    rows.push(
                                        <tr key="empty-msg">
                                            <td colSpan={9} className="p-8 text-center text-sm text-[var(--text-secondary)]">Hôm nay không có buổi học nào</td>
                                        </tr>
                                    )
                                    for (let i = 1; i < ITEMS_PER_PAGE; i++) {
                                        rows.push(
                                            <tr key={`empty-${i}`} className="bg-white border-b border-[var(--border-color)]" style={{ height: 48 }}>
                                                <td colSpan={9}></td>
                                            </tr>
                                        )
                                    }
                                } else {
                                    for (let i = 0; i < ITEMS_PER_PAGE; i++) {
                                        const l = pageItems[i]
                                        if (l) {
                                            const hasUnchecked = l.unchecked > 0
                                            rows.push(
                                                <tr key={l._id} className="bg-white border-b border-[var(--border-color)] hover:bg-blue-50 transition-colors" style={{ height: 48 }}>
                                                    <td className="p-2 text-center text-[var(--text-secondary)]">{startIdx + i + 1}</td>
                                                    <td className="p-2 font-medium truncate">
                                                        <div className="flex items-center gap-1">
                                                            <Link href={`/course/${l.courseId || l._id}`} className="text-[var(--main_d)] hover:underline font-semibold">
                                                                {l.courseId || l.courseName}
                                                            </Link>
                                                            {hasUnchecked && (
                                                                <span className="shrink-0 px-1 py-0.5 rounded font-bold bg-orange-500 text-white" style={{ fontSize: 11 }}>
                                                                    Chưa ĐD
                                                                </span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="p-2 text-[var(--text-secondary)] truncate">{l.teacher?.name || '—'}</td>
                                                    <td className="p-2 text-[var(--text-secondary)]">{l.room?.name || '—'}</td>
                                                    <td className="p-2">
                                                        <span className={`px-1.5 py-0.5 rounded font-semibold text-white text-sm ${
                                                            l.typeLabel === 'Lớp học thử' ? 'bg-purple-600' : 'bg-blue-600'
                                                        }`}>
                                                            {l.typeLabel === 'Lớp học thử' ? 'Học thử' : 'Thường'}
                                                        </span>
                                                    </td>
                                                    <td className="p-2 text-[var(--text-secondary)]">{l.time || '—'}</td>
                                                    <td className="p-2 text-center text-[var(--text-primary)] font-medium">{l.totalStudents}</td>
                                                    <td className="p-2 text-center text-green-600 font-bold">{l.present}</td>
                                                    <td className="p-2 text-center text-red-600 font-bold">{l.absent}</td>
                                                </tr>
                                            )
                                        } else {
                                            rows.push(
                                                <tr key={`empty-${i}`} className="bg-white border-b border-[var(--border-color)]" style={{ height: 48 }}>
                                                    <td colSpan={9}></td>
                                                </tr>
                                            )
                                        }
                                    }
                                }
                                return rows
                            })()
                        )}
                    </tbody>
                </table>
                </div>
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
