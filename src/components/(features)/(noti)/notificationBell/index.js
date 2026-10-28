'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Svg_Bell } from '@/components/(icon)/svg'
import useNotification from '@/hooks/useNotification'
import { srcImage } from '@/function'

const LEVEL_ICON = { 
  INCIDENT: '🔴', 
  WARNING: '🟡', 
  REMINDER: '🔵',
  INFO: '📝'
}

function timeAgo(dateStr) {
  if (!dateStr) return 'Vừa xong'
  const time = new Date(dateStr).getTime()
  if (isNaN(time)) return 'Vừa xong'
  const diff = Math.max(0, Date.now() - time)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Vừa xong'
  if (mins < 60) return `${mins} phút trước`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} giờ trước`
  const days = Math.floor(hours / 24)
  return `${days} ngày trước`
}

export default function NotificationBell({ collapsed }) {
  const [isOpen, setIsOpen] = useState(false)
  const [filter, setFilter] = useState('ALL')
  const dropdownRef = useRef(null)
  const router = useRouter()
  const { unreadCount, notifications, loading, markAsRead, markAllAsRead, hasIncident } = useNotification()

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filtered = notifications.filter(n => {
    if (filter === 'ALL') return true
    if (filter === 'UNREAD') return n.read_status !== 'READ'
    if (filter === 'LEAVE') return n.type === 'STUDENT_LEAVE_REQUEST' || n.type === 'STUDENT_LEAVE_CANCEL'
    if (filter === 'WARNING') return n.level === 'WARNING'
    if (filter === 'INCIDENT') return n.level === 'INCIDENT'
    if (filter === 'SLA') return n.type === 'SLA_VIOLATION'
    return true
  })

  const [selectedLeaveNoti, setSelectedLeaveNoti] = useState(null)

  const handleBellClick = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const handleItemClick = useCallback(async (notification) => {
    await markAsRead(notification._id)
    setIsOpen(false)

    // Nếu là Đơn xin nghỉ phép: Mở Modal chi tiết để giáo viên đọc trực tiếp ngay trên màn hình
    if (notification.type === 'STUDENT_LEAVE_REQUEST' || notification.type === 'STUDENT_LEAVE_CANCEL') {
      setSelectedLeaveNoti(notification)
      return
    }

    if (notification.ref_lesson) {
      router.push(`/calendar/${notification.ref_lesson}`)
    } else if (notification.ref_course) {
      router.push(`/course/${notification.ref_course}`)
    } else {
      router.push(`/notifications/${notification._id}`)
    }
  }, [markAsRead, router])

  const handleViewAll = useCallback(() => {
    router.push('/notifications')
    setIsOpen(false)
  }, [router])

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead()
  }, [markAllAsRead])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={handleBellClick}
        className={`relative flex items-center justify-center rounded-lg cursor-pointer transition-all duration-200 hover:bg-[var(--hover)]
          ${collapsed ? 'h-11 w-11' : 'h-10 w-10'}`}
        title="Thông báo"
        aria-label="Thông báo"
      >
        <div className={hasIncident ? 'animate-[shake_0.5s_ease-in-out_infinite]' : ''}>
          <Svg_Bell w={20} h={20} c={unreadCount > 0 ? 'var(--main_d)' : 'var(--text-secondary)'} />
        </div>
        {unreadCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 flex items-center justify-center
            min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white
            bg-red-500 border-2 border-[var(--bg-primary)] shadow-sm
            ${hasIncident ? 'animate-pulse' : ''}`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute z-[9999] bg-[var(--bg-primary)] rounded-xl shadow-2xl
          border border-[var(--border-color)] overflow-hidden
          ${collapsed 
            ? 'left-full ml-3 top-0 w-[490px]' 
            : 'left-0 top-full mt-2 w-[490px]'
          }
          max-md:fixed max-md:left-3 max-md:right-3 max-md:top-16 max-md:w-auto max-md:max-w-none`}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)] bg-[var(--bg-secondary)]/50">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">Thông báo hệ thống</h3>
              {unreadCount > 0 && (
                <span className="text-[11px] px-2 py-0.5 font-medium rounded-full bg-red-100 text-red-600">
                  {unreadCount} mới
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button 
                onClick={handleMarkAllRead} 
                className="text-xs text-[var(--main_d)] hover:underline font-medium cursor-pointer"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[var(--border-color)] overflow-x-auto scrollbar-none bg-[var(--bg-primary)]">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'UNREAD', label: 'Chưa đọc' },
              { key: 'LEAVE', label: 'Nghỉ phép' },
              { key: 'WARNING', label: 'Cảnh báo' },
              { key: 'INCIDENT', label: 'Sự cố' },
              { key: 'SLA', label: 'Quá hạn', tooltip: 'Vi phạm tiến độ / hạn xử lý (SLA)' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                title={tab.tooltip || tab.label}
                className={`px-3 py-1 text-xs rounded-lg whitespace-nowrap transition-colors font-medium cursor-pointer
                  ${filter === tab.key
                    ? 'bg-[var(--main_d)] text-white shadow-sm'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--hover)]'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Items list */}
          <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--border-color)]">
            {loading ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-5 h-5 border-2 border-[var(--main_d)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--text-secondary)]">
                <span className="text-2xl mb-1 opacity-60">🔕</span>
                <p className="text-sm font-medium">Không có thông báo nào</p>
              </div>
            ) : (
              filtered.map((n) => {
                const isLeaveNoti = n.type === 'STUDENT_LEAVE_REQUEST' || n.type === 'STUDENT_LEAVE_CANCEL';
                const isUnread = n.read_status !== 'READ';

                return (
                  <div
                    key={n._id}
                    onClick={() => handleItemClick(n)}
                    className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--hover)]
                      ${isUnread ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''}`}
                  >
                    <span className="text-base shrink-0 mt-0.5">
                      {isLeaveNoti ? '📝' : (LEVEL_ICON[n.level] || '🔵')}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className={`text-sm leading-snug ${isUnread ? 'font-semibold text-[var(--text-primary)]' : 'font-normal text-[var(--text-secondary)]'}`}>
                          {n.title}
                        </p>
                      </div>
                      <p className="text-xs text-[var(--text-secondary)] line-clamp-3 mt-1 leading-relaxed">
                        {n.content}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-[var(--text-secondary)]">
                        {isLeaveNoti && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                            Đơn xin nghỉ
                          </span>
                        )}
                        {n.level === 'INCIDENT' && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-red-100 text-red-700">
                            Sự cố
                          </span>
                        )}
                        <span>🕐 {timeAgo(n.createdAt)}</span>
                      </div>
                    </div>
                    <div className="shrink-0 flex flex-col items-end gap-1 mt-1">
                      {isUnread && (
                        <span className="w-2.5 h-2.5 rounded-full bg-[var(--main_d)] shadow-sm" title="Chưa đọc" />
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-[var(--border-color)] p-2 bg-[var(--bg-secondary)]/30">
            <button
              onClick={handleViewAll}
              className="w-full py-2 text-xs font-medium text-center text-[var(--main_d)] hover:bg-[var(--hover)] rounded-lg transition-colors cursor-pointer"
            >
              Xem tất cả thông báo trong trang Quản lý
            </button>
          </div>
        </div>
      )}

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
    </div>
  )
}
