import { Schema, model, models } from 'mongoose'

const settingSchema = new Schema({
  key: { type: String, required: true, unique: true },
  value: { type: Schema.Types.Mixed, required: true },
  description: { type: String, default: '' },
  updated_by: { type: Schema.Types.ObjectId, default: null },
}, { timestamps: true })

const NotificationSetting = models.notificationSetting || model('notificationSetting', settingSchema)
export default NotificationSetting
