'use client';
import { useRouter, usePathname } from 'next/navigation';
import { Svg_Student, Svg_Course, Svg_Canlendar, Svg_Chart, Svg_Bell } from '@/components/(icon)/svg';

const tabs = [
  { href: '/', icon: (c) => <Svg_Chart h={22} w={22} c={c} />, label: 'Thống kê' },
  { href: '/student/list', icon: (c) => <Svg_Student w={22} h={22} c={c} />, label: 'Học sinh' },
  { href: '/course', icon: (c) => <Svg_Course w={20} h={19} c={c} />, label: 'Khóa học' },
  { href: '/calendar', icon: (c) => <Svg_Canlendar w={20} h={19} c={c} />, label: 'Lịch dạy' },
  { href: '/notifications', icon: (c) => <Svg_Bell w={20} h={20} c={c} />, label: 'Thông báo' },
  { href: '/client', icon: (c) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" height={19} width={20} fill={c}>
      <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c10 0 18.8-4.9 24.2-12.5l-99.2-99.2c-14.9-14.9-23.3-35.1-23.3-56.1l0-33c-15.9-4.7-32.8-7.2-50.3-7.2l-91.4 0zM384 224c-17.7 0-32 14.3-32 32l0 82.7c0 17 6.7 33.3 18.7 45.3L478.1 491.3c18.7 18.7 49.1 18.7 67.9 0l73.4-73.4c18.7-18.7 18.7-49.1 0-67.9L512 242.7c-12-12-28.3-18.7-45.3-18.7L384 224zm24 80a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z" />
    </svg>
  ), label: 'Chăm sóc' },
];

export default function NavMobile({ data }) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="hidden max-md:flex fixed bottom-0 left-0 right-0 h-15 bg-[var(--bg-primary)] border-t border-[var(--border-color)] z-[100] justify-around items-center py-1 pb-[env(safe-area-inset-bottom,0)]">
      {tabs.map(({ href, icon, label }) => {
        const active = pathname === href || (href !== '/' && pathname.startsWith(href));
        const color = active ? 'var(--main_d)' : 'var(--text-secondary)';
        return (
          <div
            key={href}
            className={`flex flex-col items-center justify-center gap-0.5 cursor-pointer px-2 py-1 rounded-lg flex-1 max-w-[70px] transition-all duration-200 active:opacity-60 ${active ? `[&_span]:text-[var(--main_d)]` : ''}`}
            onClick={() => router.push(href)}
          >
            {icon(color)}
            <span className="text-[10px] text-[var(--text-secondary)] font-medium whitespace-nowrap">{label}</span>
          </div>
        );
      })}
    </div>
  );
}
