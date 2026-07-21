import User from '@/models/users'
import connectDB from '@/config/connectDB'
import { cacheData } from '@/lib/cache'
import { getCourseAll } from './course';

async function dataUser(_id) {
    try {
        await connectDB()
        let query = _id ? { _id } : {}
        let data = {}
        if (_id) {
            data = await User.find(query).populate({
                path: 'zalo',
                select: 'name _id phone avt action',
                populate: {
                    path: 'action',
                    populate: [
                        {
                            path: 'zaloAccount',
                            select: 'name _id phone avt',
                        },
                        {
                            path: 'createdBy',
                            select: 'name _id phone avt',
                        },
                    ],
                }
            }).lean();
        } else {
            data = await User.find({
                ...query,
                uid: { $exists: true, $ne: null }
            }, { uid: 0 }).lean().exec();
        }
        return JSON.parse(JSON.stringify(data))
    } catch (error) {
        console.error('Lỗi trong dataUser:', error)
        throw new Error('Không thể lấy dữ liệu người dùng.')
    }
}

async function dataUserreport() {
    try {
        await connectDB();
        const now = new Date();
        const courses = await getCourseAll();
        const teacherData = {};
        for (const course of courses) {
            if (!course.Detail?.length) continue;
            const roomMap = new Map(course.Area?.rooms?.map(r => [r._id.toString(), r.name]) || []);
            for (const lesson of course.Detail) {
                if (!lesson.Teacher?._id) continue;
                const teacherId = lesson.Teacher._id.toString();
                const lessonId = lesson._id.toString();
                if (!teacherData[teacherId]) {
                    teacherData[teacherId] = { teacherInfo: lesson.Teacher, allLessons: [], totalViolations: 0 };
                }
                const lessonDate = new Date(lesson.Day);
                if (lessonDate > now) {
                    teacherData[teacherId].allLessons.push({ lessonId, courseId: course.ID, course_id: course._id.toString(), day: lesson.Day, room: roomMap.get(lesson.Room?.toString()) || null, status: 'chưa diễn ra', isViolation: false, errors: { attendance: false, comment: false, image: false } });
                    continue;
                }
                const hasImageViolation = !lesson.DetailImage?.length;
                let hasAttendanceViolation = false;
                let hasCommentViolation = false;
                if (course.Student?.length) {
                    for (const student of course.Student) {
                        const learnRecord = student.Learn.find(lr => lr.Lesson?.toString() === lessonId);
                        if (learnRecord) {
                            if (learnRecord.Checkin === 0) hasAttendanceViolation = true;
                            if (learnRecord.Checkin === 1 && !learnRecord.Cmt?.length) hasCommentViolation = true;
                        } else {
                            hasAttendanceViolation = true;
                        }
                        if (hasAttendanceViolation && hasCommentViolation) break;
                    }
                } else {
                    hasAttendanceViolation = true;
                    hasCommentViolation = true;
                }
                const isViolation = hasAttendanceViolation || hasCommentViolation || hasImageViolation;
                if (isViolation) teacherData[teacherId].totalViolations++;
                teacherData[teacherId].allLessons.push({ lessonId, courseId: course.ID, course_id: course._id.toString(), day: lesson.Day, room: roomMap.get(lesson.Room?.toString()) || null, status: 'đã diễn ra', isViolation, errors: { attendance: hasAttendanceViolation, comment: hasCommentViolation, image: hasImageViolation } });
            }
        }
        const result = Object.values(teacherData);
        return JSON.parse(JSON.stringify(result));
    } catch (error) {
        console.error("Lỗi trong dataUserreport:", error);
        throw new Error('Không thể lấy dữ liệu báo cáo giáo viên.');
    }
}

export async function getUserAll({ activeOnly = false } = {}) {
    try {
        await connectDB()
        const filter = {
            uid: { $exists: true, $ne: null },
            ...(activeOnly ? { status: { $ne: false } } : {})
        }
        let data = await User.find(filter, { uid: 0 }).lean().exec();
        return JSON.parse(JSON.stringify(data))
    } catch (error) {
        console.error('Lỗi trong UserAll:', error)
        return null
    }
}

export async function getUserOne(_id) {
    try {
        const cachedFunction = cacheData(() => dataUser(_id), [`user:${_id}`])
        return await cachedFunction()
    } catch (error) {
        console.error('Lỗi trong UserAll:', error)
        return null
    }
}

export async function getUserReport() {
    try {
        const cachedFunction = cacheData(() => dataUserreport(), ['user:report'])
        return await cachedFunction()
    } catch (error) {
        console.error('Lỗi trong UserOne:', error)
        return null
    }
}

