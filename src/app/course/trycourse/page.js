import { Data_coursetry } from "@/data/course";
import Link from "next/link";
import CourseTryPages from "./main";
import CourseTryFilter from "./filter";
import { area_data, book_data, student_data, user_data } from "@/data/actions/get";

export default async function CourseTryPage() {
    let [data, book, student, teacher, area] = await Promise.all([
        Data_coursetry(),
        book_data(),
        student_data(),
        user_data({ activeOnly: true }),
        area_data(),
    ]);

    if (data?.sessions && Array.isArray(data.sessions)) {
        data.sessions.sort((a, b) => new Date(b.day) - new Date(a.day));
    }

    return (
        <div style={{ display: 'flex', height: '100%', width: '100%', gap: 16 }}>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', height: '100%', flex: 1.6 }}>
                <div style={{
                    borderRadius: '8px', padding: 16, background: 'linear-gradient(90deg, var(--yellow) 0%, rgb(249, 174, 0) 100%)',
                    boxShadow: 'var(--boxshaw)', overflow: 'hidden',
                }}>
                    <Link href={`/course/trycourse`}>
                        <div className="text-base font-medium text-[var(--text-primary)]" style={{ color: 'white', fontWeight: '500' }}>AI Robotic</div>
                        <div className="text-xl font-semibold text-[var(--text-primary)]" style={{ margin: '4px 0', color: 'white' }}>Lớp: HỌC THỬ</div>
                        <div className="text-base font-medium text-[var(--text-primary)]" style={{ color: 'white' }}>Học thử miễn phí AI Robotic</div>
                    </Link>
                </div>
                <CourseTryFilter data={data} book={book} student={student} teacher={teacher} area={area} />
            </div>
            <div style={{ flex: 4 }}>
                <CourseTryPages data={data} book={book} student={student} teacher={teacher} area={area} />
            </div>
        </div>
    );
}