import Student from '@/models/student'
import connectDB from '@/config/connectDB'
import '@/models/area'
import '@/models/course'
import '@/models/book'
import { cacheData } from '@/lib/cache'
import { CheckProfileDone } from '@/function/server'
import mongoose from 'mongoose'

export function getStudentRank(createdAt, courseCount) {
    if (!createdAt) return { name: 'Member', level: 0, color: '#9ca3af', bg: '#f3f4f6' }

    const now = new Date()
    const createdAtDate = new Date(createdAt)
    const months = (now.getFullYear() - createdAtDate.getFullYear()) * 12 + (now.getMonth() - createdAtDate.getMonth())
    const years = months / 12

    if (years > 3) return { name: 'Kim Cương', level: 5, color: '#0e7490', bg: '#ecfeff' }
    if (years >= 2 && courseCount >= 9) return { name: 'Bạch Kim', level: 4, color: '#6d28d9', bg: '#f5f3ff' }
    if (years >= 1.5 && courseCount >= 6) return { name: 'Vàng', level: 3, color: '#ca8a04', bg: '#fefce8' }
    if (years >= 1 && courseCount >= 3) return { name: 'Bạc', level: 2, color: '#64748b', bg: '#f8fafc' }
    if (courseCount >= 1) return { name: 'Member', level: 1, color: '#6b7280', bg: '#f9fafb' }

    return { name: 'Mới', level: 0, color: '#9ca3af', bg: '#f3f4f6' }
}

async function dataStudent(_id) {
    try {
        await connectDB()
        if (_id && !mongoose.Types.ObjectId.isValid(_id)) return null
        const query = _id ? { _id } : {}
        let studentQuery = Student.find(query).populate({ path: 'Area' })
        if (_id) {
            studentQuery.populate({ path: 'Course.course', model: 'course', populate: { path: 'Book', model: 'book', select: 'ID Name Price Topics Image' } })
        }
        const students = await studentQuery.lean()
        if (_id && students.length === 0) return null
        const processedStudents = students.map((student) => {
            const hasPaid = student.Course?.some(c => c.tuition != null) ?? false
            const unpaidCount = student.Course?.filter(c => c.tuition == null).length ?? 0
            if (_id && student.Course?.length) {
                const studentBusinessId = student.ID
                student.Course = student.Course.map(enrollment => {
                    if (!enrollment.course) return null
                    const { course } = enrollment
                    const studentInCourse = course.Student?.find(s => s.ID === studentBusinessId)
                    let mergedDetails = course.Detail
                    if (studentInCourse?.Learn?.length) {
                        const learnDataMap = new Map(studentInCourse.Learn.map(item => [String(item.Lesson), item]))
                        mergedDetails = course.Detail.map(detail => {
                            const learnRecord = learnDataMap.get(String(detail._id))
                            if (learnRecord) {
                                const { Image: studentImage, Lesson, ...restOfLearn } = learnRecord
                                return { ...detail, ...restOfLearn, ImageStudent: studentImage }
                            }
                            return detail
                        })
                    }
                    return { _id: course._id, ID: course.ID, Book: course.Book, Detail: mergedDetails, enrollmentStatus: enrollment.status, tuition: enrollment.tuition }
                }).filter(Boolean)
            }
    const createdAt = student._id ? new mongoose.Types.ObjectId(student._id).getTimestamp() : null
            const courseCount = student.Course?.length ?? 0
            const rank = getStudentRank(createdAt, courseCount)
            return { ...student, hasPaid, unpaidCount, createdAt, courseCount, rank, statusProfile: CheckProfileDone(student) }
        })
        return JSON.parse(JSON.stringify(processedStudents))
    } catch (error) {
        console.error('Lỗi trong dataStudent:', error)
        return null
    }
}

export async function getStudentAll() {
    try {
        const cachedFunction = cacheData(() => dataStudent(), ['students'])
        const data = await cachedFunction()
        if (data) {
            return data.map(student => {
                if (!student.rank) {
                    const courseCount = student.Course?.length ?? 0
                    return { ...student, courseCount, rank: getStudentRank(student.createdAt, courseCount) }
                }
                return student
            })
        }
        return data
    } catch (error) {
        console.error('Lỗi trong StudentAll:', error)
        return null
    }
}

export async function getStudentOne(_id) {
    try {
        const data = await dataStudent(_id)
        return data
    } catch (error) {
        console.error('Lỗi trong StudentOne:', error)
        return null
    }
}

