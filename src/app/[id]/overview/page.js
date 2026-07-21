export default async function OverviewTab({ params }) {
    const { id } = await params;
    return (
        <div style={{ display: 'flex', gap: 16 }}>
            <div style={{ border: 'thin solid var(--border-color)', width: 300, borderRadius: 8, padding: 16 }}>
                <p>Thông tin cá nhân</p>
            </div>
            <div style={{ flex: 1 }}>
                Dữ liệu hoặc nội dung của tab tổng quan sẽ hiển thị ở đây.
                (Ví dụ: Thông tin chung, timeline, v.v.)
            </div>
        </div>
    );
}
