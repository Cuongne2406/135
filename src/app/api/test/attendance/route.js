import { NextResponse } from 'next/server'

const TEACHERS = ['Nguyễn Văn A', 'Trần Thị B', 'Lê Văn C', 'Phạm Thị D', 'Hoàng Văn E']
const ROOMS = ['P101', 'P102', 'P103', 'P201', 'P202', 'P301', 'P302']
const TIMES = ['08:00-10:00', '08:30-11:30', '13:00-15:00', '13:30-16:30', '17:00-19:00', '17:30-20:30']
const COURSES = [
    { id: '26SA1001', name: 'Scratch Adventure', type: 'official' },
    { id: '26SC2001', name: 'Scratch Cơ bản', type: 'official' },
    { id: '26AD1001', name: 'AI Advanced', type: 'official' },
    { id: '26PY3001', name: 'Python Lập trình', type: 'official' },
    { id: '26RO2001', name: 'Robotics Cơ bản', type: 'official' },
    { id: '26WE1001', name: 'Web Design', type: 'official' },
    { id: '26GA3001', name: 'Game Development', type: 'official' },
    { id: '26AP2001', name: 'App Inventor', type: 'official' },
    { id: '26DA1001', name: 'Data Analysis', type: 'official' },
    { id: '26NE3001', name: 'Network Cơ bản', type: 'official' },
    { id: '26AI2001', name: 'AI Cơ bản', type: 'official' },
    { id: '26CB1001', name: 'C++ Cơ bản', type: 'official' },
    { id: '26JS2001', name: 'JavaScript', type: 'official' },
    { id: '26HW1001', name: 'Hardware Cơ bản', type: 'official' },
    { id: '26VR2001', name: 'VR Exploration', type: 'official' },
]

function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
}

function pick(arr) {
    return arr[randInt(0, arr.length - 1)]
}

function buildStudents(count) {
    const students = []
    for (let i = 0; i < count; i++) {
        const checkin = Math.random() < 0.7 ? 1 : Math.random() < 0.5 ? 2 : 3
        students.push({
            ID: `AI${String(randInt(100, 999)).padStart(4, '0')}`,
            Learn: [{ Checkin: checkin, Lesson: '000000000000000000000001' }],
        })
    }
    return students
}

function generateSampleData() {
    const today = new Date()
    const y = today.getFullYear()
    const m = String(today.getMonth() + 1).padStart(2, '0')
    const d = String(today.getDate()).padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`
    const dateObj = new Date(dateStr + 'T00:00:00')

    return COURSES.map((course, idx) => {
        const studentCount = randInt(5, 15)
        return {
            _id: `sample_${idx}_${dateStr.replace(/-/g, '')}`,
            courseId: course.id,
            courseName: course.name,
            type: course.type,
            date: dateObj,
            day: today.getDate(),
            month: today.getMonth() + 1,
            year: today.getFullYear(),
            time: pick(TIMES),
            room: { name: pick(ROOMS) },
            teacher: { name: pick(TEACHERS) },
            students: buildStudents(studentCount),
        }
    })
}

export async function GET(request) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Chức năng Test Attendance bị vô hiệu hóa trên môi trường Production' }, { status: 403 });
    }
    const data = generateSampleData()
    return NextResponse.json({ success: true, data })
}
