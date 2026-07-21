'use server'

import { getStudentOne, getStudentAll } from '@/data/database/student'
import { getInvoiceOne, getInvoiceAll } from '@/data/database/invoices'
import { getAreaOne, getAreaAll } from '@/data/database/area'
import { getCourseOne, getCourseAll } from '@/data/database/course'
import { getBookOne, getBookAll } from '@/data/database/book'
import { getCourseTry } from '../database/coursetry'
import { getUserAll, getUserOne, getUserReport } from '@/data/database/user'
import { getLabelAll } from '../database/label'
import { getFormAll } from '../database/form' 
import { getZaloAll, getZaloOne } from '../database/zalo'
import Logs from '@/models/log'
import '@/models/zalo'
import '@/models/student'
import connectDB from '@/config/connectDB'

export async function student_data(_id) {
    let data = _id ? await getStudentOne(_id) : await getStudentAll()
    return _id && data ? data[0] || null : data || null
}

export async function invoices_data(_id) {
    let data = _id ? await getInvoiceOne(_id) : await getInvoiceAll()
    return data || null
}

export async function area_data(_id) {
    let data = _id ? await getAreaOne(_id) : await getAreaAll()
    return _id && data ? data[0] || null : data || null
}

export async function course_data(_id) {
    let data = _id ? await getCourseOne(_id) : await getCourseAll()
    return data || null
}

export async function book_data(_id) {
    let data = _id ? await getBookOne(_id) : await getBookAll()
    return data || null
}

export async function zalo_data(_id) {
    let data = _id ? await getZaloOne(_id) : await getZaloAll()
    return data || null
}

export async function coursetry_data() {
    let data = await getCourseTry()
    return data || null
}

export async function user_data({ type = null, _id = null, activeOnly = false } = {}) {
    if (type === 'report') {
        return await getUserReport()
    } else {
        if (_id) {
            return await getUserOne(_id)
        } else {
            return await getUserAll({ activeOnly })
        }
    }
}

export async function label_data() {
    return await getLabelAll()
}

export async function form_data() {
    return await getFormAll()
}

export async function history_data(id, type) {
    if (!id || !type) {
        return { success: false, error: "Thiếu ID hoặc loại đối tượng." };
    }

    try {
        await connectDB();
        const filter = {};
        if (type === 'student') {
            filter.student = id;
        } else { filter.customer = id; }
        const history = await Logs.find(filter).populate('zalo', 'name avt').populate('createBy', 'name').sort({ createdAt: -1 }).lean();
        const plainHistory = JSON.parse(JSON.stringify(history));
        return { success: true, data: plainHistory };
    } catch (err) {
        console.error("Error getting customer history:", err);
        return { success: false, error: "Lỗi máy chủ khi lấy lịch sử chăm sóc." };
    }
}