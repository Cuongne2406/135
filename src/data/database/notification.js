import connectDB from '@/config/connectDB'
import Notification from '@/models/notification'
import NotificationRecipient from '@/models/notificationRecipient'
import NotificationLog from '@/models/notificationLog'
import NotificationSetting from '@/models/notificationSetting'
import NotificationTemplate from '@/models/notificationTemplate'

async function broadcast(notificationId) {
  try {
    const { broadcastNotification } = await import('@/app/api/notifications/stream/route')
    await broadcastNotification(notificationId)
  } catch (e) {
    console.warn('SSE broadcast failed:', e.message)
  }
}

export async function getNotifications({ userId, role, page = 1, limit = 20, status, level, type } = {}) {
  await connectDB()
  const query = {}
  if (status) query.status = status
  if (level) query.level = level
  if (type) query.type = type

  let notificationIds = null
  if (userId) {
    const recipientQuery = { user: userId }
    const recipients = await NotificationRecipient.find(recipientQuery).select('notification').lean()
    notificationIds = recipients.map(r => r.notification)
    query._id = { $in: notificationIds }
  }

  const skip = (page - 1) * limit
  const [data, total] = await Promise.all([
    Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Notification.countDocuments(query),
  ])

  const enriched = await Promise.all(data.map(async (notif) => {
    let readStatus = null
    if (userId) {
      const recipient = await NotificationRecipient.findOne({ notification: notif._id, user: userId }).lean()
      readStatus = recipient?.status || null
    }
    return { ...notif, read_status: readStatus }
  }))

  return { data: enriched, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } }
}

export async function getUnreadCount(userId) {
  await connectDB()
  const recipients = await NotificationRecipient.find({ user: userId, status: 'UNREAD' }).select('notification').lean()
  const notificationIds = recipients.map(r => r.notification)
  const byLevel = await Notification.aggregate([
    { $match: { _id: { $in: notificationIds }, status: { $ne: 'CLOSED' } } },
    { $group: { _id: '$level', count: { $sum: 1 } } },
  ])
  const total = byLevel.reduce((acc, item) => acc + item.count, 0)
  const byLevelObj = { REMINDER: 0, WARNING: 0, INCIDENT: 0 }
  byLevel.forEach(item => { byLevelObj[item._id] = item.count })
  return { total_unread: total, by_level: byLevelObj }
}

export async function getNotificationDetail(notificationId) {
  await connectDB()
  const notification = await Notification.findById(notificationId).lean()
  if (!notification) return null
  const logs = await NotificationLog.find({ notification: notificationId }).sort({ createdAt: 1 }).lean()
  const recipients = await NotificationRecipient.find({ notification: notificationId }).populate('user', 'name role').lean()
  return { ...notification, logs, recipients }
}

export async function createNotification({ title, content, type, level, priority, created_by = 'system', ref_course, ref_lesson, ref_teacher, ref_student, sla_deadline, targetRoles = [], userId } = {}) {
  await connectDB()

  const count = await Notification.countDocuments()
  const datePart = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const code = `NOTI-${datePart}-${String(count + 1).padStart(5, '0')}`

  const notification = await Notification.create({
    code, title, content, type, level, priority: priority || (level === 'INCIDENT' ? 1 : level === 'WARNING' ? 2 : 3),
    created_by, ref_course, ref_lesson, ref_teacher, ref_student, sla_deadline,
  })

  await NotificationLog.create({
    notification: notification._id,
    actor: created_by === 'system' ? 'Hệ thống' : created_by,
    actor_id: created_by === 'system' ? null : created_by,
    action: 'CREATE',
    new_status: 'UNREAD',
    note: 'Khởi tạo thông báo',
  })

  if (targetRoles.length > 0) {
    const { default: User } = await import('@/models/users')
    const orConditions = targetRoles.map(r => ({ role: new RegExp(`^${r}$`, 'i') }))
    const users = await User.find({ $or: orConditions }).lean()
    const recipients = users.map(u => ({
      notification: notification._id,
      user: u._id,
      role: u.role.some(r => /^admin$/i.test(r)) ? 'admin' :
            u.role.some(r => /^(hocvu|academic)$/i.test(r)) ? 'hocvu' : 'teacher',
    }))
    if (recipients.length > 0) {
      await NotificationRecipient.insertMany(recipients)
    }
    if (userId) {
      const alreadyAdded = recipients.some(r => r.user.toString() === userId.toString())
      if (!alreadyAdded) {
        await NotificationRecipient.create({
          notification: notification._id,
          user: userId,
          role: 'teacher',
        })
      }
    }
  }

  broadcast(notification._id).catch(() => {})

  return notification
}

