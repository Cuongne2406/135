'use client'

import { useState, useMemo } from 'react'
import Calendar from './ui/calendar'
import More from './ui/more'
import Student from './ui/student'

const mondayOf = d => {
    const dd = new Date(d)
    const shift = (dd.getDay() + 6) % 7      // Mon = 0 … Sun = 6
    dd.setDate(dd.getDate() - shift)
    dd.setHours(0, 0, 0, 0)
    return dd
}
const addDays = (d, n) => new Date(d.getTime() + n * 864e5)

export default function CourseTryMain({ data, book, student, teacher, area }) {
    const [weekStart, setWeekStart] = useState(() => mondayOf(new Date()))
    const weekSessions = useMemo(() => {
        const weekEnd = addDays(weekStart, 6)
        return data.sessions?.filter(s => {
            const day = new Date(s.day)
            return day >= weekStart && day <= weekEnd
        })
    }, [data.sessions, weekStart])

    
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
            <Calendar data={{ sessions: weekSessions }} time={weekStart} />

            <More
                data={data}
                weekStart={weekStart}
                setWeekStart={setWeekStart}
                book={book}
                student={student}
                teacher={teacher}
                area={area}
            />

            <Student
                data={data}
                book={book}
                student={student}
                teacher={teacher}
                area={area}
            />
        </div>
    )
}
