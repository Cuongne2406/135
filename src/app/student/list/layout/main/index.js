'use client'

import { Li_l } from '../../ui/itemStudent';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/(ui)/(loading)/loading';
import { Svg_Reload } from '@/components/(icon)/svg';
import { reloadStudent } from '@/data/actions/reload';
import Create from '../../ui/create';

const STATUS_MAP = { "Đang học": 2, "Chờ lên khóa": 1, "Đã nghỉ": 0 };

export default function Main({ data_student, data_area }) {
  const [load, setLoad] = useState(false);
  const [filterArea, setFilterArea] = useState("Tất cả");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("Đang học");
  const route = useRouter();

  const ReLoadData = async () => { setLoad(true); await reloadStudent(); route.refresh(); setLoad(false); };

  const uniqueAreas = [...new Set(data_student.map(s => s.Area?.name).filter(Boolean))];

  const filteredStudents = data_student.filter(student => {
    const search = searchTerm.trim().toLowerCase();
    const latestStatus = student.Status?.[student.Status.length - 1]?.status;

    const matchSearch = !search ||
      student.Name?.toLowerCase().includes(search) ||
      student.ID?.toLowerCase().includes(search);

    const matchArea = filterArea === "Tất cả" || student.Area?.name === filterArea;
    const matchStatus = filterStatus === "Tất cả" || latestStatus === STATUS_MAP[filterStatus];

    return matchArea && matchSearch && matchStatus;
  });

  return (
    <div className="flex gap-4 h-[calc(100%-16px)] w-full p-2 pr-0 pt-2">
      <div className="flex-1 rounded-lg border border-[var(--border-color)] flex flex-col overflow-hidden">
        <div className="border-b-2 border-[var(--border-color)] px-3 py-2 flex items-center justify-between gap-2">
          <div className="flex gap-2 items-center">
            <input
              className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 w-[300px]"
              placeholder="Nhập tên hoặc ID học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 w-[180px]"
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
            >
              <option value="Tất cả">Tất cả khu vực</option>
              {uniqueAreas.map((areaName) => (
                <option key={areaName} value={areaName}>{areaName}</option>
              ))}
            </select>
            <select
              className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 w-[140px]"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="Tất cả">Tất cả</option>
              <option value="Đang học">Đang học</option>
              <option value="Chờ lên khóa">Chờ lên khóa</option>
              <option value="Đã nghỉ">Đã nghỉ</option>
            </select>
          </div>

          <div className="flex gap-2 items-center">
            <button
              className="px-3 py-2 bg-[var(--main_d)] text-white text-sm font-medium rounded cursor-pointer border-none flex items-center gap-1.5 whitespace-nowrap transition-colors hover:brightness-110"
              onClick={ReLoadData}
            >
              <Svg_Reload w={16} h={16} c='white' />
              Tải lại dữ liệu
            </button>
            <Create data_area={data_area} />
          </div>
        </div>

        <div className="flex-1 scroll">
          {filteredStudents.map((t, index) => (
            <Li_l key={t.ID || index} data={t} dataArea={data_area} />
          ))}
        </div>
      </div>

      {load && (<div className="fixed inset-0 bg-black/80 flex justify-center items-center z-[9999]">  <Loading content={<p className='text-sm font-normal text-white'>Đang tải dữ liệu...</p>} /></div>)}
    </div>
  );
}
