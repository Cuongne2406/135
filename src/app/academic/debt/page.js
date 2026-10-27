import { student_data } from '@/data/actions/get'
import DebtClient from './client'
import connectDB from '@/config/connectDB'
import Course from '@/models/course'
import Invoice from '@/models/invoices'
import '@/models/book'

export default async function DebtPage() {
    const allStudents = await student_data()

    await connectDB()
    const allCourses = await Course.find({})
        .populate({ path: 'Book', select: 'Price Name' })
        .select('ID Book Detail.Day Student.ID Student.Learn.Checkin')
        .lean()

    // Thu thập tất cả tuition IDs từ học sinh để lấy dữ liệu hóa đơn
    const tuitionIds = []
    ;(allStudents || []).forEach(s => {
        ;(s.Course || []).forEach(c => {
            if (c.tuition) tuitionIds.push(c.tuition)
        })
    })

    const invoiceDocs = tuitionIds.length > 0
        ? await Invoice.find({ _id: { $in: tuitionIds } }).select('amountInitial amountPaid discount paymentMethod').lean()
        : []

    const invoiceMap = {}
    invoiceDocs.forEach(inv => {
        const amountInitial = Number(inv.amountInitial) || 0
        const amountPaid = Number(inv.amountPaid) || 0
        const discount = Number(inv.discount) || 0
        const remaining = Math.max(0, amountInitial - (amountPaid + discount))
        invoiceMap[String(inv._id)] = {
            amountInitial,
            amountPaid,
            discount,
            remaining,
            paymentMethod: inv.paymentMethod
        }
    })

    const courseMap = {}
    const attendanceMap = {}
    allCourses.forEach(c => {
        const cid = String(c._id)
        const days = (c.Detail || []).map(d => d.Day).filter(Boolean).sort((a, b) => new Date(a) - new Date(b))
        courseMap[cid] = {
            name: c.ID,
            price: c.Book && typeof c.Book === 'object' && c.Book.Price ? c.Book.Price : 0,
            startDate: days.length > 0 ? days[0] : null,
            endDate: days.length > 0 ? days[days.length - 1] : null,
        }
        attendanceMap[cid] = {}
        ;(c.Student || []).forEach(st => {
            const attended = (st.Learn || []).filter(l => l.Checkin > 0).length
            attendanceMap[cid][st.ID] = attended
        })
    })

    return <DebtClient students={allStudents || []} courseMap={courseMap} attendanceMap={attendanceMap} invoiceMap={invoiceMap} />
}
