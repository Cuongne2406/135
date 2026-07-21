'use client';
import React, { useState, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Menu from '@/components/(ui)/(button)/menu';

const getWeekRange = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = d.getDate() - day + (day === 0 ? -6 : 1);
    const startDate = new Date(d.setDate(diffToMonday));
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    return { startDate, endDate };
};

const getWeekNumber = (d) => {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
};

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function TeacherPage({ teachers, courses }) {
    const [timeGranularity, setTimeGranularity] = useState('month');
    const [chartMetric, setChartMetric] = useState('workload');
    const [selectedDate, setSelectedDate] = useState(new Date());

    const [isGranularityMenuOpen, setIsGranularityMenuOpen] = useState(false);
    const [isMetricMenuOpen, setIsMetricMenuOpen] = useState(false);
    const [isYearMenuOpen, setIsYearMenuOpen] = useState(false);
    const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
    const [isQuarterMenuOpen, setIsQuarterMenuOpen] = useState(false);
    const [isWeekMenuOpen, setIsWeekMenuOpen] = useState(false);

    const { startDate, endDate } = useMemo(() => {
        const d = new Date(selectedDate);
        if (timeGranularity === 'year') {
            const year = d.getFullYear();
            return { startDate: new Date(year, 0, 1), endDate: new Date(year, 11, 31, 23, 59, 59, 999) };
        }
        if (timeGranularity === 'quarter') {
            const year = d.getFullYear();
            const quarter = Math.floor(d.getMonth() / 3);
            const startMonth = quarter * 3;
            return { startDate: new Date(year, startMonth, 1), endDate: new Date(year, startMonth + 3, 0, 23, 59, 59, 999) };
        }
        if (timeGranularity === 'week') return getWeekRange(d);
        const year = d.getFullYear();
        const month = d.getMonth();
        return { startDate: new Date(year, month, 1), endDate: new Date(year, month + 1, 0, 23, 59, 59, 999) };
    }, [timeGranularity, selectedDate]);

    const teacherStats = useMemo(() => {
        const stats = new Map();
        const now = new Date();
        teachers.forEach(teacher => {
            stats.set(teacher._id, { name: teacher.name, teachingSessions: 0, taSessions: 0, homeroomCount: 0, violations: { attendance: 0, comment: 0, evidence: 0 } });
        });

        courses.forEach(course => {
            if (course.TeacherHR?._id && stats.has(course.TeacherHR._id)) {
                stats.get(course.TeacherHR._id).homeroomCount++;
            }
            const studentLearnMap = new Map();
            course.Student.forEach(student => {
                student.Learn.forEach(learnRecord => studentLearnMap.set(learnRecord.Lesson, learnRecord));
            });
            course.Detail.forEach(lesson => {
                const lessonDate = new Date(lesson.Day);
                if (lessonDate < startDate || lessonDate > endDate) return;
                const teacherId = lesson.Teacher?._id;
                const taId = lesson.TeachingAs?._id;
                if (teacherId && stats.has(teacherId) && lessonDate <= now) stats.get(teacherId).teachingSessions++;
                if (taId && stats.has(taId)) stats.get(taId).taSessions++;
                if (lessonDate < now && teacherId && stats.has(teacherId)) {
                    let attendanceViolated = false, commentViolated = false, evidenceViolated = false;
                    course.Student.forEach(student => {
                        const learnRecord = studentLearnMap.get(lesson._id);
                        if (!learnRecord) return;
                        if (learnRecord.Checkin === 0) attendanceViolated = true;
                        if (learnRecord.Checkin === 1) {
                            if (learnRecord.Cmt.length === 0) commentViolated = true;
                            if (learnRecord.Image.length === 0) evidenceViolated = true;
                        }
                    });
                    const teacherStat = stats.get(teacherId);
                    if (attendanceViolated) teacherStat.violations.attendance++;
                    if (commentViolated) teacherStat.violations.comment++;
                    if (evidenceViolated) teacherStat.violations.evidence++;
                }
            });
        });

        return Array.from(stats.values()).map(s => ({ ...s, totalWorkload: s.teachingSessions + s.taSessions, totalViolations: s.violations.attendance + s.violations.comment + s.violations.evidence }));
    }, [teachers, courses, startDate, endDate]);

    const topWorkload = [...teacherStats].sort((a, b) => b.totalWorkload - a.totalWorkload).slice(0, 5);
    const topViolations = [...teacherStats].sort((a, b) => b.totalViolations - a.totalViolations).filter(t => t.totalViolations > 0).slice(0, 5);
    const overallStats = { totalTeachers: teachers.length, totalSessions: teacherStats.reduce((sum, t) => sum + t.totalWorkload, 0), totalViolations: teacherStats.reduce((sum, t) => sum + t.totalViolations, 0) };

    const chartData = useMemo(() => {
        const sortedTeachers = [...teacherStats].sort((a, b) => b[chartMetric === 'workload' ? 'totalWorkload' : 'totalViolations'] - a[chartMetric === 'workload' ? 'totalWorkload' : 'totalViolations']);
        const labels = sortedTeachers.map(t => t.name);
        return chartMetric === 'workload'
            ? { labels, datasets: [{ label: 'Buổi dạy', data: sortedTeachers.map(t => t.teachingSessions), backgroundColor: '#36a2eb' }, { label: 'Buổi trợ giảng', data: sortedTeachers.map(t => t.taSessions), backgroundColor: '#ff9f40' }] }
            : { labels, datasets: [{ label: 'Lỗi điểm danh', data: sortedTeachers.map(t => t.violations.attendance), backgroundColor: '#ff6384' }, { label: 'Lỗi nhận xét', data: sortedTeachers.map(t => t.violations.comment), backgroundColor: '#ffcd56' }, { label: 'Lỗi minh chứng', data: sortedTeachers.map(t => t.violations.evidence), backgroundColor: '#4bc0c0' }] };
    }, [teacherStats, chartMetric]);

    const chartOptions = { indexAxis: 'y', responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true, beginAtZero: true }, y: { stacked: true } }, plugins: { legend: { position: 'top' }, title: { display: false } } };

    const renderTimePeriodSelector = () => {
        const currentYear = new Date().getFullYear();
        const year = selectedDate.getFullYear();
        const month = selectedDate.getMonth();
        const quarter = Math.floor(month / 3);
        const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i);

        switch (timeGranularity) {
            case 'week':
                const weekDetails = getWeekRange(selectedDate);
                const weekButtonText = `Tuần ${getWeekNumber(selectedDate)} (${weekDetails.startDate.toLocaleDateString('vi-VN')} - ${weekDetails.endDate.toLocaleDateString('vi-VN')})`;
                return (
                    <div className="flex-[2] flex gap-2">
                        <Menu isOpen={isWeekMenuOpen} onOpenChange={setIsWeekMenuOpen} customButton={<div className='input text-sm font-normal text-[var(--text-primary)]'>{weekButtonText}</div>} menuItems={<div className="p-2">
                            <input type="date" className="border border-gray-300 rounded-md p-2 text-sm w-full" value={selectedDate.toISOString().split('T')[0]} onChange={e => { setSelectedDate(new Date(e.target.value)); setIsWeekMenuOpen(false); }} />
                        </div>} />
                    </div>
                );
            case 'month':
                return (
                    <div className="flex-[2] flex gap-2">
                        <Menu isOpen={isMonthMenuOpen} onOpenChange={setIsMonthMenuOpen} customButton={<div className='input text-sm font-normal text-[var(--text-primary)]'>{`Tháng ${month + 1}`}</div>} menuItems={<div className="p-2 mt-1 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col">{Array.from({ length: 12 }, (_, i) => i).map(m => <p key={m} className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { setSelectedDate(new Date(year, m, 1)); setIsMonthMenuOpen(false); }}>{`Tháng ${m + 1}`}</p>)}</div>} />
                        <Menu isOpen={isYearMenuOpen} onOpenChange={setIsYearMenuOpen} customButton={<div className='input text-sm font-normal text-[var(--text-primary)]'>{`Năm ${year}`}</div>} menuItems={<div className="p-2 mt-1 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col">{yearOptions.map(y => <p key={y} className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { setSelectedDate(new Date(y, month, 1)); setIsYearMenuOpen(false); }}>{`Năm ${y}`}</p>)}</div>} />
                    </div>
                );
            case 'quarter':
                return (
                    <div className="flex-[2] flex gap-2">
                        <Menu isOpen={isQuarterMenuOpen} onOpenChange={setIsQuarterMenuOpen} customButton={<div className='input text-sm font-normal text-[var(--text-primary)]'>{`Quý ${quarter + 1}`}</div>} menuItems={<div className="p-2 mt-1 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col">{[0, 1, 2, 3].map(q => <p key={q} className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { setSelectedDate(new Date(year, q * 3, 1)); setIsQuarterMenuOpen(false); }}>{`Quý ${q + 1}`}</p>)}</div>} />
                        <Menu isOpen={isYearMenuOpen} onOpenChange={setIsYearMenuOpen} customButton={<div className='input text-sm font-normal text-[var(--text-primary)]'>{`Năm ${year}`}</div>} menuItems={<div className="p-2 mt-1 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col">{yearOptions.map(y => <p key={y} className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { setSelectedDate(new Date(y, quarter * 3, 1)); setIsYearMenuOpen(false); }}>{`Năm ${y}`}</p>)}</div>} />
                    </div>
                );
            case 'year':
                return (
                    <div className="flex-[2] flex gap-2">
                        <Menu isOpen={isYearMenuOpen} onOpenChange={setIsYearMenuOpen} customButton={<div className='input text-sm font-normal text-[var(--text-primary)]'>{`Năm ${year}`}</div>} menuItems={<div className="p-2 mt-1 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col">{yearOptions.map(y => <p key={y} className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { setSelectedDate(new Date(y, 0, 1)); setIsYearMenuOpen(false); }}>{`Năm ${y}`}</p>)}</div>} />
                    </div>
                );
            default: return null;
        }
    };

    const granularityText = { week: 'Xem theo tuần', month: 'Xem theo tháng', quarter: 'Xem theo quý', year: 'Xem theo năm' };
    const metricText = { workload: 'Xem lượng dạy', violations: 'Xem lỗi vi phạm' };

    return (
        <div className="flex gap-2">
            <div className="w-[350px] shrink-0 flex flex-col gap-2">
                <p className='text-base font-semibold text-[var(--text-primary)]' style={{ marginBottom: 5 }}>Thống kê giáo viên, trợ giảng</p>
                <div className="flex justify-end gap-2 items-stretch">
                    <div className="flex-1 flex">
                        <Menu isOpen={isGranularityMenuOpen} onOpenChange={setIsGranularityMenuOpen} customButton={<div className='input text-sm font-normal text-[var(--text-primary)]'>{granularityText[timeGranularity]}</div>} menuItems={<div className="p-2 mt-1 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col">
                            <p className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { setTimeGranularity('week'); setIsGranularityMenuOpen(false); }}>Xem theo tuần</p>
                            <p className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { setTimeGranularity('month'); setIsGranularityMenuOpen(false); }}>Xem theo tháng</p>
                            <p className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { setTimeGranularity('quarter'); setIsGranularityMenuOpen(false); }}>Xem theo quý</p>
                            <p className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { setTimeGranularity('year'); setIsGranularityMenuOpen(false); }}>Xem theo năm</p>
                        </div>} />
                    </div>
                    <div className="flex-1 flex">
                        <Menu isOpen={isMetricMenuOpen} onOpenChange={setIsMetricMenuOpen} customButton={<div className='input text-sm font-normal text-[var(--text-primary)]'>{metricText[chartMetric]}</div>} menuItems={<div className="p-2 mt-1 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col">
                            <p className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { setChartMetric('workload'); setIsMetricMenuOpen(false); }}>Xem lượng dạy</p>
                            <p className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { setChartMetric('violations'); setIsMetricMenuOpen(false); }}>Xem lỗi vi phạm</p>
                        </div>} />
                    </div>

                </div>
                <div>
                    {renderTimePeriodSelector()}
                </div>
                <div className="grid grid-cols-3 gap-3">
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-gray-200 text-center gap-1"><span>Tổng số GV</span><strong>{overallStats.totalTeachers}</strong></div>
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-gray-200 text-center gap-1"><span>Tổng buổi dạy</span><strong>{overallStats.totalSessions}</strong></div>
                    <div className="flex flex-col items-center justify-center p-3 bg-white rounded-lg border border-gray-200 text-center gap-1"><span>Tổng vi phạm</span><strong>{overallStats.totalViolations}</strong></div>
                </div>
                <div className="flex flex-col gap-2.5 bg-white p-3 rounded-lg border border-gray-200">
                    <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ paddingBottom: 8, marginBottom: 3, borderBottom: 'thin dashed var(--border-color)' }}>Khối lượng công việc cao nhất</p>
                    {topWorkload.map((t, i) =>
                        <div key={i} className="flex justify-between items-center text-sm">
                            <span>{t.name}</span>
                            <strong>{t.totalWorkload} buổi</strong>
                        </div>
                    )}
                </div>
                <div className="flex flex-col gap-2.5 bg-white p-3 rounded-lg border border-gray-200">
                    <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ paddingBottom: 8, marginBottom: 3, borderBottom: 'thin dashed var(--border-color)' }}>Cần lưu ý</p>
                    {topViolations.length > 0 ? topViolations.map((t, i) => <div key={i} className="flex justify-between items-center text-sm"><span>{t.name}</span><strong className="text-red-500">{t.totalViolations} lỗi</strong></div>) : <p className="text-sm text-gray-400 text-center py-2.5">Không có vi phạm</p>}</div>
            </div>
            <div className="flex-1 flex flex-col bg-[var(--bg-primary)] p-4 rounded border border-[var(--border-color)]">
                <Bar data={chartData} options={chartOptions} />
            </div>
        </div>
    );
}