export async function markAsRead(notificationId, userId) {
  await connectDB()
  const recipient = await NotificationRecipient.findOne({ notification: notificationId, user: userId })
  if (!recipient) return null
  recipient.status = 'READ'
  recipient.read_at = new Date()
  await recipient.save()
  return recipient
}

export async function markAllAsRead(userId) {
  await connectDB()
  const result = await NotificationRecipient.updateMany(
    { user: userId, status: 'UNREAD' },
    { $set: { status: 'READ', read_at: new Date() } }
  )
  return result.modifiedCount
}

export async function resolveNotification(notificationId, userId, note) {
  await connectDB()
  const notification = await Notification.findById(notificationId)
  if (!notification) return null
  const oldStatus = notification.status
  notification.status = 'RESOLVED'
  notification.resolved_at = new Date()
  notification.resolved_by = userId
  await notification.save()

  await NotificationLog.create({
    notification: notificationId,
    actor: userId?.toString() || 'unknown',
    actor_id: userId,
    action: 'UPDATE_STATUS',
    old_status: oldStatus,
    new_status: 'RESOLVED',
    note: note || 'Đã xử lý',
  })
  return notification
}

export async function closeNotification(notificationId, userId, reason) {
  await connectDB()
  const notification = await Notification.findById(notificationId)
  if (!notification) return null
  const oldStatus = notification.status
  notification.status = 'CLOSED'
  notification.closed_at = new Date()
  notification.closed_by = userId
  await notification.save()

  await NotificationLog.create({
    notification: notificationId,
    actor: userId?.toString() || 'unknown',
    actor_id: userId,
    action: 'CLOSE',
    old_status: oldStatus,
    new_status: 'CLOSED',
    note: reason || 'Đã đóng thông báo',
  })
  return notification
}

export async function escalateNotification(notificationId, userId, reason) {
  await connectDB()
  const notification = await Notification.findById(notificationId)
  if (!notification) return null
  const oldStatus = notification.status
  notification.status = 'ESCALATED'
  notification.level = 'INCIDENT'
  notification.priority = 1
  await notification.save()

  const newNotification = await createNotification({
    title: `[Đã nâng cấp] ${notification.title}`,
    content: `Sự cố được nâng cấp từ thông báo ${notification.code}.\nLý do: ${reason}\n\nNội dung gốc:\n${notification.content}`,
    type: 'INCIDENT',
    level: 'INCIDENT',
    priority: 1,
    ref_course: notification.ref_course,
    ref_lesson: notification.ref_lesson,
    ref_teacher: notification.ref_teacher,
    ref_student: notification.ref_student,
    targetRoles: ['hocvu', 'Academic'],
    userId,
  })

  await NotificationLog.create({
    notification: notificationId,
    actor: userId?.toString() || 'unknown',
    actor_id: userId,
    action: 'ESCALATE',
    old_status: oldStatus,
    new_status: 'ESCALATED',
    note: reason || 'Đã nâng cấp thành sự cố',
    metadata: { new_notification_id: newNotification._id.toString() },
  })

  return { escalated: notification, new_notification: newNotification }
}

export async function getSettings() {
  await connectDB()
  return NotificationSetting.find().sort({ key: 1 }).lean()
}

export async function updateSetting(key, value, userId) {
  await connectDB()
  const setting = await NotificationSetting.findOneAndUpdate(
    { key },
    { $set: { value, updated_by: userId } },
    { upsert: true, new: true }
  )
  return setting
}

export async function getTemplates() {
  await connectDB()
  return NotificationTemplate.find({ is_active: true }).lean()
}

export async function updateTemplate(id, updates) {
  await connectDB()
  return NotificationTemplate.findByIdAndUpdate(id, { $set: updates }, { new: true })
}
