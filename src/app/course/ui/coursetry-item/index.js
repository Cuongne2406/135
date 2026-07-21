import React from 'react';
import Link from 'next/link';

export default function CourseTryItem({ data }) {
    console.log(data);

    return (
        <Link href={`/course/trycourse`} className='bg-[#fffce6] rounded-lg p-4 w-[calc(25%-12px-32px)] shadow-[var(--boxshaw2)] transition-shadow duration-300 flex flex-col justify-between no-underline border-b-3 border-[var(--yellow)] relative hover:cursor-pointer hover:shadow-[0_3px_8px_rgba(0,0,0,0.24)] before:content-[""] before:absolute before:bottom-0 before:right-0 before:w-1/2 before:h-auto before:aspect-[16/9] before:bg-[url(https://www.voca.vn/assets/images/project-mission-2.svg)] before:bg-cover before:transition-opacity before:duration-300'>
            <div>
                <div className='flex items-center mb-4'>
                    <div className='w-11 h-11 rounded-md bg-[var(--main_d)] text-white flex items-center justify-center font-medium mr-3' style={{ background: 'var(--yellow)' }}>
                        HT
                    </div>
                    <div className='flex-1'>
                        <div className='font-bold text-[#656565] flex justify-between items-center text-xl'>
                            HỌC THỬ AI ROBOTIC
                        </div>
                        <p className='text-[#656565] text-sm font-medium mt-1'>Khóa học thử miễn phí</p>
                    </div>
                </div>
                <div className='flex gap-1 mb-1 text-sm'>
                    <span className='text-[#656565]'>Số buổi chưa diễn ra:</span>
                    <span className='text-[#656565]'>
                        {data.totalSessions}
                    </span>
                </div>
                <div className='flex gap-1 mb-1 text-sm'>
                    <span className='text-[#656565]'>Học sinh chưa học thử:</span>
                    <span className='text-[#656565]'>
                        {data.totalStudents}
                    </span>
                </div>
            </div>
        </Link>
    );
}