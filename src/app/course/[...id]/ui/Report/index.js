'use client';

import React, { useState, useCallback, useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, } from 'chart.js';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import Noti from '@/components/(features)/(noti)/noti';
import { Svg_Chart } from '@/components/(icon)/svg';
// --- Đăng ký Chart.js ---
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

// --- Hằng số ---
const ATTENDANCE_STATUS = {
    PRESENT: 1,
    ABSENT_NO_PERMISSION: 2,
    ABSENT_WITH_PERMISSION: 3,
};

// --- Custom Hook: Tách toàn bộ logic tính toán ra khỏi component ---
const useCourseAnalytics = (course) => {
    return useMemo(() => {
        if (!course || !course.Detail || !course.Student) {
            return { attendanceData: { labels: [], datasets: [] }, makeupLessonsNeeded: [], canCompleteCourse: false };
        }

        // Tối ưu: Tạo một map để tra cứu trạng thái điểm danh của học sinh nhanh hơn
        const studentLearnMap = new Map(
            course.Student.map(student => [
                student.ID,
                new Map(student.Learn.map(learnItem => [learnItem.Lesson, learnItem.Checkin]))
            ])
        );

        // 1. Tính toán dữ liệu điểm danh cho biểu đồ
        const labels = course.Detail.map((lesson, index) => `Chủ đề ${index + 1}`);
        const attendanceCounts = course.Detail.map(lesson => {
            const counts = { present: 0, permitted: 0, unpermitted: 0 };
            course.Student.forEach(student => {
                const checkinStatus = studentLearnMap.get(student.ID)?.get(lesson._id);
                switch (checkinStatus) {
                    case ATTENDANCE_STATUS.PRESENT:
                        counts.present++;
                        break;
                    case ATTENDANCE_STATUS.ABSENT_WITH_PERMISSION:
                        counts.permitted++;
                        break;
                    case ATTENDANCE_STATUS.ABSENT_NO_PERMISSION:
                        counts.unpermitted++;
                        break;
                    default:
                        break;
                }
            });
            return counts;
        });

        const totalStudents = course.Student.length;
        const attendanceData = {
            labels,
            datasets: [
                { label: 'Có mặt', data: attendanceCounts.map(c => c.present), backgroundColor: 'rgba(75, 192, 192, 0.7)' },
                { label: 'Vắng có phép', data: attendanceCounts.map(c => c.permitted), backgroundColor: 'rgba(255, 206, 86, 0.7)' },
                { label: 'Vắng không phép', data: attendanceCounts.map(c => c.unpermitted), backgroundColor: 'rgba(255, 99, 132, 0.7)' },
                { label: 'Chưa điểm danh', data: attendanceCounts.map(c => totalStudents - c.present - c.permitted - c.unpermitted), backgroundColor: 'rgba(201, 203, 207, 0.7)' },
            ],
        };

        // 2. Phân tích các buổi cần bù
        const lessonsByTopic = course.Detail.reduce((acc, lesson) => {
            if (!acc[lesson.Topic]) {
                acc[lesson.Topic] = { topicName: lesson.LessonDetails?.Name, sessions: [] };
            }
            acc[lesson.Topic].sessions.push(lesson);
            return acc;
        }, {});

        const makeupLessonsNeeded = Object.entries(lessonsByTopic).map(([topicId, { topicName, sessions }]) => {
            const studentsNeedingMakeup = course.Student.filter(student => {
                const learnMap = studentLearnMap.get(student.ID);
                if (!learnMap) return false;

                const wasPresent = sessions.some(s => learnMap.get(s._id) === ATTENDANCE_STATUS.PRESENT);
                if (wasPresent) return false;

                const hadPermittedAbsence = sessions.some(s => learnMap.get(s._id) === ATTENDANCE_STATUS.ABSENT_WITH_PERMISSION);
                return hadPermittedAbsence;
            });

            return { topicId, topicName, students: studentsNeedingMakeup };
        }).filter(item => item.students.length > 0);

        const allDates = course.Detail.map(item => new Date(item.Day));
        const dateRange = [new Date(Math.min(...allDates)), new Date(Math.max(...allDates))];
        const isPastEndDate = new Date(dateRange[1]) ? new Date() > new Date(dateRange[1]) : false;
        const canCompleteCourse = makeupLessonsNeeded.length === 0 && isPastEndDate;

        return { attendanceData, makeupLessonsNeeded, canCompleteCourse };
    }, [course]);
};


// --- Các Component con để làm sạch phần render ---

const ReportTrigger = ({ onClick }) => (
    <div className={'flex items-center flex-col justify-center gap-2 rounded-md cursor-pointer w-full h-full bg-[#fff9de] transition-all duration-100 hover:-translate-y-0.5 hover:bg-[#fff6d0]'} onClick={onClick}>
        <Svg_Chart w={18} h={18} c='var(--text-primary)' />
        <p className="text-xs font-semibold text-[var(--text-primary)]">Báo cáo</p>
    </div>
);

