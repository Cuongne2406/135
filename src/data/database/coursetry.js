import TrialCourse from '@/models/coursetry'
import Area from '@/models/area'
import PostStudent from '@/models/student'
import '@/models/users'
import '@/models/book'
import connectDB from '@/config/connectDB'
import { cacheData } from '@/lib/cache'
import { Types } from 'mongoose'

const DEFAULT_TRIAL = {
    _id: null,
    name: 'Học thử',
    code: null,
    sessions: [],
    totalSessions: 0,
    totalStudents: 0
}

async function dataCourseTry() {
    try {
        await connectDB()
        let course = await TrialCourse.findById('6871bc14ada3650715efc786')
            .populate('sessions.teacher', 'name phone')
            .populate('sessions.teachingAs', 'name phone')
            .populate('sessions.book', 'Name Topics')
            .lean()
        if (!course) {
            course = await TrialCourse.findOne()
                .populate('sessions.teacher', 'name phone')
                .populate('sessions.teachingAs', 'name phone')
                .populate('sessions.book', 'Name Topics')
                .lean()
        }
        if (!course) return DEFAULT_TRIAL

        const sessions = course.sessions || []
        const roomIds = new Set()
        const stuIds = new Set()
        sessions.forEach(s => {
            if (s.room) roomIds.add(String(s.room))
            if (s.students) s.students.forEach(st => stuIds.add(String(st.studentId)))
        })
        const roomMap = new Map()
        const roomObjectIds = [...roomIds].filter(id => Types.ObjectId.isValid(id)).map(id => new Types.ObjectId(id))
        const areas = roomObjectIds.length > 0 ? await Area.find({ 'rooms._id': { $in: roomObjectIds } }, { 'rooms.$': 1 }).lean() : []
        areas.forEach(a => a.rooms?.forEach(r => roomMap.set(String(r._id), { _id: r._id, name: r.name })))
        const stuMap = new Map()
        const validStuIds = [...stuIds].filter(id => Types.ObjectId.isValid(id)).map(id => new Types.ObjectId(id))
        const students = validStuIds.length > 0 ? await PostStudent.find({ _id: { $in: validStuIds } }, { Name: 1, Trial: 1, Phone: 1, ID: 1 }).lean() : []
        students.forEach(st => stuMap.set(String(st._id), { _id: st._id, name: st.Name, statuses: st.Trial, phone: st.Phone || '', id: st.ID }))
        const uniqStu = new Set()
        const formattedSessions = sessions.map(s => {
            const roomObj = roomMap.get(String(s.room)) || null
            const topic = s.book?.Topics?.find(t => String(t._id) === String(s.topicId)) || null
            const stuList = (s.students || []).map(st => {
                const info = stuMap.get(String(st.studentId)) || {}
                uniqStu.add(String(st.studentId))
                return { ...st, ...info }
            })
            return { ...s, room: roomObj, book: s.book ? { _id: s.book._id, name: s.book.Name } : null, topic, students: stuList, teacher: s.teacher || null, teachingAs: s.teachingAs || null }
        })
        const payload = { _id: course._id, name: course.name, code: course.code ?? null, sessions: formattedSessions, totalSessions: formattedSessions.length, totalStudents: uniqStu.size }
        return JSON.parse(JSON.stringify(payload))
    } catch (error) {
        console.error('Lỗi trong dataCourseTry:', error.message)
        return DEFAULT_TRIAL
    }
}

export async function getCourseTry() {
    try {
        const cachedFunction = cacheData(() => dataCourseTry(), ['coursetry'])
        return await cachedFunction()
    } catch (error) {
        console.error('Lỗi trong CourseTry:', error)
        return DEFAULT_TRIAL
    }
}

