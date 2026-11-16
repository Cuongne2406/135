'use client';

import { useState, useMemo } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend);


const StatusCharts = ({ summaryData, violationTypesData }) => {
    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: 'top',
                labels: {
                    font: {
                        family: "'Inter', sans-serif",
                    }
                }
            },
            title: {
                display: true,
                font: {
                    size: 16,
                    family: "'Inter', sans-serif",
                },
                padding: {
                    top: 10,
                    bottom: 10
                }
            },
            tooltip: {
                titleFont: { family: "'Inter', sans-serif" },
                bodyFont: { family: "'Inter', sans-serif" }
            }
        },
    };

    const summaryChartData = {
        labels: [''], // Bỏ label trục X để gọn hơn
        datasets: [
            {
                label: 'Hoàn thành',
                data: [summaryData.completed],
                backgroundColor: 'rgba(75, 192, 192, 0.6)',
                borderColor: 'rgba(75, 192, 192, 1)',
                borderWidth: 1,
            },
            {
                label: 'Vi phạm',
                data: [summaryData.violations],
                backgroundColor: 'rgba(255, 99, 132, 0.6)',
                borderColor: 'rgba(255, 99, 132, 1)',
                borderWidth: 1,
            },
        ],
    };

    const violationTypesChartData = {
        labels: ['Điểm Danh', 'Nhận Xét', 'Hình Ảnh'],
        datasets: [
            {
                label: 'Số lỗi vi phạm',
                data: [
                    violationTypesData.attendance,
                    violationTypesData.comment,
                    violationTypesData.image,
                ],
                backgroundColor: [
                    'rgba(255, 159, 64, 0.7)',
                    'rgba(153, 102, 255, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                ],
                borderColor: [
                    'rgba(255, 159, 64, 1)',
                    'rgba(153, 102, 255, 1)',
                    'rgba(54, 162, 235, 1)',
                ],
                borderWidth: 1,
                hoverOffset: 8,
            },
        ],
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: 520 }}>
            <div style={{ position: 'relative', height: 200 }}>
                <Bar
                    options={{
                        ...chartOptions,
                        scales: { y: { beginAtZero: true } },
                        plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: `Tổng quan: ${summaryData.total} buổi học` } }
                    }}
                    data={summaryChartData}
                />
            </div>
            <div style={{ position: 'relative', height: 300, width: '100%' }}>
                <Doughnut
                    options={{
                        ...chartOptions,
                        plugins: { ...chartOptions.plugins, title: { ...chartOptions.plugins.title, text: 'Phân loại vi phạm phổ biến' } }
                    }}
                    data={violationTypesChartData}
                />
            </div>
        </div>
    );
};


// ====================================================================
// CÁC THÀNH PHẦN ICON (Icon Components)
// ====================================================================
const ChevronIcon = ({ expanded, size = 20 }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={`${'text-[var(--text-primary)] transition-transform duration-200'} ${expanded ? 'rotate-180' : ''}`}>
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const CheckCircleIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={'border-l-4 border-[var(--green)]'}>
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>
    </svg>
);

// ====================================================================
// HÀM TIỆN ÍCH (Utility Function)
// ====================================================================
const getCurrentMonthDateRange = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const toYyyyMmDd = (date) => date.toISOString().split('T')[0];
    return { start: toYyyyMmDd(firstDay), end: toYyyyMmDd(lastDay) };
};


