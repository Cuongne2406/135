import checkAuthToken from "@/utils/checktoken"
import { user_data, zalo_data } from "@/data/actions/get"
import SettingClient from "./main"

export default async function SettingPage() {
  let user = await checkAuthToken()
  if (!user || (!user.role.some(r => /^admin$/i.test(r)) && !user.role.some(r => /^academic$/i.test(r)))) {
    return (
      <div className="flex items-center justify-center" style={{ height: '100%', width: '100%' }}>
        <h4 style={{ fontStyle: 'italic' }}>Bạn không có quyền truy cập trang này</h4>
      </div>
    )
  }

  const allZalo = await zalo_data()
  const allUsers = await user_data({})

  return <SettingClient zaloAccounts={allZalo || []} users={allUsers || []} />
}
