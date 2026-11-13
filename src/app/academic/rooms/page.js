import { area_data } from '@/data/actions/get'
import RoomManager from './ui'

export default async function RoomsPage() {
  const areas = await area_data()
  return (
    <div className="p-4 h-full overflow-auto">
      <RoomManager areas={areas || []} />
    </div>
  )
}
