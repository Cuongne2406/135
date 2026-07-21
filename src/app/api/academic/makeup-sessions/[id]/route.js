import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import MakeupSession from '@/models/makeupSession'
import PostCourse from '@/models/course'
import authenticate from '@/utils/authenticate'
import mongoose from 'mongoose'

export async function PATCH(req, { params }) {
    try {
        const auth = await authenticate(req)
        if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

        const { id } = params
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
        }

        const body = await req.json()
        await connectDB()

        const updateData = { ...body, updatedBy: auth.user._id }
        if (body.makeupStatus === 'MAKEUP_COMPLETED') {
            updateData.completedAt = new Date()
        }

        const session = await MakeupSession.findByIdAndUpdate(id, { $set: updateData }, { new: true }).lean()
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

        const { id } = params
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'ID không hợp lệ' }, { status: 400 })
        }

        await connectDB()
        const session = await MakeupSession.findByIdAndDelete(id).lean()
        if (!session) {
            return NextResponse.json({ error: 'Không tìm thấy phiên học bù' }, { status: 404 })
        }

        await PostCourse.updateOne(
            {
                _id: session.course,
                'Student.ID': session.studentId,
                'Student.Learn.Lesson': session.lesson
            },
            { $set: { 'Student.$[stu].Learn.$[les].makeupStatus': 'NOT_REQUIRED' } },
            { arrayFilters: [{ 'stu.ID': session.studentId }, { 'les.Lesson': session.lesson }] }
        )

        return NextResponse.json({ message: 'Đã xóa phiên học bù' })
    } catch (err) {
        console.error('Delete makeup session error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
