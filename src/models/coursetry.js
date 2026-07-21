import { Schema, model, models } from 'mongoose';

const ImageSchema = new Schema(
    {
        id: { type: String, required: true, unique: true },
        type: { type: String },
        created: { type: Date, default: Date.now },
    },
    { _id: false }
);

const TrialStudentStatusSchema = new Schema(
    {
        studentId: { type: String, required: true },
        checkin: { type: Boolean, default: false },
        cmt: { type: Array, default: [] },
        images: { type: [ImageSchema], default: [] },
        note: { type: String, default: '' },
    },
    { _id: false }
);

const TrialSessionSchema = new Schema(
    {
        day: { type: Date, required: true },
        room: { type: Schema.Types.ObjectId },
        time: { type: String },
        folderId: { type: String, required: true },
        images: { type: ImageSchema, required: true },
        book: { type: Schema.Types.ObjectId, ref: 'book', required: true },
        topicId: { type: Schema.Types.ObjectId, required: true },
        students: { type: [TrialStudentStatusSchema], default: [] },
        teacher: { type: Schema.Types.ObjectId, ref: 'user' },
        teachingAs: { type: Schema.Types.ObjectId, ref: 'user' },
        status: { type: Boolean, default: true },
        note: { type: String },
    },
    { _id: true }
);
const TrialCourseSchema = new Schema(
    {
        name: { type: String, required: true, unique: true },
        rootFolderId: { type: String, required: true },
        sessions: { type: [TrialSessionSchema], default: [] },
    },
    { versionKey: false }
);
TrialCourseSchema.virtual('allStudents').get(function () {
    const set = new Set();
    this.sessions.forEach((s) =>
        s.students.forEach((st) => set.add(st.studentId))
    );
    return Array.from(set);
});
TrialCourseSchema.index({ 'sessions.day': 1, 'sessions.room': 1 });
const TrialCourse =
    models.trialCourse || model('trialCourse', TrialCourseSchema);

export default TrialCourse;
