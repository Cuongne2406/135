import Navbar from "./template/navbar"
import { CheckRole } from "@/function/server";
import { area_data, book_data, course_data, coursetry_data, user_data } from "@/data/actions/get";

export default async function Home() {
  const user = (await CheckRole()) || { role: [] };
  const [courses, books, areas, teacherList, trial] = await Promise.all([
    course_data(),
    book_data(),
    area_data(),
    user_data({ activeOnly: true }),
    coursetry_data()
  ]);
  return (
    <Navbar data={courses} book={books} areas={areas} user={user} teacher={teacherList} trys={trial} />
  );
}
