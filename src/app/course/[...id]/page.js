import Timeline from "./ui/timeline";
import Detail from "./ui/detailcourse";
import { course_data, student_data, user_data } from "@/data/actions/get";

export default async function OverviewTab({ params }) {
    const { id } = await params;
    const data = await course_data(id[0]);
    if (!data) return <div className="flex items-center justify-center h-full text-sm text-[var(--text-secondary)]">Không tìm thấy khóa học</div>
    let students = await student_data();
    const users = await user_data({ activeOnly: true })
    const tienDo = tinhTienDoHocTap(data);
    data.Progress = tienDo; 
    
    return (
        <div style={{ display: 'flex', height: '100%', width: '100%', gap: 16 }}>
            <Timeline data={data} props={id} />
            <div style={{ flex: 4 }}>
                <Detail data={data} params={id} studentsx={students} users={users} />
            </div>
        </div>
    );
}

function tinhTienDoHocTap(data) {
    let tongSoTiet = 0;
    let tietDaHoc = 0;
    const ngayHienTai = new Date();
    const danhSachBuoiHoc = data?.Detail || [];

    danhSachBuoiHoc.forEach(buoiHoc => {
        const soTiet = buoiHoc?.LessonDetails?.Period;
        if (typeof soTiet === 'number') {
            tongSoTiet += soTiet;

            try {
                const ngayHoc = new Date(buoiHoc.Day);
                if (ngayHoc < ngayHienTai) {
                    tietDaHoc += soTiet;
                }
            } catch (e) {
                console.error("Lỗi khi xử lý ngày của buổi học:", e);
            }
        }
    });

    return `${tietDaHoc}/${tongSoTiet}`;
}
