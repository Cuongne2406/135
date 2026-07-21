'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import { driveImage } from '@/function';

const buildUrl = (id) => id ? `https://lh3.googleusercontent.com/d/${id}` : '';

const ArrowIcon = ({ isOpen }) => (
    <svg className={`text-[#6c757d] transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"></polyline>
    </svg>
);

const getStatusInfo = (status, type) => {
    const classMap = {
        enrollment: { 2: 'bg-[#28a745]', 1: 'bg-[#ffc107] text-[#333]', 0: 'bg-[#17a2b8]' },
        checkin: { 1: 'bg-[#e9f7ef] text-[#28a745]', 2: 'bg-[#fbe9e7] text-[#dc3545]', 3: 'bg-[#e8f6f8] text-[#17a2b8]', 0: 'bg-[#f1f3f5] text-[#6c757d]' }
    };
    const textMap = {
        enrollment: { 2: 'Đã hoàn thành', 1: 'Bảo lưu', 0: 'Đang học' },
        checkin: { 1: 'Có mặt', 2: 'Vắng', 3: 'Có phép', 0: 'Chưa điểm danh' }
    };
    return { text: textMap[type][status] || '', className: classMap[type][status] || '' };
};

export default function CourseListDisplay({ courses }) {
    const [expandedCourseId, setExpandedCourseId] = useState(courses[0]?._id || null);
    const [selectedLesson, setSelectedLesson] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const handleLessonClick = (lesson) => {
        setSelectedLesson(lesson);
        setIsPopupOpen(true);
    };
    const [imageFilter, setImageFilter] = useState('all');
    const renderLessonDetailPopup = (lesson) => {
        if (!lesson) return null;


        const allImages = lesson.DetailImage || [];
        const personalImages = lesson.ImageStudent || [];
        const imagesToDisplay = imageFilter === 'all' ? allImages : personalImages;
        const statusInfo = getStatusInfo(lesson.Checkin, 'checkin');

        return (
            <div className="flex flex-col gap-5 p-2">
                <div className="flex justify-between items-center pb-3 border-b border-[#e9ecef]">
                    <h3 className="m-0 text-xl text-[#343a40]">{lesson.TopicName || 'Chi tiết buổi học'}</h3>
                    <div className={`text-sm font-medium px-2.5 py-1 rounded ${statusInfo.className}`}>{statusInfo.text}</div>
                </div>
                <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
                    <div>
                        <strong className="block mb-3 font-semibold text-[#343a40]">Nhận xét buổi học:</strong>
                        {lesson.Cmt?.length > 0 && lesson.Cmt.some(c => c) ? (
                            <ul className="m-0 pl-[18px] text-[#6c757d] text-sm">{lesson.Cmt.map((cmt, i) => cmt && <li key={i}>{cmt}</li>)}</ul>
                        ) : (<p className="text-[#adb5bd] italic text-sm">Chưa có nhận xét.</p>)}
                    </div>
                    <div>
                        <div className="flex gap-2 mb-3">
                            <button onClick={() => setImageFilter('all')} className={`text-xs px-2 py-1 border border-[#ddd] bg-white rounded cursor-pointer ${imageFilter === 'all' ? 'bg-[#007bff] text-white border-[#007bff]' : ''}`}>Tất cả ({allImages.length})</button>
                            <button onClick={() => setImageFilter('personal')} className={`text-xs px-2 py-1 border border-[#ddd] bg-white rounded cursor-pointer ${imageFilter === 'personal' ? 'bg-[#007bff] text-white border-[#007bff]' : ''}`}>Cá nhân ({personalImages.length})</button>
                        </div>
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(100px,1fr))] gap-2 max-h-[300px] overflow-y-auto p-1">
                            {imagesToDisplay.length > 0 ? (
                                imagesToDisplay.map(img => (
                                    <a key={img.id} href={buildUrl(img.id)} target="_blank" rel="noopener noreferrer" className="relative aspect-square rounded-md overflow-hidden">
                                        <Image src={buildUrl(img.id)} alt="Ảnh buổi học" fill sizes="100px" className="object-cover transition-transform duration-200 hover:scale-110" />
                                    </a>
                                ))
                            ) : <p className="text-[#adb5bd] italic text-sm">Không có hình ảnh.</p>}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            <div className="flex flex-col gap-4">
                {courses.map(course => {
                    const isExpanded = expandedCourseId === course._id;
                    const statusInfo = getStatusInfo(course.enrollmentStatus, 'enrollment');
                    const totalLessons = course.Detail.length;
                    const completedLessons = course.Detail.filter(d => d.Checkin === 1 || d.Checkin === 3).length;
                    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
                    const lessonsWithTopicNames = course.Detail.map(detail => ({ ...detail, TopicName: course.Book?.Topics.find(t => t._id === detail.Topic)?.Name }));

                    return (
                        <div key={course._id} className="bg-white rounded-lg border border-[var(--border-color)] overflow-hidden transition-shadow duration-300">
                            <button className="grid grid-cols-[3fr_2fr_auto] items-center gap-4 w-full px-5 py-4 bg-none border-none cursor-pointer text-left max-md:grid-cols-[1fr_auto]" onClick={() => setExpandedCourseId(isExpanded ? null : course._id)}>
                                <div className="flex items-center gap-4">
                                    <Image src={driveImage(course.Book?.Image)} width={60} height={60} alt={course.Book?.Name} className="rounded-lg object-cover" />
                                    <div style={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
                                        <p className='text-sm font-semibold text-[var(--text-primary)]'>{course.Book?.Name}</p>
                                        <p className='text-sm font-semibold text-[var(--text-primary)]'>Khóa: <span style={{ fontWeight: 400 }}>{course.ID}</span></p>
                                        <p className='text-sm font-semibold text-[var(--text-primary)]'>Trạng thái: <span style={{ fontWeight: 400 }}>{statusInfo.text}</span></p>
                                    </div>
                                </div>
                                <div className="text-sm text-[#6c757d] max-md:hidden">
                                    <span>{completedLessons}/{totalLessons} buổi</span>
                                    <div className="w-full h-1.5 bg-[#e9ecef] rounded overflow-hidden mt-1">
                                        <div className="h-full bg-[#007bff] rounded transition-all duration-500 ease-in-out" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                                <ArrowIcon isOpen={isExpanded} />
                            </button>
                            <div className={`max-h-0 overflow-hidden transition-[max-height] duration-[0.4s] ease-out bg-[#fdfdfd] ${isExpanded ? 'max-h-[2000px] transition-[max-height] duration-[0.5s] ease-in border-t border-[var(--border-color)]' : ''}`}>
                                <div className="flex flex-col">
                                    {lessonsWithTopicNames.map((lesson, index) => {
                                        const lessonStatus = getStatusInfo(lesson.Checkin, 'checkin');
                                        return (
                                            <button key={lesson._id} className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 w-full px-4 py-3 rounded-md border-none bg-white cursor-pointer text-left transition-[background-color,box-shadow] duration-200 border-t border-[var(--border-color)] hover:bg-[#f8f9fa] hover:shadow-[0_1px_4px_rgba(0,0,0,0.05)] max-md:grid-cols-[auto_1fr_auto] max-md:gap-3" onClick={() => handleLessonClick(lesson)}>
                                                <p className="font-bold text-[#007bff] text-sm">Buổi {index + 1}</p>
                                                <div className="flex flex-col gap-0.5">
                                                    <p className="font-medium text-[#495057]">{lesson.TopicName || `Chủ đề buổi ${index + 1}`}</p>
                                                    <p className="text-xs text-[#adb5bd]">Thời gian học: {lesson.Time} {new Date(lesson.Day).toLocaleDateString('vi-VN')}</p>
                                                </div>
                                                <div className={`text-sm font-medium px-2.5 py-1 rounded max-md:hidden ${lessonStatus.className}`}>{lessonStatus.text}</div>
                                                <p className="text-[#6c757d]">›</p>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
            <FlexiblePopup
                open={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                title="Chi tiết buổi học"
                data={selectedLesson}
                renderItemList={renderLessonDetailPopup}
                width={700}
            />
        </>
    );
}
