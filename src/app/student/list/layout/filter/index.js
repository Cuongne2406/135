'use client'

export default function Nav({ data_student, setFilterStatus, currentFilterStatus }) {
    const totalStudents = data_student.length;
    const activeStudents = data_student.filter(student => student.Status[student.Status.length - 1].status === 2).length;
    const inactiveStudents = data_student.filter(student => student.Status[student.Status.length - 1].status === 0).length;
    const pendingStudents = data_student.filter(student => student.Status[student.Status.length - 1].status === 1).length;

    return (
        <>
            <div
                className="flex flex-col items-center justify-center gap-2 rounded cursor-pointer w-full h-full bg-[#f5ffe5] hover:bg-[#f6ffde] hover:-translate-y-0.5 transition-all duration-100"
                style={{
                    width: 'calc(50% - 4px)',
                    aspectRatio: 1,
                    background: currentFilterStatus === "Tất cả" ? 'var(--main_d)' : '#deefff'
                }}
                onClick={() => setFilterStatus("Tất cả")}
            >
                <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ color: currentFilterStatus === "Tất cả" ? 'white' : '' }}>{totalStudents}</p>
                <p className='text-xs font-semibold text-[var(--text-primary)]' style={{ color: currentFilterStatus === "Tất cả" ? 'white' : '' }}>Tổng học sinh</p>
            </div>

            <div
                className="flex flex-col items-center justify-center gap-2 rounded cursor-pointer w-full h-full bg-[#f5ffe5] hover:bg-[#f6ffde] hover:-translate-y-0.5 transition-all duration-100"
                style={{
                    width: 'calc(50% - 4px)',
                    aspectRatio: 1,
                    background: currentFilterStatus === "Đang học" ? 'var(--green)' : '#ddffe6'
                }}
                onClick={() => setFilterStatus("Đang học")}
            >
                <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ color: currentFilterStatus === "Đang học" ? 'white' : '' }}>{activeStudents}</p>
                <p className='text-xs font-semibold text-[var(--text-primary)]' style={{ color: currentFilterStatus === "Đang học" ? 'white' : '' }}>Đang học</p>
            </div>

            <div
                className="flex flex-col items-center justify-center gap-2 rounded cursor-pointer w-full h-full bg-[#f5ffe5] hover:bg-[#f6ffde] hover:-translate-y-0.5 transition-all duration-100"
                style={{
                    width: 'calc(50% - 4px)',
                    aspectRatio: 1,
                    background: currentFilterStatus === "Đã nghỉ" ? 'var(--red)' : '#ffdddd'
                }}
                onClick={() => setFilterStatus("Đã nghỉ")}
            >
                <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ color: currentFilterStatus === "Đã nghỉ" ? 'white' : '' }}>{inactiveStudents}</p>
                <p className='text-xs font-semibold text-[var(--text-primary)]' style={{ color: currentFilterStatus === "Đã nghỉ" ? 'white' : '' }}>Đã nghỉ</p>
            </div>

            <div
                className="flex flex-col items-center justify-center gap-2 rounded cursor-pointer w-full h-full bg-[#f5ffe5] hover:bg-[#f6ffde] hover:-translate-y-0.5 transition-all duration-100"
                style={{
                    width: 'calc(50% - 4px)',
                    aspectRatio: 1,
                    background: currentFilterStatus === "Chờ lên khóa" ? 'var(--yellow)' : '#fff6dd'
                }}
                onClick={() => setFilterStatus("Chờ lên khóa")}
            >
                <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ color: currentFilterStatus === "Chờ lên khóa" ? 'white' : '' }}>{pendingStudents}</p>
                <p className='text-xs font-semibold text-[var(--text-primary)]' style={{ color: currentFilterStatus === "Chờ lên khóa" ? 'white' : '' }}>Chờ lên khóa</p>
            </div>
        </>
    );
}