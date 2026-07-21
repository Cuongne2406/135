import Link from "next/link"
import Dot from "./dot"
import { formatDate } from "@/function";

export default function Timeline({ data = [], props }) {
    data.Detail.sort((a, b) => {
        const dateA = new Date(a.Day);
        const dateB = new Date(b.Day);
        return dateA - dateB;
    });
    const allDates = data.Detail?.map(item => new Date(item.Day));
    let dateRange = ['Chưa có dữ liệu', 'Chưa có dữ liệu'];
    if (allDates && allDates.length > 0) {
        dateRange = [formatDate(new Date(Math.min(...allDates))), formatDate(new Date(Math.max(...allDates)))];
    }

    return (
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%', flex: 1.6 }}>

            <div style={{
                borderRadius: '8px', padding: 16, background: 'linear-gradient(90deg, rgba(32,97,165,1) 0%, rgba(18,57,98,1) 100%)',
                boxShadow: 'var(--boxshaw)', overflow: 'hidden',
            }}><Link href={`/course/${data._id}`}>
                    <div className="text-base font-medium text-[var(--text-primary)]" style={{ color: 'white', fontWeight: '500' }}>{data.Type}</div>
                    <div className="text-xl font-semibold text-[var(--text-primary)]" style={{ margin: '4px 0', color: 'white' }}>Lớp: {data.ID}</div>
                    <div className="text-base font-medium text-[var(--text-primary)]" style={{ color: 'white' }}>Từ {dateRange[0]} đến {dateRange[1]}</div>
                </Link>
            </div>


            <div style={{ flex: 1, overflow: 'hidden', overflowY: 'scroll' }}>
                {data.Detail?.map((e, i) => {
                    let datalesson = e
                    datalesson.Student = data.Student.flatMap((s) => {
                        let g = s.Learn.filter(t => t.Lesson == e._id)
                        return g
                    })
                    return (
                        i == data.Detail.length - 1 ?
                            <Dot key={i} props={props} course={data._id} type="end" index={i} data={datalesson} /> :
                            i == 0 ? <Dot key={i} props={props} course={data._id} type="center" index={i} data={datalesson} /> :
                                <Dot key={i} props={props} course={data._id} type="main" index={i} data={datalesson} />
                    )
                })}
            </div>
        </div>
    )
}

