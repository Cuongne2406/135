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
                <div className="rounded-lg p-4 bg-white border border-slate-200 shadow-xs mb-3">
                    <Link href={`/course/trycourse`} className="block">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Chương trình trải nghiệm</span>
                            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-[#fffbeb] text-[#b45309] border border-[#fde68a]">Học thử</span>
                        </div>
                        <div className="text-lg font-semibold text-slate-900 tracking-tight">AI Robotic — Lớp Học Thử</div>
                        <div className="text-xs text-slate-500 mt-1">Lớp học trải nghiệm công nghệ & robotics miễn phí</div>
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