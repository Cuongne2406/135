'use client'

import { useState, useMemo } from 'react'
import React from 'react'
import Link from 'next/link'
import Pay from '@/app/student/list/ui/pay'
import BankManager from '@/components/bank-manager'

function fmtPrice(price) {
    const n = Number(price)
    if (!n || isNaN(n)) return '—'
    return n.toLocaleString('vi-VN') + ' VNĐ'
}

export default function DebtClient({ students, courseMap, attendanceMap }) {
    const [search, setSearch] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [viewMode, setViewMode] = useState('flat')
    const [expanded, setExpanded] = useState({})
    const [tab, setTab] = useState('tuition')

const rows = useMemo(() => {
    const result = []
    const seen = new Set()
    students.forEach(s => {
        ;(s.Course || []).forEach(c => {
            const cid = String(c.course)
            const key = s._id + '-' + cid
            if (seen.has(key)) return
            seen.add(key)
            result.push({
                _id: s._id,
                ID: s.ID,
                Name: s.Name,
                Phone: s.Phone,
                AreaName: s.Area?.name || '-',
                courseId: cid,
                courseName: (courseMap[cid]?.name) || cid.slice(-6),
                price: courseMap[cid]?.price,
                startDate: courseMap[cid]?.startDate,
                endDate: courseMap[cid]?.endDate,
                status: c.status,
                paid: c.tuition != null,
                attended: attendanceMap?.[cid]?.[s.ID] || 0,
            })
            })
        })
        result.sort((a, b) => (a.courseName || '').localeCompare(b.courseName || ''))
        return result
    }, [students, courseMap, attendanceMap])

    const filtered = useMemo(() => {
        let result = rows
        if (search.trim()) {
            const q = search.toLowerCase()
            result = result.filter(r => r.ID?.toLowerCase().includes(q) || r.Name?.toLowerCase().includes(q))
        }
        if (statusFilter === 'paid') result = result.filter(r => r.paid)
        else if (statusFilter === 'unpaid') result = result.filter(r => !r.paid)
        return result
    }, [rows, search, statusFilter])

    const grouped = useMemo(() => {
        const map = {}
        filtered.forEach(r => {
            if (!map[r.courseId]) map[r.courseId] = []
            map[r.courseId].push(r)
        })
        return Object.entries(map).sort((a, b) =>
            (a[1][0].courseName || '').localeCompare(b[1][0].courseName || '')
        )
    }, [filtered])

    function renderFlat() {
        return (
            <div className="overflow-x-auto bg-[var(--bg-primary)] rounded border border-[var(--border-color)] flex-1">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left bg-[var(--main_d)] text-white">
                            <th className="p-2.5 font-medium">Lớp</th>
                            <th className="p-2.5 font-medium">Ngày BĐ</th>
                            <th className="p-2.5 font-medium">Ngày KT</th>
                            <th className="p-2.5 font-medium">ID</th>
                            <th className="p-2.5 font-medium">Tên</th>
                            <th className="p-2.5 font-medium">Điện thoại</th>
                            <th className="p-2.5 font-medium">Đã học</th>
                            <th className="p-2.5 font-medium">Số tiền</th>
                            <th className="p-2.5 font-medium">Đóng tiền</th>
                            <th className="p-2.5 font-medium">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(r => (
                            <tr key={r._id + '-' + r.courseId} className="border-t border-[var(--border-color)] hover:bg-[var(--hover)]">
                                <td className="p-2.5">
                                    <Link href={`/course/${r.courseId}`} className="inline-block px-2 py-1 rounded-md text-sm font-medium text-[var(--main_d)] bg-[var(--main_d)]/10 hover:bg-[var(--main_d)]/20 transition-colors">{r.courseName}</Link>
                                </td>
                                <td className="p-2.5 text-[var(--text-primary)] text-xs">{r.startDate ? new Date(r.startDate).toLocaleDateString('vi-VN') : '—'}</td>
                                <td className="p-2.5 text-[var(--text-primary)] text-xs">{r.endDate ? new Date(r.endDate).toLocaleDateString('vi-VN') : '—'}</td>
                                <td className="p-2.5 text-[var(--text-primary)]">{r.ID}</td>
                                <td className="p-2.5">
                                    <Link href={`/${r._id}`} className="text-[var(--main_d)] hover:underline">{r.Name}</Link>
                                </td>
                                <td className="p-2.5 text-[var(--text-secondary)]">{r.Phone || '—'}</td>
                                <td className="p-2.5 text-[var(--text-primary)]">{r.attended}</td>
                                <td className="p-2.5">{fmtPrice(r.price)}</td>
                                <td className="p-2.5">
                                    {r.paid ? (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Đã đóng</span>
                                    ) : (
                                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Chưa đóng</span>
                                    )}
                                </td>
                                <td className="p-2.5">
                                    <Pay _id={r._id} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )
    }

    function renderGrouped() {
        return (
            <div className="overflow-x-auto bg-[var(--bg-primary)] rounded border border-[var(--border-color)] flex-1">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left bg-[var(--main_d)] text-white">
                            <th className="p-2.5 font-medium w-[14%]">Lớp</th>
                            <th className="p-2.5 font-medium w-[8%]">Ngày BĐ</th>
                            <th className="p-2.5 font-medium w-[8%]">Ngày KT</th>
                            <th className="p-2.5 font-medium w-[7%]">ID</th>
                            <th className="p-2.5 font-medium w-[15%]">Tên</th>
                            <th className="p-2.5 font-medium w-[10%]">Điện thoại</th>
                            <th className="p-2.5 font-medium w-[6%]">Đã học</th>
                            <th className="p-2.5 font-medium w-[14%]">Số tiền</th>
                            <th className="p-2.5 font-medium">Đóng tiền</th>
                            <th className="p-2.5 font-medium">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {grouped.map(([cid, list]) => {
                            const courseName = list[0].courseName
                            const open = expanded[cid] !== false
                            return (
                                <React.Fragment key={cid}>
                                    <tr className="border-t border-[var(--border-color)] bg-[var(--main_d)]/5 hover:bg-[var(--main_d)]/10 transition-colors">
                                        <td className="p-2.5 font-semibold text-[var(--main_d)]" colSpan={10}>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setExpanded(p => ({ ...p, [cid]: !open }))}
                                                    className="flex items-center gap-2 cursor-pointer"
                                                >
                                                    <svg
                                                        className={`shrink-0 transition-transform ${open ? 'rotate-90' : ''}`}
                                                        xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" height={10} width={10} fill="currentColor"
                                                    >
                                                        <path d="M278.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-160 160c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L210.7 256 73.4 118.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l160 160z" />
                                                    </svg>
                                                    <Link href={`/course/${cid}`} onClick={e => e.stopPropagation()} className="px-2 py-1 rounded-md bg-[var(--main_d)]/10 hover:bg-[var(--main_d)]/20 transition-colors">{courseName}</Link>
                                                </button>
                                                <span className="ml-auto text-xs text-[var(--text-secondary)] font-normal">{list.length} học sinh</span>
                                            </div>
                                        </td>
                                    </tr>
                                    {open && list.map(r => (
                                        <tr
                                            key={r._id + '-' + r.courseId}
                                            className="border-t border-[var(--border-color)] hover:bg-[var(--hover)]"
                                        >
                                        <td className="p-2.5">
                                            <Link href={`/course/${r.courseId}`} className="inline-block px-2 py-1 rounded-md text-sm font-medium text-[var(--main_d)] bg-[var(--main_d)]/10 hover:bg-[var(--main_d)]/20 transition-colors">{r.courseName}</Link>
                                        </td>
                                        <td className="p-2.5 text-[var(--text-primary)] text-xs">{r.startDate ? new Date(r.startDate).toLocaleDateString('vi-VN') : '—'}</td>
                                        <td className="p-2.5 text-[var(--text-primary)] text-xs">{r.endDate ? new Date(r.endDate).toLocaleDateString('vi-VN') : '—'}</td>
                                        <td className="p-2.5 text-[var(--text-primary)]">{r.ID}</td>
                                        <td className="p-2.5">
                                            <Link href={`/${r._id}`} className="text-[var(--main_d)] hover:underline">{r.Name}</Link>
                                        </td>
                                        <td className="p-2.5 text-[var(--text-secondary)]">{r.Phone || '—'}</td>
                                        <td className="p-2.5 text-[var(--text-primary)]">{r.attended}</td>
                                        <td className="p-2.5">{fmtPrice(r.price)}</td>
                                        <td className="p-2.5">
                                                {r.paid ? (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">Đã đóng</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">Chưa đóng</span>
                                                )}
                                            </td>
                                            <td className="p-2.5">
                                                <Pay _id={r._id} />
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="border-t-0">
                                        <td colSpan={10} className="h-2 bg-gray-50"></td>
                                    </tr>
                                </React.Fragment>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-3 p-4 h-full">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Quản lý học phí</h2>
            </div>

            <div className="flex gap-0 border-b border-[var(--border-color)]">
                <button
                    className={`px-4 py-2 text-sm font-medium transition-colors ${tab === 'tuition' ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    onClick={() => setTab('tuition')}
                >
                    Danh sách
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium transition-colors ${tab === 'bank' ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    onClick={() => setTab('bank')}
                >
                    Ngân hàng
                </button>
            </div>

            {tab === 'tuition' ? (
                <>
            <div className="flex items-center gap-2">
                <input
                    className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 flex-1"
                    placeholder="Tìm theo tên hoặc ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                />
                <select
                    className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700"
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value)}
                >
                    <option value="all">Tất cả</option>
                    <option value="unpaid">Chưa đóng</option>
                    <option value="paid">Đã đóng</option>
                </select>
                <button
                    onClick={() => setViewMode(v => v === 'flat' ? 'grouped' : 'flat')}
                    className="px-3 py-2 text-xs rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--main_d)] transition-colors whitespace-nowrap"
                >
                    {viewMode === 'flat' ? 'Theo lớp' : 'Danh sách'}
                </button>
            </div>

            {filtered.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-secondary)]">
                    Không có học sinh nợ học phí
                </div>
            ) : viewMode === 'flat' ? renderFlat() : renderGrouped()}
                </>
            ) : (
                <BankManager />
            )}
        </div>
    )
}
