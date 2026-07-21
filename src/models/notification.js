import { Schema, model, models } from 'mongoose'

const notificationSchema = new Schema({
  code: { type: String, required: true, unique: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: [
      'MISSING_ATTENDANCE', 'MISSING_REASON', 'MISSING_LESSON_LOG',
      'MISSING_RESOURCE', 'SLA_VIOLATION', 'STUDENT_ABSENT_MANY',
      'TEACHER_LATE_REPORT', 'LESSON_NOT_READY', 'INCIDENT',
      'SYSTEM_ERROR', 'ACCOUNT_ISSUE',
      'MAKEUP_SCHEDULED', 'MAKEUP_REMINDER', 'MAKEUP_ABSENT',
      'MAKEUP_EXPIRED', 'ATTENDANCE_REMINDER', 'SLA_CHECK_MANUAL'
    ]
  },
  level: {
    type: String,
    required: true,
    enum: ['REMINDER', 'WARNING', 'INCIDENT', 'INFO'],
    default: 'REMINDER'
  },
  priority: { type: Number, enum: [1, 2, 3], default: 3 },
  status: {
    type: String,
    required: true,
    enum: ['UNREAD', 'READ', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED'],
    default: 'UNREAD'
  },
  ref_course: { type: Schema.Types.ObjectId, ref: 'course', default: null },
  ref_lesson: { type: Schema.Types.ObjectId, default: null },
  ref_teacher: { type: Schema.Types.ObjectId, ref: 'user', default: null },
  ref_student: { type: Schema.Types.ObjectId, ref: 'student', default: null },
  sla_deadline: { type: Date, default: null },
  sla_violated_at: { type: Date, default: null },
  created_by: { type: String, default: 'system' },
  resolved_at: { type: Date, default: null },
  closed_at: { type: Date, default: null },
  resolved_by: { type: Schema.Types.ObjectId, default: null },
  closed_by: { type: Schema.Types.ObjectId, default: null },
}, { timestamps: true })

notificationSchema.index({ status: 1, level: 1, createdAt: -1 })
notificationSchema.index({ ref_course: 1, status: 1 })
notificationSchema.index({ ref_teacher: 1, status: 1 })
notificationSchema.index({ sla_deadline: 1, status: 1 })
notificationSchema.index({ type: 1, createdAt: -1 })

const Notification = models.notification || model('notification', notificationSchema)
export default Notification
