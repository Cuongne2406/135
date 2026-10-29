import connect from '@/config/connectDB';
import Course from '@/models/course';
import Trial from '@/models/coursetry';
import Book from '@/models/book';
import Student from '@/models/student';
import User from '@/models/users';
import Area from '@/models/area';
import mongoose, { Types } from 'mongoose';

const isId = v => Types.ObjectId.isValid(v);

const topicById = async tid => {
    if (!tid) return null;
    return Book.findOne({ 'Topics._id': tid }, { 'Topics.$': 1 })
        .lean()
        .then(b => b?.Topics?.[0] || null);
};

const roomName = async rid => {
    if (!rid) return null;
    return Area.aggregate([
        { $unwind: '$rooms' },
        { $match: { 'rooms._id': rid } },
        { $replaceRoot: { newRoot: '$rooms' } },
        { $limit: 1 }
    ]).then(r => r[0]?.name || null);
};

const buildStudents = (raw, mapById, lessonId) =>
    (raw || []).map(st => {
        const info = mapById.get(st.studentId || st.ID) || {};
        const a = st.attendance || st || {};
        return {
            _id: info._id ? String(info._id) : null,
            ID: info.ID ?? st.studentId ?? '–––',
            Name: info.Name ?? 'Không tên',
            Avt: info.Avt ?? null,
            attendance: {
                Checkin: a.Checkin ?? (st.checkin ? 1 : 0),
                absenceReason: a.absenceReason ?? '',
                makeupStatus: a.makeupStatus ?? '',
                Cmt: a.Cmt ?? a.cmt ?? [],
                CmtFn: a.CmtFn ?? st.cmtFn ?? '',
                Note: a.Note ?? st.note ?? '',
                Lesson: String(lessonId),
                Image: a.Image ?? st.images ?? []
            }
        };
    });

export async function getLessonDetailData(id) {
    if (!id || !isId(id)) return null;

    try {
        await connect();
        const lessonObjectId = new mongoose.Types.ObjectId(id);

        const c = await Course.findOne(
            { 'Detail._id': { $in: [id, lessonObjectId] } },
            { ID: 1, Version: 1, Area: 1, Student: 1, Detail: { $elemMatch: { _id: { $in: [id, lessonObjectId] } } } }
        ).lean();

        if (c && Array.isArray(c.Detail) && c.Detail.length > 0) {
            const ses = c.Detail[0];

            const [topic, teachers, studs, room] = await Promise.all([
                topicById(ses.Topic),
                User.find({ _id: { $in: [ses.Teacher, ses.TeachingAs].filter(Boolean) } })
                    .select('name')
                    .lean(),
                Student.find({ ID: { $in: (c.Student || []).map(s => s.ID).filter(Boolean) } })
                    .select('ID Name Avt')
                    .lean(),
                roomName(ses.Room)
            ]);

            const uMap = new Map((teachers || []).map(u => [u._id.toString(), u]));
            const sMap = new Map((studs || []).map(s => [s.ID, s]));

            const students = buildStudents(
                (c.Student || []).flatMap(s => {
                    const attendance = (s.Learn || []).find(lr => lr?.Lesson?.toString() === id.toString());
                    return attendance ? [{ ...s, attendance }] : [];
                }),
                sMap,
                id
            );

            const result = {
                course: { _id: c._id.toString(), ID: c.ID, Version: c.Version },
                session: {
                    _id: ses._id.toString(),
                    Topic: topic,
                    Day: ses.Day,
                    Room: room,
                    Time: ses.Time,
                    Teacher: uMap.get(String(ses.Teacher)) ? { _id: String(uMap.get(String(ses.Teacher))._id), name: uMap.get(String(ses.Teacher)).name } : null,
                    TeachingAs: uMap.get(String(ses.TeachingAs)) ? { _id: String(uMap.get(String(ses.TeachingAs))._id), name: uMap.get(String(ses.TeachingAs)).name } : null,
                    Image: ses.Image,
                    DetailImage: ses.DetailImage
                },
                students
            };

            return JSON.parse(JSON.stringify(result));
        }

        /* ───── Khóa học thử (Trial) ───── */
        const t = await Trial.findOne(
            { 'sessions._id': { $in: [id, lessonObjectId] } },
            { name: 1, sessions: { $elemMatch: { _id: { $in: [id, lessonObjectId] } } } }
        ).lean();

        if (!t || !Array.isArray(t.sessions) || t.sessions.length === 0) {
            return null;
        }

        const s = t.sessions[0];

        const [topic2, teachers2, studs2, room2] = await Promise.all([
            topicById(s.topicId),
            User.find({ _id: { $in: [s.teacher, s.teachingAs].filter(Boolean) } })
                .select('name')
                .lean(),
            Student.find({
                $or: [
                    { _id: { $in: (s.students || []).filter(x => isId(x.studentId)).map(x => x.studentId) } },
                    { ID: { $in: (s.students || []).map(x => x.studentId).filter(Boolean) } }
                ]
            }).select('ID Name Avt').lean(),
            roomName(s.room)
        ]);

        const uMap2 = new Map((teachers2 || []).map(u => [u._id.toString(), u]));
        const sMap2 = new Map([
            ...(studs2 || []).map(st => [st._id?.toString() || st.ID, st]),
            ...(studs2 || []).map(st => [st.ID, st])
        ]);

        const students2 = buildStudents(s.students || [], sMap2, id);

        const result2 = {
            course: { _id: t._id.toString(), ID: 'trycourse', Version: 1, type: 'trial' },
            session: {
                _id: s._id.toString(),
                Topic: topic2,
                Day: s.day,
                Room: room2,
                Time: s.time,
                Teacher: uMap2.get(String(s.teacher)) ? { _id: String(uMap2.get(String(s.teacher))._id), name: uMap2.get(String(s.teacher)).name } : null,
                TeachingAs: uMap2.get(String(s.teachingAs)) ? { _id: String(uMap2.get(String(s.teachingAs))._id), name: uMap2.get(String(s.teachingAs)).name } : null,
                Image: s.folderId,
                DetailImage: s.images
            },
            students: students2
        };

        return JSON.parse(JSON.stringify(result2));
    } catch (err) {
        console.error('[getLessonDetailData Error]', err);
        return null;
    }
}
