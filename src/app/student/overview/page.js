import { ReusableLineChart } from "./client"

export default function Status() {
    const daysInMonth = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12']
    const studentNumbers = [12, 13, 15, 16, 18, 19, 20, 23, 37, 39, 54, 60]
    return (
        <div style={{ marginRight: 8, gap: 16 }} className="flex flex-col">
            <div style={{ display: 'flex', gap: 8 }}>
                <div className="p-4 rounded-lg flex-1 border border-[var(--border-color)] flex flex-col gap-2">
                    <p className='text-xs font-normal text-[var(--text-primary)]'>Tổng học sinh đã nghỉ: {studentNumbers[studentNumbers.length - 1]} học sinh</p>
                    <ReusableLineChart labels={daysInMonth} dataPoints={studentNumbers} color={'#dc3545'} />
                </div>
                <div className="p-4 rounded-lg flex-1 border border-[var(--border-color)] flex flex-col gap-2">
                    <p className='text-xs font-normal text-[var(--text-primary)]'>Tổng học sinh đang học: {studentNumbers[studentNumbers.length - 1]} học sinh</p>
                    <ReusableLineChart labels={daysInMonth} dataPoints={studentNumbers} color={'#28a745'} />
                </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
                <div className="p-4 rounded-lg flex-1 border border-[var(--border-color)] flex flex-col gap-2">
                    <p className='text-xs font-normal text-[var(--text-primary)]'>Tổng học sinh đã nghỉ: {studentNumbers[studentNumbers.length - 1]} học sinh</p>
                    <ReusableLineChart labels={daysInMonth} dataPoints={studentNumbers} color={'#28a745'} />
                </div>
                <div className="p-4 rounded-lg flex-1 border border-[var(--border-color)] flex flex-col gap-2">
                    <p className='text-xs font-normal text-[var(--text-primary)]'>Tổng học sinh đang học: {studentNumbers[studentNumbers.length - 1]} học sinh</p>
                    <ReusableLineChart labels={daysInMonth} dataPoints={studentNumbers} color={'#28a745'} />
                </div>
            </div>
        </div>
    )
}
