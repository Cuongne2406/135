'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

export default function useNotification() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)
  const eventSourceRef = useRef(null)

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/unread-count')
      const json = await res.json()
      if (json.success) {
        setUnreadCount(json.total_unread || 0)
      }
    } catch (e) {
      console.warn('fetchUnreadCount error:', e)
    }
  }, [])

  const fetchRecent = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=5')
      const json = await res.json()
      if (json.success) {
        setNotifications(json.data || [])
      }
    } catch (e) {
      console.warn('fetchRecent error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(async () => {
    await Promise.all([fetchUnreadCount(), fetchRecent()])
  }, [fetchUnreadCount, fetchRecent])

  useEffect(() => {
    refresh()
    const polling = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(polling)
  }, [refresh, fetchUnreadCount])

  useEffect(() => {
    try {
      const eventSource = new EventSource('/api/notifications/stream')
      eventSourceRef.current = eventSource

      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data)
          if (data.type === 'new_notification') {
            setNotifications(prev => [data.notification, ...prev].slice(0, 5))
            setUnreadCount(prev => prev + 1)
          } else if (data.type === 'count_update') {
            if (data.total_unread !== undefined) {
              setUnreadCount(data.total_unread)
            }
          }
        } catch (err) {
          console.warn('SSE parse error:', err)
        }
      }

      eventSource.onerror = () => {
        eventSource.close()
      }
    } catch (e) {
      console.warn('SSE init error (fallback to polling):', e)
    }

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close()
      }
    }
  }, [])

  const markAsRead = useCallback(async (notificationId) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'PUT' })
      setNotifications(prev => prev.map(n =>
        n._id === notificationId ? { ...n, read_status: 'READ' } : n
      ))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (e) {
      console.warn('markAsRead error:', e)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/read-all', { method: 'PUT' })
      const json = await res.json()
      if (json.success) {
        setNotifications(prev => prev.map(n => ({ ...n, read_status: 'READ' })))
        setUnreadCount(0)
      }
    } catch (e) {
      console.warn('markAllAsRead error:', e)
    }
  }, [])

  const getUnreadByLevel = useCallback(() => {
    const levels = { REMINDER: 0, WARNING: 0, INCIDENT: 0 }
    notifications.forEach(n => {
      if (n.read_status !== 'READ' && levels[n.level] !== undefined) {
        levels[n.level]++
      }
    })
    return levels
  }, [notifications])

  return {
    unreadCount,
    notifications,
    loading,
    refresh,
    markAsRead,
    markAllAsRead,
    getUnreadByLevel,
    hasIncident: notifications.some(n => n.level === 'INCIDENT' && n.read_status !== 'READ'),
  }
}
