'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'

const statusMap = {
    MAKEUP_PENDING: { label: 'Chờ xếp lịch bù', color: 'bg-[#fff3e0] text-[#e65100]' },
    MAKEUP_REQUIRED: { label: 'Cần học bù', color: 'bg-[#fef3cd] text-[#856404]' },
    MAKEUP_SCHEDULED: { label: 'Đã xếp lịch bù', color: 'bg-[#e3f2fd] text-[#1565c0]' },
    MAKEUP_COMPLETED: { label: 'Đã học bù', color: 'bg-[#e8f5e9] text-[#2e7d32]' },
    MAKEUP_ABSENT: { label: 'Vắng buổi bù', color: 'bg-[#ffebee] text-[#c62828]' },
    MAKEUP_EXPIRED: { label: 'Quá hạn học bù', color: 'bg-[#f3e5f5] text-[#6a1b9a]' },
    MAKEUP_CANCELLED: { label: 'Hủy học bù', color: 'bg-[#eceff1] text-[#607d8b]' },
    NOT_REQUIRED: { label: 'Không cần học bù', color: 'bg-[#f1f3f5] text-[#6c757d]' },
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
                        className={`text-xs px-3 py-1 rounded border ${statusFilter === f ? 'bg-[#1565c0] text-white border-[#1565c0]' : 'bg-[var(--bg-primary)] text-[var(--text-primary)] border-[var(--border-color)]'}`}>
                        {statusMap[f]?.label || 'Tất cả'}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center p-8"><p>Đang tải...</p></div>
            ) : sessions.length === 0 ? (
                <div className="flex items-center justify-center p-8 bg-[var(--bg-primary)] rounded border border-[var(--border-color)]">
                    <p className="text-[var(--text-secondary)]">Không có phiên học bù nào</p>
                </div>
            ) : (
                <div className="overflow-x-auto bg-[var(--bg-primary)] rounded border border-[var(--border-color)]">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-[var(--border-color)] text-left">
                                <th className="p-3 font-medium text-[var(--text-primary)]">Học sinh</th>
                                <th className="p-3 font-medium text-[var(--text-primary)]">Khóa học</th>
                                <th className="p-3 font-medium text-[var(--text-primary)]">Nội dung cần bù</th>
                                <th className="p-3 font-medium text-[var(--text-primary)]">Lịch bù</th>
                                <th className="p-3 font-medium text-[var(--text-primary)]">Trạng thái</th>
                                <th className="p-3 font-medium text-[var(--text-primary)]">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sessions.map(s => {
                                const st = statusMap[s.makeupStatus] || { label: s.makeupStatus, color: '' }
                                return (
                                    <tr key={s._id} className="border-b border-[var(--border-color)] hover:bg-[var(--bg-hover)]">
                                        <td className="p-3 text-[var(--text-primary)]">{s.studentName}</td>
                                        <td className="p-3 text-[var(--text-primary)]">{s.course?.Name || s.course?.ID || 'N/A'}</td>
                                        <td className="p-3 text-[var(--text-primary)]">{s.contentToMakeup || '—'}</td>
                                        <td className="p-3 text-[var(--text-primary)]">
                                            {s.makeupDate ? new Date(s.makeupDate).toLocaleDateString('vi-VN') : '—'}
                                            {s.makeupTime ? ` ${s.makeupTime}` : ''}
                                        </td>
                                        <td className="p-3">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${st.color}`}>{st.label}</span>
                                        </td>
                                        <td className="p-3 flex gap-1">
                                            {s.makeupStatus === 'MAKEUP_PENDING' && (
                                                <button onClick={() => handleStatusChange(s._id, 'MAKEUP_SCHEDULED')}
                                                    className="text-xs px-2 py-1 rounded bg-[#e3f2fd] text-[#1565c0]">Xếp lịch</button>
                                            )}
                                            {s.makeupStatus === 'MAKEUP_SCHEDULED' && (
                                                <button onClick={() => handleStatusChange(s._id, 'MAKEUP_COMPLETED')}
                                                    className="text-xs px-2 py-1 rounded bg-[#e8f5e9] text-[#2e7d32]">Xác nhận đã học</button>
                                            )}
                                            {['MAKEUP_PENDING', 'MAKEUP_SCHEDULED'].includes(s.makeupStatus) && (
                                                <button onClick={() => handleStatusChange(s._id, 'MAKEUP_CANCELLED')}
                                                    className="text-xs px-2 py-1 rounded bg-[#ffebee] text-[#c62828]">Hủy</button>
                                            )}
                                            <button onClick={() => handleDelete(s._id)}
                                                className="text-xs px-2 py-1 rounded bg-[#eceff1] text-[#607d8b]">Xóa</button>
                                            {s.course?._id && (
                                                <Link href={`/course/${s.course._id}`} className="text-xs px-2 py-1 rounded bg-[#f1f3f5] text-[#6c757d]">
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