// ====================================================================
// THÀNH PHẦN CHÍNH (Main Component)
// ====================================================================
const EnhancedViolationsReport = ({ initialReports }) => {
    const router = useRouter();
    const [visibleTeacher, setVisibleTeacher] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [startDate, setStartDate] = useState(getCurrentMonthDateRange().start);
    const [endDate, setEndDate] = useState(getCurrentMonthDateRange().end);
    const [showMode, setShowMode] = useState('violations');
    const [isSummaryExpanded, setIsSummaryExpanded] = useState(false);

    const toggleDetails = (teacherId) => {
        setVisibleTeacher(visibleTeacher === teacherId ? null : teacherId);
    };

    // Tối ưu hóa tính toán dữ liệu
    const lessonsInDateRange = useMemo(() => {
        return (Array.isArray(initialReports) ? initialReports : [])
            .flatMap(report => report?.allLessons || [])
            .filter(lesson => {
                if (typeof lesson !== 'object' || !lesson?.lessonId) return false;
                const lessonDate = new Date(lesson.day);
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                if (end) end.setHours(23, 59, 59, 999);
                return (!start || lessonDate >= start) && (!end || lessonDate <= end);
            });
    }, [initialReports, startDate, endDate]);

    const reportSummary = useMemo(() => {
        const violations = lessonsInDateRange.filter(l => l.isViolation).length;
        return {
            total: lessonsInDateRange.length,
            violations: violations,
            completed: lessonsInDateRange.length - violations,
        };
    }, [lessonsInDateRange]);

    const violationTypesSummary = useMemo(() => {
        const violationCounts = {
            attendance: 0,
            comment: 0,
            image: 0,
        };

        lessonsInDateRange.forEach(lesson => {
            if (lesson.isViolation && lesson.errors) {
                if (lesson.errors.attendance) violationCounts.attendance++;
                if (lesson.errors.comment) violationCounts.comment++;
                if (lesson.errors.image) violationCounts.image++;
            }
        });

        return violationCounts;
    }, [lessonsInDateRange]);


    const filteredReports = useMemo(() => {
        let reports = Array.isArray(initialReports) ? initialReports.filter(r => typeof r === 'object' && r?.teacherInfo) : [];

        if (searchTerm) {
            reports = reports.filter(r => r.teacherInfo.name.toLowerCase().includes(searchTerm.toLowerCase()));
        }

        const reportsWithFilteredLessons = reports.map(report => {
            const lessons = Array.isArray(report.allLessons) ? report.allLessons.filter(l => typeof l === 'object' && l?.lessonId) : [];

            const lessonsInScope = lessons.filter(lesson => {
                const lessonDate = new Date(lesson.day);
                const start = startDate ? new Date(startDate) : null;
                const end = endDate ? new Date(endDate) : null;
                if (end) end.setHours(23, 59, 59, 999);
                return (!start || lessonDate >= start) && (!end || lessonDate <= end);
            });

            const lessonsToDisplay = showMode === 'violations'
                ? lessonsInScope.filter(l => l.isViolation)
                : lessonsInScope;

            return {
                ...report,
                lessonsToDisplay: lessonsToDisplay,
                violationsInScope: lessonsInScope.filter(l => l.isViolation).length,
                totalInScope: lessonsInScope.length,
            };
        }).filter(report => report.lessonsToDisplay.length > 0);

        reportsWithFilteredLessons.sort((a, b) => b.violationsInScope - a.violationsInScope || b.totalInScope - a.totalInScope);

        return reportsWithFilteredLessons;
    }, [initialReports, searchTerm, startDate, endDate, showMode]);

    const handleResetFilters = () => {
        const currentMonth = getCurrentMonthDateRange();
        setSearchTerm('');
        setStartDate(currentMonth.start);
        setEndDate(currentMonth.end);
        setShowMode('violations');
        router.refresh();
    };

    return (
        <div className={'mt-4 flex-1 overflow-hidden flex flex-col'}>
            <div className={'flex flex-wrap justify-between gap-4 items-center p-2 bg-[var(--bg-primary)] rounded-md mb-4 border border-[var(--border-color)]'}>
                <div className={'flex gap-4'}>
                    <div className={'flex bg-[#e9ecef] rounded-md p-1'}>
                        <button onClick={() => setShowMode('violations')} className={`${'p-[0.4rem_0.8rem] border-none bg-transparent cursor-pointer text-sm text-[var(--text-primary)] font-medium rounded transition-all duration-200'} ${showMode === 'violations' ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : ''}`}>Chỉ vi phạm</button>
                        <button onClick={() => setShowMode('all')} className={`${'p-[0.4rem_0.8rem] border-none bg-transparent cursor-pointer text-sm text-[var(--text-primary)] font-medium rounded transition-all duration-200'} ${showMode === 'all' ? 'bg-[var(--bg-primary)] text-[var(--text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : ''}`}>Tất cả</button>
                    </div>
                    <input type="text" placeholder="Tìm tên giáo viên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className={`px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none ${'w-[180px]'}`} />
                    <div className={'flex items-center gap-1'}>
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className={`px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none ${'w-[135px]'}`} title="Từ ngày" />
                        <span className={'text-[var(--text-primary)]'}>–</span>
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className={`px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none ${'w-[135px]'}`} title="Đến ngày" />
                    </div>
                </div>
                <div className={'flex gap-4'}>
                    <button onClick={handleResetFilters} className={'p-[0.5rem_1rem] bg-[#6c757d] text-white border-none rounded-md cursor-pointer hover:bg-[#5a6268] transition-colors duration-200'}>Làm mới</button>
                </div>
            </div>

            <div style={{ display: 'flex', gap: 16, flex: 1, overflow: 'hidden' }}>
                {/* Khu vực biểu đồ */}
                <div className={'flex-1 overflow-hidden p-2 bg-white rounded-lg border border-[#e5e7eb] max-h-[calc(100vh-180px)]'}>
                    <StatusCharts
                        summaryData={reportSummary}
                        violationTypesData={violationTypesSummary}
                    />
                </div>

                {/* Khu vực danh sách */}
                <div style={{ flex: 2, overflow: 'hidden', overflowY: 'auto' }}>
                    <div className={'flex flex-col mx-auto gap-2 flex-[2]'}>
                        <p className='text-base font-semibold text-[var(--text-primary)]'>Danh sách giáo viên giảng dạy</p>
                        {filteredReports.length > 0 ? (
                            filteredReports.map(report => (
                                <div key={report.teacherInfo._id} className={'bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md overflow-hidden'}>
                                    <div className={'flex justify-between items-center p-[0.75rem_1.25rem] cursor-pointer transition-colors duration-200 hover:bg-[var(--bg-secondary)]'} onClick={() => toggleDetails(report.teacherInfo._id)}>
                                        <p className={'font-medium text-[var(--text-primary)] m-0'}>{report.teacherInfo.name}</p>
                                        <div className={'flex items-center gap-3'}>
                                            <span className={'text-sm text-[var(--text-primary)] bg-[#f0f0f0] p-[0.25rem_0.75rem] rounded-full'}>
                                                <span className={'font-bold text-[var(--main_d)]'}>{report.violationsInScope}</span> / {report.totalInScope} buổi
                                            </span>
                                            <ChevronIcon expanded={visibleTeacher === report.teacherInfo._id} />
                                        </div>
                                    </div>

                                    {visibleTeacher === report.teacherInfo._id && (
                                        <div className={'p-[0.25rem_0] border-t border-[#f0f0f0] bg-[#fafbfd]'}>
                                            {report.lessonsToDisplay.map(lesson => (
                                                <Link href={`/course/${lesson.courseId}/${lesson.lessonId}`} key={lesson.lessonId} className={`${'flex flex-wrap justify-between items-center gap-[0.5rem_1rem] p-[0.75rem_1.25rem] border-b border-[#f0f0f0] cursor-pointer transition-colors duration-200 hover:bg-[var(--bg-secondary)]'} ${lesson.isViolation ? 'border-l-4 border-[var(--main_d)]' : 'border-l-4 border-[var(--green)]'}`}>
                                                    <div className={'flex items-center gap-4 text-sm text-[var(--text-primary)]'}>
                                                        <span className={'font-medium text-[var(--text-primary)]'}>{lesson.courseId}</span>
                                                        <span className='text-sm text-gray-600'>{new Date(lesson.day).toLocaleDateString('vi-VN')}</span>
                                                        <span className={'italic'}>{lesson.room && !/^[0-9a-fA-F]{24}$/.test(lesson.room) ? lesson.room : 'N/A'}</span>
                                                    </div>
                                                    {lesson.isViolation ? (
                                                        <div className={'flex gap-2'}>
                                                            {lesson.errors.attendance && <span className={`${'p-[0.2rem_0.6rem] rounded-full text-xs font-medium text-white'} ${'bg-[rgba(255,159,64,0.7)] border border-[rgba(255,159,64,1)]'}`}>Thiếu Điểm Danh</span>}
                                                            {lesson.errors.comment && <span className={`${'p-[0.2rem_0.6rem] rounded-full text-xs font-medium text-white'} ${'bg-[#b794ff] border border-[rgba(153,102,255,1)]'}`}>Thiếu Nhận Xét</span>}
                                                            {lesson.errors.image && <span className={`${'p-[0.2rem_0.6rem] rounded-full text-xs font-medium text-white'} ${'bg-[#42A5F5] border border-[rgba(54,162,235,1)]'}`}>Thiếu Hình Ảnh</span>}
                                                        </div>
                                                    ) : (
                                                        <div className={'flex items-center gap-1 text-xs font-medium text-[var(--green)]'}>
                                                            <CheckCircleIcon />
                                                            <span>Hoàn thành</span>
                                                        </div>
                                                    )}
                                                </Link>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))
                        ) : (
                            <p className={'text-center p-8 text-[var(--text-primary)] bg-[var(--bg-primary)] rounded-lg'}>Không có dữ liệu nào phù hợp với bộ lọc.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EnhancedViolationsReport;