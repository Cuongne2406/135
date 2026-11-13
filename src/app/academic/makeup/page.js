'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import SkeletonTable from '@/components/ui/SkeletonTable'
import EmptyState from '@/components/ui/EmptyState'

const statusMap = {
    MAKEUP_PENDING: { label: 'Chờ xếp lịch bù', color: 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]' },
    MAKEUP_REQUIRED: { label: 'Cần học bù', color: 'bg-[#fffbeb] text-[#b45309] border border-[#fde68a]' },
    MAKEUP_SCHEDULED: { label: 'Đã xếp lịch bù', color: 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]' },
    MAKEUP_COMPLETED: { label: 'Đã học bù', color: 'bg-[#f0fdf4] text-[#15803d] border border-[#bbf7d0]' },
    MAKEUP_ABSENT: { label: 'Vắng buổi bù', color: 'bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]' },
    MAKEUP_EXPIRED: { label: 'Quá hạn học bù', color: 'bg-[#fef2f2] text-[#b91c1c] border border-[#fecaca]' },
    MAKEUP_CANCELLED: { label: 'Hủy học bù', color: 'bg-[#f8fafc] text-[#475569] border border-[#e2e8f0]' },
    NOT_REQUIRED: { label: 'Không cần học bù', color: 'bg-[#f8fafc] text-[#475569] border border-[#e2e8f0]' },
}

