import { Schema, model, models } from 'mongoose'

const RoomSchema = new Schema(
    {
        status: { type: Boolean, default: false },
        message: { type: String, trim: true },
        data: {
            type: Schema.Types.Mixed, default: {}
        }
    },
    { _id: false, versionKey: false }
)

const logs = new Schema(
    {
        status: { type: RoomSchema, default: () => ({ status: true, message: 'Thành công', data: {} }) },
        type: { type: String, required: true },
        action: { type: String },
        note: { type: String },
        details: { type: Schema.Types.Mixed, default: {} },
        createdAt: { type: Date, default: Date.now },
        createBy: { type: Schema.Types.ObjectId, ref: 'user' },
        customer: { type: Schema.Types.ObjectId, ref: 'customer' },
        student: { type: Schema.Types.ObjectId, ref: 'student' },
        zalo: { type: Schema.Types.ObjectId, ref: 'zaloaccount', required: false },
        schedule: { type: Schema.Types.ObjectId, ref: 'scheduledjob', default: null },
    },
    { timestamps: true, versionKey: false }
)

const Logs = models.Log || models.log || models.logmes || model('logmes', logs);
if (!models.Log) {
    try { model('Log', logs); } catch (_) {}
}
if (!models.log) {
    try { model('log', logs); } catch (_) {}
}
export default Logs;
