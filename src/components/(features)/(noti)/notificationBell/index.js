'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Svg_Bell } from '@/components/(icon)/svg'
import useNotification from '@/hooks/useNotification'

const LEVEL_ICON = { INCIDENT: '🔴', WARNING: '🟡', REMINDER: '🔵' }

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
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
    if (filter === 'WARNING') return n.level === 'WARNING'
    if (filter === 'INCIDENT') return n.level === 'INCIDENT'
    if (filter === 'SLA') return n.type === 'SLA_VIOLATION'
    return true
  })

  const handleBellClick = useCallback(() => {
    setIsOpen(prev => !prev)
  }, [])

  const handleItemClick = useCallback(async (notification) => {
    await markAsRead(notification._id)
    if (notification.ref_course) {
      router.push(`/course/${notification.ref_course}`)
    } else {
      router.push(`/notifications/${notification._id}`)
    }
    setIsOpen(false)
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
      >
        <div className={hasIncident ? 'animate-[shake_0.5s_ease-in-out_infinite]' : ''}>
          <Svg_Bell w={20} h={20} c={unreadCount > 0 ? 'var(--main_d)' : 'var(--text-secondary)'} />
        </div>
        {unreadCount > 0 && (
          <span className={`absolute -top-0.5 -right-0.5 flex items-center justify-center
            min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold text-white
            bg-red-500 border-2 border-[var(--bg-primary)]
            ${hasIncident ? 'animate-pulse' : ''}`}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className={`absolute top-full mt-2 bg-[var(--bg-primary)] rounded-xl shadow-lg
          border border-[var(--border-color)] z-[9999] overflow-hidden
          ${collapsed ? 'left-0' : 'right-0'}
          w-[400px] max-md:w-[calc(100vw-32px)] max-md:fixed max-md:left-4 max-md:right-4`}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">Thông báo</h3>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button onClick={handleMarkAllRead} className="text-xs text-[var(--main_d)] hover:underline">
                  Đánh dấu tất cả
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-1 px-3 py-2 border-b border-[var(--border-color)] overflow-x-auto">
            {[
              { key: 'ALL', label: 'Tất cả' },
              { key: 'UNREAD', label: 'Chưa đọc' },
              { key: 'WARNING', label: 'Cảnh báo' },
              { key: 'INCIDENT', label: 'Sự cố' },
              { key: 'SLA', label: 'SLA' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-2.5 py-1 text-xs rounded-lg whitespace-nowrap transition-colors
                  ${filter === tab.key
                    ? 'bg-[var(--main_d)] text-white'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--hover)]'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-[var(--main_d)] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-[var(--text-secondary)]">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-8 h-8 mb-2 opacity-40" fill="currentColor">
                  <path d="M224 0c-17.7 0-32 14.3-32 32l0 19.2C119 66 64 130.6 64 208l0 25.4c0 45.4-15.5 89.5-43.8 124.9L5.3 377c-5.8 7.2-6.9 17.1-2.9 25.4S14.8 416 24 416l400 0c9.2 0 17.6-5.3 21.6-13.6s2.9-18.2-2.9-25.4l-14.9-18.6C399.5 322.9 384 278.8 384 233.4l0-25.4c0-77.4-55-142-128-156.8L256 32c0-17.7-14.3-32-32-32z" />
                </svg>
                <p className="text-sm">Không có thông báo</p>
              </div>
            ) : (
              filtered.slice(0, 5).map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleItemClick(n)}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--hover)]
                    ${n.read_status !== 'READ' ? 'bg-[var(--main_l)]' : ''}`}
                >
                  <span className="text-base shrink-0 mt-0.5">{LEVEL_ICON[n.level] || '🔵'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{n.title}</p>
                    <p className="text-xs text-[var(--text-secondary)] line-clamp-2 mt-0.5">{n.content}</p>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-secondary)]">
                      {n.ref_course && <span>🏫 {n.course_name || 'Lớp'}</span>}
                      {n.ref_teacher && <span>👤 GV</span>}
                      <span>🕐 {timeAgo(n.createdAt)}</span>
                    </div>
                  </div>
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    {n.level === 'INCIDENT' && <span className="px-1.5 py-0.5 text-[10px] font-semibold text-red-600 bg-red-50 rounded">Sự cố</span>}
                    {n.read_status !== 'READ' && <span className="w-2 h-2 rounded-full bg-[var(--main_d)]" />}
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-[var(--border-color)] p-2">
            <button
              onClick={handleViewAll}
              className="w-full py-2 text-sm text-center text-[var(--main_d)] hover:bg-[var(--hover)] rounded-lg transition-colors"
            >
              Xem tất cả thông báo
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
