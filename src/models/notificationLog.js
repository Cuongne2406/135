import { Schema, model, models } from 'mongoose'

const logSchema = new Schema({
  notification: { type: Schema.Types.ObjectId, ref: 'notification', required: true },
  actor: { type: String, required: true },
  actor_id: { type: Schema.Types.ObjectId, default: null },
  action: {
    type: String,
    required: true,
    enum: [
      'CREATE', 'VIEW', 'UPDATE_STATUS', 'REMIND',
      'ASSIGN', 'CLOSE', 'ESCALATE', 'NOTE'
    ]
  },
  old_status: { type: String, default: null },
  new_status: { type: String, default: null },
  note: { type: String, default: '' },
  metadata: { type: Schema.Types.Mixed, default: {} },
}, { timestamps: true })

logSchema.index({ notification: 1, createdAt: 1 })

const NotificationLog = models.notificationLog || model('notificationLog', logSchema)
export default NotificationLog
