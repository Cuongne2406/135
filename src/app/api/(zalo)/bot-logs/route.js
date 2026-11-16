import { NextResponse } from 'next/server'
import connectDB from '@/config/connectDB'
import Logs from '@/models/log'
import mongoose from 'mongoose'

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url)
        const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
        const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '30')))
        const zaloId = searchParams.get('zaloId')
        const actionType = searchParams.get('actionType')
        const status = searchParams.get('status')
        const search = searchParams.get('search') || ''

        await connectDB()

        const filter = {}

        if (zaloId && mongoose.Types.ObjectId.isValid(zaloId)) {
            filter.zalo = new mongoose.Types.ObjectId(zaloId)
        }
        if (actionType) {
            filter.type = actionType
        }
        if (status === 'success') {
            filter['status.status'] = true
        } else if (status === 'failed') {
            filter['status.status'] = false
        }

        if (search) {
            filter['status.message'] = { $regex: search, $options: 'i' }
        }

        const [total, logs] = await Promise.all([
            Logs.countDocuments(filter),
            Logs.find(filter)
                .populate('zalo', 'name avt phone')
                .populate('customer', 'Name phone')
                .populate('student', 'Name phone')
                .populate('createBy', 'name')
                .populate('schedule', 'jobName actionType')
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .lean(),
        ])

        const items = logs.map(log => ({
            _id: log._id,
            type: log.type,
            status: log.status,
            message: log.status?.message || '',
            createdAt: log.createdAt,
            zalo: log.zalo ? { _id: log.zalo._id, name: log.zalo.name, avt: log.zalo.avt, phone: log.zalo.phone } : null,
            customer: log.customer ? { _id: log.customer._id, Name: log.customer.Name, phone: log.customer.phone } : null,
            student: log.student ? { _id: log.student._id, Name: log.student.Name, phone: log.student.phone } : null,
            createBy: log.createBy ? { name: log.createBy.name } : null,
            schedule: log.schedule ? { jobName: log.schedule.jobName, actionType: log.schedule.actionType } : null,
        }))

        return NextResponse.json({
            success: true,
            data: items,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (err) {
        console.error('[BOT_LOGS]', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
