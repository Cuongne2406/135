'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js'
import { Bar } from 'react-chartjs-2'
import StatCard from './statCard'
import ChartCard from './chartCard'
import EmptyState from './emptyState'
import { KPISkeleton } from './loadingSkeleton'
import { Svg_Student, Svg_User, Svg_Tuition, Svg_Graduation, Svg_Close } from '@/components/(icon)/svg'

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend)

function formatCurrency(n) {
    if (!n || isNaN(n)) return '0 VNĐ'
    return n.toLocaleString('vi-VN') + ' VNĐ'
}

function formatNumber(n) {
    if (n === undefined || n === null) return '0'
    return n.toLocaleString('vi-VN')
}

function formatAge(n) {
    if (n === null || n === undefined) return '—'
    const lo = Math.floor(n)
    const hi = Math.ceil(n)
    if (lo === hi) return lo + ' tuổi'
    return lo + '-' + hi + ' tuổi'
}

// const statusOptions = [
//     { value: '', label: 'Tất cả' },
//     { value: '2', label: 'Đang học' },
//     { value: '1', label: 'Đang chờ xếp lớp' },
//     { value: '0', label: 'Hoàn thành' },
// ]

const periodOptions = [
    { value: 'month', label: 'Theo tháng' },
    { value: 'quarter', label: 'Theo quý' },
    { value: 'year', label: 'Theo năm' },
]

const PASTEL_BLUE = '#93c5fd'
const PASTEL_GREEN = '#86efac'
const PASTEL_YELLOW = '#fde68a'
const PASTEL_ORANGE = '#fdba74'
const PASTEL_RED = '#fca5a5'

function ClassSearch({ options, value, onChange }) {
    const [open, setOpen] = useState(false)
    const [query, setQuery] = useState('')
    const ref = useRef(null)
    const selected = options.find(c => c._id === value)
    const filtered = query ? options.filter(c => c.name.toLowerCase().includes(query.toLowerCase())) : options

    useEffect(() => {
        function handleClick(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false)
        }
        document.addEventListener('mousedown', handleClick)
        return () => document.removeEventListener('mousedown', handleClick)
    }, [])

    return (
        <div ref={ref} className="relative">
            <input type="text" placeholder="Tìm lớp..." value={open ? query : (selected?.name || '')}
                onChange={e => { setQuery(e.target.value); setOpen(true) }}
                onFocus={() => { setOpen(true); setQuery('') }}
                className="px-2 py-1.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none w-[130px]"
            />
            {value && !open && (
                <button onClick={() => { onChange(''); setQuery('') }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                    <Svg_Close w={10} h={10} c={'currentColor'} />
                </button>
            )}
            {open && (
                <div className="absolute top-full left-0 right-0 mt-1 max-h-48 overflow-y-auto rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] shadow-lg z-50">
                    <button className={'w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[var(--hover)] ' + (!value ? 'bg-[var(--hover)]' : 'text-[var(--text-primary)]')}
                        onClick={() => { onChange(''); setOpen(false); setQuery('') }}>Tất cả lớp</button>
                    {filtered.map(c => (
                        <button key={c._id}
                            className={'w-full text-left px-3 py-2 text-sm transition-colors hover:bg-[var(--hover)] ' + (value === c._id ? 'bg-[var(--hover)] font-medium' : 'text-[var(--text-primary)]')}
                            onClick={() => { onChange(c._id); setOpen(false); setQuery('') }}>{c.name}</button>
                    ))}
                    {filtered.length === 0 && <p className="px-3 py-2 text-sm text-[var(--text-secondary)]">Không tìm thấy lớp</p>}
                </div>
            )}
        </div>
    )
}