const MakeupSection = ({ lessons, onSelect }) => (
    <div className={'flex-1'}>
        <h2 className='text-base font-semibold text-[var(--text-primary)]'>Danh sách chủ đề cần bù</h2>
        {lessons.length === 0 ? (
            <p className={`${'text-[#155724] bg-[#d4edda] border border-[#c3e6cb] rounded-lg p-5 text-center italic'}`} style={{ fontSize: 14 }}>Không có buổi học nào cần bù.</p>
        ) : (
            <ul className={'list-none p-0'}>
                {lessons.map(({ topicId, topicName, students }) => (
                    <li key={topicId} className={'bg-white p-2 rounded-sm cursor-pointer mb-2 w-[calc(100%-16px)] shadow-[var(--boxshaw2)] border-l-6 border-[#ffc107] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_6px_16px_rgba(0,0,0,0.1)]'} onClick={() => onSelect({ topicId, topicName, students })}>
                        <p className='text-sm font-semibold text-[var(--text-primary)]'>Chủ đề: {topicName} (ID: {topicId})</p>
                        <p className='text-sm font-normal text-[var(--text-primary)]'>Số lượng học sinh cần bù: {students.length}</p>
                    </li>
                ))}
            </ul>
        )}
    </div>
);

const StudentListPopup = ({ lesson, onClose }) => {
    if (!lesson) return null;
    return (
        <FlexiblePopup
            open={!!lesson}
            onClose={onClose}
            width={600}
            title={`Học sinh cần bù | Chủ đề: ${lesson.topicName}`}
            renderItemList={() => (
                <div className={'p-4 flex flex-col gap-3'}>
                    {lesson.students.map((student, index) => (
                        <div key={student.ID} className={'flex items-center gap-4 p-3 bg-[#f8f9fa] rounded-md border border-[#e9ecef]'}>
                            <span className={'font-semibold text-[#007bff] text-lg'}>{index + 1}.</span>
                            <div className={'flex flex-col'}>
                                <span className={'font-medium text-[#343a40]'}>{student.Name}</span>
                                <span className={'text-xs text-[#6c757d]'}>ID: {student.ID}</span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        />
    );
};

const CompletionButton = ({ onClick, disabled }) => (
    <div className={'mt-8 text-center'}>
        <button className="px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5" onClick={onClick} disabled={disabled} style={{ background: disabled ? 'var(--gray_3)' : 'var(--main_d)' }}>
            <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Xác nhận hoàn thành</p>
        </button>
        {disabled && <p className={'text-xs italic text-[var(--text-secondary)] mt-2'}>Khóa học chưa thể hoàn thành do vẫn còn học sinh cần bù hoặc chưa tới ngày kết thúc.</p>}
    </div>
);


// --- Component Chính ---
export default function Report({ course }) {
    const [isOpen, setIsOpen] = useState(false);
    const [noti, setNoti] = useState({ open: false, mes: '', status: false });
    const [selectedMakeupLesson, setSelectedMakeupLesson] = useState(null);

    const { attendanceData, makeupLessonsNeeded, canCompleteCourse } = useCourseAnalytics(course);

    const resetPopup = useCallback(() => setIsOpen(false), []);
    const handleCompleteCourse = useCallback(() => {
        setNoti({ open: true, mes: 'Xác nhận hoàn thành khóa học thành công!', status: true });
        resetPopup();
    }, [resetPopup]);

    const chartOptions = {
        plugins: { title: { display: true, text: `Tình hình điểm danh: ${course?.Name || course?.ID}`, font: { size: 18 } } },
        responsive: true,
        maintainAspectRatio: false,
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, title: { display: true, text: 'Sĩ số' } } },
    };

    const renderMainReport = () => (
        <div className={'p-4 bg-[#f8f9fa] h-[calc(100%-32px)]'}>
            <div className={'flex gap-4'}>
                <div className={'flex-[1.5]'}>
                    <Bar options={chartOptions} data={attendanceData} />
                </div>
                <MakeupSection lessons={makeupLessonsNeeded} onSelect={setSelectedMakeupLesson} />
            </div>

            {/* Nút hoàn thành được đặt bên ngoài hàng trên, do đó nó sẽ nằm ở dưới cùng */}
            <CompletionButton onClick={handleCompleteCourse} disabled={!canCompleteCourse} />
        </div>
    );

    return (
        <>
            <ReportTrigger onClick={() => setIsOpen(true)} />

            <FlexiblePopup
                open={isOpen}
                onClose={resetPopup}
                width={1200}
                title={`Tổng quan khóa học ${course?.ID || '-'}`}
                renderItemList={renderMainReport}
            />

            <StudentListPopup
                lesson={selectedMakeupLesson}
                onClose={() => setSelectedMakeupLesson(null)}
            />

            <Noti
                open={noti.open}
                onClose={() => setNoti(n => ({ ...n, open: false }))}
                status={noti.status}
                mes={noti.mes}
            />
        </>
    );
}