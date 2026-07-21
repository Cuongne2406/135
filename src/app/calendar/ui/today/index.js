'user sever';

import CalendarCourse from '../lesson_td';

export default function Today({ data, today, month, year }) {
  
    
    return (
        <div style={{ borderRight: '1px solid var(--border-color)', width: '100%', height: '100%', overflow: 'auto' }}>
            <div className="bg-gradient-to-r from-[#485fed] via-[rgba(255,44,118,0.25)] to-[#485fed] text-white px-10 py-[27px] relative border-r border-[#485fed] mb-12 before:content-[''] before:bg-gradient-to-r before:from-[#485fed] before:via-[rgba(255,44,118,0.25)] before:to-[#485fed] before:opacity-40 before:z-0 before:block before:w-full before:h-10 before:mx-auto before:absolute before:-bottom-[13px] before:left-1/2 before:-translate-x-1/2 before:rounded-[50%] before:shadow-[0px_0px_40px_0_#485fed]" >
                <p className='text-base font-normal text-[var(--text-primary)]' style={{ marginBottom: 8, color: 'white' }}>Ngày hôm nay </p>
                <p className='text-xl font-semibold text-[var(--text-primary)]' style={{ color: 'white' }}>Ngày {today} tháng {month} năm {year}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8 }}>
                <div className='text-base font-semibold text-[var(--text-primary)]' style={{ color: 'var(--main_d)' }}>Lịch dạy hôm nay</div>
                <div style={{ height: '2px', backgroundColor: 'var(--main_d)', flex: 1, marginTop: '2px' }}></div>
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
