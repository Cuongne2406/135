import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import TrialCourse from '@/models/coursetry'
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
                    from: 'users',
                    localField: 'Detail.Teacher',
                    foreignField: '_id',
                    as: 'teacher'
                }
            },
            { $set: { teacher: { $arrayElemAt: ['$teacher', 0] } } },
            {
                $addFields: {
                    lessonStart: '$Detail.Day',
                    lessonEnd: {
                        $dateAdd: {
                            startDate: '$Detail.Day',
                            unit: 'minute',
                            amount: 90
                        }
                    },
                    studentCount: { $size: '$Student' },
                    checkedStudents: {
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
                    }
                }
            },
            {
                $project: {
                    _id: 1,
                    ID: 1,
                    Name: 1,
                    lessonId: '$Detail._id',
                    lessonDay: '$Detail.Day',
                    lessonTime: '$Detail.Time',
                    lessonType: '$Detail.Type',
                    lessonNote: '$Detail.Note',
                    teacherName: '$teacher.name',
                    teacherId: '$Detail.Teacher',
                    totalStudents: '$studentCount',
                    checkedStudents: 1
                }
            }
        ])

        const trialAgg = TrialCourse.aggregate([
            { $unwind: '$sessions' },
            { $match: { 'sessions.day': { $gte: start, $lt: end } } },
            {
                $lookup: {
                    from: 'users',
                    localField: 'sessions.teacher',
                    foreignField: '_id',
                    as: 'teacher'
                }
            },
            { $set: { teacher: { $arrayElemAt: ['$teacher', 0] } } },
            {
                $project: {
                    _id: 1,
                    ID: '$name',
                    Name: '$name',
                    lessonId: '$sessions._id',
                    lessonDay: '$sessions.day',
                    lessonTime: '$sessions.time',
                    lessonType: { $literal: null },
                    lessonNote: { $literal: null },
                    teacherName: '$teacher.name',
                    teacherId: '$sessions.teacher',
                    totalStudents: { $size: { $ifNull: ['$sessions.students', []] } },
                    checkedStudents: {
                        $size: {
                            $filter: {
                                input: { $ifNull: ['$sessions.students', []] },
                                as: 'st',
                                cond: { $eq: ['$$st.checkin', true] }
                            }
                        }
                    }
                }
            }
        ])

        const [official, trial] = await Promise.all([agg, trialAgg])
        const sessions = [...official, ...trial]

        let total = sessions.length
        let scheduled = 0, inProgress = 0, ended = 0
        let waitingReport = 0, completed = 0
        let slaWarning = 0, slaViolation = 0

        for (const s of sessions) {
            const startTime = new Date(s.lessonDay)
            const endTime = new Date(startTime.getTime() + 90 * 60 * 1000)

            if (now < startTime) scheduled++
            else if (now >= startTime && now <= endTime) inProgress++
            else {
                ended++
                const hasCheckin = s.checkedStudents > 0
                if (hasCheckin) completed++
                else waitingReport++
            }
        }

        return NextResponse.json({
            date: start.toISOString().split('T')[0],
            total_sessions: total,
            scheduled_sessions: scheduled,
            in_progress_sessions: inProgress,
            ended_sessions: ended,
            waiting_report_sessions: waitingReport,
            completed_sessions: completed,
            sla_warning_sessions: slaWarning,
            sla_violation_sessions: slaViolation,
            open_incidents: 0,
            sessions
        })
    } catch (err) {
        console.error('Academic dashboard today error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
