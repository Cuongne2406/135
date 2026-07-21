import Navbar from "./template/navbar"
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken';
import { area_data, book_data, course_data, coursetry_data, user_data } from "@/data/actions/get";

export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get(process.env.token)?.value;
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  const [courses, books, areas, user, trial] = await Promise.all([course_data(), book_data(), area_data(), user_data({ activeOnly: true }), coursetry_data()])
  return (
    <Navbar data={courses} book={books} areas={areas} user={decodedToken} teacher={user} trys={trial} />
  )
}
