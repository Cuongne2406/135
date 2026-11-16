'use client';
import React, { useState, useMemo } from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import Menu from '@/components/(ui)/(button)/menu';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

function getDateIndex(date) {
    const month = date.getMonth();
    const dayOfMonth = date.getDate();
    let weekOfMonth;
    if (dayOfMonth <= 7) weekOfMonth = 0;
    else if (dayOfMonth <= 14) weekOfMonth = 1;
    else if (dayOfMonth <= 21) weekOfMonth = 2;
    else weekOfMonth = 3;
    return month * 4 + weekOfMonth;
}

function getEndOfPeriod(year, index) {
    const month = Math.floor(index / 4);
    const weekInMonth = index % 4;
    if (weekInMonth < 3) return new Date(year, month, (weekInMonth + 1) * 7, 23, 59, 59);
    return new Date(year, month + 1, 0, 23, 59, 59);
}

export default function StudentDB({ data }) {
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [viewMode, setViewMode] = useState('cumulative');
    const [selectedArea, setSelectedArea] = useState('all'); // State mới cho khu vực

    const [isMenustatus, setIsMenustatus] = useState(false);
    const [isMenuyear, setIsMenuyear] = useState(false);
    const [isMenuarea, setIsMenuarea] = useState(false); // State cho menu khu vực

    const availableAreas = useMemo(() => {
        const areas = new Map();
        data.forEach(student => {
            if (student.Area?._id && student.Area?.name) {
                areas.set(student.Area._id, student.Area.name);
            }
        });
        return Array.from(areas, ([_id, name]) => ({ _id, name }));
    }, [data]);

    const filteredData = useMemo(() => {
        if (selectedArea === 'all') return data;
        return data.filter(student => student.Area?._id === selectedArea);
    }, [data, selectedArea]);

    const chartData = useMemo(() => {
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentIndex = getDateIndex(now);
        const labels = Array.from({ length: 48 }, (_, i) => `T${(i % 4) + 1}`);
        const studyingData = Array(48).fill(0);
        const waitingData = Array(48).fill(0);
        const leftData = Array(48).fill(0);

        const processedData = filteredData.map(student => ({
            ...student,
            Status: student.Status?.map(s => ({ ...s, date: new Date(s.date) })).sort((a, b) => a.date - b.date) || []
        }));

        if (viewMode === 'cumulative') {
            const getStudentStateAt = (student, targetDate) => {
                let activeStatus = null;
                for (const status of student.Status) {
                    if (status.date <= targetDate) activeStatus = status;
                    else break;
                }
                return activeStatus;
            };

            for (let i = 0; i < 48; i++) {
                if (selectedYear === currentYear && i > currentIndex) continue;
                const endOfPeriod = getEndOfPeriod(selectedYear, i);
                let totals = { studying: 0, waiting: 0, left: 0 };
                processedData.forEach(student => {
                    const latestStatus = getStudentStateAt(student, endOfPeriod);
                    if (latestStatus) {
                        if (latestStatus.status === 2) totals.studying++;
                        else if (latestStatus.status === 1) totals.waiting++;
                        else if (latestStatus.status === 0) totals.left++;
                    }
                });
                studyingData[i] = totals.studying;
                waitingData[i] = totals.waiting;
                leftData[i] = totals.left;
            }
        } else {
            filteredData.forEach(student => {
                if (student.Status?.length) {
                    const latestStatus = student.Status[student.Status.length - 1];
                    if (latestStatus?.date) {
                        const statusDate = new Date(latestStatus.date);
                        if (statusDate.getFullYear() === selectedYear) {
                            const index = getDateIndex(statusDate);
                            if (latestStatus.status === 2) studyingData[index]++;
                            else if (latestStatus.status === 1) waitingData[index]++;
                            else if (latestStatus.status === 0) leftData[index]++;
                        }
                    }
                }
            });
        }

        return {
            labels,
            datasets: [
                { label: 'Đang học', data: studyingData, backgroundColor: '#a4ffbb', borderSkipped: false },
                { label: 'Đang chờ', data: waitingData, backgroundColor: '#ffe39e', borderSkipped: false },
                { label: 'Đã nghỉ', data: leftData, backgroundColor: '#ffb9b9', borderRadius: { topLeft: 6, topRight: 6 }, borderSkipped: false }
            ]
        };
    }, [filteredData, selectedYear, viewMode]);

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            title: { display: false },
        },
        scales: {
            x: { stacked: true, grid: { display: true, drawOnChartArea: true, color: context => (context.index % 4 === 0 ? 'rgba(0, 0, 0, 0.08)' : 'rgba(0, 0, 0, 0)') }, ticks: { autoSkip: false, maxRotation: 0, minRotation: 0, callback: (v, i) => (i % 4 === 1 ? 'Tháng ' + (Math.floor(i / 4) + 1) : '') } },
            y: { stacked: true, beginAtZero: true, ticks: { precision: 0 }, grid: { color: 'rgba(0, 0, 0, 0.05)' } }
        },
        barPercentage: 0.95,
        categoryPercentage: 1,
    };

    const years = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - 5 + i);
    const selectedAreaName = selectedArea === 'all' ? 'Tất cả khu vực' : availableAreas.find(a => a._id === selectedArea)?.name;

    return (
        <div className="rounded-xl">

            <div className="flex gap-2">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: 350 }}>
                    <p className='text-base font-semibold text-[var(--text-primary)]' style={{ marginBottom: 5 }}>Thống kê học sinh</p>
                    <div className="flex items-center w-full border border-[var(--border-color)] rounded" style={{ width: 'calc(100% - 32px)', padding: '10px 16px', display: 'flex', justifyContent: 'space-between' }} >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 16, background: 'var(--green)' }}></div>
                            <p className='text-sm font-normal text-neutral-500'>Đang học</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 16, background: 'var(--yellow)' }}></div>
                            <p className='text-sm font-normal text-neutral-500'>Đang chờ</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 16, background: 'var(--red)' }}></div>
                            <p className='text-sm font-normal text-neutral-500'>Đã nghỉ</p>
                        </div>
                    </div>
                    <div className="flex items-center justify-around border border-[var(--border-color)] rounded bg-[var(--bg-primary)]">
                        <div style={{ flex: 1, borderRight: '1px solid var(--border-color)' }}>
                            <Menu isOpen={isMenustatus} onOpenChange={setIsMenustatus} customButton={<div className='px-3 py-2.5 rounded bg-white text-sm outline-none text-neutral-500 resize-none' style={{ cursor: 'pointer', border: 'none', background: 'none', textAlign: 'center' }}>{viewMode === 'cumulative' ? 'Xem tích lũy' : 'Xem thay đổi'}</div>} menuItems={<div className="p-2 mt-1 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col">
                                <p className='text-sm font-normal text-neutral-500' onClick={() => { setViewMode('cumulative'); setIsMenustatus(false) }}>Xem tích lũy</p>
                                <p className='text-sm font-normal text-neutral-500' onClick={() => { setViewMode('changes'); setIsMenustatus(false) }}>Xem thay đổi</p>
                            </div>} menuPosition="bottom" />
                        </div>
                        <div style={{ flex: 1, borderRight: '1px solid var(--border-color)' }}>
                            <Menu isOpen={isMenuarea} onOpenChange={setIsMenuarea} customButton={<div className='px-3 py-2.5 rounded bg-white text-sm outline-none text-neutral-500 resize-none' style={{ cursor: 'pointer', border: 'none', background: 'none', textAlign: 'center' }}>{selectedAreaName}</div>} menuItems={<div className="p-2 mt-1 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col">
                                <p className='text-sm font-normal text-neutral-500' onClick={() => { setSelectedArea('all'); setIsMenuarea(false) }}>Tất cả khu vực</p>
                                {availableAreas.map(area => <p key={area._id} className='text-sm font-normal text-neutral-500' onClick={() => { setSelectedArea(area._id); setIsMenuarea(false) }}>{area.name}</p>)}
                            </div>} menuPosition="bottom" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <Menu isOpen={isMenuyear} onOpenChange={setIsMenuyear} customButton={<div className='px-3 py-2.5 rounded bg-white text-sm outline-none text-neutral-500 resize-none' style={{ cursor: 'pointer', border: 'none', background: 'none', textAlign: 'center' }}>Năm {selectedYear}</div>} menuItems={<div className="p-2 mt-1 rounded bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col">
                                {years.map(year => <p key={year} className='text-sm font-normal text-neutral-500' onClick={() => { setSelectedYear(year); setIsMenuyear(false) }}>Năm {year}</p>)}
                            </div>} menuPosition="bottom" />
                        </div>
                    </div>
                    <div className="w-[calc(100%-33px)] bg-white border border-[var(--border-color)] rounded p-4 flex flex-col gap-0.5 self-start">
                        <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ paddingBottom: 8, marginBottom: 3, borderBottom: 'thin dashed var(--border-color)' }}>Thông số học sinh hiện tại</p>
                        <div className="flex justify-between items-center text-sm text-[#475569] p-2 rounded" style={{ background: '#b8ecff' }}><span>Tổng số: </span><span className='text-sm font-semibold text-[var(--text-primary)]'>{filteredData.length}</span></div>
                        <div className="flex justify-between items-center text-sm text-[#475569] p-2 rounded" style={{ background: '#a4ffbb' }}><span>Đang học: </span><span className={`text-sm font-semibold text-[var(--text-primary)] text-[#3b82f6]`}>{filteredData.filter(s => s.Status?.length && s.Status[s.Status.length - 1].status === 2).length}</span></div>
                        <div className="flex justify-between items-center text-sm text-[#475569] p-2 rounded" style={{ background: '#ffe39e' }}><span>Đang chờ: </span><span className={`text-sm font-semibold text-[var(--text-primary)] text-[#f97316]`}>{filteredData.filter(s => s.Status?.length && s.Status[s.Status.length - 1].status === 1).length}</span></div>
                        <div className="flex justify-between items-center text-sm text-[#475569] p-2 rounded" style={{ background: '#ffb9b9' }}><span>Đã nghỉ: </span><span className={`text-sm font-semibold text-[var(--text-primary)] text-[#a8a29e]`}>{filteredData.filter(s => s.Status?.length && s.Status[s.Status.length - 1].status === 0).length}</span></div>
                    </div>
                </div>
                <div className="flex-1 flex flex-col gap-4 min-w-0">
                    <div className="relative h-full bg-white p-4 rounded border border-[var(--border-color)]"><Bar options={options} data={chartData} /></div>
                </div>
            </div >
        </div >
    );
}