import Image from 'next/image';
import Link from 'next/link';

const formatPrice = (price) => {
    if (typeof price !== 'number') return 'N/A';
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
};

const ProgramCard = ({ program }) => {
    const topicCount = Object.keys(program.Topics || {}).length
    const url = program.Image ? (program.Image.split('/').length == 5 ? program.Image : `https://lh3.googleusercontent.com/d/${program.Image}`) : '/placeholder.png';

    return (
        <Link href={`/course/book/${program._id}`} className={'flex flex-row bg-white rounded-lg shadow-[var(--boxshaw2)] overflow-hidden transition-all duration-300 w-[calc(25%-12px)] cursor-pointer aspect-[6/3] hover:-translate-y-1 hover:shadow-[var(--boxshaw)]'}>
            <div className={'w-1/3 flex'}>
                <div className={'relative aspect-[3/4] w-full bg-gradient-to-br from-[var(--main_l)] to-[var(--main_d)] flex items-center justify-center text-white'}>
                    <Image src={url} fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" alt={program.Name} />
                </div>
            </div>
            <div className={'flex-[2] p-5 flex flex-col'}>
                <div className={'flex justify-between items-start mb-2'}>
                    <p className='text-lg font-semibold text-[var(--text-primary)]'>{program.Name}</p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p className='text-sm font-semibold text-[var(--text-primary)]'>Mã chương trình: <span style={{ fontWeight: 400 }}>{program.ID}</span></p>
                    <p className='text-sm font-semibold text-[var(--text-primary)]'>Số chủ đề: <span style={{ fontWeight: 400 }}>{topicCount} chủ đề</span></p>
                    <p className='text-sm font-semibold text-[var(--text-primary)]'>Số tiết học: <span style={{ fontWeight: 400 }}>{program.Topics?.reduce((total, item) => total + (item.Period || 0), 0) || 0} tiết</span></p>
                    <p className='text-sm font-semibold text-[var(--text-primary)]'>Giá khóa học: <span style={{ fontWeight: 400 }}>{formatPrice(program.Price)}</span></p>
                </div>
            </div>
        </Link>
    );
};

const ProgramList = ({ programs }) => {
    if (!programs || programs.length === 0) {
        return <div>Không có chương trình nào để hiển thị.</div>;
    }
    
    return (
        <div className={'flex flex-wrap gap-4 bg-[#f7f9fc]'}>
            {programs.map(program => (
                <ProgramCard key={program._id} program={program} />
            ))}
        </div>
    );
};

export default ProgramList;