import Invoice from '@/models/invoices'
import Student from '@/models/student'
import Course from '@/models/course'
import Book from '@/models/book'
import User from '@/models/users'
import connectDB from '@/config/connectDB'
import { cacheData } from '@/lib/cache'

async function dataInvoice(_id) {
    try {
        await connectDB()
        let invoiceData

        if (_id) {
            invoiceData = await Invoice.findById(_id)
                .populate({
                    path: 'studentId',
                    select: 'ID Name Phone Email BD Address'
                })
                .populate({
                    path: 'courseId',
                    select: 'ID Book Detail',
                    populate: {
                        path: 'Book',
                        model: 'book',
                        select: 'Name Price'
                    }
                })
                .populate({
                    path: 'createBy',
                    model: 'user',
                    select: 'name phone',
                })
                .lean()
            if (!invoiceData) return null
        } else { invoiceData = await Invoice.find({}).lean() }
        return JSON.parse(JSON.stringify(invoiceData))
    } catch (error) {
        
        throw new Error('Không thể lấy dữ liệu hóa đơn.')
    }
}

export async function getInvoiceAll() {
    try {
        const cachedFunction = cacheData(() => dataInvoice(), ['invoices'])
        return await cachedFunction()
    } catch (error) {
        return []
    }
}

export async function getInvoiceOne(_id) {
    try {
        const cachedFunction = cacheData(() => dataInvoice(_id), [`invoice:${_id}`])
        return await cachedFunction()
    } catch (error) {
        return null
    }
}