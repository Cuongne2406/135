import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import PostBook from '@/models/book'
import PostArea from '@/models/area'
import PostUser from '@/models/users'
import mongoose from 'mongoose'

function todayAt(h, m) {
    const d = new Date()
    d.setHours(h, m, 0, 0)
    return d
}

export async function GET(request) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Chức năng Test SLA bị vô hiệu hóa trên môi trường Production' }, { status: 403 });
    }
    try {
        await connectDB()

        await PostCourse.deleteMany({ ID: /^SLA-TEST-/ })
        await PostBook.deleteMany({ ID: 'SLA-TEST-BOOK' })
        await PostArea.deleteMany({ name: 'SLA-TEST-AREA' })
        await PostUser.deleteMany({ email: /^sla-test-/ })

        const bookId = new mongoose.Types.ObjectId()
        const topicId1 = new mongoose.Types.ObjectId()
        const topicId2 = new mongoose.Types.ObjectId()
        const topicId3 = new mongoose.Types.ObjectId()

        await PostBook.create({
            _id: bookId,
            ID: 'SLA-TEST-BOOK',
            Name: 'SLA Test Book',
            Type: 'SLA Test',
            Price: 0,
            Image: '',
            Topics: [
                { _id: topicId1, Name: 'SLA Topic 1', Period: 2, Slide: '' },
                { _id: topicId2, Name: 'SLA Topic 2', Period: 2, Slide: '' },
                { _id: topicId3, Name: 'SLA Topic 3', Period: 2, Slide: '' },
            ]
        })

        const areaId = new mongoose.Types.ObjectId()
        const roomId = new mongoose.Types.ObjectId()

        await PostArea.create({
            _id: areaId,
            name: 'SLA-TEST-AREA',
            rooms: [{ _id: roomId, name: 'SLA Room' }],
            color: '#ff0000',
        })

        const teacherId = new mongoose.Types.ObjectId()
        await PostUser.create({
            _id: teacherId,
            name: 'SLA Test Teacher',
            email: 'sla-test-teacher@test.com',
            uid: '$2a$10$dummy',
            role: ['Teacher'],
            status: true,
        })

        const courseIds = []
        const detailIds = []

        // Lesson 1: Warning — missing attendance only, 60 min late
        const d1Id = new mongoose.Types.ObjectId()
        detailIds.push(d1Id)
        await PostCourse.create({
            ID: 'SLA-TEST-001',
            Name: 'SLA Test Course 1 — Warning',
            Book: bookId,
            Area: areaId,
            Type: 'SLA Test',
            Detail: [{
                _id: d1Id,
                Topic: topicId1,
                Day: todayAt(6, 0),   // started at 06:00, ended at 07:30
                Room: roomId,
                Time: '06:00',
                Teacher: teacherId,
                Note: 'Có nhật ký',
                DetailImage: [{ id: 'sla-img-1', type: 'image', create: new Date() }],
                Type: 'SLA Test',
            }],
            Student: [],   // No students → no checkin → missing attendance
            TeacherHR: teacherId,
        })
        courseIds.push('SLA-TEST-001')

        // Lesson 2: Violation — missing journal + resource, 150 min late
        const d2Id = new mongoose.Types.ObjectId()
        detailIds.push(d2Id)
        await PostCourse.create({
            ID: 'SLA-TEST-002',
            Name: 'SLA Test Course 2 — Violation (no journal, no resource)',
            Book: bookId,
            Area: areaId,
            Type: 'SLA Test',
            Detail: [{
                _id: d2Id,
                Topic: topicId2,
                Day: todayAt(5, 0),   // started at 05:00, ended at 06:30
                Room: roomId,
                Time: '05:00',
                Teacher: teacherId,
                Note: '',    // empty → no journal
                // no DetailImage → no resource
                Type: 'SLA Test',
            }],
            Student: [
                { ID: 'SLA-STU-001', Learn: [{ Checkin: 1, Cmt: ['ok'], Lesson: d2Id }] },
                { ID: 'SLA-STU-002', Learn: [{ Checkin: 1, Cmt: ['ok'], Lesson: d2Id }] },
            ],
            TeacherHR: teacherId,
        })
        courseIds.push('SLA-TEST-002')

        // Lesson 3: Violation — missing all three, 180 min late
        const d3Id = new mongoose.Types.ObjectId()
        detailIds.push(d3Id)
        await PostCourse.create({
            ID: 'SLA-TEST-003',
            Name: 'SLA Test Course 3 — Violation (all missing)',
            Book: bookId,
            Area: areaId,
            Type: 'SLA Test',
            Detail: [{
                _id: d3Id,
                Topic: topicId3,
                Day: todayAt(4, 0),   // started at 04:00, ended at 05:30
                Room: roomId,
                Time: '04:00',
                Teacher: teacherId,
                // no Note → no journal
                // no DetailImage → no resource
                Type: 'SLA Test',
            }],
            Student: [],   // No students → no checkin
            TeacherHR: teacherId,
        })
        courseIds.push('SLA-TEST-003')

        return NextResponse.json({
            success: true,
            message: `Created ${courseIds.length} SLA test courses`,
            courses: courseIds,
            book: 'SLA-TEST-BOOK',
            area: 'SLA-TEST-AREA',
            teacher: 'sla-test-teacher@test.com',
        })
    } catch (err) {
        console.error('SLA test seed error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE() {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Endpoint test SLA bị vô hiệu hóa trên môi trường Production' }, { status: 403 });
    }
    try {
        await connectDB()
        const r1 = await PostCourse.deleteMany({ ID: /^SLA-TEST-/ })
        const r2 = await PostBook.deleteMany({ ID: 'SLA-TEST-BOOK' })
        const r3 = await PostArea.deleteMany({ name: 'SLA-TEST-AREA' })
        const r4 = await PostUser.deleteMany({ email: /^sla-test-/ })
        return NextResponse.json({
            success: true,
            message: `Cleaned up: ${r1.deletedCount} courses, ${r2.deletedCount} books, ${r3.deletedCount} areas, ${r4.deletedCount} users`,
        })
    } catch (err) {
        console.error('SLA test cleanup error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
