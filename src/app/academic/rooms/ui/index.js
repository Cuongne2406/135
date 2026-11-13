'use client'
import CreateArea from '@/app/course/ui/createarea'
import ListArea from '@/app/course/ui/area-item'

export default function RoomManager({ areas }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h4 className="m-0 text-base font-semibold text-[var(--text-primary)]">Quản lý phòng học</h4>
        <CreateArea />
      </div>
      <ListArea programs={areas} />
    </div>
  )
}
