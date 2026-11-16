import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import MakeupSession from '@/models/makeupSession'
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
        const { start, end } = getTodayRange()

        const agg = PostCourse.aggregate([
            { $unwind: '$Detail' },
            { $match: { 'Detail.Day': { $gte: start, $lt: end } } },
            { $unwind: '$Student' },
            { $unwind: '$Student.Learn' },
            {
                $match: {
                    $expr: { $eq: ['$Student.Learn.Lesson', '$Detail._id'] }
                }
            },
            {
                $group: {
                    _id: null,
                    totalTurns: { $sum: 1 },
                    presentTurns: {
                        $sum: { $cond: [{ $eq: ['$Student.Learn.Checkin', 1] }, 1, 0] }
                    },
                    absentTurns: {
                        $sum: {
                            $cond: [
                                { $in: ['$Student.Learn.Checkin', [2, 3]] },
                                1,
                                0
                            ]
                        }
                    },
                    uncheckedTurns: {
                        $sum: { $cond: [{ $eq: ['$Student.Learn.Checkin', 0] }, 1, 0] }
                    },
                    absentWithReason: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $in: ['$Student.Learn.Checkin', [2, 3]] },
                                        { $ne: [{ $ifNull: ['$Student.Learn.absenceReason', ''] }, ''] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },
                    absentWithoutReason: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $in: ['$Student.Learn.Checkin', [2, 3]] },
                                        { $eq: [{ $ifNull: ['$Student.Learn.absenceReason', ''] }, ''] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ])

        const makeupAgg = MakeupSession.aggregate([
            {
                $match: {
                    createdAt: { $gte: start, $lt: end }
                }
            },
            {
                $group: {
                    _id: null,
                    makeupRequired: { $sum: 1 },
                    makeupScheduled: {
                        $sum: {
                            $cond: [
                                { $eq: ['$makeupStatus', 'MAKEUP_SCHEDULED'] },
                                1,
                                0
                            ]
                        }
                    },
                    makeupCompleted: {
                        $sum: {
                            $cond: [
                                { $eq: ['$makeupStatus', 'MAKEUP_COMPLETED'] },
                                1,
                                0
                            ]
                        }
                    },
                    makeupExpired: {
                        $sum: {
                            $cond: [
                                { $eq: ['$makeupStatus', 'MAKEUP_EXPIRED'] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ])

        const [attendanceResult, makeupResult] = await Promise.all([agg, makeupAgg])
        const stats = attendanceResult[0] || {
            totalTurns: 0, presentTurns: 0, absentTurns: 0,
            uncheckedTurns: 0, absentWithReason: 0, absentWithoutReason: 0
        }
        const makeup = makeupResult[0] || {
            makeupRequired: 0, makeupScheduled: 0, makeupCompleted: 0, makeupExpired: 0
        }

        const total = stats.totalTurns || 1

        return NextResponse.json({
            date: start.toISOString().split('T')[0],
            total_student_turns: stats.totalTurns,
            present_turns: stats.presentTurns,
            absent_turns: stats.absentTurns,
            present_rate: Math.round((stats.presentTurns / total) * 1000) / 10,
            absent_rate: Math.round((stats.absentTurns / total) * 1000) / 10,
            absence_with_reason: stats.absentWithReason,
            absence_without_reason: stats.absentWithoutReason,
            makeup_required: makeup.makeupRequired,
            makeup_scheduled: makeup.makeupScheduled,
            makeup_completed: makeup.makeupCompleted,
            makeup_expired: makeup.makeupExpired
        })
    } catch (err) {
        console.error('Attendance today error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
