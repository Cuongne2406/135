'use client'
import { usePathname } from 'next/navigation'
import { Svg_Chart, Svg_List } from '@/components/(icon)/svg'
import Link from 'next/link'

export default function Nav() {
  const pathname = usePathname()
  const isListActive = pathname === '/teacher'
  const isOverviewActive = pathname === '/teacher/overview'

  return (
    <div className='flex p-2 rounded-md bg-[var(--bg-primary)] gap-2 border border-[var(--border-color)]'>
      <Link href={'/teacher'}
        className={`p-2 bg-transparent rounded-md cursor-pointer text-base font-medium text-[var(--text-primary)] flex items-center justify-center ${isListActive ? 'bg-[var(--border-color)]' : ''}`}
        style={{ gap: 8 }}
      >
        <Svg_List w={16} h={16} c={'var(--main_d)'} />
        Danh sách
      </Link>
      <Link href={'/teacher/overview'}
        className={`p-2 bg-transparent rounded-md cursor-pointer text-base font-medium text-[var(--text-primary)] flex items-center justify-center ${isOverviewActive ? 'bg-[var(--border-color)]' : ''}`}
        style={{ gap: 8 }}
      >
        <Svg_Chart w={16} h={16} c={'var(--main_d)'} />
        Báo cáo
      </Link>
    </div>
  )
}