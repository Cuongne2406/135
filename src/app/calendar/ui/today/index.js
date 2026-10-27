import CalendarCourse from '../lesson_td';

export default function Today({ data = [], today, month, year }) {
    return (
        <div className="w-full h-full overflow-auto border-r border-[var(--border-color)] bg-white">
            <div className="bg-[var(--main_d)] text-white p-5 m-4 rounded-xl shadow-xs">
                <p className="text-xs text-white/80 font-medium mb-1">Ngày hôm nay</p>
                <h2 className="text-lg font-bold text-white m-0">Ngày {today} tháng {month} năm {year}</h2>
            </div>
            <div className="flex items-center px-4 py-2 gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[var(--main_d)]">Lịch dạy hôm nay</span>
                <div className="h-0.5 bg-[var(--main_d)]/20 flex-1"></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
                {data.length === 0 ?
                    <p style={{
                        padding: 32,
                        fontStyle: 'italic',
                        color: 'var(--text-secondary)',
                        textAlign: 'center',
                    }}>Không có lịch dạy</p> :
                    <> {data.map((course, index) => {
                        return <CalendarCourse key={index} data={course} />
                    })}
                    </>
                }
            </div>
        </div >
    );
}
