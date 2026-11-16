import { Schema, model, models } from 'mongoose';

const zaloMessageLogSchema = new Schema({
    recipientPhone: { type: String, required: true, index: true },
    studentId: { type: String, required: true, index: true },
    studentName: { type: String, default: '' },
    courseId: { type: Schema.Types.ObjectId, ref: 'course', default: null },
    lessonId: { type: Schema.Types.ObjectId, default: null },
    type: {
        type: String,
        required: true,
        enum: [
            'LEAVE_REQUEST_CONFIRMATION',
            'LEAVE_CANCEL_CONFIRMATION',
            'INSTANT_CHECKIN_PRESENT',
            'INSTANT_CHECKIN_ABSENT',
            'SMART_SCHEDULE_REMINDER',
            'POST_SESSION_DIGEST'
        ],
        index: true
    },
    title: { type: String, required: true },
    content: { type: String, required: true },
    actionUrl: { type: String, default: '' },
    status: {
        type: String,
        enum: ['SENT', 'SIMULATED', 'FAILED'],
        default: 'SENT',
        index: true
    },
    errorMessage: { type: String, default: '' },
    metadata: { type: Schema.Types.Mixed, default: {} },
    sentAt: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

zaloMessageLogSchema.index({ studentId: 1, type: 1, lessonId: 1 });
zaloMessageLogSchema.index({ sentAt: -1 });

const ZaloMessageLog = models.zaloMessageLog || model('zaloMessageLog', zaloMessageLogSchema);
export default ZaloMessageLog;
