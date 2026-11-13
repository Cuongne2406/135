'use client'
import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'

const LEVEL_LABEL = { INCIDENT: 'Sự cố', WARNING: 'Cảnh báo', REMINDER: 'Nhắc nhở' }
const STATUS_LABEL = {
  UNREAD: 'Chưa đọc', READ: 'Đã đọc', IN_PROGRESS: 'Đang xử lý',
  RESOLVED: 'Đã xử lý', CLOSED: 'Đã đóng', ESCALATED: 'Đã nâng cấp'
}
const STATUS_COLOR = {
  UNREAD: 'text-blue-600 bg-blue-50', READ: 'text-gray-600 bg-gray-100',
  IN_PROGRESS: 'text-yellow-600 bg-yellow-50', RESOLVED: 'text-green-600 bg-green-50',
  CLOSED: 'text-gray-400 bg-gray-100', ESCALATED: 'text-red-600 bg-red-50'
}

export default function NotificationDetailPage() {
  const router = useRouter()
  const { id } = useParams()
  const [notification, setNotification] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [note, setNote] = useState('')

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/api/notifications/${id}`)
        const json = await res.json()
        if (json.success) setNotification(json.data)
        else router.push('/notifications')
      } catch (e) {
        console.error(e)
        router.push('/notifications')
      } finally {
        setLoading(false)
      }
    }
    fetchDetail()
  }, [id, router])

  const handleAction = async (action) => {
    setActionLoading(action)
    try {
      const methods = {
        resolve: { url: `/api/notifications/${id}/resolve`, method: 'PUT', body: { note } },
        close: { url: `/api/notifications/${id}/close`, method: 'PUT', body: { reason: note } },
        escalate: { url: `/api/notifications/${id}/escalate`, method: 'POST', body: { reason: note } },
      }
      const config = methods[action]
      if (!config) return

      const res = await fetch(config.url, {
        method: config.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config.body),
      })
      const json = await res.json()
      if (json.success) {
        const refresh = await fetch(`/api/notifications/${id}`)
        const refreshJson = await refresh.json()
        if (refreshJson.success) setNotification(refreshJson.data)
        setNote('')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[var(--main_d)] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!notification) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[var(--text-secondary)]">
        <p>Không tìm thấy thông báo</p>
        <Link href="/notifications" className="text-[var(--main_d)] mt-2">← Quay lại</Link>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/notifications"
        className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)] hover:text-[var(--main_d)] mb-4"
      >
        ← Quay lại danh sách
      </Link>

      <div className="bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)] overflow-hidden">
        <div className={`p-6 border-b border-[var(--border-color)]
          ${notification.level === 'INCIDENT' ? 'bg-red-50' :
            notification.level === 'WARNING' ? 'bg-yellow-50' : 'bg-blue-50'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">
              {notification.level === 'INCIDENT' ? '🚨' : notification.level === 'WARNING' ? '⚠️' : '📋'}
            </span>
            <span className={`px-2 py-0.5 text-xs font-bold rounded
              ${notification.level === 'INCIDENT' ? 'text-red-600 bg-red-100' :
                notification.level === 'WARNING' ? 'text-yellow-600 bg-yellow-100' :
                'text-blue-600 bg-blue-100'}`}
            >
              {LEVEL_LABEL[notification.level]}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded ${STATUS_COLOR[notification.status]}`}>
              {STATUS_LABEL[notification.status]}
            </span>
          </div>
          <h1 className="text-lg font-bold text-[var(--text-primary)]">{notification.title}</h1>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Mã thông báo</p>
              <p className="text-sm text-[var(--text-primary)] font-mono">{notification.code}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Loại cảnh báo</p>
              <p className="text-sm text-[var(--text-primary)]">{notification.type}</p>
            </div>
            <div>
              <p className="text-xs text-[var(--text-secondary)] mb-1">Ngày tạo</p>
              <p className="text-sm text-[var(--text-primary)]">
                {new Date(notification.createdAt).toLocaleString('vi-VN')}
              </p>
            </div>
            {notification.sla_deadline && (
              <div className="col-span-2 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-700 mb-1">
                  🕐 SLA — Service Level Agreement (Thỏa thuận cấp độ dịch vụ)
                </p>
                <p className="text-xs text-red-600 mb-2">
                  SLA là cam kết về thời gian tối đa để xử lý công việc sau buổi học.
                  Nếu quá thời hạn này mà chưa hoàn tất, hệ thống sẽ đánh dấu vi phạm.
                </p>
                <div className="flex items-center justify-between text-xs text-red-700">
                  <span>⏰ Thời hạn SLA: <strong>{new Date(notification.sla_deadline).toLocaleString('vi-VN')}</strong></span>
                  {new Date(notification.sla_deadline) < new Date() ? (
                    <span className="px-2 py-0.5 bg-red-600 text-white rounded font-bold">
                      🚨 ĐÃ VI PHẠM SLA (quá hạn {Math.floor((Date.now() - new Date(notification.sla_deadline)) / 60000)} phút)
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 bg-green-600 text-white rounded font-bold">
                      ✅ Còn {Math.floor((new Date(notification.sla_deadline) - Date.now()) / 60000)} phút
                    </span>
                  )}
                </div>
                <div className="mt-2 text-xs text-red-500">
                  <p>📋 Quy trình SLA theo thời gian:</p>
                  <p className="ml-2">• T+30 phút: Nhắc nhở (REMINDER) — kiểm tra điểm danh</p>
                  <p className="ml-2">• T+60 phút: Cảnh báo (WARNING) — kiểm tra nhật ký buổi học</p>
                  <p className="ml-2">• T+90 phút: Cảnh báo (WARNING) — kiểm tra tài nguyên buổi học</p>
                  <p className="ml-2">• T+120 phút: Sự cố (INCIDENT) — vi phạm SLA</p>
                </div>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Nội dung</h3>
            <div className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap bg-[var(--bg-secondary)] p-4 rounded-lg">
              {notification.content}
            </div>
          </div>

          {(notification.ref_course || notification.ref_teacher || notification.ref_student) && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Thông tin liên quan</h3>
              <div className="flex flex-wrap gap-3">
                {notification.ref_course && (
                  <Link
                    href={`/course/${notification.ref_course}`}
                    className="px-3 py-1.5 text-xs bg-[var(--main_l)] text-[var(--main_d)] rounded-lg hover:underline"
                  >
                    🏫 Xem khóa học →
                  </Link>
                )}
                {notification.ref_teacher && (
                  <span className="px-3 py-1.5 text-xs bg-[var(--bg-secondary)] rounded-lg">
                    👤 Giáo viên
                  </span>
                )}
                {notification.ref_student && (
                  <span className="px-3 py-1.5 text-xs bg-[var(--bg-secondary)] rounded-lg">
                    👤 Học viên
                  </span>
                )}
              </div>
            </div>
          )}

          {notification.logs && notification.logs.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-2">Lịch sử thao tác</h3>
              <div className="space-y-2">
                {notification.logs.map((log, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[var(--text-secondary)]">
                    <span className="text-gray-400 shrink-0 w-16">
                      {new Date(log.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <span className="font-medium text-[var(--text-primary)] shrink-0">{log.actor}</span>
                    <span>{log.action === 'CREATE' ? 'Khởi tạo' :
                          log.action === 'VIEW' ? 'Đã xem' :
                          log.action === 'UPDATE_STATUS' ? 'Cập nhật trạng thái' :
                          log.action === 'CLOSE' ? 'Đã đóng' :
                          log.action === 'ESCALATE' ? 'Đã nâng cấp' :
                          log.action === 'REMIND' ? 'Đã nhắc nhở' : log.action}</span>
                    {log.note && <span className="italic">: {log.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {notification.status !== 'CLOSED' && notification.status !== 'RESOLVED' && (
            <div className="border-t border-[var(--border-color)] pt-4">
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Hành động</h3>
              <div className="flex flex-wrap gap-2 mb-3">
                <button
                  onClick={() => handleAction('resolve')}
                  disabled={actionLoading === 'resolve'}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-40"
                >
                  {actionLoading === 'resolve' ? '⏳' : '✅'} Đã xử lý
                </button>
                <button
                  onClick={() => handleAction('close')}
                  disabled={actionLoading === 'close'}
                  className="px-3 py-1.5 text-xs font-medium text-[var(--text-primary)] border border-[var(--border-color)] rounded-lg hover:bg-[var(--hover)] disabled:opacity-40"
                >
                  🔒 Đóng thông báo
                </button>
                <button
                  onClick={() => handleAction('escalate')}
                  disabled={actionLoading === 'escalate'}
                  className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-40"
                >
                  🚨 Chuyển thành sự cố
                </button>
                {notification.ref_lesson && (
                  <button className="px-3 py-1.5 text-xs font-medium text-[var(--main_d)] border border-[var(--main_d)] rounded-lg hover:bg-[var(--main_l)]">
                    📘 Xem buổi học
                  </button>
                )}
              </div>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Nhập ghi chú / lý do (bắt buộc khi đóng hoặc nâng cấp)..."
                className="w-full px-3 py-2 text-sm border border-[var(--border-color)] rounded-lg bg-transparent text-[var(--text-primary)] outline-none resize-none"
                rows={2}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