export default function Overview() {
    const now = new Date()
    const cy = now.getFullYear()
    const cm = now.getMonth() + 1
    const cq = Math.ceil(cm / 3)

    const [areaId, setAreaId] = useState('')
    const [classId, setClassId] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [period, setPeriod] = useState('month')

    const [fromYear, setFromYear] = useState(cy)
    const [toYear, setToYear] = useState(cy)
    const [fromMonth, setFromMonth] = useState(cm > 1 ? cm - 1 : 12)
    const [toMonth, setToMonth] = useState(cm)
    const [fromQuarter, setFromQuarter] = useState(1)
    const [toQuarter, setToQuarter] = useState(cq)

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const hasLoadedOnce = useRef(false)

    const fetchData = useCallback(async () => {
        setLoading(true)
        setError(null)
        try {
            const p = new URLSearchParams()
            if (areaId) p.set('areaId', areaId)
            if (classId) p.set('classId', classId)
            if (statusFilter) p.set('status', statusFilter)
            p.set('period', period)
            p.set('fromYear', String(fromYear))
            p.set('toYear', String(toYear))
            if (period === 'month') {
                p.set('fromMonth', String(fromMonth))
                p.set('toMonth', String(toMonth))
            }
            if (period === 'quarter') {
                p.set('fromQuarter', String(fromQuarter))
                p.set('toQuarter', String(toQuarter))
            }
            const res = await fetch('/api/dashboard/overview?' + p)
            const json = await res.json()
            if (json.success) { setData(json.data); hasLoadedOnce.current = true }
            else setError(json.error || 'Lỗi tải dữ liệu')
        } catch {
            setError('Lỗi kết nối máy chủ')
        } finally {
            setLoading(false)
        }
    }, [areaId, classId, statusFilter, period, fromYear, toYear, fromMonth, toMonth, fromQuarter, toQuarter])

    useEffect(() => { fetchData() }, [fetchData])

    const summary = data?.summary
    const areaOptions = data?.areaOptions || []
    const classOptions = data?.classOptions || []
    const yearOptions = data?.yearOptions || []
    const monthOptions = data?.monthOptions || []
    const quarterOptions = data?.quarterOptions || []

    function periodLabel() {
        if (period === 'month') {
            if (fromYear === toYear && fromMonth === toMonth) return `Tháng ${fromMonth}/${fromYear}`
            return `T${fromMonth}/${fromYear} → T${toMonth}/${toYear}`
        }
        if (period === 'quarter') {
            if (fromYear === toYear && fromQuarter === toQuarter) return `Q${fromQuarter}/${fromYear}`
            return `Q${fromQuarter}/${fromYear} → Q${toQuarter}/${toYear}`
        }
        if (fromYear === toYear) return `Năm ${fromYear}`
        return `${fromYear} → ${toYear}`
    }

    function chartOpts(isCurrency) {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: function(ctx) { return isCurrency ? formatCurrency(ctx.raw) : String(ctx.raw) } } }
            },
            scales: {
                x: { grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { autoSkip: false, maxRotation: 45 } },
                y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { precision: 0 } }
            }
        }
    }

    function chartHOpts() {
        return {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: { callbacks: { label: function(ctx) { return String(ctx.raw) } } }
            },
            scales: {
                x: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' }, ticks: { precision: 0 } },
                y: { grid: { display: false }, ticks: { autoSkip: false } }
            }
        }
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <p className="text-red-500 font-medium mb-2">Lỗi tải dữ liệu</p>
                    <p className="text-sm text-[var(--text-secondary)]">{error}</p>
                    <button onClick={fetchData} className="mt-3 px-4 py-2 text-sm rounded-lg bg-[var(--main_d)] text-white hover:opacity-90 transition-opacity">Thử lại</button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4 p-4 w-full max-w-full min-w-0">
            <div className="flex items-center justify-between gap-3 flex-nowrap">
                <h1 className="text-xs font-bold text-[var(--text-primary)] shrink-0">TỔNG QUAN</h1>
            </div>

            <div className="flex items-center gap-1.5 flex-nowrap">
                <div className="flex items-center gap-1.5 overflow-x-auto whitespace-nowrap min-w-0">
                    <div className="flex items-center gap-1 rounded-lg border border-[var(--border-color)] p-0.5 bg-[var(--bg-primary)] shrink-0">
                        {periodOptions.map(opt => (
                            <button key={opt.value} onClick={() => setPeriod(opt.value)}
                                className={'px-2 py-1.5 text-xs rounded-md transition-colors ' + (period === opt.value ? 'bg-[var(--main_d)] text-white font-medium' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]')}>
                                {opt.label}
                            </button>
                        ))}
                    </div>

                    {period === 'month' && (
                        <>
                            <select value={fromMonth} onChange={e => setFromMonth(parseInt(e.target.value))} className="px-1.5 py-1.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none max-w-[100px]">
                                {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                            <select value={fromYear} onChange={e => setFromYear(parseInt(e.target.value))} className="px-1.5 py-1.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none max-w-[90px]">
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <span className="text-sm text-[var(--text-secondary)] shrink-0">→</span>
                            <select value={toMonth} onChange={e => setToMonth(parseInt(e.target.value))} className="px-1.5 py-1.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none max-w-[100px]">
                                {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                            </select>
                            <select value={toYear} onChange={e => setToYear(parseInt(e.target.value))} className="px-1.5 py-1.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none max-w-[90px]">
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </>
                    )}

                    {period === 'quarter' && (
                        <>
                            <select value={fromYear} onChange={e => setFromYear(parseInt(e.target.value))} className="px-1.5 py-1.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none max-w-[90px]">
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select value={fromQuarter} onChange={e => setFromQuarter(parseInt(e.target.value))} className="px-1.5 py-1.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none max-w-[115px]">
                                {quarterOptions.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                            </select>
                            <span className="text-sm text-[var(--text-secondary)] shrink-0">→</span>
                            <select value={toYear} onChange={e => setToYear(parseInt(e.target.value))} className="px-1.5 py-1.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none max-w-[90px]">
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <select value={toQuarter} onChange={e => setToQuarter(parseInt(e.target.value))} className="px-1.5 py-1.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none max-w-[115px]">
                                {quarterOptions.map(q => <option key={q.value} value={q.value}>{q.label}</option>)}
                            </select>
                        </>
                    )}

                    {period === 'year' && (
                        <>
                            <select value={fromYear} onChange={e => setFromYear(parseInt(e.target.value))} className="px-1.5 py-1.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none max-w-[90px]">
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                            <span className="text-sm text-[var(--text-secondary)] shrink-0">→</span>
                            <select value={toYear} onChange={e => setToYear(parseInt(e.target.value))} className="px-1.5 py-1.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none max-w-[90px]">
                                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
                            </select>
                        </>
                    )}
                </div>

                <select value={areaId} onChange={e => { setAreaId(e.target.value); setClassId('') }} className="px-1.5 py-1.5 text-sm rounded-lg border border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] outline-none max-w-[120px] shrink-0">
                    <option value="">Tất cả KV</option>
                    {areaOptions.map(a => <option key={a._id} value={a._id}>{a.name}</option>)}
                </select>
            </div>

            <div className="relative">
                {loading && hasLoadedOnce.current && (
                    <div className="absolute inset-0 bg-[var(--bg-primary)]/60 z-10 flex items-center justify-center rounded-xl">
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--bg-primary)] shadow-md">
                            <svg className="animate-spin h-4 w-4 text-[var(--main_d)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                            <span className="text-sm text-[var(--text-primary)]">Đang tải...</span>
                        </div>
                    </div>
                )}

                {!hasLoadedOnce.current && loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                        <KPISkeleton />
                    </div>
                    ) : !data ? (
                        <div className="flex items-center justify-center py-16"><EmptyState /></div>
                    ) : (
                        <>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                <StatCard label="Tổng học sinh" value={formatNumber(summary?.totalStudents)} 
                                    icon={<Svg_Student w={20} h={20} c={'currentColor'} />} />
                            <StatCard label="Tuổi trung bình" value={formatAge(summary?.avgAge)}
                                icon={<Svg_User w={20} h={20} c={'currentColor'} />} />
                            <StatCard label="Học phí đã nhận" value={formatCurrency(summary?.totalTuition)}
                                icon={<Svg_Tuition w={20} h={20} c={'currentColor'} />} />
                            <StatCard label="Số lớp học" value={formatNumber(summary?.totalClasses)}
                                icon={<Svg_Graduation w={20} h={20} c={'currentColor'} />} />
                            </div>

                            <div className="flex items-center gap-2 mt-4 mb-1">
                                <div className="h-px flex-1 bg-[var(--border-color)]"></div>
                                <span className="text-xs font-medium text-[var(--text-secondary)] shrink-0">Theo bộ lọc</span>
                                <div className="h-px flex-1 bg-[var(--border-color)]"></div>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                                <StatCard label="Học sinh" value={formatNumber(summary?.filteredStudents)}
                                    icon={<Svg_Student w={20} h={20} c={'currentColor'} />} />
                                <StatCard label="Tuổi trung bình" value={formatAge(summary?.filteredAvgAge)}
                                    icon={<Svg_User w={20} h={20} c={'currentColor'} />} />
                                <StatCard label="Học phí" value={formatCurrency(summary?.filteredTuition)}
                                    icon={<Svg_Tuition w={20} h={20} c={'currentColor'} />} />
                                <StatCard label="Số lớp" value={formatNumber(summary?.filteredClasses)}
                                    icon={<Svg_Graduation w={20} h={20} c={'currentColor'} />} />
                            </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mt-6">
                            <ChartCard title="Học sinh theo lớp">
                                {data?.studentsByClass?.length ? (
                                    <div className="h-72">
                                        <Bar data={{
                                            labels: data.studentsByClass.map(s => s.className),
                                            datasets: [{ data: data.studentsByClass.map(s => s.count), backgroundColor: data.studentsByClass.map((_, i) => [PASTEL_BLUE, PASTEL_GREEN, PASTEL_YELLOW, PASTEL_ORANGE][i % 4]), borderRadius: 4 }]
                                        }} options={chartHOpts()} />
                                    </div>
                                ) : <EmptyState />}
                            </ChartCard>
                            <ChartCard title="Học sinh theo trạng thái">
                                {data?.studentsByStatus?.length ? (
                                    <div className="h-72">
                                        <Bar data={{
                                            labels: data.studentsByStatus.map(s => s.status),
                                            datasets: [{ data: data.studentsByStatus.map(s => s.count), backgroundColor: data.studentsByStatus.map(s => s.status === 'Đang học' ? PASTEL_GREEN : s.status === 'Đang chờ xếp lớp' ? PASTEL_YELLOW : PASTEL_RED), borderRadius: 4 }]
                                        }} options={chartHOpts()} />
                                    </div>
                                ) : <EmptyState />}
                            </ChartCard>
                            <ChartCard title="Học phí đã nhận">
                                {data?.monthlyTuition?.length ? (
                                    <div className="h-72">
                                        <Bar data={{
                                            labels: data.monthlyTuition.map(m => m.label),
                                            datasets: [{ data: data.monthlyTuition.map(m => m.total), backgroundColor: PASTEL_BLUE, borderRadius: 4 }]
                                        }} options={chartOpts(true)} />
                                    </div>
                                ) : <EmptyState />}
                            </ChartCard>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 gap-4 mt-6">
                            <ChartCard title="Học sinh mới">
                                {data?.monthlyEnrollments?.length ? (
                                    <div className="h-60">
                                        <Bar data={{
                                            labels: data.monthlyEnrollments.map(m => m.label),
                                            datasets: [{ data: data.monthlyEnrollments.map(m => m.count), backgroundColor: PASTEL_GREEN, borderRadius: 4 }]
                                        }} options={chartOpts()} />
                                    </div>
                                ) : <EmptyState />}
                            </ChartCard>
                            <ChartCard title="Học sinh hoàn thành">
                                {data?.monthlyCompletions?.length ? (
                                    <div className="h-60">
                                        <Bar data={{
                                            labels: data.monthlyCompletions.map(m => m.label),
                                            datasets: [{ data: data.monthlyCompletions.map(m => m.count), backgroundColor: PASTEL_ORANGE, borderRadius: 4 }]
                                        }} options={chartOpts()} />
                                    </div>
                                ) : <EmptyState />}
                            </ChartCard>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}