export default function MakeupPage() {
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [statusFilter, setStatusFilter] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [formData, setFormData] = useState({
        courseId: '',
        lessonId: '',
        studentId: '',
        makeupDate: '',
        makeupTime: '',
        contentToMakeup: '',
        note: '',
    })
    const [saving, setSaving] = useState(false)
    const [msg, setMsg] = useState('')

    const fetchSessions = useCallback(async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (statusFilter) params.set('status', statusFilter)
            const res = await fetch(`/api/academic/makeup-sessions?${params}`)
            const json = await res.json()
            setSessions(json.items || [])
        } catch (err) {
            console.error(err)
            setMsg('Không thể tải danh sách học bù. Vui lòng kiểm tra kết nối mạng.')
        } finally {
            setLoading(false)
        }
    }, [statusFilter])

    useEffect(() => { fetchSessions() }, [fetchSessions])

    const handleStatusChange = async (id, newStatus) => {
        try {
            const res = await fetch(`/api/academic/makeup-sessions/${id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ makeupStatus: newStatus }),
            })
            if (res.ok) {
                setMsg('Cập nhật trạng thái thành công')
                fetchSessions()
            }
        } catch (err) {
            console.error(err)
            setMsg('Lỗi khi cập nhật')
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Xóa phiên học bù này?')) return
        try {
            const res = await fetch(`/api/academic/makeup-sessions/${id}`, { method: 'DELETE' })
            if (res.ok) {
                setMsg('Đã xóa phiên học bù')
                fetchSessions()
            }
        } catch (err) {
            console.error(err)
            setMsg('Lỗi khi xóa phiên học bù: ' + (err.message || 'Lỗi mạng'))
        }
    }

    const handleCreate = async (e) => {
        e.preventDefault()
        setSaving(true)
        try {
            const res = await fetch('/api/academic/makeup-sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })
            if (res.ok) {
                setMsg('Tạo yêu cầu học bù thành công')
                setShowForm(false)
                setFormData({ courseId: '', lessonId: '', studentId: '', makeupDate: '', makeupTime: '', contentToMakeup: '', note: '' })
                fetchSessions()
            } else {
                const err = await res.json()
                setMsg(err.error || 'Lỗi khi tạo')
            }
        } catch (err) {
            setMsg(err.message)
        } finally {
            setSaving(false)
        }
    }

    const filters = ['', 'MAKEUP_PENDING', 'MAKEUP_SCHEDULED', 'MAKEUP_COMPLETED', 'MAKEUP_ABSENT', 'MAKEUP_EXPIRED']

    return (
        <div className="flex flex-col gap-4 p-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Quản lý học bù</h2>
                <button onClick={() => setShowForm(!showForm)} className="text-sm px-4 py-2 rounded bg-[#1565c0] text-white hover:opacity-80">
                    {showForm ? 'Đóng' : '+ Tạo yêu cầu học bù'}
                </button>
            </div>

            {msg && (
                <div className="px-4 py-2 rounded bg-[#e8f5e9] text-[#2e7d32] text-sm flex justify-between items-center">
                    <span>{msg}</span>
                    <button onClick={() => setMsg('')} className="text-[#2e7d32]">&times;</button>
                </div>
            )}

            {showForm && (
                <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 bg-[var(--bg-primary)] rounded border border-[var(--border-color)]">
                    <input className="input text-sm p-2 border rounded" placeholder="Course ID" value={formData.courseId} onChange={e => setFormData(f => ({ ...f, courseId: e.target.value }))} required />
                    <input className="input text-sm p-2 border rounded" placeholder="Lesson ID" value={formData.lessonId} onChange={e => setFormData(f => ({ ...f, lessonId: e.target.value }))} required />
                    <input className="input text-sm p-2 border rounded" placeholder="Student ID (mã học sinh)" value={formData.studentId} onChange={e => setFormData(f => ({ ...f, studentId: e.target.value }))} required />
                    <input className="input text-sm p-2 border rounded" type="date" placeholder="Ngày học bù" value={formData.makeupDate} onChange={e => setFormData(f => ({ ...f, makeupDate: e.target.value }))} />
                    <input className="input text-sm p-2 border rounded" type="time" placeholder="Giờ học bù" value={formData.makeupTime} onChange={e => setFormData(f => ({ ...f, makeupTime: e.target.value }))} />
                    <input className="input text-sm p-2 border rounded" placeholder="Nội dung cần bù" value={formData.contentToMakeup} onChange={e => setFormData(f => ({ ...f, contentToMakeup: e.target.value }))} />
                    <input className="input text-sm p-2 border rounded md:col-span-2" placeholder="Ghi chú" value={formData.note} onChange={e => setFormData(f => ({ ...f, note: e.target.value }))} />
                    <button type="submit" disabled={saving} className="md:col-span-2 text-sm px-4 py-2 rounded bg-[#2e7d32] text-white hover:opacity-80 disabled:opacity-50">
                        {saving ? 'Đang lưu...' : 'Tạo yêu cầu'}
                    </button>
                </form>
            )}

            <div className="flex gap-2 flex-wrap">
                {filters.map(f => (
                    <button key={f} onClick={() => setStatusFilter(f)}
                        className={`text-xs px-3 py-1.5 rounded-md font-medium border transition-colors cursor-pointer ${statusFilter === f ? 'bg-[var(--main_d)] text-white border-[var(--main_d)] shadow-xs' : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'}`}>
                        {statusMap[f]?.label || 'Tất cả'}
                    </button>
                ))}
            </div>

            {loading ? (
                <SkeletonTable rows={5} columns={6} headers={['Học sinh', 'Khóa học', 'Nội dung cần bù', 'Lịch bù', 'Trạng thái', 'Hành động']} />
            ) : sessions.length === 0 ? (
                <EmptyState
                    title="Không có phiên học bù nào"
                    description="Hiện tại không có yêu cầu hoặc lịch học bù nào phù hợp với bộ lọc."
                    actionText={statusFilter ? 'Xem tất cả' : undefined}
                    onAction={statusFilter ? () => setStatusFilter('') : undefined}
                />
            ) : (
                <div className="overflow-x-auto bg-white rounded-lg border border-slate-200 shadow-xs">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="bg-slate-50/90 border-b border-slate-200 text-left">
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Học sinh</th>
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Khóa học</th>
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Nội dung cần bù</th>
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Lịch bù</th>
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Trạng thái</th>
                                <th className="p-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {sessions.map(s => {
                                const st = statusMap[s.makeupStatus] || { label: s.makeupStatus, color: 'bg-slate-50 text-slate-600 border border-slate-200' }
                                return (
                                    <tr key={s._id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-3 font-medium text-slate-900">{s.studentName}</td>
                                        <td className="p-3 text-slate-700">{s.course?.Name || s.course?.ID || '—'}</td>
                                        <td className="p-3 text-slate-600">{s.contentToMakeup || '—'}</td>
                                        <td className="p-3 text-slate-600 font-mono text-xs">
                                            {s.makeupDate ? new Date(s.makeupDate).toLocaleDateString('vi-VN') : '—'}
                                            {s.makeupTime ? ` ${s.makeupTime}` : ''}
                                        </td>
                                        <td className="p-3">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold ${st.color}`}>{st.label}</span>
                                        </td>
                                        <td className="p-3 flex gap-1.5 items-center">
                                            {s.makeupStatus === 'MAKEUP_PENDING' && (
                                                <button onClick={() => handleStatusChange(s._id, 'MAKEUP_SCHEDULED')}
                                                    className="text-xs px-2.5 py-1 rounded-md font-medium bg-[var(--main_d)] text-white hover:bg-[var(--main_b)] transition-colors">Xếp lịch</button>
                                            )}
                                            {s.makeupStatus === 'MAKEUP_SCHEDULED' && (
                                                <button onClick={() => handleStatusChange(s._id, 'MAKEUP_COMPLETED')}
                                                    className="text-xs px-2.5 py-1 rounded-md font-medium bg-emerald-700 text-white hover:bg-emerald-800 transition-colors">Xác nhận học</button>
                                            )}
                                            {['MAKEUP_PENDING', 'MAKEUP_SCHEDULED'].includes(s.makeupStatus) && (
                                                <button onClick={() => handleStatusChange(s._id, 'MAKEUP_CANCELLED')}
                                                    className="text-xs px-2 py-1 rounded-md font-medium bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors">Hủy</button>
                                            )}
                                            <button onClick={() => handleDelete(s._id)}
                                                className="text-xs px-2 py-1 rounded-md font-medium bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">Xóa</button>
                                            {s.course?._id && (
                                                <Link href={`/course/${s.course._id}`} className="text-xs px-2 py-1 rounded-md font-medium bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100 transition-colors">
                                                    Khóa học
                                                </Link>
                                            )}
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    )
}
