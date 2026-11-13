import { user_data } from "@/data/actions/get";
import { CheckRole } from "@/function/server"
import AdminPage from "@/app/(admin)/index";
import TeacherPage from "@/app/(teacher)/index";
import { redirect } from 'next/navigation';

export default async function Home() {
  const user = await CheckRole();
  if (!user) {
    redirect('/login'); 
  }
  const isAdmin = Array.isArray(user.role)
    ? user.role.some(r => /^admin$/i.test(r))
    : user.role === 'Admin';

  return (
    <>
      {isAdmin ? <AdminPage /> : <TeacherPage data={await user_data({ _id: user.id })} />}
    </>
  );
}
