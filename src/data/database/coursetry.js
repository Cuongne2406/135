import TrialCourse from '@/models/coursetry'
import Area from '@/models/area'
import PostStudent from '@/models/student'
import connectDB from '@/config/connectDB'
import { cacheData } from '@/lib/cache'
import { Types } from 'mongoose'

async function dataCourseTry() {
    try {
        await connectDB()
        const course = await TrialCourse.findById('6871bc14ada3650715efc786').populate('sessions.teacher', 'name phone').populate('sessions.teachingAs', 'name phone').populate('sessions.book', 'Name Topics').lean()
        if (!course) throw new Error('Trial course không tồn tại')
        const roomIds = new Set()
        const stuIds = new Set()
        course.sessions.forEach(s => {
            if (s.room) roomIds.add(String(s.room))
            s.students.forEach(st => stuIds.add(st.studentId))
        })
        const roomMap = new Map()
        const roomObjectIds = [...roomIds].map(id => new Types.ObjectId(id))
        const areas = await Area.find({ 'rooms._id': { $in: roomObjectIds } }, { 'rooms.$': 1 }).lean()
        areas.forEach(a => a.rooms.forEach(r => roomMap.set(String(r._id), { _id: r._id, name: r.name })))
        const stuMap = new Map()
        const students = await PostStudent.find({ _id: { $in: [...stuIds] } }, { Name: 1, Trial: 1, Phone: 1, ID: 1 }).lean()
        students.forEach(st => stuMap.set(String(st._id), { _id: st._id, name: st.Name, statuses: st.Trial, phone: st.Phone || '', id: st.ID }))
        const uniqStu = new Set()
        course.sessions = course.sessions.map(s => {
            const roomObj = roomMap.get(String(s.room)) || null
            const topic = s.book?.Topics?.find(t => String(t._id) === String(s.topicId)) || null
            const students = s.students.map(st => {
                const info = stuMap.get(String(st.studentId)) || {}
                uniqStu.add(String(st.studentId))
                return { ...st, ...info }
            })
            return { ...s, room: roomObj, book: s.book ? { _id: s.book._id, name: s.book.Name } : null, topic, students, teacher: s.teacher || null, teachingAs: s.teachingAs || null }
        })
        const payload = { _id: course._id, name: course.name, code: course.code ?? null, sessions: course.sessions, totalSessions: course.sessions.length, totalStudents: uniqStu.size }
        return JSON.parse(JSON.stringify(payload))
    } catch (error) {
        console.error('Lỗi trong dataCourseTry:', error)
        throw error
    }
}

export async function getCourseTry() {
    try {
        const cachedFunction = cacheData(() => dataCourseTry(), ['coursetry'])
        return await cachedFunction()
    } catch (error) {
        console.error('Lỗi trong CourseTry:', error)
        return null
    }
}

