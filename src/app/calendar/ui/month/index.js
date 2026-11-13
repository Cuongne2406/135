import Link from 'next/link';
import LoadButton from '../button/load';

export default function Title({ month, year }) {
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextYear = month === 12 ? year + 1 : year;

    return (
        <div className="flex justify-between items-center px-4 py-4 bg-[var(--bg-primary)] text-[#3b4056] border-b border-[#e5e6e8] h-9">
            <div className="flex gap-2">
                <Link
                    href={`?month=${prevMonth}&year=${prevYear}`}
                    className="w-8 h-8 border-2 border-[var(--border-color)] rounded-md flex justify-center items-center cursor-pointer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512" height={16} width={16} fill="var(--text-primary)">
                        <path d="M9.4 278.6c-12.5-12.5-12.5-32.8 0-45.3l128-128c9.2-9.2 22.9-11.9 34.9-6.9s19.8 16.6 19.8 29.6l0 256c0 12.9-7.8 24.6-19.8 29.6s-25.7 2.2-34.9-6.9l-128-128z" />
                    </svg>
                </Link>

                <Link
                    href={`?month=${nextMonth}&year=${nextYear}`}
                    className="w-8 h-8 border-2 border-[var(--border-color)] rounded-md flex justify-center items-center cursor-pointer"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512" height={16} width={16} fill="var(--text-primary)">
                        <path d="M246.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-128-128c-9.2-9.2-22.9-11.9-34.9-6.9s-19.8 16.6-19.8 29.6l0 256c0 12.9 7.8 24.6 19.8 29.6s25.7 2.2 34.9-6.9l128-128z" />
                    </svg>
                </Link>
            </div>
            <div className="text-lg font-semibold text-[var(--text-primary)]">
                Tháng {month} năm {year}
            </div>
            <LoadButton month={month} year={year} />
        </div>
    );
}
