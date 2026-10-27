import { Schema, model, models } from 'mongoose'

const Course = new Schema({
  course: { type: Schema.Types.ObjectId, required: true, ref: 'course' },
  tuition: { type: Schema.Types.ObjectId, default: null },
  // 2: Đã hoàn thành, 1: Bảo lưu kết quả, 0: Chưa hoàn thành
  status: { type: Number, required: true, enum: [2, 1, 0], default: 0 },
});

const Trials = new Schema({
  topic: { type: Schema.Types.ObjectId, required: true, ref: 'course' },
  note: { type: String, default: '' },
  // 2: Theo học, 1: Chờ, 0: Không theo
  status: { type: Number, required: true, enum: [2, 1, 0], default: 1 },
});

const Status = new Schema({
  status: { type: Schema.Types.Mixed, required: true },
  act: { type: String, default: '' },
  date: { type: Date, default: Date.now },
  note: { type: String, default: '' },
});

const ScoreSchema = new Schema({
  testName: { type: String, required: true },
  courseId: { type: Schema.Types.ObjectId, ref: 'course' },
  score: { type: Number, required: true },
  maxScore: { type: Number, default: 10 },
  date: { type: Date, default: Date.now },
  note: { type: String, default: '' },
}, { _id: true });

const PresentationSchema = new Schema({
  course: { type: Schema.Types.ObjectId, ref: 'course', required: true },
  bookId: { type: String, required: true },
  bookName: { type: String },
  Video: { type: String, default: '' },
  Img: { type: String, default: '' },
  Comment: { type: String, default: '' },
}, { _id: false });

const ProfileSchema = new Schema({
  Intro: { type: String, default: '' },
  Avatar: { type: String, default: '' },
  ImgSkill: { type: String, default: '' },
  ImgPJ: { type: [String], default: [] },
  Skill: { type: Map, of: String, default: {} },
  Present: { type: [PresentationSchema], default: [] }
}, { _id: false });

const LearnDetailSchema = new Schema({
  care: { type: Array, default: [] },
  trials: { type: [{ type: Schema.Types.ObjectId, ref: 'trialCourse' }], default: [] },
  // 0: chưa có kết quả, 1: nhập học, 2: không nhập học
  result: { type: Number, default: 0 },
}, { _id: false });

const postSchema = new Schema({
  ID: {
    type: String,
    required: true,
  },
  Uid: {
    type: String
  },
  Name: {
    type: String
  },
  BD: {
    type: Date
  },
  School: {
    type: String
  },
  Area: {
    type: Schema.Types.ObjectId,
    ref: 'area',
  },
  Address: {
    type: String
  },
  ParentName: {
    type: String
  },
  Phone: {
    type: String
  },
  Email: {
    type: String
  },
  Avt: {
    type: String
  },
  Status: {
    type: [Status],
    default: () => ([{
      status: 1,
      act: 'chờ',
      date: new Date(),
      note: 'Thêm học sinh thành công',
    }])
  },
  Course: {
    type: [Course],
    default: []
  },
  Profile: {
    type: ProfileSchema,
    default: () => ({ Present: [] })
  },
  Scores: {
    type: [ScoreSchema],
    default: []
  },
  Leave: { type: Boolean, default: false },
  Trial: {
    type: [Trials],
    default: []
  },
  Note: { type: [LearnDetailSchema], default: [] }
}, { versionKey: false })

postSchema.index({ ID: 1 });
postSchema.index({ Phone: 1 });
postSchema.index({ Uid: 1 });
postSchema.index({ 'Course.course': 1 });
postSchema.index({ Area: 1 });

const PostStudent = models.Student || models.student || model('student', postSchema);
if (!models.Student) {
  try { model('Student', postSchema); } catch (_) {}
}

export default PostStudent;