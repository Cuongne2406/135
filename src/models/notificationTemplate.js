import { Schema, model, models } from 'mongoose'

const templateSchema = new Schema({
  type: { type: String, required: true, unique: true },
  title_template: { type: String, required: true },
  content_template: { type: String, required: true },
  default_level: {
    type: String,
    required: true,
    enum: ['REMINDER', 'WARNING', 'INCIDENT']
  },
  default_priority: { type: Number, enum: [1, 2, 3], default: 3 },
  variables: { type: [String], default: [] },
  is_active: { type: Boolean, default: true },
}, { timestamps: true })

const NotificationTemplate = models.notificationTemplate || model('notificationTemplate', templateSchema)
export default NotificationTemplate
