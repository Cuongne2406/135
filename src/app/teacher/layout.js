import checkAuthToken from "@/utils/checktoken"

export default async function Layout({ children }) {
    let user = await checkAuthToken()
    if (!user || !user.role.includes('Admin')) {
        return (
            <div className="flex items-center justify-center" style={{ height: '100%', width: '100%' }}>
                <h4 style={{ fontStyle: 'italic' }}>Bạn không có quyền truy cập trang này</h4>
            </div>
        )
    }

    return (
        <div className="flex flex-col" style={{ height: '100%', width: '100%' }}>
            {children}
        </div>
    )
} 