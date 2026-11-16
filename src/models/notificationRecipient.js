import { Schema, model, models } from 'mongoose'

const recipientSchema = new Schema({
  notification: { type: Schema.Types.ObjectId, ref: 'notification', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'user', required: true },
  role: { type: String, required: true, enum: ['admin', 'hocvu', 'teacher'] },
  status: { type: String, default: 'UNREAD', enum: ['UNREAD', 'READ'] },
  read_at: { type: Date, default: null },
  is_acknowledged: { type: Boolean, default: false },
}, { timestamps: true })

recipientSchema.index({ user: 1, status: 1, createdAt: -1 })
recipientSchema.index({ notification: 1, user: 1 }, { unique: true })

const NotificationRecipient = models.notificationRecipient || model('notificationRecipient', recipientSchema)
export default NotificationRecipient
