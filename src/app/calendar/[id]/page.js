
import { Data_lesson } from "@/data/course";
import Main from "./ui/main";

export default async function CourseLessonPage({ params }) {
    const { id } = await params
    const data = await Data_lesson(id);
    
    return (
        <Main data={data} />
    );
}
