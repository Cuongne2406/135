import Link from 'next/link';
import { formatDate } from '@/function';
import { Svg_Detail } from '@/components/(icon)/svg';

const getEventStatus = (data) => {
    const today = new Date();
    today.setHours(7, 0, 0, 0);
    const eventDate = new Date(data.Day);

    if (eventDate < today) {
        return { text: 'Đã diễn ra', color: 'var(--green)' };
    } else if (eventDate.getDate() == today.getDate() && eventDate.getMonth() == today.getMonth() && eventDate.getFullYear() == today.getFullYear()) {
        return { text: 'Đang diễn ra', color: 'var(--main_d)' };
    } else {
        return { text: 'Chưa diễn ra', color: 'gray' };
    }
};

const statusLesson2 = (data) => {
    if (data.Type === 'Học bù') { return { text: 'Học bù', color: 'var(--yellow)' }; }
    if (data.Type === 'Báo nghỉ') { return { text: 'Báo nghỉ', color: 'var(--red)' }; }
    else { return { text: 'Chính thức', color: 'var(--green)' }; }
}



export default function TimeLine_Dot({ course, type, index, data, props }) {
    let statusLesson = [1, 1, 1];
    let num = 0
    data.Student.forEach(element => {
        if (element.Checkin == 0) { statusLesson[0] = 0 }
        if (element.Checkin == 1) {
            num++;
            if ((element.Cmt || []).length == 0) {
                statusLesson[1] = 0;
            }
            if ((element.Image || []).length == 0) {
                statusLesson[2] = 0;
            }
        }
    });
    if (num == 0) {
        statusLesson[1] = 0
        statusLesson[2] = 0
    }

    props = props[1] || '';
    let id = data._id;

    const status = getEventStatus(data);
    const status2 = statusLesson2(data);

    return (
        <Link href={`/course/${course}/${id}`}>
            <div style={{ display: 'flex', padding: '16px 0', position: 'relative', cursor: 'pointer', textDecoration: 'none' }}>
                {type == 'end' ? null : type == 'main' ?
                    <div style={{ position: 'absolute', left: 18.5, top: '50%', height: '100%', width: '3px', backgroundColor: '#1f5fa2', zIndex: '0' }}></div> :
                    <div style={{ position: 'absolute', left: 18.5, top: '0', height: '200%', width: '3px', backgroundColor: '#1f5fa2', zIndex: '0' }}></div>}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, zIndex: 1 }}>

                    <div className={'w-10 h-10 rounded-full bg-[#1f5fa2] text-white z-[1] flex items-center justify-center'} >{index + 1}</div>

                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                            <p className="Chip text-xs font-normal text-[var(--text-primary)]" style={{ background: status.color, color: 'white', padding: '3px 8px', borderRadius: 12, width: 'max-content' }}>
                                {status.text}
                            </p>
                            <p className="Chip text-xs font-normal text-[var(--text-primary)]" style={{ background: statusLesson[0] == 1 ? 'var(--green)' : 'var(--red)', color: 'white', padding: 5, borderRadius: 12, width: 'max-content' }}>

                            </p>
                            <p className="Chip text-xs font-normal text-[var(--text-primary)]" style={{ background: statusLesson[1] == 1 ? 'var(--green)' : 'var(--red)', color: 'white', padding: 5, borderRadius: 12, width: 'max-content' }}>

                            </p>
                            <p className="Chip text-xs font-normal text-[var(--text-primary)]" style={{ background: statusLesson[2] == 1 ? 'var(--green)' : 'var(--red)', color: 'white', padding: 5, borderRadius: 12, width: 'max-content' }}>

                            </p>
                        </div>
                        <p className="text-base font-semibold text-[var(--text-primary)]" style={{ color: props == id ? 'var(--main_d)' : 'var(--text-primary)' }}>
                            {data?.LessonDetails?.Name || 'Không có tên chủ đề'}
                            <span className='text-sm font-semibold text-[var(--text-primary)]' style={{ marginLeft: 5, color: status2.color }}>({status2.text})</span>
                        </p>
                        <div className='text-sm font-normal text-[var(--text-primary)]'>Ngày {formatDate(new Date(data.Day))}</div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
