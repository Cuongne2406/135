import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import MakeupSession from '@/models/makeupSession'
import mongoose from 'mongoose'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const courseId = searchParams.get('courseId')
        const studentId = searchParams.get('studentId')

        await connectDB()
        const match = {}
        if (courseId) match.course = new mongoose.Types.ObjectId(courseId)
        if (studentId) match.studentId = studentId

        const agg = await MakeupSession.aggregate([
            { $match: match },
            {
                $group: {
                    _id: '$makeupStatus',
                    count: { $sum: 1 }
                }
            }
        ])

        const statusMap = {}
        for (const item of agg) {
            statusMap[item._id] = item.count
        }

        return NextResponse.json({
            total: agg.reduce((sum, item) => sum + item.count, 0),
            byStatus: statusMap
        })
    } catch (err) {
        console.error('Makeup stats error:', err)
        return NextResponse.json({ error: err.message }, { status: 500 })
    }
}
