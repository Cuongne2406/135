import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import MakeupSession from '@/models/makeupSession'
import PostCourse from '@/models/course'
import authenticate from '@/utils/authenticate'
import { checkScheduleConflict } from '@/utils/scheduleConflict'
import { isValidStatus, isValidTransition, isTerminalStatus } from '@/lib/makeupFsm'
import mongoose from 'mongoose'

export async function PATCH(req, { params }) {
    try {
        const auth = await authenticate(req)
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
        }

        const body = await req.json()
        await connectDB()

        const existingSession = await MakeupSession.findById(id).lean()
        if (!existingSession) {
            return NextResponse.json({ error: 'Không tìm thấy phiên học bù' }, { status: 404 })
        }

        // Kiểm tra hợp lệ theo FSM 8 trạng thái ở máy chủ
        if (body.makeupStatus !== undefined) {
            if (!isValidStatus(body.makeupStatus)) {
                return NextResponse.json({ error: `Trạng thái học bù không hợp lệ: ${body.makeupStatus}` }, { status: 400 })
            }
            if (!isValidTransition(existingSession.makeupStatus, body.makeupStatus)) {
                return NextResponse.json({
                    error: `Không thể chuyển trạng thái từ ${existingSession.makeupStatus} sang ${body.makeupStatus} theo FSM.`
                }, { status: 400 })
            }
        } else if (isTerminalStatus(existingSession.makeupStatus)) {
            return NextResponse.json({
                error: `Phiên học bù đã ở trạng thái kết thúc (${existingSession.makeupStatus}), không thể chỉnh sửa.`
            }, { status: 400 })
        }

        const targetDate = body.makeupDate || existingSession.makeupDate
        const targetTime = body.makeupTime || existingSession.makeupTime
        const targetRoom = body.makeupRoom !== undefined ? body.makeupRoom : existingSession.makeupRoom
        const targetTeacher = body.makeupTeacher !== undefined ? body.makeupTeacher : existingSession.makeupTeacher

        if (targetDate && targetTime && (targetRoom || targetTeacher)) {
            const conflict = await checkScheduleConflict({
                date: targetDate,
                timeStr: targetTime,
                roomId: targetRoom,
                teacherId: targetTeacher,
                excludeCourseId: existingSession.course,
                excludeLessonId: existingSession.lesson,
                excludeMakeupId: id
            })
            if (conflict.hasConflict) {
                return NextResponse.json({ error: conflict.message }, { status: 409 })
            }
        }

        const allowedFields = [
            'makeupLesson',
            'makeupTeacher',
            'makeupRoom',
            'roomAlert',
            'makeupStatus',
            'makeupDate',
            'makeupTime',
            'contentToMakeup',
            'note',
            'absenceReason'
        ]
        const updateData = { updatedBy: auth.user._id }
        for (const key of allowedFields) {
            if (body[key] !== undefined) {
                updateData[key] = body[key]
            }
        }
        if (body.makeupStatus === 'MAKEUP_COMPLETED') {
            updateData.completedAt = new Date()
        }

        const session = await MakeupSession.findByIdAndUpdate(
            id,
            { $set: updateData },
            { new: true, runValidators: true }
        ).lean()
        if (!session) {
            return NextResponse.json({ error: 'Không tìm thấy phiên học bù' }, { status: 404 })
        }

        if (body.makeupStatus) {
            await PostCourse.updateOne(
                {
                    _id: session.course,
                    'Student.ID': session.studentId,
                    'Student.Learn.Lesson': session.lesson
                },
                { $set: { 'Student.$[stu].Learn.$[les].makeupStatus': body.makeupStatus } },
                { arrayFilters: [{ 'stu.ID': session.studentId }, { 'les.Lesson': session.lesson }] }
            )
        }

        return NextResponse.json({ session })
    } catch (err) {
        console.error('Update makeup session error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}

export async function DELETE(req, { params }) {
    try {
        const auth = await authenticate(req)
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = await params
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
        }

        await connectDB()
        const existingSession = await MakeupSession.findById(id).lean()
        if (!existingSession) {
            return NextResponse.json({ error: 'Không tìm thấy phiên học bù' }, { status: 404 })
        }

        if (!isValidTransition(existingSession.makeupStatus, 'MAKEUP_CANCELLED')) {
            return NextResponse.json({
                error: `Không thể xóa/hủy phiên học bù từ trạng thái ${existingSession.makeupStatus} theo quy tắc FSM.`
            }, { status: 400 })
        }

        const cancelNote = existingSession.note
            ? `${existingSession.note} | Đã hủy qua lệnh xóa học vụ`
            : 'Đã hủy qua lệnh xóa học vụ'

        const session = await MakeupSession.findByIdAndUpdate(
            id,
            {
                $set: {
                    makeupStatus: 'MAKEUP_CANCELLED',
                    updatedBy: auth.user._id,
                    note: cancelNote
                }
            },
            { new: true, runValidators: true }
        ).lean()

        await PostCourse.updateOne(
            {
                _id: existingSession.course,
                'Student.ID': existingSession.studentId,
                'Student.Learn.Lesson': existingSession.lesson
            },
            { $set: { 'Student.$[stu].Learn.$[les].makeupStatus': 'MAKEUP_CANCELLED' } },
            { arrayFilters: [{ 'stu.ID': existingSession.studentId }, { 'les.Lesson': existingSession.lesson }] }
        )

        return NextResponse.json({ message: 'Đã hủy phiên học bù sang MAKEUP_CANCELLED theo FSM', session })
    } catch (err) {
        console.error('Delete makeup session error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
