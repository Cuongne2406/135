'use client'
import { useState, useEffect, useMemo, useCallback } from 'react'
import Link from 'next/link'
import Loading from '@/components/(ui)/(loading)/loading'

const DAYS = ['Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy', 'Chủ nhật']
const DAY_LABELS = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật']
const SLOTS = ['Sáng', 'Chiều', 'Tối']

function getWeekRange(date) {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  const monday = new Date(d.setDate(diff))
  monday.setHours(0, 0, 0, 0)
  const days = []
  for (let i = 0; i < 7; i++) {
    const dt = new Date(monday)
    dt.setDate(monday.getDate() + i)
    days.push(dt)
  }
  return { monday, days }
}

function fmtDate(d) {
  return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`
}

function getMonthName(m) {
  return ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'][m]
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

function getSlotIndex(timeStr) {
  if (!timeStr) return 1
  const start = timeStr.split('-')[0] || timeStr
  const mins = timeToMinutes(start)
  if (mins < 720) return 0
  if (mins < 1020) return 1
  return 2
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

const isObjId = (v) => /^[0-9a-fA-F]{24}$/.test(v)

function safeRoom(item) {
  return item.room?.name && !isObjId(item.room.name) ? item.room.name : '?'
}

function DayLessons({ lessons }) {
  if (lessons.length === 0) return <div className="text-xs text-[var(--text-secondary)] italic p-1">—</div>
  return (
    <div className="flex flex-col gap-1">
      {lessons.map((item, idx) => (
        <Link key={item._id || idx} href={`/calendar/${item._id}`}
          className="block p-2 rounded text-sm leading-snug hover:opacity-90 transition-all border shadow-sm text-gray-800"
          style={{
            background: item.type === 'Học bù' ? '#fff3e0' : '#dbeafe',
            borderColor: item.type === 'Học bù' ? '#fdba74' : '#93c5fd'
          }}>
          <div className="font-semibold truncate flex items-center gap-1">
            <span>{safeRoom(item)}</span>
            {item.room?.area && <span className="opacity-50 font-normal">· {item.room.area}</span>}
          </div>
          <div className="truncate text-xs">{item.courseId}</div>
          {item.teacher?.name && <div className="truncate text-xs opacity-70">{item.teacher.name}</div>}
          {item.time && <div className="text-xs opacity-60">{item.time}</div>}
        </Link>
      ))}
      
    </div>
  )
}

function MonthList({ data }) {
  const now = new Date()
  const cy = now.getFullYear()
  const cm = now.getMonth() + 1
  const cd = now.getDate()

  const groupedByDay = useMemo(() => {
    return data.reduce((acc, item) => {
      const k = `${String(item.day).padStart(2, '0')}/${String(item.month).padStart(2, '0')}/${item.year}`
      ;(acc[k] ??= []).push(item)
      return acc
    }, {})
  }, [data])

  const sortedDays = useMemo(() => {
    return Object.keys(groupedByDay).sort((a, b) => {
      const [da, ma, ya] = a.split('/').map(Number)
      const [db, mb, yb] = b.split('/').map(Number)
      return new Date(ya, ma - 1, da) - new Date(yb, mb - 1, db)
    })
  }, [groupedByDay])

  return (
    <div>
      {sortedDays.map(dayKey => {
        const lessons = (groupedByDay[dayKey] || []).sort((a, b) => {
          const sa = a.time?.split('-')[0] || '00:00'
          const sb = b.time?.split('-')[0] || '00:00'
          return timeToMinutes(sa) - timeToMinutes(sb)
        })
        const [dd, mm, yy] = dayKey.split('/').map(Number)
        const today = dd === cd && mm === cm && yy === cy
        return (
          <section key={dayKey} className="border-b border-[var(--border-color)]">
            <div className={`px-3 py-2 text-xs font-semibold border-b border-[var(--border-color)] ${today ? 'text-white' : 'bg-[var(--bg-secondary)] text-[var(--text-primary)]'}`}
              style={today ? { background: 'var(--main)' } : undefined}>
              {dd}/{mm}/{yy} {today ? '(Hôm nay)' : ''}
            </div>
            {lessons.map(item => {
              const makeup = item.type === 'Học bù'
              return (
                <Link key={item._id} href={`/calendar/${item._id}`}
                  className="flex items-center gap-2 px-3 py-2 text-xs hover:bg-[var(--hover)] transition-colors border-b border-[var(--border-color)] last:border-b-0">
                  <div className="w-14 shrink-0 text-[var(--text-secondary)] font-medium">{item.time || '—'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: makeup ? '#e65100' : 'var(--main)' }}></span>
                      <span className="font-semibold text-[var(--text-primary)] truncate">{item.courseId}</span>
                      {item.room?.name && !isObjId(item.room.name) && <span className="text-[var(--text-secondary)] truncate">— {item.room.name}</span>}
                    </div>
                    {item.topic?.Name && <div className="text-[var(--text-secondary)] truncate mt-0.5">{item.topic.Name}</div>}
                    <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mt-0.5">
                      {item.teacher?.name && <span>{item.teacher.name}</span>}
                    </div>
                  </div>
                  {makeup && <span className="shrink-0 px-1.5 py-0.5 text-xs rounded bg-orange-100 text-orange-600 font-medium">Bù</span>}
                </Link>
              )
            })}
          </section>
        )
      })}
      {sortedDays.length === 0 && (
        <div className="flex items-center justify-center h-32 text-xs text-[var(--text-secondary)] italic">
          Không có buổi học nào trong tháng
        </div>
      )}
    </div>
  )
}

export default function CalendarPage() {
  const [today] = useState(new Date())
  const [currentMonday, setCurrentMonday] = useState(() => getWeekRange(today).monday)
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState(null)
  const [viewMode, setViewMode] = useState('my')

  const fetchData = useCallback(async (monday) => {
    setLoading(true)
    try {
      const month = monday.getMonth() + 1
      const year = monday.getFullYear()
      const res = await fetch(`/api/calendar?month=${month}&year=${year}`)
      const json = await res.json()
      const real = json.data || []
      setData(real)
    } catch { } finally { setLoading(false) }
  }, [])

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me')
      const json = await res.json()
      if (json.user) setUser(json.user)
    } catch { }
  }, [])

  useEffect(() => { fetchData(currentMonday) }, [currentMonday, fetchData])
  useEffect(() => { fetchUser() }, [fetchUser])

  const weekDays = useMemo(() => getWeekRange(currentMonday).days, [currentMonday])
  const viewMonth = currentMonday.getMonth() + 1
  const viewYear = currentMonday.getFullYear()
  const monthLabel = useMemo(() => {
    const ms = [...new Set(weekDays.map(d => d.getMonth()))]
    const y = weekDays[0].getFullYear()
    return ms.length === 1 ? `${getMonthName(ms[0])} ${y}` : `${getMonthName(ms[0])} - ${getMonthName(ms[ms.length - 1])} ${y}`
  }, [weekDays])

  const myData = useMemo(() => {
    if (!user?._id) return []
    const uid = user._id.toString()
    return data.filter(i => {
      const t = i.teacher?._id?.toString()
      const ta = i.teachingAs?._id?.toString()
      return t === uid || ta === uid
    })
  }, [data, user])

  const gridSource = useMemo(() => viewMode === 'my' ? myData : data, [viewMode, myData, data])

  const weekData = useMemo(() => {
    const grid = {}
    for (const day of weekDays) {
      const key = fmtDate(day)
      grid[key] = { Sáng: [], Chiều: [], Tối: [] }
    }
    for (const item of gridSource) {
      const d = new Date(item.date)
      const key = fmtDate(d)
      if (!grid[key]) continue
      grid[key][SLOTS[getSlotIndex(item.time)]].push(item)
    }
    return grid
  }, [weekDays, gridSource])

  const navWeek = (o) => {
    const d = new Date(currentMonday)
    d.setDate(d.getDate() + o * 7)
    setCurrentMonday(d)
  }

  const isActive = (m) => viewMode === m

  function MobileWeekList() {
    const items = []
    for (const day of weekDays) {
      const key = fmtDate(day)
      const dayLessons = (gridSource || []).filter(item => {
        const d = new Date(item.date)
        return fmtDate(d) === key
      })
      const isToday = sameDay(day, today)
      items.push({ day, lessons: dayLessons, isToday })
    }
    return (
      <div className="flex flex-col h-full">
        {items.map(({ day, lessons, isToday }) => (
          <div key={fmtDate(day)} className="flex flex-1 min-h-0 border-b border-gray-200 overflow-hidden">
            {/* Left sidebar — date indicator */}
            <div className={`w-[80px] shrink-0 flex flex-col items-center justify-center text-white ${isToday ? 'bg-red-600' : 'bg-[var(--main)]'}`}>
              <span className="text-xs font-semibold leading-tight text-center px-1">{DAY_LABELS[day.getDay() === 0 ? 6 : day.getDay() - 1]}</span>
              <div className="w-5 border-t border-white/60 my-1.5"></div>
              <span className="text-sm font-bold leading-tight">{day.getDate()}/{day.getMonth() + 1}</span>
            </div>
            {/* Right content — DayLessons cards */}
            <div className="flex-1 bg-white p-2 overflow-y-auto">
              <DayLessons lessons={lessons} />
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex h-full border border-[var(--border-color)] rounded-lg overflow-hidden bg-[var(--bg-primary)]">
      {/* LEFT: month list */}
      <div className="hidden lg:flex flex-col border-r border-[var(--border-color)] w-[380px] min-w-[380px]">
        <div style={{ background: 'var(--main)' }} className="flex flex-col justify-center px-4 border-b border-[var(--border-color)] h-[94px]">
          <span className="text-lg font-bold text-white">{viewMode === 'my' ? 'Lịch của tôi' : 'Toàn trung tâm'}</span>
          <span className="text-sm text-white/80">Tháng {viewMonth}/{viewYear}</span>
        </div>
        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Loading content={<p className="text-sm">Đang tải...</p>} /></div>
        ) : viewMode === 'my' && !user ? (
          <div className="flex-1 flex items-center justify-center text-xs text-[var(--text-secondary)] italic">Đăng nhập để xem lịch cá nhân</div>
        ) : (
          <div className="flex-1 overflow-y-auto"><MonthList data={gridSource} /></div>
        )}
      </div>

      {/* RIGHT: week grid */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* header bar */}
        <div style={{ background: 'var(--main)' }} className="px-3 py-2 border-b border-[var(--border-color)] flex items-center gap-2">
          <button onClick={() => navWeek(-1)} className="text-white text-sm px-1.5 py-0.5 rounded cursor-pointer bg-transparent border-0 hover:bg-white/20">‹</button>
          <span className="text-sm font-semibold text-white">{monthLabel}</span>
          <button onClick={() => navWeek(1)} className="text-white text-sm px-1.5 py-0.5 rounded cursor-pointer bg-transparent border-0 hover:bg-white/20">›</button>
          <button onClick={() => setCurrentMonday(getWeekRange(new Date()).monday)} className="ml-2 px-3 py-1 text-xs font-semibold text-gray-800 bg-white/85 rounded cursor-pointer border-0 leading-none">Hôm nay</button>
          <div className="ml-auto flex rounded-md overflow-hidden">
            <button onClick={() => setViewMode('my')}
              style={{ background: isActive('my') ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.2)', color: isActive('my') ? '#222' : 'rgba(255,255,255,0.8)' }}
              className="px-3.5 py-1 text-xs font-bold border-0 cursor-pointer transition-all duration-150">Lịch của tôi</button>
            <button onClick={() => setViewMode('all')}
              style={{ background: isActive('all') ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.2)', color: isActive('all') ? '#222' : 'rgba(255,255,255,0.8)' }}
              className="px-3.5 py-1 text-xs font-bold border-0 cursor-pointer transition-all duration-150">Lịch trung tâm</button>
          </div>
        </div>

        {/* loading / no user */}
        {loading ? (
          <div className="flex-1 flex items-center justify-center"><Loading content={<p className="text-sm">Đang tải...</p>} /></div>
        ) : viewMode === 'my' && !user ? (
          <div className="flex-1 flex items-center justify-center text-xs text-[var(--text-secondary)] italic">Đăng nhập để xem lịch cá nhân</div>
        ) : (
          <>
          {/* DESKTOP: week grid — hidden on small screens */}
          <div className="hidden lg:flex flex-1 flex-col overflow-hidden">
            {/* day headers */}
            <div style={{ background: 'var(--main)' }} className="flex border-b border-[var(--border-color)]">
              <div className="w-20 min-w-20 border-r border-white/20"></div>
              {weekDays.map((d, i) => {
                const isToday = sameDay(d, today)
                return (
                  <div key={i} className={`flex-1 px-2 py-1.5 text-center border-r border-white/20 ${isToday ? 'bg-red-600' : ''}`}>
                    <div className={`text-xs font-medium ${isToday ? 'text-white' : 'text-white/80'}`}>{DAY_LABELS[i]}</div>
                    <div className={`text-base font-bold ${isToday ? 'text-white' : 'text-white'}`}>{d.getDate()}/{d.getMonth() + 1}</div>
                  </div>
                )
              })}
            </div>

            {/* time slot rows */}
            <div className="flex-1 flex flex-col">
              {SLOTS.map(slot => (
                <div key={slot} className="flex flex-1 border-b border-[var(--border-color)]" style={{ minHeight: 180 }}>
                  <div className="w-20 min-w-20 px-2 border-r border-[var(--border-color)] text-sm text-[var(--text-secondary)] font-bold flex items-center justify-center">{slot}</div>
                  {weekDays.map((d, di) => {
                    const key = fmtDate(d)
                    const lessons = weekData[key]?.[slot] || []
                    const isToday = sameDay(d, today)
                    return (
                      <div key={di} className={`flex-1 p-2 border-r border-[var(--border-color)] overflow-y-auto ${isToday ? 'bg-red-50' : ''}`}>
                        <DayLessons lessons={lessons} />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* MOBILE: list view — shown only on small screens */}
          <div className="lg:hidden flex-1 flex flex-col overflow-hidden p-3">
            <MobileWeekList />
          </div>
          </>
        )}
      </div>
    </div>
  )
}
