import { Schema, model, models } from 'mongoose';

const makeupSessionSchema = new Schema({
    course: { type: Schema.Types.ObjectId, ref: 'course', required: true },
    lesson: { type: Schema.Types.ObjectId, required: true },
    studentId: { type: String, required: true },
    makeupLesson: { type: Schema.Types.ObjectId },
    makeupTeacher: { type: Schema.Types.ObjectId, ref: 'user' },
    makeupStatus: {
        type: String,
        enum: ['NOT_REQUIRED', 'MAKEUP_REQUIRED', 'MAKEUP_PENDING', 'MAKEUP_SCHEDULED', 'MAKEUP_COMPLETED', 'MAKEUP_ABSENT', 'MAKEUP_EXPIRED', 'MAKEUP_CANCELLED'],
        default: 'MAKEUP_PENDING'
    },
    makeupDate: { type: Date },
    makeupTime: { type: String },
    contentToMakeup: { type: String, default: '' },
    completedAt: { type: Date },
    note: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'user' },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'user' },
}, { timestamps: true });

const MakeupSession = models.makeupSession || model('makeupSession', makeupSessionSchema);
export default MakeupSession;
