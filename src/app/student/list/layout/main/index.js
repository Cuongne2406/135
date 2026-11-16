'use client'

import { Li_l } from '../../ui/itemStudent';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Loading from '@/components/(ui)/(loading)/loading';
import { Svg_Reload } from '@/components/(icon)/svg';
import { reloadStudent } from '@/data/actions/reload';
import Create from '../../ui/create';

import EmptyState from '@/components/ui/EmptyState';
import SkeletonTable from '@/components/ui/SkeletonTable';

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
      <div className="flex-1 rounded-lg border border-slate-200 bg-white flex flex-col overflow-hidden shadow-xs">
        <div className="border-b border-slate-200 px-3 py-2.5 flex items-center justify-between gap-2 bg-slate-50/50">
          <div className="flex gap-2 items-center flex-wrap">
            <input
              className="h-9 px-3 border border-slate-300 rounded-md bg-white text-sm outline-none text-slate-900 focus:ring-2 focus:ring-[var(--main_d)]/15 focus:border-[var(--main_d)] w-[280px]"
              placeholder="Tìm theo tên hoặc ID học sinh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select
              className="h-9 px-3 border border-slate-300 rounded-md bg-white text-sm outline-none text-slate-800 focus:ring-2 focus:ring-[var(--main_d)]/15 focus:border-[var(--main_d)] w-[170px]"
              value={filterArea}
              onChange={(e) => setFilterArea(e.target.value)}
            >
              <option value="Tất cả">Tất cả khu vực</option>
              {uniqueAreas.map((areaName) => (
                <option key={areaName} value={areaName}>{areaName}</option>
              ))}
            </select>
            <select
              className="h-9 px-3 border border-slate-300 rounded-md bg-white text-sm outline-none text-slate-800 focus:ring-2 focus:ring-[var(--main_d)]/15 focus:border-[var(--main_d)] w-[140px]"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="Tất cả">Tất cả trạng thái</option>
              <option value="Đang học">Đang học</option>
              <option value="Chờ lên khóa">Chờ lên khóa</option>
              <option value="Đã nghỉ">Đã nghỉ</option>
            </select>
          </div>

          <div className="flex gap-2 items-center">
            <button
              className="h-9 px-3.5 bg-[var(--main_d)] text-white text-sm font-medium rounded-md cursor-pointer border-none flex items-center gap-1.5 whitespace-nowrap transition-colors hover:bg-[var(--main_b)] shadow-xs"
              onClick={ReLoadData}
            >
              <Svg_Reload w={15} h={15} c='white' />
              Tải lại
            </button>
            <Create data_area={data_area} />
          </div>
        </div>

        {/* Header danh sách học viên */}
        <div className="bg-slate-50/90 border-b border-slate-200 px-3 py-2.5 flex items-center text-xs font-semibold uppercase tracking-wider text-slate-500">
          <div style={{ flex: 5, display: 'flex', alignItems: 'center' }}>
            <div style={{ flex: 2 }}>Mã & Họ tên học sinh</div>
            <div style={{ flex: 1 }}>Khu vực</div>
            <div style={{ flex: 1 }}>Liên hệ</div>
            <div style={{ flex: 1 }}>Ngày tạo</div>
            <div style={{ flex: 0.8, textAlign: 'center' }}>Xếp hạng</div>
          </div>
          <div style={{ flex: 1, textAlign: 'center' }}>Thao tác</div>
        </div>

        <div className="flex-1 scroll">
          {load ? (
            <div className="p-4">
              <SkeletonTable rows={6} columns={6} />
            </div>
          ) : filteredStudents.length === 0 ? (
            <EmptyState
              title="Không tìm thấy học sinh nào"
              description="Không có bản ghi nào khớp với điều kiện tìm kiếm hoặc bộ lọc khu vực/trạng thái hiện tại."
              actionText="Xóa bộ lọc"
              onAction={() => { setSearchTerm(''); setFilterArea('Tất cả'); setFilterStatus('Tất cả'); }}
            />
          ) : (
            filteredStudents.map((t, index) => (
              <Li_l key={t.ID || index} data={t} dataArea={data_area} ReLoadData={ReLoadData} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
