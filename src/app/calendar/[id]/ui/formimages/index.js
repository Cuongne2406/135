'use client';

import React, { useState, useEffect, useMemo } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right'; // <-- Đường dẫn đến component popup
import Loading from '@/components/(ui)/(loading)/loading';         // <-- Đường dẫn đến component loading
import Noti from '@/components/(features)/(noti)/noti';                  // <-- Đường dẫn đến component Noti
import { useRouter } from 'next/navigation';
import { Re_lesson } from '@/data/course';        
import { reloadCourse } from '@/data/actions/reload';


const getDriveImageUrl = (id, size = 200) => `https://lh3.googleusercontent.com/d/${id}=w${size}`;

const areSetsEqual = (setA, setB) => {
    if (setA.size !== setB.size) return false;
    for (const item of setA) {
        if (!setB.has(item)) return false;
    }
    return true;
};

export default function StudentImageSelectionManager({ studentInfo, courseInfo, course }) {

    const router = useRouter();
    const [isPrimaryOpen, setPrimaryOpen] = useState(false);
    const [isSecondaryOpen, setSecondaryOpen] = useState(false);

    // Tách riêng state loading cho 2 popup
    const [isLoadingPrimary, setIsLoadingPrimary] = useState(false);
    const [isLoadingSecondary, setIsLoadingSecondary] = useState(false);
    // State quản lý thông báo Noti
    const [notification, setNotification] = useState({ open: false, status: false, mes: '' });

    const [originalImageIds, setOriginalImageIds] = useState(new Set());
    const [selectedImageIds, setSelectedImageIds] = useState(new Set());
    const [tempSelection, setTempSelection] = useState(new Set());

    useEffect(() => {
        const initialIds = new Set(studentInfo.Image.map(img => img.id) || []);
        setOriginalImageIds(initialIds);
        setSelectedImageIds(initialIds);
    }, [studentInfo]);

    const allCourseImages = courseInfo?.DetailImage || [];

    const selectedImageObjects = useMemo(() =>
        allCourseImages.filter(img => selectedImageIds.has(img.id)),
        [selectedImageIds, allCourseImages]
    );

    const handleOpenSecondaryPopup = () => {
        setTempSelection(new Set(selectedImageIds));
        setSecondaryOpen(true);
    };

    const handleRemoveFromPrimary = (imageId) => {
        const newSelectedIds = new Set(selectedImageIds);
        newSelectedIds.delete(imageId);
        setSelectedImageIds(newSelectedIds);
    };

    const handleToggleInSecondary = (imageId) => {
        const newTempIds = new Set(tempSelection);
        if (newTempIds.has(imageId)) {
            newTempIds.delete(imageId);
        } else {
            newTempIds.add(imageId);
        }
        setTempSelection(newTempIds);
    };

    const hasChangedOnPrimary = !areSetsEqual(originalImageIds, selectedImageIds);

    const handleSaveChangesOnPrimary = async () => {
        if (!hasChangedOnPrimary) return;
        setIsLoadingPrimary(true);
        try {
            const idsToSave = Array.from(selectedImageIds);
            await saveStudentImagesAPI(studentInfo.ID, courseInfo.id, idsToSave);
            setOriginalImageIds(selectedImageIds);
            setNotification({ open: true, status: true, mes: 'Cập nhật danh sách ảnh thành công!' });
            setPrimaryOpen(false);
        } catch (error) {
            setNotification({ open: true, status: false, mes: error.message || 'Lưu thay đổi thất bại.' });
        } finally {
            setIsLoadingPrimary(false);
        }
    };

    // HÀM MỚI: Xử lý lưu từ Popup 2
    const handleSaveFromSecondary = async () => {
        setIsLoadingSecondary(true);
        try {

            // Lấy ID của buổi học từ courseInfo (được truyền vào component)
            const lessonImageId = courseInfo?._id;
            if (!lessonImageId) {
                throw new Error("Không tìm thấy mã định danh của buổi học (courseInfo.Image).");
            }

            // Chuyển Set ID thành mảng các object {id, type} đúng cấu trúc
            const imagesToSave = allCourseImages
                .filter(img => tempSelection.has(img.id))
                .map(img => ({ id: img.id, type: img.type }));

            // Gọi API route với phương thức POST
            const response = await fetch('/api/updateimagestudent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    lessonId: lessonImageId,         // ID của buổi học để tìm kiếm
                    studentId: studentInfo.ID,
                    newImages: imagesToSave       // Mảng object ảnh mới
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Lỗi từ server');
            }
            await reloadCourse(course._id); 
            await Re_lesson(courseInfo._id);
            router.refresh();

            // Cập nhật state chính sau khi API thành công
            setSelectedImageIds(tempSelection);
            setOriginalImageIds(tempSelection);

            setNotification({ open: true, status: true, mes: result.message || 'Lưu lựa chọn thành công!' });
            setSecondaryOpen(false); // Đóng popup 2
        } catch (error) {
            console.error("Lỗi khi lưu từ popup 2:", error);
            setNotification({ open: true, status: false, mes: error.message || 'Có lỗi xảy ra, không thể lưu.' });
        } finally {
            setIsLoadingSecondary(false);
        }
    };
    const closeNotification = () => setNotification({ open: false, status: false, mes: '' });

    // Render nội dung cho Popup 1
    const renderPrimaryContent = () => (
        <div className="relative p-4 h-[calc(100%-16px)] pb-0 flex flex-col">
            {isLoadingPrimary && (
                <div className="absolute inset-0 bg-white/85 flex justify-center items-center z-10 rounded-lg">
                    <Loading size={50} content={<p>Đang lưu...</p>} />
                </div>
            )}
            <div className="flex justify-between items-center mb-3 shrink-0">
                <p className='text-base font-semibold text-[var(--text-primary)]'>Ảnh đã chọn ({selectedImageObjects.length})</p>
                <button className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' onClick={handleOpenSecondaryPopup}>+ Thêm ảnh</button>
            </div>

            {selectedImageObjects.length > 0 ?
                <div style={{ overflow: 'auto', flex: 1 }}>
                    <div className="grid grid-cols-5 gap-2.5 overflow-y-auto bg-[#f9f9f9] rounded-lg p-2.5 flex-1">{
                        selectedImageObjects.map(image => (
                            <button key={image.id} className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border-none p-0 bg-[#e0e0e0] transition-transform duration-200">
                                <img src={getDriveImageUrl(image.id)} alt={`Ảnh của ${studentInfo.ID}`} className="w-full h-full object-cover block transition-opacity duration-300" />
                            </button>
                        ))
                    }
                    </div>
                </div> : (
                    <div className="w-full h-full min-h-[150px] flex items-center justify-center text-center text-[#888]">
                        <p>Chưa có ảnh nào được chọn.</p>
                    </div>
                )}

        </div>
    );

    // Render nội dung cho Popup 2
    const renderSecondaryContent = () => (
        <div className="relative p-4 h-[calc(100%-16px)] pb-0 flex flex-col">
            {isLoadingSecondary && ( // Sử dụng state loading riêng
                <div className="absolute inset-0 bg-white/85 flex justify-center items-center z-10 rounded-lg">
                    <Loading size={50} content={<p>Đang lưu lựa chọn...</p>} />
                </div>
            )}
            <div style={{ flex: 1, overflow: 'auto' }}>
                <div className="grid grid-cols-5 gap-2.5">
                    {allCourseImages.map(image => (
                        <button
                            key={image.id}
                            className={`relative aspect-square rounded-lg overflow-hidden cursor-pointer border-none p-0 bg-[#e0e0e0] transition-transform duration-200 ${tempSelection.has(image.id) ? '' : ''}`}
                            onClick={() => handleToggleInSecondary(image.id)}
                        >
                            <img src={getDriveImageUrl(image.id)} alt={`Ảnh lớp ${image.id}`} loading="lazy" className={`w-full h-full object-cover block transition-opacity duration-300 ${tempSelection.has(image.id) ? 'opacity-50' : ''}`} />
                            {tempSelection.has(image.id) && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-[rgba(25,135,84,0.8)] text-white text-2xl flex justify-center items-center">✓</div>}
                        </button>
                    ))}
                </div>
            </div>
            <div className="w-full py-2.5 flex justify-start gap-2 border-t border-[#e0e0e0] bg-[#fdfdfd] shrink-0">
                <button className="px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5" onClick={handleSaveFromSecondary} disabled={isLoadingSecondary}>
                    {isLoadingSecondary ? 'Đang lưu...' : 'Lưu lựa chọn'}
                </button>
            </div>
        </div>
    );

    return (
        <>
            <Noti
                open={notification.open}
                onClose={closeNotification}
                status={notification.status}
                mes={notification.mes}
            />

            <div className="flex items-center gap-2 py-2 rounded-lg cursor-pointer transition-colors duration-200 flex-1 justify-center" onClick={() => setPrimaryOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill='var(--text-primary)'>
                    <path d="M0 96C0 60.7 28.7 32 64 32l384 0c35.3 0 64 28.7 64 64l0 320c0 35.3-28.7 64-64 64L64 480c-35.3 0-64-28.7-64-64L0 96zM323.8 202.5c-4.5-6.6-11.9-10.5-19.8-10.5s-15.4 3.9-19.8 10.5l-87 127.6L170.7 297c-4.6-5.7-11.5-9-18.7-9s-14.2 3.3-18.7 9l-64 80c-5.8 7.2-6.9 17.1-2.9 25.4s12.4 13.6 21.6 13.6l96 0 32 0 208 0c8.9 0 17.1-4.9 21.2-12.8s3.6-17.4-1.4-24.7l-120-176zM112 192a48 48 0 1 0 0-96 48 48 0 1 0 0 96z" /></svg>
            </div>

            <FlexiblePopup
                open={isPrimaryOpen}
                onClose={() => setPrimaryOpen(false)}
                title={`Ảnh của học sinh: ${studentInfo.ID}`}
                renderItemList={renderPrimaryContent}
                width={600}
                footer={
                    <div className="w-full py-2.5 flex justify-start gap-2 border-t border-[#e0e0e0] bg-[#fdfdfd] shrink-0">
                        <button className="px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5" onClick={handleSaveChangesOnPrimary} disabled={!hasChangedOnPrimary || isLoadingPrimary}>
                            {isLoadingPrimary ? 'Đang lưu...' : 'Lưu thay đổi'}
                        </button>
                    </div>
                }

                secondaryOpen={isSecondaryOpen}
                onCloseSecondary={() => setSecondaryOpen(false)}
                secondaryTitle={`Chọn ảnh từ thư viện lớp`}
                renderSecondaryList={renderSecondaryContent}
            />
        </>
    );
}
