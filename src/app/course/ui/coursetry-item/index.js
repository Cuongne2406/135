import React from 'react';
import Link from 'next/link';

export default function CourseTryItem({ data }) {
    if (!data) return null;

    const totalSessions = data.totalSessions ?? 0;
    const totalStudents = data.totalStudents ?? 0;

    return (
        <Link href={`/course/trycourse`} className='bg-[#fffdf0] rounded-xl p-4.5 w-[calc(25%-12px-32px)] border border-amber-200 border-b-4 border-b-[var(--yellow)] shadow-xs hover:shadow-md transition-all flex flex-col justify-between no-underline'>
            <div>
                <div className='flex items-center mb-4'>
                    <div className='w-11 h-11 rounded-lg bg-[var(--yellow)] text-slate-900 border border-amber-300 flex items-center justify-center font-bold text-sm mr-3'>
                        HT
                    </div>
                    <div className='flex-1'>
                        <div className='font-bold text-[var(--text-primary)] flex justify-between items-center text-sm'>
                            HỌC THỬ AI ROBOTIC
                        </div>
                        <p className='text-amber-800/80 text-xs font-medium mt-0.5'>Khóa học thử miễn phí</p>
                    </div>
                </div>
                <div className='flex justify-between items-center mb-1.5 text-xs'>
                    <span className='text-[var(--text-secondary)]'>Số buổi chưa diễn ra:</span>
                    <span className='font-semibold text-slate-900 bg-amber-100/70 px-2 py-0.5 rounded'>
                        {totalSessions}
                    </span>
                </div>
                <div className='flex justify-between items-center text-xs'>
                    <span className='text-[var(--text-secondary)]'>Học sinh chưa học thử:</span>
                    <span className='font-semibold text-slate-900 bg-amber-100/70 px-2 py-0.5 rounded'>
                        {totalStudents}
                    </span>
                </div>
            </div>
        </Link>
    );
}