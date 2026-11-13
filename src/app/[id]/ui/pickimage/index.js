'use client';

import React, { useState, useMemo, useCallback, memo } from 'react';
import Image from 'next/image';

// Helper để lấy thông tin trạng thái khóa học
const getStatusInfo = (status) => {
    switch (status) {
        case 2: return { text: 'Đã hoàn thành', className: 'bg-[#28a745]' };
        case 1: return { text: 'Bảo lưu', className: 'bg-[#ffc107] text-[#333]' };
        default: return { text: 'Đang học', className: 'bg-[#007bff]' };
    }
};

// Icon mũi tên
const ArrowIcon = ({ isOpen }) => (
    <span className={`flex items-center transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} style={{ display: 'flex', alignItems: 'center' }}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" width={14} height={14} fill="currentColor">
            <path d="M137.4 374.6c12.5 12.5 32.8 12.5 45.3 0l128-128c9.2-9.2 11.9-22.9 6.9-34.9s-16.6-19.8-29.6-19.8L64 192c-12.9 0-24.6 7.8-29.6 19.8s-2.2 25.7 6.9 34.9l128 128z" />
        </svg>
    </span>
);

// Component con cho một mục Accordion
const CourseAccordionItem = memo(function CourseAccordionItem({ course, onMediaClick, selectionMode, selectedMedia, initialFilter }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [personalFilter, setPersonalFilter] = useState('all');
    const [typeFilter, setTypeFilter] = useState(initialFilter);

    const mediaItems = useMemo(() => {
        const source = personalFilter === 'all'
            ? course.Detail?.flatMap(d => d.DetailImage || []) || []
            : course.Detail?.flatMap(d => d.ImageStudent || []) || [];

        if (typeFilter === 'all') return source;
        return source.filter(item => item.type === typeFilter);
    }, [course.Detail, personalFilter, typeFilter]);

    const statusInfo = getStatusInfo(course.enrollmentStatus);

    return (
        <div className="border border-[#e0e0e0] rounded-lg overflow-hidden bg-white w-full">
            <button className="flex justify-between items-center w-full px-4 py-3 bg-[#f9fafb] border-none cursor-pointer text-left outline-none" onClick={() => setIsExpanded(!isExpanded)}>
                <div className="flex items-center gap-3 flex-wrap">
                    <p className="font-semibold text-base text-[#333]">{course.Book?.Name || course.ID}</p>
                    <span className={`px-2.5 py-1 rounded-xl text-xs font-medium text-white ${statusInfo.className}`}>{statusInfo.text}</span>
                </div>
                <ArrowIcon isOpen={isExpanded} />
            </button>
            <div className={`max-h-0 overflow-hidden transition-[max-height] duration-[0.4s] ease-out ${isExpanded ? 'max-h-[1000px] transition-[max-height] duration-[0.5s] ease-in' : ''}`}>
                <div className="p-2 border-t border-[#e0e0e0]">
                    <div className="flex gap-2.5 mb-2.5">
                        {initialFilter === 'all' && (
                            <>
                                <button onClick={() => setTypeFilter('all')} className={`px-3 py-1.5 border border-[#ccc] rounded-md bg-[#f0f0f0] cursor-pointer transition-[background-color,color] duration-200 ${typeFilter === 'all' ? 'bg-[#007bff] text-white border-[#007bff]' : ''}`}>Tất cả</button>
                                <button onClick={() => setTypeFilter('image')} className={`px-3 py-1.5 border border-[#ccc] rounded-md bg-[#f0f0f0] cursor-pointer transition-[background-color,color] duration-200 ${typeFilter === 'image' ? 'bg-[#007bff] text-white border-[#007bff]' : ''}`}>Ảnh</button>
                                <button onClick={() => setTypeFilter('video')} className={`px-3 py-1.5 border border-[#ccc] rounded-md bg-[#f0f0f0] cursor-pointer transition-[background-color,color] duration-200 ${typeFilter === 'video' ? 'bg-[#007bff] text-white border-[#007bff]' : ''}`}>Video</button>
                                <span className="w-px bg-[#ddd] mx-1"></span>
                            </>
                        )}
                        <button onClick={() => setPersonalFilter('all')} className={`px-3 py-1.5 border border-[#ccc] rounded-md bg-[#f0f0f0] cursor-pointer transition-[background-color,color] duration-200 ${personalFilter === 'all' ? 'bg-[#007bff] text-white border-[#007bff]' : ''}`}>Khoá học</button>
                        <button onClick={() => setPersonalFilter('personal')} className={`px-3 py-1.5 border border-[#ccc] rounded-md bg-[#f0f0f0] cursor-pointer transition-[background-color,color] duration-200 ${personalFilter === 'personal' ? 'bg-[#007bff] text-white border-[#007bff]' : ''}`}>Cá nhân</button>
                    </div>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3 max-h-[500px] overflow-y-auto p-1">
                        {mediaItems.length > 0 ? (
                            mediaItems.map((media) => {
                                const mediaUrl = media.type === 'video' ? `https://drive.google.com/thumbnail?id=${media.id}` : `https://lh3.googleusercontent.com/d/${media.id}`;
                                const isSelected = selectionMode === 'single' ? selectedMedia === media.id : Array.isArray(selectedMedia) && selectedMedia.includes(media.id);
                                
                                return (
                                    <div key={media.id} className={`relative aspect-video rounded-md overflow-hidden cursor-pointer border-[3px] transition-transform duration-200 bg-black ${isSelected ? 'border-[#007bff]' : 'border-transparent'} hover:scale-105`} onClick={() => onMediaClick(media.id)}>
                                        {media.type === 'video'
                                            ? <Image src={mediaUrl} alt="Media" fill sizes="150px" className="w-full h-full object-cover" loading="lazy" />
                                            : <Image src={mediaUrl} alt="Media" fill sizes="150px" className="w-full h-full object-cover" loading="lazy" />
                                        }
                                        {isSelected && (
                                            <div className="absolute top-[5px] right-[5px] w-5 h-5 bg-[#007bff] text-white rounded-full flex items-center justify-center text-xs font-bold">✓</div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (<p className="col-span-full text-center text-[#888] py-5">Không có file phù hợp.</p>)}
                    </div>
                </div>
            </div>
        </div>
    );
});

export default function CourseAndImageSelection({ studentData, selectionMode, selected, onSelectionChange, filterType = 'all' }) {
    // SỬA LỖI 3: Handler giờ đây nhận vào và xử lý mediaId
    const handleMediaClick = useCallback((mediaId) => {
        if (!onSelectionChange) return;
        if (selectionMode === 'single') {
            onSelectionChange(mediaId);
        } else {
            const currentSelection = Array.isArray(selected) ? selected : [];
            const newSelection = currentSelection.includes(mediaId) ? currentSelection.filter(id => id !== mediaId) : [...currentSelection, mediaId];
            onSelectionChange(newSelection);
        }
    }, [selectionMode, selected, onSelectionChange]);

    if (!studentData?.Course?.length) return <p>Học sinh chưa đăng ký khóa học nào.</p>;

    return (
        <div className="w-[calc(100%-24px)] flex flex-col gap-2 p-3">
            {studentData.Course.map(enrollment => (<CourseAccordionItem key={enrollment._id} course={enrollment} onMediaClick={handleMediaClick} selectionMode={selectionMode} selectedMedia={selected} initialFilter={filterType} />))}
        </div>
    );
}
