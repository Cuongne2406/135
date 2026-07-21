'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

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

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true)
    try {
      const statusParam = filter !== 'ALL' ? `&status=${filter}` : ''
      const res = await fetch(`/api/notifications?page=${page}&limit=20${statusParam}`)
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
          className="px-3 py-1.5 text-xs font-medium text-[var(--main_d)] border border-[var(--main_d)] rounded-lg hover:bg-[var(--main_l)] transition-colors"
        >
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      <div className="flex gap-2 mb-4 overflow-x-auto">
        {[
          { key: 'ALL', label: 'Tất cả' },
          { key: 'UNREAD', label: 'Chưa đọc' },
          { key: 'WARNING', label: 'Cảnh báo' },
          { key: 'INCIDENT', label: 'Sự cố' },
          { key: 'SLA', label: 'SLA' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => handleFilterChange(tab.key)}
            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors
              ${filter === tab.key
                ? 'bg-[var(--main_d)] text-white'
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
            <p className="text-lg">Không có thông báo</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {data.map((n) => (
              <div
                key={n._id}
                onClick={async () => {
                  try { await fetch(`/api/notifications/${n._id}/read`, { method: 'PUT' }) } catch {}
                  router.push(n.ref_course ? `/course/${n.ref_course}` : `/notifications/${n._id}`)
                }}
                className={`flex items-start gap-3 p-4 rounded-lg border-l-4 transition-colors cursor-pointer hover:bg-[var(--hover)] bg-[var(--bg-primary)]
                  ${n.read_status !== 'READ' ? 'border-l-[var(--main_d)]' : 'border-l-transparent'}`}
              >
                <span className="text-xl shrink-0">{LEVEL_ICON[n.level] || '🔵'}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{n.title}</p>
                    {n.level === 'INCIDENT' && (
                      <span className="px-1.5 py-0.5 text-[10px] font-bold text-red-600 bg-red-50 rounded">Sự cố</span>
                    )}
                    {n.read_status !== 'READ' && <span className="w-2 h-2 rounded-full bg-[var(--main_d)] shrink-0" />}
                  </div>
                  <p className="text-sm text-[var(--text-secondary)] mt-1 line-clamp-2">{n.content}</p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                    <span>🕐 {timeAgo(n.createdAt)}</span>
                    {n.ref_course && <span>🏫 Lớp học</span>}
                  </div>
                </div>
                <div className="shrink-0 flex items-center">
                  {n.level !== 'READ' && <span className="text-[var(--main_d)] text-lg">›</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

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
