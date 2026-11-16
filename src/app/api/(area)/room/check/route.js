import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import TrialCourse from '@/models/coursetry'
import authenticate from '@/utils/authenticate'
import mongoose from 'mongoose'

export async function GET(req) {
  try {
    const { user } = await authenticate(req)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const roomId = searchParams.get('roomId')
    const date = searchParams.get('date')
    const time = searchParams.get('time')
    const excludeId = searchParams.get('excludeId')

    if (!roomId || !date || !time)
      return NextResponse.json({ error: 'roomId, date, time là bắt buộc' }, { status: 400 })

    if (!mongoose.Types.ObjectId.isValid(roomId))
      return NextResponse.json({ error: 'roomId không hợp lệ' }, { status: 400 })

    await connectDB()

    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)
    const roomOid = new mongoose.Types.ObjectId(roomId)

    const timeRange = time.split('-')
    const timeStart = timeRange[0]?.trim()
    const timeEnd = timeRange[1]?.trim()

    const officialConflicts = await PostCourse.aggregate([
      { $unwind: '$Detail' },
      {
        $match: {
          'Detail.Day': { $gte: dayStart, $lte: dayEnd },
          'Detail.Room': roomOid,
          ...(excludeId ? { 'Detail._id': { $ne: new mongoose.Types.ObjectId(excludeId) } } : {})
        }
      },
      {
        $project: {
          _id: '$Detail._id',
          courseId: '$ID',
          time: '$Detail.Time',
          teacher: 1,
          timeStart: { $arrayElemAt: [{ $split: ['$Detail.Time', '-'] }, 0] },
          timeEnd: { $arrayElemAt: [{ $split: ['$Detail.Time', '-'] }, 1] }
        }
      }
    ])

    const trialConflicts = await TrialCourse.aggregate([
      { $unwind: '$sessions' },
      {
        $match: {
          'sessions.day': { $gte: dayStart, $lte: dayEnd },
          'sessions.room': roomOid,
          ...(excludeId ? { 'sessions._id': { $ne: new mongoose.Types.ObjectId(excludeId) } } : {})
        }
      },
      {
        $project: {
          _id: '$sessions._id',
          courseId: '$name',
          time: '$sessions.time',
          timeStart: { $arrayElemAt: [{ $split: ['$sessions.time', '-'] }, 0] },
          timeEnd: { $arrayElemAt: [{ $split: ['$sessions.time', '-'] }, 1] }
        }
      }
    ])

    function timeToMins(t) {
      if (!t) return null
      const [h, m] = t.split(':').map(Number)
      return isNaN(h) || isNaN(m) ? null : h * 60 + m
    }

    const reqStart = timeToMins(timeStart)
    const reqEnd = timeToMins(timeEnd)

    function overlaps(aStart, aEnd, bStart, bEnd) {
      if (aStart === null || aEnd === null || bStart === null || bEnd === null) return true
      return aStart < bEnd && bStart < aEnd
    }

    const conflicting = [...officialConflicts, ...trialConflicts].filter(item => {
      const itemStart = timeToMins(item.timeStart)
      const itemEnd = timeToMins(item.timeEnd)
      return overlaps(reqStart, reqEnd, itemStart, itemEnd)
    })

    return NextResponse.json({
      success: true,
      conflict: conflicting.length > 0,
      conflicts: conflicting.map(c => ({
        _id: c._id,
        courseId: c.courseId,
        time: c.time
      }))
    })
  } catch (err) {
    console.error('Room check error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
