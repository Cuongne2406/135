import Main from './layout/main';
import { area_data, student_data } from '@/data/actions/get';

export default async function Pages() {
  const studentList = await student_data();
  const area_all = await area_data  ();

  return (
    <Main data_area={area_all} data_student={studentList} />
  );
}
