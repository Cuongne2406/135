'user sever';

import React from 'react';
import Link from 'next/link';
import { truncateString } from '@/function';

const CalendarCourse = ({ data = {} }) => {
    if (data.type === "Báo nghỉ") return null;
    let statusLesson = [1, 1, 1];
    let num = 0
    data.students.forEach(element => {
        if (element.Checkin == 0) { statusLesson[0] = 0 }
        if (element.Checkin == 1) {
            num++;
            if (element.Cmt.length == 0) {
                statusLesson[1] = 0;
            }
            if (element.Image.length == 0) {
                statusLesson[2] = 0;
            }
        }
    });
    if (num == 0) {
        statusLesson = [0, 0, 0];
    }

    return (
        <Link href={`/calendar/${data._id}`} className="group flex justify-between relative mx-4 my-2 cursor-pointer no-underline" >
            <div className="h-full w-[3px] bg-[var(--main_b)] absolute top-0 left-0 transition-all duration-200 group-hover:w-full group-hover:rounded-r-lg group-hover:z-0" style={{ background: data.type == "trial" ? 'var(--yellow)' : 'var(--main_b)' }} />
            <div className="px-4 py-3 pl-6 z-[1] transition-all duration-100 w-full group-hover:text-white group-hover:mr-4">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <p className={`transition-all duration-200 text-white px-2.5 py-1 rounded-full w-max text-xs ${statusLesson[0] == 1 ? 'border border-[var(--green)] group-hover:bg-white group-hover:text-[var(--green)]' : 'border border-[var(--red)] group-hover:bg-white group-hover:text-[var(--red)]'}`} style={{ background: statusLesson[0] == 1 ? 'var(--green)' : 'var(--red)' }}>
                        Điểm danh
                    </p>
                    <p className={`transition-all duration-200 text-white px-2.5 py-1 rounded-full w-max text-xs ${statusLesson[1] == 1 ? 'border border-[var(--green)] group-hover:bg-white group-hover:text-[var(--green)]' : 'border border-[var(--red)] group-hover:bg-white group-hover:text-[var(--red)]'}`} style={{ background: statusLesson[1] == 1 ? 'var(--green)' : 'var(--red)' }}>
                        Nhận xét
                    </p>
                    <p className={`transition-all duration-200 text-white px-2.5 py-1 rounded-full w-max text-xs ${statusLesson[2] == 1 ? 'border border-[var(--green)] group-hover:bg-white group-hover:text-[var(--green)]' : 'border border-[var(--red)] group-hover:bg-white group-hover:text-[var(--red)]'}`} style={{ background: statusLesson[2] == 1 ? 'var(--green)' : 'var(--red)' }}>
                        Minh chứng
                    </p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <h5 style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }} className="m-0 group-hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill="var(--text-primary)" className="transition-all duration-300 group-hover:fill-white">
                            <path d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120l0 136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2 280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24z" />
                        </svg>
                        {data.time}
                    </h5>
                    <h5 className="flex items-start gap-2 m-0 z-[1] transition-all duration-300 group-hover:text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width={16} height={16} fill="var(--text-primary)" className="transition-all duration-300 group-hover:fill-white">
                            <path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" />
                        </svg>
                        {data.room.name}
                    </h5>
                </div>
                <div style={{ display: 'flex', gap: 8 }}><h5 className="m-0 group-hover:text-white" style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>Chủ đề: {truncateString(data.topic.Name, 30, 5)} {data.type == "trial" && '- Học thử'}</h5> </div>
                <div style={{ display: 'flex', gap: 8 }}><h5 className="m-0 group-hover:text-white">Giáo viên: {data.teacher.name}</h5> </div>
                <div style={{ display: 'flex', gap: 8 }}><h5 className="m-0 group-hover:text-white">Trợ giảng: {data.teachingAs?.name ? data.teachingAs.name : '-'}</h5> </div>
            </div>

        </Link >
    );
};

export default CalendarCourse;
