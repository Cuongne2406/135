'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const getStatusColor = (s) => {
  if (!s) return 'bg-gray-100 text-gray-500'
  const p = s.Profile
  if (!p) return 'bg-rose-50 text-rose-600'
  const checks = [
    p.Intro,
    p.Avatar,
    p.ImgSkill,
    p.ImgPJ?.length >= 3,
    p.Skill && Object.values(p.Skill).filter(Boolean).length >= 6,
  ]
  const done = checks.filter(Boolean).length
  if (done === checks.length) return 'bg-emerald-50 text-emerald-600'
  if (done >= 3) return 'bg-amber-50 text-amber-600'
  return 'bg-rose-50 text-rose-600'
}

const getStatusLabel = (s) => {
  if (!s) return 'Chưa có'
  const p = s.Profile
  if (!p) return 'Chưa có'
  const checks = [
    p.Intro,
    p.Avatar,
    p.ImgSkill,
    p.ImgPJ?.length >= 3,
    p.Skill && Object.values(p.Skill).filter(Boolean).length >= 6,
  ]
  const done = checks.filter(Boolean).length
  if (done === checks.length) return 'Hoàn thành'
  if (done >= 3) return 'Đang làm'
  return 'Chưa làm'
}

const formatDate = (d) => {
  if (!d) return ''
  const date = new Date(d)
  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}

const Main = ({ data }) => {
  const router = useRouter()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  const students = useMemo(() => {
    if (!data) return []
    return data.filter(s => {
      const match = (s.Name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                    (s._id || '').toLowerCase().includes(searchTerm.toLowerCase())
      if (!match) return false
      if (filterStatus === 'all') return true
      if (filterStatus === 'done') return getStatusLabel(s) === 'Hoàn thành'
      if (filterStatus === 'progress') return getStatusLabel(s) === 'Đang làm'
      if (filterStatus === 'none') return getStatusLabel(s) === 'Chưa làm' || getStatusLabel(s) === 'Chưa có'
      return true
    })
  }, [data, searchTerm, filterStatus])

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center gap-3 p-2 bg-white rounded-md border border-[var(--border-color)]">
        <input
          type="text"
          placeholder="Tìm kiếm theo tên hoặc ID..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 flex-1"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700"
        >
          <option value="all">Tất cả</option>
          <option value="done">Hoàn thành</option>
          <option value="progress">Đang làm</option>
          <option value="none">Chưa làm</option>
        </select>
      </div>
      <div className="flex-1 overflow-y-auto">
        {students.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse bg-white rounded-lg overflow-hidden shadow-sm">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">ID</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">Họ và tên</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">Giới thiệu</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">Avatar</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">Kĩ năng</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">Sản phẩm</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">Trạng thái</th>
                  <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wider border-b">Ngày tạo</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => {
                  const p = s.Profile || {}
                  const hasIntro = !!p.Intro
                  const hasAvatar = !!p.Avatar
                  const hasSkill = p.Skill && Object.values(p.Skill).filter(Boolean).length >= 6
                  const hasProducts = p.ImgPJ?.length >= 3
                  const statusLabel = getStatusLabel(s)
                  const statusColor = getStatusColor(s)
                  return (
                    <tr key={s._id} className="hover:bg-gray-50 transition-colors border-b border-gray-100 cursor-pointer" onClick={() => router.push(`/${s._id}`)}>
                      <td className="px-4 py-3 text-sm text-gray-500">{s._id}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-800">{s.Name}</td>
                      <td className="px-4 py-3">{hasIntro ? <span className="text-xs text-emerald-600">✓</span> : <span className="text-xs text-rose-400">—</span>}</td>
                      <td className="px-4 py-3">{hasAvatar ? <span className="text-xs text-emerald-600">✓</span> : <span className="text-xs text-rose-400">—</span>}</td>
                      <td className="px-4 py-3">{hasSkill ? <span className="text-xs text-emerald-600">✓</span> : <span className="text-xs text-rose-400">—</span>}</td>
                      <td className="px-4 py-3">{hasProducts ? <span className="text-xs text-emerald-600">✓</span> : <span className="text-xs text-rose-400">—</span>}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 text-[11px] font-semibold rounded ${statusColor}`}>{statusLabel}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">{formatDate(s.createdAt)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-xl text-[#888] mt-12">Không tìm thấy học sinh nào.</p>
        )}
      </div>
    </div>
  )
}

export default Main
