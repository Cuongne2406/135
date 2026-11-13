'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Svg_Chart } from '@/components/(icon)/svg';

export default function Home({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    const status = [
        { link: '/student/overview', content: 'Tổng quan', icon: <Svg_Chart w={16} h={16} c={'var(--main_d)'} /> }
    ];

    const profit = [
        { link: '/student/overview/overviews', content: 'Theo thời gian', icon: <Svg_Chart w={16} h={16} c={'var(--main_d)'} /> },
        { link: '/student/overview/overviews', content: 'Theo khu vực', icon: <Svg_Chart w={16} h={16} c={'var(--main_d)'} /> },
    ];

    const trend = [
        { link: '/student/overview/overviews', content: 'Khóa học', icon: <Svg_Chart w={16} h={16} c={'var(--main_d)'} /> }
    ];

    return (
        <div className="flex gap-2 h-[calc(100%-16px)] w-[calc(100%-8px)] p-2">
            <div className="flex flex-col gap-2 w-[200px] min-h-full h-max">
                <p className="pb-2 border-b border-[var(--border-color)] text-base font-semibold text-[var(--text-primary)]">Trạng thái học sinh</p>
                {status.map((route, index) => (
                    <div
                        key={index}
                        className={`w-[calc(100%-32px)] px-4 py-2.5 rounded bg-transparent cursor-pointer transition-all duration-200 flex gap-1.5 items-center ${pathname === route.link ? 'bg-[var(--hover)]' : 'hover:bg-[var(--hover)]'}`}
                        onClick={() => router.push(route.link)}
                    >
                        {route.icon}
                        {route.content}
                    </div>
                ))}
                <p className="pb-2 border-b border-[var(--border-color)] text-base font-semibold text-[var(--text-primary)]" style={{ marginTop: 8 }}>Lợi nhuận</p>
                {profit.map((route, index) => (
                    <div
                        key={index}
                        className={`w-[calc(100%-32px)] px-4 py-2.5 rounded bg-transparent cursor-pointer transition-all duration-200 flex gap-1.5 items-center ${pathname === route.link ? 'bg-[var(--hover)]' : 'hover:bg-[var(--hover)]'}`}
                        onClick={() => router.push(route.link)}
                    >
                        {route.icon}
                        {route.content}
                    </div>
                ))}
                <p className="pb-2 border-b border-[var(--border-color)] text-base font-semibold text-[var(--text-primary)]" style={{ marginTop: 8 }}>Xu hướng</p>
                {trend.map((route, index) => (
                    <div
                        key={index}
                        className={`w-[calc(100%-32px)] px-4 py-2.5 rounded bg-transparent cursor-pointer transition-all duration-200 flex gap-1.5 items-center ${pathname === route.link ? 'bg-[var(--hover)]' : 'hover:bg-[var(--hover)]'}`}
                        onClick={() => router.push(route.link)}
                    >
                        {route.icon}
                        {route.content}
                    </div>
                ))}
            </div>
            <div className="flex-1 w-full h-full scroll">
                {children}
            </div>
        </div>
    )
}
