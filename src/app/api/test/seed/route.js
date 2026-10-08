import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import Course from '@/models/course'
import TrialCourse from '@/models/coursetry'
import Book from '@/models/book'
import Area from '@/models/area'
import User from '@/models/users'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

export async function GET() {
    try {
        await connectDB()

        const existing = await Course.findOne({ ID: /^TEST-/ })
        if (existing) {
            await Course.deleteMany({ ID: /^TEST-/ })
            await TrialCourse.deleteMany({ name: /^TEST-/ })
        }

        let book = await Book.findOne({ Name: 'Test Book' })
        if (!book) {
            book = await Book.create({
                ID: 'TEST-BOOK-01',
                Name: 'Test Book',
                Type: 'Test',
                Price: 1000000,
                Topics: [{ _id: new mongoose.Types.ObjectId(), Name: 'Test Topic', Period: 12, Slide: 'test-slide' }],
            })
        }

        let area = await Area.findOne({ name: 'Test Area' })
        if (!area) {
            area = await Area.create({
                name: 'Test Area',
                color: '#3b82f6',
                rooms: [
                    { _id: new mongoose.Types.ObjectId(), name: 'P.Test 01' },
                    { _id: new mongoose.Types.ObjectId(), name: 'P.Test 02' },
                ],
            })
        }

        const hashPass = await bcrypt.hash('123456', 10)

        let teacher = await User.findOne({ email: 'gvtest@test.com' })
        if (!teacher) {
            teacher = await User.create({
                name: 'GV Test',
                phone: '0900000000',
                email: 'gvtest@test.com',
                uid: hashPass,
                role: ['Teacher'],
                status: true,
            })
        } else {
            teacher.uid = hashPass
            teacher.role = ['Teacher']
            teacher.status = true
            await teacher.save()
        }

        let admin = await User.findOne({ email: 'admin@test.com' })
        if (!admin) {
            admin = await User.create({
                name: 'Admin Sys',
                phone: '0999999999',
                email: 'admin@test.com',
                uid: hashPass,
                role: ['Admin'],
                status: true,
            })
        } else {
            admin.uid = hashPass
            admin.role = ['Admin']
            admin.status = true
            await admin.save()
        }

        const topicId = book.Topics[0]._id
        const roomId = area.rooms[0]._id
        const roomId2 = area.rooms[1]._id

        const today = new Date()
        const lessonDate = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0, 0)

        const officialStudentCount = 12
        const officialStudents = Array.from({ length: officialStudentCount }, (_, i) => ({
            ID: `TEST-HS-${String(i + 1).padStart(3, '0')}`,
            Learn: [
                {
                    Checkin: i < 9 ? 1 : i < 11 ? 2 : 0,
                    Lesson: new mongoose.Types.ObjectId(),
                    Cmt: [],
                    CmtFn: '',
                    Note: '',
                    absenceReason: i >= 9 && i < 11 ? 'Ốm' : '',
                    makeupStatus: 'NOT_REQUIRED',
                },
            ],
        }))

        const detailLessonId = new mongoose.Types.ObjectId()
        const officialCourse = await Course.create({
            ID: 'TEST-OFFICIAL-01',
            Book: book._id,
            Status: true,
            Type: 'AI Robotic',
            Detail: [
                {
                    _id: detailLessonId,
                    Topic: topicId,
                    Day: lessonDate,
                    Room: roomId,
                    Time: '08:00 - 09:30',
                    Teacher: teacher._id,
                },
            ],
            Student: officialStudents.map(s => ({
                ...s,
                Learn: s.Learn.map(l => ({ ...l, Lesson: detailLessonId })),
            })),
            Area: area._id,
            TeacherHR: teacher._id,
        })

        const trialStudentCount = 8
        const trialStudents = Array.from({ length: trialStudentCount }, (_, i) => ({
            studentId: `TEST-TRIAL-HS-${String(i + 1).padStart(3, '0')}`,
            checkin: i < 5,
            cmt: [],
            images: [],
            note: '',
        }))

        try {
            await mongoose.connection.db.collection('trialcourses').dropIndex('code_1')
        } catch (_) {}
        try {
            await mongoose.connection.db.collection('trialcourses').dropIndex('sessions.students.images.id_1')
        } catch (_) {}

        const trialCourse = await TrialCourse.create({
            name: 'TEST-TRIAL-01',
            rootFolderId: 'test-root',
            sessions: [
                {
                    day: lessonDate,
                    room: roomId2,
                    time: '14:45 - 16:15',
                    folderId: 'test-folder',
                    images: { id: 'test-img', type: 'test' },
                    book: book._id,
                    topicId,
                    students: trialStudents,
                    teacher: teacher._id,
                    status: true,
                },
            ],
        })

        return NextResponse.json({
            message: 'Tạo dữ liệu test thành công',
            officialCourse: { ID: officialCourse.ID, _id: officialCourse._id },
            trialCourse: { name: trialCourse.name, _id: trialCourse._id },
            lessonDate: lessonDate.toISOString(),
            stats: {
                officialStudents: officialStudentCount,
                trialStudents: trialStudentCount,
                total: officialStudentCount + trialStudentCount,
            },
        })
    } catch (err) {
        console.error('Seed error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE() {
    try {
        await connectDB()
        const r1 = await Course.deleteMany({ ID: /^TEST-/ })
        const r2 = await TrialCourse.deleteMany({ name: /^TEST-/ })
        await Book.deleteOne({ ID: 'TEST-BOOK-01' })
        await Area.deleteOne({ name: 'Test Area' })
        await User.deleteOne({ name: 'GV Test' })
        return NextResponse.json({
            message: 'Đã xóa dữ liệu test',
            deleted: { courses: r1.deletedCount, trialCourses: r2.deletedCount },
        })
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
