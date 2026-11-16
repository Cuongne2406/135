import Course from '@/models/course'
import User from '@/models/users'
import Book from '@/models/book'
import '@/models/area'
import Student from '@/models/student'
import connectDB from '@/config/connectDB'
import { cacheData } from '@/lib/cache'
import { CheckProfileDone } from '@/function/server';
import mongoose from 'mongoose';

export async function dataCourse(_id) {
    try {
        await connectDB();
        if (!_id) {
            const courses = await Course.find({ Type: 'AI Robotic' })
                .populate({ path: 'Book', select: 'Name' })
                .populate({ path: 'TeacherHR', select: 'name' })
                .populate({ path: 'Area', select: 'name color rooms' })
                .populate({ path: 'Detail', populate: [{ path: 'Teacher', select: 'name phone' }] })
                .lean();


        //    if (courses && courses.length > 0 && courses[0].Detail && courses[0].Detail.length > 0) {
        //         console.log("\n=== CHI TIẾT 1 OBJECT TRONG DETAIL ĐỂ DEBUG ===");
        //         console.log(JSON.stringify(courses[0].Detail[0], null, 2)); 
        //         console.log(`=> Khóa học này đang chứa ${courses[0].Detail.length} object Detail như trên.\n`);
        //     }

            
            const idSet = new Set();
            courses.forEach(course => {
                (course.Detail || []).forEach(detail => {
                    const id = typeof detail.TeachingAs === 'string' ? detail.TeachingAs : detail.TeachingAs?._id;
                    if (mongoose.Types.ObjectId.isValid(id)) idSet.add(id);
                });
            });
            const userMap = {};
            const idList = Array.from(idSet);
            if (idList.length) {
                const users = await User.find({ _id: { $in: idList } }, 'name phone').lean();
                users.forEach(u => { userMap[String(u._id)] = u; });
            }
            const cleaned = courses.map(course => {
                (course.Detail || []).forEach(detail => {
                    const id = typeof detail.TeachingAs === 'string' ? detail.TeachingAs : detail.TeachingAs?._id;
                    if (userMap[id]) detail.TeachingAs = userMap[id];
                    else delete detail.TeachingAs;
                });
                return course;
            });
            return JSON.parse(JSON.stringify(cleaned));
        }
        const query = mongoose.Types.ObjectId.isValid(_id) ? { _id } : { ID: _id }
        const course = await Course.findOne(query)
            .populate([{ path: 'Book' }, { path: 'TeacherHR', select: 'name phone' }, { path: 'Area', select: 'name rooms color' }])
            .lean();
        if (!course) return null;

        const userIds = new Set();
        course.Detail?.forEach(d => {
            if (d.Teacher && mongoose.Types.ObjectId.isValid(d.Teacher)) userIds.add(d.Teacher.toString());
            if (d.TeachingAs && mongoose.Types.ObjectId.isValid(d.TeachingAs)) userIds.add(d.TeachingAs.toString());
        });
        const lessonIds = [...new Set(course.Detail?.map(d => d.Topic?.toString()).filter(Boolean) || [])];
        const studentIds = course.Student?.map(s => s.ID) || [];

        const [usersData, relevantBooks, studentsData] = await Promise.all([
            userIds.size > 0 ? User.find({ _id: { $in: Array.from(userIds) } }).select('name phone').lean() : Promise.resolve([]),
            lessonIds.length > 0 ? Book.find({ 'Topics._id': { $in: lessonIds.map(lid => new mongoose.Types.ObjectId(lid)) } }).lean() : Promise.resolve([]),
            studentIds.length > 0 ? Student.find({ ID: { $in: studentIds } }).select('ID Name _id Profile Course').lean() : Promise.resolve([])
        ]);
        const userDetailsMap = new Map(usersData.map(u => [u._id.toString(), u]));
        const lessonDetailsMap = new Map();
        if (relevantBooks.length > 0) {
            for (const book of relevantBooks) {
                for (const topic of book.Topics) {
                    const topicIdStr = topic._id.toString();
                    if (lessonIds.includes(topicIdStr)) lessonDetailsMap.set(topicIdStr, topic);
                }
            }
        }
        const roomMap = course.Area && Array.isArray(course.Area.rooms) ? new Map(course.Area.rooms.map(r => [r._id.toString(), r.name])) : null;

        if (course.Detail) {
            course.Detail.forEach(item => {
                item.LessonDetails = lessonDetailsMap.get(item.Topic?.toString()) || null;
                item.Teacher = userDetailsMap.get(item.Teacher?.toString()) || null;
                item.TeachingAs = userDetailsMap.get(item.TeachingAs?.toString()) || null;
                const rawRoom = item.Room?.toString()
                if (rawRoom && !mongoose.Types.ObjectId.isValid(rawRoom)) {
                } else if (roomMap && rawRoom) {
                    item.Room = roomMap.get(rawRoom) || null
                } else if (rawRoom) {
                    item.Room = null
                }
            });
        }
        if (studentsData.length > 0) {
            const studentInfoMap = new Map(studentsData.map(s => [s.ID, s]));
            course.Student.forEach(student => {
                const info = studentInfoMap.get(student.ID);
                student.Name = info?.Name || 'Không tìm thấy';
                student.userId = info?._id || null;
                student.StatusProfile = CheckProfileDone(info?.Profile || {});
                student.StatusCourse = info?.Course.filter(c => c.course.toString() == _id)[0]?.tuition == null ? false : true || false;
            });
        }
        return JSON.parse(JSON.stringify(course));
    } catch (error) {
        console.error('Lỗi trong dataCourse:', error);
        const isCastError = error.name === 'CastError';
        throw new Error(isCastError ? 'ID khóa học không hợp lệ.' : 'Không thể lấy dữ liệu khóa học từ máy chủ.');
    }
}

export async function getCourseAll() {
    try {
        const cachedFunction = cacheData(() => dataCourse(), ['courses'])
        return await cachedFunction()
    } catch (error) {
        console.error('Lỗi trong CourseAll:', error)
        return null
    }
}

export async function getCourseOne(_id) {
    try {
        const cachedFunction = cacheData(() => dataCourse(_id), [`course:${_id}`])
        return await cachedFunction()
    } catch (error) {
        console.error('Lỗi trong CourseOne:', error)
        throw new Error('Không thể lấy dữ liệu khóa học.')
    }
}
