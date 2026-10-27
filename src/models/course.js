import { Schema, model, models } from 'mongoose';

const DetailSchema = new Schema({
    Topic: { type: Schema.Types.ObjectId, required: true },
    Day: { type: Date, required: true },
    Room: { type: Schema.Types.ObjectId },
    Time: { type: String },
    Teacher: { type: Schema.Types.ObjectId, ref: 'user' },
    TeachingAs: { type: Schema.Types.ObjectId, ref: 'user' },
    Image: { type: String },
    DetailImage: {
        type: [{
            id: { type: String, required: true },
            type: { type: String },
            create: { type: Date, default: Date.now }
        }],
        default: []
    },
    Type: { type: String },
    Note: { type: String },
});

const LearnDetailSchema = new Schema({
    Checkin: { type: Number, default: 0 },
    Cmt: { type: Array, default: [] },
    CmtFn: { type: String, default: '' },
    Note: { type: String, default: '' },
    Lesson: { type: Schema.Types.ObjectId, required: true },
    Image: {
        type: [{
            id: { type: String, required: true },
            type: { type: String },
            create: { type: Date, default: Date.now }
        }],
        default: []
    },
    absenceReason: { type: String, default: '' },
    makeupStatus: {
        type: String,
        enum: ['NOT_REQUIRED', 'MAKEUP_REQUIRED', 'MAKEUP_PENDING', 'MAKEUP_SCHEDULED', 'MAKEUP_COMPLETED', 'MAKEUP_ABSENT', 'MAKEUP_EXPIRED', 'MAKEUP_CANCELLED'],
        default: 'NOT_REQUIRED'
    },
}, { _id: false });

const StudentSchema = new Schema({
    ID: { type: String, required: true },
    Learn: { type: [LearnDetailSchema], default: [] },
});

const postCourseSchema = new Schema({
    ID: {
        type: String,
        required: true,
        unique: true
    },
    Book: { type: Schema.Types.ObjectId, ref: 'book' },
    Status: {
        type: Boolean,
        default: false
    },
    Type: { type: String },
    Detail: {
        type: [DetailSchema],
        default: []
    },
    Area: {
        type: Schema.Types.ObjectId, ref: 'area'
    },
    Student: {
        type: [StudentSchema],
        default: []
    },
    TeacherHR: {
        type: Schema.Types.ObjectId, ref: 'user'
    },
    template: {
        type: String,
        default: 'robot-mecha'
    },
    Version: {
        type: Number
    },
    aiPortfolioDraft: {
        type: Schema.Types.Mixed,
        default: null
    },
    isPublished: {
        type: Boolean,
        default: false
    },
    publishedAt: {
        type: Date,
        default: null
    }
}, { versionKey: false });

postCourseSchema.index({ Type: 1, Status: 1 });
postCourseSchema.index({ 'Detail.Image': 1 });
postCourseSchema.index({ 'Detail.Day': 1 });
postCourseSchema.index({ 'Detail.Teacher': 1 });
postCourseSchema.index({ 'Student.ID': 1 });
postCourseSchema.index({ Area: 1 });

if (models.course && !models.course.schema.path('aiPortfolioDraft')) {
    delete models.course;
}
if (models.Course && !models.Course.schema.path('aiPortfolioDraft')) {
    delete models.Course;
}

const PostCourse = models.Course || models.course || model('course', postCourseSchema);
if (!models.Course) {
    try { model('Course', postCourseSchema); } catch (_) {}
}

export default PostCourse;