import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import mongoose from 'mongoose'

function getTodayRange() {
    const now = new Date()
    const start = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
    return { start, end, now }
}

export async function GET() {
    try {
        await connectDB()
        const { start, end, now } = getTodayRange()

        const agg = PostCourse.aggregate([
            { $unwind: '$Detail' },
            { $match: { 'Detail.Day': { $gte: start, $lt: end } } },
            {
                $lookup: {
                    from: 'books',
                    localField: 'Book',
                    foreignField: '_id',
                    as: 'bk'
                }
            },
            { $set: { bk: { $arrayElemAt: ['$bk', 0] } } },
            {
                $set: {
                    topic: {
                        $arrayElemAt: [
                            {
                                $filter: {
                                    input: '$bk.Topics',
                                    as: 'tp',
                                    cond: { $eq: ['$$tp._id', '$Detail.Topic'] }
                                }
                            },
                            0
                        ]
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'Detail.Teacher',
                    foreignField: '_id',
                    as: 'teacher'
                }
            },
            { $set: { teacher: { $arrayElemAt: ['$teacher', 0] } } },
            {
                $lookup: {
                    from: 'areas',
                    localField: 'Area',
                    foreignField: '_id',
                    as: 'ar'
                }
            },
            { $set: { ar: { $arrayElemAt: ['$ar', 0] } } },
            {
                $addFields: {
                    lessonEnd: {
                        $dateAdd: {
                            startDate: '$Detail.Day',
                            unit: 'minute',
                            amount: 90
                        }
                    },
                    hasCheckin: {
                        $gt: [
                            {
                                $size: {
                                    $filter: {
                                        input: '$Student',
                                        as: 'st',
                                        cond: {
                                            $gt: [
                                                { $size: { $ifNull: ['$$st.Learn', []] } },
                                                0
                                            ]
                                        }
                                    }
                                }
                            },
                            0
                        ]
                    },
                    hasJournal: {
                        $cond: [
                            { $ifNull: ['$Detail.Note', false] },
                            { $ne: ['$Detail.Note', ''] },
                            false
                        ]
                    },
                    hasResource: {
                        $gt: [{ $size: { $ifNull: ['$Detail.DetailImage', []] } }, 0]
                    }
                }
            },
            {
                $match: {
                    $expr: { $lt: ['$lessonEnd', now] }
                }
            },
            {
                $project: {
                    _id: 1,
                    courseId: '$ID',
                    courseName: '$Name',
                    lessonId: '$Detail._id',
                    lessonNumber: { $literal: 0 },
                    topicName: '$topic.Name',
                    teacherName: '$teacher.name',
                    endedAt: '$lessonEnd',
                    hasCheckin: 1,
                    hasJournal: 1,
                    hasResource: 1,
                    lessonType: '$Detail.Type'
                }
            }
        ])

        const results = await agg
        const items = results.map(r => {
            const missing = []
            if (!r.hasCheckin) missing.push('attendance')
            if (!r.hasJournal) missing.push('journal')
            if (!r.hasResource) missing.push('resource')

            const endedAt = new Date(r.endedAt)
            const lateMs = now - endedAt
            const lateMinutes = Math.round(lateMs / 60000)
            const level = lateMinutes > 120 ? 'VIOLATION' : 'WARNING'

            return {
                class_name: r.courseName || r.courseId,
                lesson_number: r.lessonNumber,
                topic_name: r.topicName,
                teacher_name: r.teacherName || 'N/A',
                ended_at: endedAt.toISOString(),
                missing_items: missing,
                late_minutes: lateMinutes,
                level
            }
        })

        return NextResponse.json({ items })
    } catch (err) {
        console.error('SLA alerts error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
