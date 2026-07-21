import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import PostCourse from '@/models/course'
import TrialCourse from '@/models/coursetry'
import mongoose from 'mongoose'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const month = +searchParams.get('month')
    const year = +searchParams.get('year')
    const teacherId = searchParams.get('teacherId')
    if (!Number.isInteger(month) || !Number.isInteger(year) || month < 1 || month > 12)
      return NextResponse.json({ error: 'month/year không hợp lệ' }, { status: 400 })

    await connectDB()
    if (mongoose.connection.readyState !== 1) await mongoose.connection.asPromise()

    const start = new Date(Date.UTC(year, month - 1, 1))
    const end = new Date(Date.UTC(year, month, 1))

    const teacherMatch = teacherId && mongoose.Types.ObjectId.isValid(teacherId)
      ? {
          $or: [
            { 'Detail.Teacher': new mongoose.Types.ObjectId(teacherId) },
            { 'Detail.TeachingAs': new mongoose.Types.ObjectId(teacherId) }
          ]
        }
      : {}

    const officialAgg = PostCourse.aggregate([
      { $unwind: '$Detail' },
      { $match: { 'Detail.Day': { $gte: start, $lt: end }, ...teacherMatch } },
      {
        $addFields: {
          students: {
            $map: {
              input: {
                $filter: {
                  input: '$Student',
                  as: 'st',
                  cond: {
                    $anyElementTrue: [
                      { $map: { input: '$$st.Learn', as: 'lr', in: { $eq: ['$$lr.Lesson', '$Detail._id'] } } }
                    ]
                  }
                }
              },
              as: 'st',
              in: {
                $mergeObjects: [
                  '$$st',
                  { Learn: { $filter: { input: '$$st.Learn', as: 'lr', cond: { $eq: ['$$lr.Lesson', '$Detail._id'] } } } }
                ]
              }
            }
          }
        }
      },
      { $lookup: { from: 'books', localField: 'Book', foreignField: '_id', as: 'b' } },
      { $set: { b: { $arrayElemAt: ['$b', 0] } } },
      {
        $set: {
          topic: {
            $arrayElemAt: [
              { $filter: { input: '$b.Topics', as: 't', cond: { $eq: ['$$t._id', '$Detail.Topic'] } } },
              0
            ]
          }
        }
      },
      { $lookup: { from: 'users', localField: 'Detail.Teacher', foreignField: '_id', as: 'teacher' } },
      { $lookup: { from: 'users', localField: 'Detail.TeachingAs', foreignField: '_id', as: 'teachingAs' } },
      {
        $lookup: {
          from: 'areas',
          let: { roomId: '$Detail.Room' },
          pipeline: [
            { $unwind: '$rooms' },
            { $match: { $expr: { $eq: ['$rooms._id', '$$roomId'] } } },
            { $project: { _id: 0, room: '$rooms', name: '$name', color: '$color' } }
          ],
          as: 'rd'
        }
      },
      { $set: { rd: { $arrayElemAt: ['$rd', 0] } } },
      {
        $project: {
          _id: '$Detail._id',
          courseId: '$ID',
          courseName: '$Name',
          type: '$Detail.Type',
          date: '$Detail.Day',
          day: { $dayOfMonth: '$Detail.Day' },
          month: { $month: '$Detail.Day' },
          year: { $year: '$Detail.Day' },
          time: '$Detail.Time',
          room: {
            _id: { $ifNull: ['$rd.room._id', null] },
            name: { $ifNull: ['$rd.room.name', null] },
            area: '$rd.name',
            color: '$rd.color'
          },
          image: '$Detail.Image',
          topic: '$topic',
          teacher: { $arrayElemAt: ['$teacher', 0] },
          teachingAs: { $arrayElemAt: ['$teachingAs', 0] },
          students: '$students'
        }
      }
    ])
    const trialTeacherMatch = teacherId && mongoose.Types.ObjectId.isValid(teacherId)
      ? {
          $or: [
            { 'sessions.teacher': new mongoose.Types.ObjectId(teacherId) },
            { 'sessions.teachingAs': new mongoose.Types.ObjectId(teacherId) }
          ]
        }
      : {}

    const trialAgg = TrialCourse.aggregate([
      { $unwind: '$sessions' },
      { $match: { 'sessions.day': { $gte: start, $lt: end }, ...trialTeacherMatch } },
      { $lookup: { from: 'books', localField: 'sessions.book', foreignField: '_id', as: 'b' } },
      { $set: { b: { $arrayElemAt: ['$b', 0] } } },
      {
        $set: {
          topic: {
            $arrayElemAt: [
              { $filter: { input: '$b.Topics', as: 't', cond: { $eq: ['$$t._id', '$sessions.topicId'] } } },
              0
            ]
          }
        }
      },
      { $lookup: { from: 'users', localField: 'sessions.teacher', foreignField: '_id', as: 'teacher' } },
      { $lookup: { from: 'users', localField: 'sessions.teachingAs', foreignField: '_id', as: 'teachingAs' } },
      {
        $lookup: {
          from: 'areas',
          let: { roomId: '$sessions.room' },
          pipeline: [
            { $unwind: '$rooms' },
            { $match: { $expr: { $eq: ['$rooms._id', '$$roomId'] } } },
            { $project: { _id: 0, room: '$rooms', name: '$name', color: '$color' } }
          ],
          as: 'rd'
        }
      },
      { $set: { rd: { $arrayElemAt: ['$rd', 0] } } },
      {
        $project: {
          _id: '$sessions._id',
          courseId: '$name',
          courseName: '$name',
          type: { $literal: 'trial' },
          date: '$sessions.day',
          day: { $dayOfMonth: '$sessions.day' },
          month: { $month: '$sessions.day' },
          year: { $year: '$sessions.day' },
          time: '$sessions.time',
          room: {
            _id: { $ifNull: ['$rd.room._id', null] },
            name: { $ifNull: ['$rd.room.name', null] },
            area: '$rd.name',
            color: '$rd.color'
          },
          image: null,
          topic: '$topic',
          teacher: { $arrayElemAt: ['$teacher', 0] },
          teachingAs: { $arrayElemAt: ['$teachingAs', 0] },
          students: '$sessions.students'
        }
      }
    ])

    const [official, trial] = await Promise.all([officialAgg, trialAgg])
    const data = [...official, ...trial].sort((a, b) => a.date - b.date)
    return NextResponse.json({ success: true, data })
  } catch (err) {
    console.error('Calendar API error:', err)
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
