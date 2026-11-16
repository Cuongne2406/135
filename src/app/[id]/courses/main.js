'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import { driveImage } from '@/function';
import { getTemplateConfig } from '@/lib/templates';

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
    return { text: textMap[type]?.[status] || '', className: classMap[type]?.[status] || '' };
};

export default function CourseListDisplay({ courses = [] }) {
    const [expandedCourseId, setExpandedCourseId] = useState(courses?.[0]?._id || null);
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
                {(courses || []).map(course => {
                    const isExpanded = expandedCourseId === course._id;
                    const statusInfo = getStatusInfo(course.enrollmentStatus, 'enrollment');
                    const totalLessons = course.Detail?.length || 0;
                    const completedLessons = (course.Detail || []).filter(d => d.Checkin === 1 || d.Checkin === 3).length;
                    const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
                    const lessonsWithTopicNames = (course.Detail || []).map(detail => ({ ...detail, TopicName: course.Book?.Topics?.find(t => t._id === detail.Topic)?.Name }));

                    const tmpl = getTemplateConfig(course.template);
                    const { tokens } = tmpl;

                    return (
                        <div
                            key={course._id}
                            className="rounded-xl overflow-hidden transition-all duration-300 shadow-xs"
                            style={{
                                backgroundColor: tokens.cardBg,
                                border: `1.5px solid ${tokens.cardBorder}`
                            }}
                        >
                            <button
                                className="grid grid-cols-[3fr_2fr_auto] items-center gap-4 w-full px-5 py-4 border-none cursor-pointer text-left max-md:grid-cols-[1fr_auto] transition-colors"
                                style={{ background: tokens.headerBg }}
                                onClick={() => setExpandedCourseId(isExpanded ? null : course._id)}
                            >
                                <div className="flex items-center gap-4">
                                    {course.Book?.Image ? (
                                        <Image src={driveImage(course.Book.Image)} width={60} height={60} alt={course.Book?.Name || 'Khoá học'} className="rounded-lg object-cover shadow-xs" />
                                    ) : (
                                        <div className="w-[60px] h-[60px] rounded-lg bg-gray-200/80 flex items-center justify-center text-xl shadow-xs" style={{ border: `1px solid ${tokens.cardBorder}` }}>
                                            {tmpl.icon || '📚'}
                                        </div>
                                    )}
                                    <div style={{ display: 'flex', gap: 2, flexDirection: 'column' }}>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className='text-base font-bold' style={{ color: tokens.textPrimary }}>{course.Book?.Name}</p>
                                            <span
                                                className="text-[11px] px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 shadow-xs"
                                                style={{
                                                    backgroundColor: tokens.badgeBg,
                                                    color: tokens.badgeText,
                                                    border: `1px solid ${tokens.accentBorder}`
                                                }}
                                            >
                                                {tmpl.icon} {tmpl.name}
                                            </span>
                                        </div>
                                        <p className='text-xs font-medium' style={{ color: tokens.textSecondary }}>
                                            Khóa: <span style={{ fontWeight: 600 }}>{course.ID}</span>
                                        </p>
                                        <p className='text-xs font-medium' style={{ color: tokens.textSecondary }}>
                                            Trạng thái: <span style={{ fontWeight: 600 }}>{statusInfo.text}</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="text-sm max-md:hidden" style={{ color: tokens.textSecondary }}>
                                    <span className="font-medium">{completedLessons}/{totalLessons} buổi học</span>
                                    <div className="w-full h-2 rounded-full overflow-hidden mt-1.5 bg-black/10">
                                        <div
                                            className="h-full rounded-full transition-all duration-500 ease-in-out"
                                            style={{ width: `${progress}%`, background: tokens.progressBar }}
                                        />
                                    </div>
                                </div>
                                <ArrowIcon isOpen={isExpanded} />
                            </button>
                            <div
                                className={`max-h-0 overflow-hidden transition-[max-height] duration-[0.4s] ease-out ${isExpanded ? 'max-h-[2000px] transition-[max-height] duration-[0.5s] ease-in border-t' : ''
                                    }`}
                                style={{
                                    backgroundColor: tokens.cardBg,
                                    borderColor: tokens.cardBorder
                                }}
                            >
                                <div className="flex flex-col p-2 gap-1.5">
                                    {lessonsWithTopicNames.map((lesson, index) => {
                                        const lessonStatus = getStatusInfo(lesson.Checkin, 'checkin');
                                        return (
                                            <button
                                                key={lesson._id}
                                                className="grid grid-cols-[auto_1fr_auto_auto] items-center gap-4 w-full px-4 py-3 rounded-lg border cursor-pointer text-left transition-all duration-150 hover:-translate-y-0.5 max-md:grid-cols-[auto_1fr_auto] max-md:gap-3 shadow-2xs"
                                                style={{
                                                    backgroundColor: tokens.lessonBg,
                                                    borderColor: tokens.cardBorder
                                                }}
                                                onClick={() => handleLessonClick(lesson)}
                                            >
                                                <p
                                                    className="font-bold text-sm tracking-wide"
                                                    style={{ color: tokens.primary }}
                                                >
                                                    Buổi {index + 1}
                                                </p>
                                                <div className="flex flex-col gap-0.5">
                                                    <p
                                                        className="font-semibold text-sm"
                                                        style={{ color: tokens.textPrimary }}
                                                    >
                                                        {lesson.TopicName || `Chủ đề buổi ${index + 1}`}
                                                    </p>
                                                    <p
                                                        className="text-xs"
                                                        style={{ color: tokens.textSecondary }}
                                                    >
                                                        Thời gian: {lesson.Time} • {new Date(lesson.Day).toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                                <div className={`text-xs font-semibold px-2.5 py-1 rounded-md max-md:hidden ${lessonStatus.className}`}>
                                                    {lessonStatus.text}
                                                </div>
                                                <p style={{ color: tokens.textSecondary }} className="font-bold text-base">›</p>
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
