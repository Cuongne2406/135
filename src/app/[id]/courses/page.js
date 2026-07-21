import { Read_Student_ById } from "@/data/database/student";
import CourseListDisplay from "./main";
import { student_data } from "@/data/actions/get";

export default async function CoursesTab({ params }) {
    const { id } = params;
    const studentData = await student_data(id);
    

    if (!studentData || !studentData.Course || studentData.Course.length === 0) {
        return (
            <div className="rounded-xl">
                <p>Học sinh này chưa tham gia khóa học nào.</p>
            </div>
        );
    }
    
    const processedCourses = studentData.Course
        .map(enrollment => {
            enrollment.Detail?.sort((a, b) => new Date(a.Day) - new Date(b.Day));
            return enrollment;
        })
        .sort((a, b) => {
            if (a.enrollmentStatus !== 2 && b.enrollmentStatus === 2) return -1;
            if (a.enrollmentStatus === 2 && b.enrollmentStatus !== 2) return 1;
            const dateA = a.Detail?.length > 0 ? new Date(a.Detail[0].Day) : 0;
            const dateB = b.Detail?.length > 0 ? new Date(b.Detail[0].Day) : 0;
            return dateB - dateA;
        });

    return (
        <div className="rounded-xl">
            <CourseListDisplay courses={processedCourses} />
        </div>
    );
}
