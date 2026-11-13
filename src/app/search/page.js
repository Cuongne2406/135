import Main from './main';
import { student_data } from '@/data/actions/get';

export default async function SearchPage() {
  const studentList = await student_data();
  return <Main data={studentList} />;
}
