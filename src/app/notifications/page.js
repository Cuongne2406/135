'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { srcImage } from '@/function'

const LEVEL_ICON = { INCIDENT: '🔴', WARNING: '🟡', REMINDER: '🔵' }
const LEVEL_CLASS = {
  INCIDENT: 'border-l-red-500 bg-red-50',
  WARNING: 'border-l-yellow-500 bg-yellow-50',
  REMINDER: 'border-l-blue-500 bg-blue-50',
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} ngày trước`
  return new Date(dateStr).toLocaleDateString('vi-VN')
}

export default function NotificationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [data, setData] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, total_pages: 1 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState(searchParams.get('status') || 'ALL')

  const [selectedLeaveNoti, setSelectedLeaveNoti] = useState(null)

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      let queryParam = ''
      if (filter === 'UNREAD') queryParam = '&status=UNREAD'
      else if (filter === 'WARNING') queryParam = '&level=WARNING'
      else if (filter === 'INCIDENT') queryParam = '&level=INCIDENT'
      else if (filter === 'SLA') queryParam = '&type=SLA_VIOLATION'
      else if (filter === 'LEAVE') queryParam = '&type=STUDENT_LEAVE_REQUEST'

      const res = await fetch(`/api/notifications?page=${page}&limit=20${queryParam}`)
      const json = await res.json()
      if (json.success) {
        setData(json.data)
        setPagination(json.pagination)
      }
    } catch (e) {
      console.error('Failed to fetch notifications:', e)
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchData(1) }, [fetchData])

  const handleFilterChange = (newFilter) => {
    setFilter(newFilter)
    router.replace(`/notifications?status=${newFilter}`)
  }

  const handleMarkAllRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'PUT' })
      fetchData(pagination.page)
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-[var(--text-primary)]">Thông báo</h1>
        <button
          onClick={handleMarkAllRead}
          className="px-3 py-1.5 text-xs font-medium text-[var(--main_d)] border border-[var(--main_d)] rounded-lg hover:bg-[var(--main_l)] transition-colors cursor-pointer"
        >
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'UNREAD', label: 'Chưa đọc' },
          { key: 'LEAVE', label: 'Nghỉ phép' },
          { key: 'WARNING', label: 'Cảnh báo' },
          { key: 'INCIDENT', label: 'Sự cố' },
          { key: 'SLA', label: 'Quá hạn (SLA)' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors cursor-pointer
              ${filter === tab.key
                ? 'bg-[var(--main_d)] text-white shadow-sm'
                : 'text-[var(--text-secondary)] bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-[var(--hover)]'}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-[var(--main_d)] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-[var(--text-secondary)]">
            <span className="text-3xl mb-2 opacity-50">🔕</span>
            <p className="text-base font-medium">Không có thông báo nào</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data.map((n) => {
              const isLeaveNoti = n.type === 'STUDENT_LEAVE_REQUEST' || n.type === 'STUDENT_LEAVE_CANCEL'
              const isUnread = n.read_status !== 'READ'

              return (
                <div
                  key={n._id}
                  onClick={async () => {
                    try { await fetch(`/api/notifications/${n._id}/read`, { method: 'PUT' }) } catch {}
                    
                    // Nếu là Đơn xin nghỉ: Bật Modal xem chi tiết
                    if (isLeaveNoti) {
                      setSelectedLeaveNoti(n)
                      return
                    }

                    const refLessonId = typeof n.ref_lesson === 'object' && n.ref_lesson !== null
                      ? (n.ref_lesson._id || n.ref_lesson.id)
                      : n.ref_lesson

                    const refCourseId = typeof n.ref_course === 'object' && n.ref_course !== null
                      ? (n.ref_course._id || n.ref_course.id)
                      : n.ref_course

                    if (refLessonId) {
                      router.push(`/calendar/${refLessonId}`)
                    } else if (refCourseId) {
                      router.push(`/course/${refCourseId}`)
                    } else {
                      router.push(`/notifications/${n._id}`)
                    }
                  }}
                  className={`flex items-start gap-3 p-4 rounded-lg border-l-4 transition-colors cursor-pointer hover:bg-[var(--hover)] bg-[var(--bg-primary)]
                    ${isUnread ? 'border-l-[var(--main_d)] bg-blue-50/20' : 'border-l-transparent'}`}
                >
                  <span className="text-xl shrink-0 mt-0.5">
                    {isLeaveNoti ? '📝' : (LEVEL_ICON[n.level] || '🔵')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm ${isUnread ? 'font-semibold text-[var(--text-primary)]' : 'font-medium text-[var(--text-secondary)]'}`}>
                        {n.title}
                      </p>
                      {isLeaveNoti && (
                        <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200 rounded">
                          Đơn xin nghỉ
                        </span>
                      )}
                      {n.level === 'INCIDENT' && (
                        <span className="px-1.5 py-0.5 text-[10px] font-bold text-red-600 bg-red-50 rounded">Sự cố</span>
                      )}
                      {isUnread && <span className="w-2 h-2 rounded-full bg-[var(--main_d)] shrink-0" />}
                    </div>
                    <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2 leading-relaxed">{n.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                      <span>🕐 {timeAgo(n.createdAt)}</span>
                      {n.ref_course && <span>🏫 Lớp học</span>}
                    </div>
                  </div>
                  <div className="shrink-0 flex items-center">
                    {isUnread && <span className="text-[var(--main_d)] text-lg">›</span>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal Xem Chi Tiết Đơn Xin Nghỉ Phép Của Phụ Huynh */}
      {selectedLeaveNoti && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden text-slate-800">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-amber-100 bg-[#fffbeb]">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📝</span>
                <div>
                  <h3 className="text-base font-semibold text-slate-800">
                    Chi tiết Đơn xin nghỉ phép
                  </h3>
                  <p className="text-xs text-slate-500">
                    Được gửi trực tiếp từ Phụ huynh qua Sổ liên lạc online
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLeaveNoti(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200/50 hover:text-slate-700 transition-colors cursor-pointer text-lg font-bold"
                title="Đóng"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {/* Thẻ học sinh */}
              <div className="flex items-start gap-3 p-3.5 rounded-xl bg-[#f8fafc] border border-slate-200">
                <div className="w-11 h-11 rounded-full overflow-hidden bg-blue-100 border border-slate-200 shrink-0 relative flex items-center justify-center">
                  {selectedLeaveNoti.student_avatar ? (
                    <img
                      src={srcImage(selectedLeaveNoti.student_avatar)}
                      alt="Student Avatar"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fb = e.currentTarget.parentElement?.querySelector('.avatar-fallback');
                        if (fb) fb.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <span className={`text-base avatar-fallback ${selectedLeaveNoti.student_avatar ? 'hidden' : 'flex'}`}>👤</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-slate-500 font-medium">Học sinh xin nghỉ:</p>
                  <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">
                    {selectedLeaveNoti.title.replace(/^Đơn xin nghỉ:\s*/i, '')}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                    <span>🕐 {timeAgo(selectedLeaveNoti.createdAt)}</span>
                    <span>•</span>
                    <span className="text-emerald-600 font-medium">Đã ghi nhận đơn xin nghỉ</span>
                  </div>
                </div>
              </div>

              {/* Lời nhắn / Lý do từ phụ huynh */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Nội dung đơn & Lời nhắn từ Phụ huynh:
                </p>
                <div className="p-4 rounded-xl bg-[#fffbeb] border border-[#fef08a] text-slate-800 text-sm leading-relaxed">
                  <p className="font-medium text-amber-950">
                    {selectedLeaveNoti.content}
                  </p>
                </div>
              </div>

              {/* Trạng thái hệ thống */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl border border-slate-200 bg-[#f8fafc]">
                  <span className="text-[11px] text-slate-500 block font-medium">Điểm danh trên lớp:</span>
                  <span className="text-xs font-semibold text-amber-600 inline-flex items-center gap-1 mt-1">
                    ⚠️ Vắng có phép
                  </span>
                </div>
                <div className="p-3.5 rounded-xl border border-slate-200 bg-[#f8fafc]">
                  <span className="text-[11px] text-slate-500 block font-medium">Học vụ & Học bù:</span>
                  <span className="text-xs font-semibold text-blue-600 inline-flex items-center gap-1 mt-1">
                    🔄 Cần học bù
                  </span>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-slate-200 bg-[#f8fafc]">
              <button
                onClick={() => setSelectedLeaveNoti(null)}
                className="px-4 py-2 text-xs font-medium text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
              >
                Đóng lại
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const target = selectedLeaveNoti.ref_lesson
                      ? `/calendar/${selectedLeaveNoti.ref_lesson}`
                      : `/course/${selectedLeaveNoti.ref_course}`;
                    setSelectedLeaveNoti(null);
                    router.push(target);
                  }}
                  className="px-4 py-2 text-xs font-medium bg-[#0284c7] text-white hover:bg-[#0369a1] rounded-lg shadow-sm transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>📋</span> Mở Sổ điểm danh buổi học
                </button>
                <button
                  onClick={() => {
                    setSelectedLeaveNoti(null);
                    router.push('/academic/makeup');
                  }}
                  className="px-3.5 py-2 text-xs font-medium border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <span>🔄</span> Quản lý học bù
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {pagination.total_pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-[var(--border-color)]">
          <button
            onClick={() => fetchData(Math.max(1, pagination.page - 1))}
            disabled={pagination.page <= 1}
            className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border-color)] disabled:opacity-40"
          >
            ← Trước
          </button>
          <span className="text-sm text-[var(--text-secondary)]">
            {pagination.page} / {pagination.total_pages}
          </span>
          <button
            onClick={() => fetchData(Math.min(pagination.total_pages, pagination.page + 1))}
            disabled={pagination.page >= pagination.total_pages}
            className="px-3 py-1.5 text-sm rounded-lg border border-[var(--border-color)] disabled:opacity-40"
          >
            Sau →
          </button>
        </div>
      )}
    </div>
  )
}
