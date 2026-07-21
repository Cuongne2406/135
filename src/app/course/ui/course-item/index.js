import React, { useMemo } from 'react';
import Link from 'next/link';
import { calculatePastLessons, formatDate } from '@/function';

export default function CourseItem({ data = {} }) {
    const teacherMap = new Map();
    const teachingAsMap = new Map();

    data.Detail.forEach(item => {
        if (item.Teacher && item.Teacher._id) {
            teacherMap.set(item.Teacher._id, item.Teacher);
        }
        if (item.TeachingAs && item.TeachingAs._id) {
            teachingAsMap.set(item.TeachingAs._id, item.TeachingAs);
        }
    });
    const uniqueTeachers = Array.from(teacherMap.values());
    const uniqueTeachingAs = Array.from(teachingAsMap.values());

    const pastLessonsCount = calculatePastLessons(data);
    const { ID = '', Area = {}, Detail = [], Student = [], Book = { Name: 'Trống' } } = data;
    const allDates = data.Detail.map(item => new Date(item.Day));
    const dateRange = [formatDate(new Date(Math.min(...allDates))), formatDate(new Date(Math.max(...allDates)))];
    const { lessonsDone, totalLessons, percent } = useMemo(() => {
        const today = new Date();
        const currentHour = today.getHours();

        const stats = Detail.reduce(
            (acc, item) => {
                if (!item || typeof item.Lesson !== 'number' || typeof item.Day !== 'string') {
                    return acc;
                }

                acc.total += item.Lesson;

                const parts = item.Day.split('/');
                if (parts.length !== 3) {
                    return acc;
                }
                const [dd, mm, yyyy] = parts;
                const lessonDate = new Date(`${yyyy}-${mm}-${dd}`);

                const isPastDay = today > lessonDate;
                const isSameDay = today.toDateString() === lessonDate.toDateString();

                if (isPastDay && !isSameDay) {
                    acc.done += item.Lesson;
                } else if (isSameDay) {
                    if (typeof item.Time === 'string' && item.Time.length >= 2) {
                        const hourStart = Number(item.Time.slice(0, 2));
                        if (!isNaN(hourStart) && hourStart < currentHour) {
                            acc.done += item.Lesson;
                        }
                    }
                }

                return acc;
            },
            { done: 0, total: 0 }
        );

        return {
            lessonsDone: stats.done,
            totalLessons: stats.total,
            percent: stats.total > 0 ? (stats.done / stats.total) * 100 : 0,
        };
    }, [Detail]);

    const studentCount = Student.length;

    return (
        <Link href={`/course/${data._id}`} className={'bg-[var(--bg-primary)] rounded-lg p-4 w-[calc(25%-12px)] border border-[var(--border-color)] transition-shadow duration-300 flex flex-col justify-between no-underline hover:cursor-pointer hover:shadow-[0_3px_8px_rgba(0,0,0,0.24)]'} style={{ borderBottom: `3px solid ${data.Status ? 'var(--green)' : 'var(--main_b)'}` }}>
            <div>
                <div className={'flex items-center mb-4'}>
                    <div className={'w-11 h-11 rounded-md bg-[var(--main_d)] text-white flex items-center justify-center font-medium mr-3'}>
                        {ID.length >= 5 ? ID.slice(2, 5) : ''}
                    </div>
                    <div className={'flex-1'}>
                        <div className={'font-bold text-[var(--text-primary)] flex justify-between items-center text-xl'}>
                            {ID}
                            {Area && <span className={'text-xs font-normal text-white px-4 py-1 rounded-full'} style={{
                                background: Area.color, borderRadius: 16,
                                padding: '4px 16px', color: 'white'
                            }}>{Area.name}</span>}
                        </div>
                        <p className={'text-[var(--text-secondary)] text-sm font-medium mt-1'}>{Book?.Name || '-'}</p>
                    </div>
                </div>

                <div className={'flex gap-1 mb-1 text-sm'}>
                    <span className={'text-[var(--text-primary)]'}>Thời gian:</span>
                    <span className={'text-[var(--text-secondary)]'}>
                        {dateRange[0] && dateRange[1] ? `${dateRange[0]} - ${dateRange[1]}` : 'Chưa có thời gian'}
                    </span>
                </div>

                <div className={'flex gap-1 mb-1 text-sm'}>
                    <span className={'text-[var(--text-primary)]'}>Số lượng học sinh:</span>
                    <span className={'text-[var(--text-secondary)]'}>{studentCount} Học sinh</span>
                </div>
                <div className={'flex gap-1 mb-1 text-sm'}>
                    <span className={'text-[var(--text-primary)]'}>Giáo viên chủ nhiệm:</span>
                    <span className={'text-[var(--text-secondary)]'}>
                        {data.TeacherHR.name}
                    </span>
                </div>
                <div className={'mb-1 text-sm'}>
                    <span className={'text-[var(--text-primary)]'}>Giáo viên giảng dạy: </span>
                    <span className={'text-[var(--text-secondary)]'}>
                        {uniqueTeachers.length > 0 ? uniqueTeachers.map(teacher => teacher.name).join(', ') : 'Chưa có giáo viên'}
                    </span>
                </div>
                <div className={'mb-1 text-sm'}>
                    <h5 className={'text-[var(--text-primary)]'}>Giáo viên trợ giảng: <span className={'text-[var(--text-secondary)]'}>
                        {uniqueTeachingAs.length > 0 ? uniqueTeachingAs.map(ta => ta.name).join(', ') : 'Chưa có giáo viên'}
                    </span></h5>

                </div>
            </div>
            <div>
                <div className={'flex gap-1 mb-1 text-sm'} style={{ marginBottom: 8, marginTop: 'auto' }}>
                    <h5 className={'text-[var(--text-primary)]'}>Tiến độ học:</h5>
                    <h5 className={'text-[var(--text-secondary)]'}>
                        {pastLessonsCount}/{data.Detail.length} Buổi
                    </h5>
                </div>

                <div className={'w-full h-2 rounded bg-[#e6e8f0] overflow-hidden'} >
                    <div
                        className={'h-full bg-[#3366ff] rounded-l-[4px] transition-[width] duration-300'}
                        style={{ width: `${Number(pastLessonsCount) / data.Detail.length * 100}%` }}
                        aria-label="progress"
                    />
                </div>
            </div>
        </Link>
    );
}