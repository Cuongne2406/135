'use client'
import { usePathname } from 'next/navigation'
import { Svg_Chart, Svg_List } from '@/components/(icon)/svg'
import Link from 'next/link'

export default function Nav() {
  const pathname = usePathname()
  const isOverviewActive = pathname.startsWith('/student/overview')
  const isListActive = pathname.startsWith('/student/list')

  return (
    <div className="shadow-[rgba(0,0,0,0.1)_0px_0px_3px_0px,rgba(0,0,0,0.05)_0px_0px_1px_0px] flex p-2 rounded-lg bg-[var(--bg-primary)] gap-2">
      <Link href={'/student/list'}
        className={`px-4 py-2 bg-transparent rounded-md cursor-pointer text-base font-medium text-[var(--text-primary)] flex items-center justify-center ${isListActive ? 'bg-[var(--border-color)]' : 'hover:bg-[var(--bg-secondary)]'}`}
        style={{ gap: 8 }}
      >
        <Svg_List w={16} h={16} c={'var(--main_d)'} />
        <h5>Danh sách</h5>
      </Link>
      <Link href={'/student/overview'}
        className={`px-4 py-2 bg-transparent rounded-md cursor-pointer text-base font-medium text-[var(--text-primary)] flex items-center justify-center ${isOverviewActive ? 'bg-[var(--border-color)]' : 'hover:bg-[var(--bg-secondary)]'}`}
        style={{ gap: 8 }}
      >
        <Svg_Chart w={16} h={16} c={'var(--main_d)'} />
        <h5>Biểu đồ</h5>
      </Link>

    </div>
  )
}
