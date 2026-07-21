'use client';

import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react';
import { Svg_Pen } from "@/components/(icon)/svg";
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import Noti from '@/components/(features)/(noti)/noti';
import AlertPopup from '@/components/(features)/(noti)/alert';
import Menu from '@/components/(ui)/(button)/menu';
import Loading from '@/components/(ui)/(loading)/loading';
import { useRouter } from 'next/navigation';

const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    let date;

    if (dateString.includes('/')) {
        const parts = dateString.split('/');
        if (parts.length === 3) {
            const [day, month, year] = parts;
            date = new Date(year, month - 1, day);
        }
    } else {
        date = new Date(dateString);
    }

    if (date && !isNaN(date.getTime())) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    return '';
};

const UpdateStudentForm = React.memo(forwardRef(({
    onClose,
    onShowNotification,
    onShowCloseConfirm,
    data_area,
    onRefreshData,
    reloadData,
    setIsLoading,
    data
}, ref) => {
    const route = useRouter();
    const [formData, setFormData] = useState({
        studentName: '', dob: '', school: '', parentName: '',
        area: '', areaId: '', phone: '', email: '', address: ''
    });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [isDirty, setIsDirty] = useState(false);
    const [isAreaMenuOpen, setIsAreaMenuOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (data) {
            setFormData({
                studentName: data.Name || '',
                dob: formatDateForInput(data.BD),
                school: data.School || '',
                parentName: data.ParentName || '',
                area: data.Area?.name || '',
                areaId: data.Area?._id || '',
                phone: data.Phone || '',
                email: data.Email || '',
                address: data.Address || ''
            });
            // SỬA LỖI TẠI ĐÂY: Sử dụng trực tiếp data.Avt
            setAvatarPreview(`https://lh3.googleusercontent.com/d/${data.Avt || null}`);
            setIsDirty(false);
        }
    }, [data]);

    useEffect(() => {
        const previewUrl = avatarPreview;
        return () => {
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
        };
    }, [avatarPreview]);

    const handleInputChange = useCallback((e) => {
        const { name, value } = e.target;
        const finalValue = name === 'phone' ? value.replace(/[^0-9]/g, '') : value;
        setFormData(prev => ({ ...prev, [name]: finalValue }));
        setIsDirty(true);
    }, []);

    const handleImageClick = useCallback(() => fileInputRef.current.click(), []);

    const handleImageChange = useCallback((e) => {
        const file = e.target.files[0];
        if (file && ['image/jpeg', 'image/png', 'image/jpg'].includes(file.type)) {
            setAvatarFile(file);
            const previewUrl = URL.createObjectURL(file);
            setAvatarPreview(previewUrl);
            setIsDirty(true);
        } else if (file) {
            onShowNotification('Định dạng ảnh không hợp lệ. Vui lòng chọn .jpg, .jpeg, hoặc .png', false);
        }
    }, [onShowNotification]);

    const validateForm = useCallback(() => {
        const requiredFields = {
            studentName: 'Tên học sinh',
            dob: 'Ngày sinh',
            parentName: 'Tên phụ huynh',
            areaId: 'Khu vực',
            phone: 'Số điện thoại'
        };
        for (const field in requiredFields) {
            if (!formData[field]) {
                onShowNotification(`Vui lòng điền đầy đủ thông tin: ${requiredFields[field]}.`, false);
                return false;
            }
        }
        if (!/^0\d{9}$/.test(formData.phone)) {
            onShowNotification('Số điện thoại không hợp lệ. Vui lòng nhập 10 chữ số và bắt đầu bằng số 0.', false);
            return false;
        }
        return true;
    }, [formData, onShowNotification]);

    const handleSubmit = useCallback(async (e) => {
        e.preventDefault();
        if (!validateForm() || isSubmitting) return;

        setIsSubmitting(true);
        setIsLoading(true);

        const submissionData = new FormData();
        submissionData.append('Name', formData.studentName);
        submissionData.append('BD', formData.dob);
        submissionData.append('School', formData.school);
        submissionData.append('ParentName', formData.parentName);
        submissionData.append('Phone', formData.phone);
        submissionData.append('Email', formData.email);
        submissionData.append('Address', formData.address);
        submissionData.append('Area', formData.areaId);
        if (avatarFile) {
            submissionData.append('Avt', avatarFile);
        }

        try {
            const response = await fetch(`/api/student/${data._id}`, {
                method: 'PUT',
                body: submissionData,
            });
            const result = await response.json();
            if (!response.ok) {
                throw new Error(result.mes || 'Có lỗi xảy ra trong quá trình cập nhật.');
            }
            onShowNotification(result.mes || 'Cập nhật thành công!', true);
            if (onRefreshData) onRefreshData(result.data); // Truyền dữ liệu mới nhất về để cập nhật UI
            onClose();
        } catch (error) {
            onShowNotification(error.message, false);
        } finally {
            setIsSubmitting(false);
            setIsLoading(false);
            route.refresh(); // Làm mới trang để cập nhật dữ liệu
            if (reloadData) reloadData();
        }
    }, [validateForm, isSubmitting, setIsLoading, formData, avatarFile, data._id, onShowNotification, onRefreshData, onClose, reloadData]);

    const handleAttemptClose = useCallback(() => {
        if (isDirty) {
            onShowCloseConfirm();
        } else {
            onClose();
        }
    }, [isDirty, onClose, onShowCloseConfirm]);

    useImperativeHandle(ref, () => ({
        triggerAttemptClose: handleAttemptClose
    }), [handleAttemptClose]);

    const areaMenuItems = useMemo(() => (
        <div className="m-0 w-full rounded-md bg-[var(--bg-primary)] mt-2 shadow-[rgba(0,0,0,0.1)_0px_0px_3px_0px,rgba(0,0,0,0.05)_0px_0px_1px_0px]">
            <div className="bg-white rounded shadow-[var(--boxshaw2)] mt-[5px]" style={{ gap: 3, padding: 8 }}>
                {(data_area || []).map((area) => (
                    <p
                        key={area._id}
                        onClick={() => {
                            setFormData(prev => ({ ...prev, area: area.name, areaId: area._id }));
                            setIsDirty(true);
                            setIsAreaMenuOpen(false);
                        }}
                        className='text-sm font-normal text-[var(--text-primary)]'
                    >
                        {area.name}
                    </p>
                ))}
            </div>
        </div>
    ), [data_area]);

    return (
        <>
            <div className="px-4 pb-0 pt-4">
                <TextNoti mes={<p>Các thông tin có đánh dấu <span className="text-[var(--red)]">*</span> là bắt buộc.</p>} title={'Lưu ý khi cập nhật thông tin'} color={'yellow'} />
            </div>
            <div className="flex p-4 gap-4">
                <input type="file" ref={fileInputRef} onChange={handleImageChange} accept=".jpg,.jpeg,.png" className="hidden" />
                <div onClick={handleImageClick} className="w-40 p-2 aspect-square rounded border-2 border-dashed border-[#ccc] flex flex-col gap-4 items-center justify-center cursor-pointer" style={{ background: avatarPreview ? `url(${avatarPreview}) center/cover` : 'transparent' }}>
                    {!avatarPreview && (
                        <>
                            <svg width="45" height="45" viewBox="0 0 24 24" fill="none" stroke="#9b9b9b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><path d="M21 15l-5-5L5 21"></path>
                            </svg>
                            <p className='text-base font-medium text-[var(--text-primary)]'>Hình ảnh đại diện</p>
                            <p className="text-xs font-normal text-[var(--text-primary)] text-center">Chỉ chấp nhận .jpg, .jpeg, .png</p>
                        </>
                    )}
                </div>
                <div className="flex-1 flex flex-col gap-2">
                    <div className="flex gap-1 flex-col">
                        <p className='text-sm font-semibold text-[var(--text-primary)]'>Tên học sinh <span className="text-[var(--red)]">*</span></p>
                        <input name="studentName" value={formData.studentName} onChange={handleInputChange} type='text' placeholder='Họ và tên' className={`px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none w-[calc(100%-24px)]`} />
                    </div>
                    <div className="flex gap-1 flex-col">
                        <p className='text-sm font-semibold text-[var(--text-primary)]'>Ngày sinh <span className="text-[var(--red)]">*</span></p>
                        <input name="dob" value={formData.dob} onChange={handleInputChange} type='date' className={`px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none w-[calc(100%-24px)]`} />
                    </div>
                    <div className="flex gap-1 flex-col">
                        <p className='text-sm font-semibold text-[var(--text-primary)]'>Trường học</p>
                        <input name="school" value={formData.school} onChange={handleInputChange} type='text' placeholder='Trường học' className={`px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none w-[calc(100%-24px)]`} />
                    </div>
                </div>
            </div>
            <div className="px-4">
                <TextNoti mes={<p>Thông tin liên hệ như SĐT (Có zalo) và Email sẽ được sử dụng để liên lạc với phụ huynh học sinh, vui lòng nhập chính xác những thông tin này.<br /></p>} title={'Thông tin liên hệ'} color={'yellow'} />
            </div>
            <div className="p-4 flex flex-col gap-2">
                <div className="flex gap-2">
                    <div className="flex gap-1 flex-col flex-1">
                        <p className='text-sm font-semibold text-[var(--text-primary)]'>Tên phụ huynh <span className="text-[var(--red)]">*</span></p>
                        <input name="parentName" value={formData.parentName} onChange={handleInputChange} type='text' placeholder='Họ và tên' className={`px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none w-[calc(100%-24px)]`} />
                    </div>
                    <div className="flex gap-1 flex-col flex-1">
                        <p className='text-sm font-semibold text-[var(--text-primary)]'>Số điện thoại <span className="text-[var(--red)]">*</span></p>
                        <input name="phone" value={formData.phone} onChange={handleInputChange} type='tel' placeholder='Số điện thoại' className={`px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none w-[calc(100%-24px)]`} maxLength="10" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="flex gap-1 flex-col flex-1">
                        <p className='text-sm font-semibold text-[var(--text-primary)]'>Khu vực <span className="text-[var(--red)]">*</span></p>
                        <Menu isOpen={isAreaMenuOpen} onOpenChange={setIsAreaMenuOpen} menuItems={areaMenuItems} menuPosition="top"
                            customButton={
                                <div onClick={() => setIsAreaMenuOpen(o => !o)} className="px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none w-[calc(100%-24px)] cursor-pointer">
                                    {formData.area || 'Chọn khu vực'}
                                </div>
                            }
                        />
                    </div>
                    <div className="flex gap-1 flex-col flex-1">
                        <p className='text-sm font-semibold text-[var(--text-primary)]'>Email</p>
                        <input name="email" value={formData.email} onChange={handleInputChange} type='email' placeholder='Email' className={`px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none w-[calc(100%-24px)]`} />
                    </div>
                </div>
                <div className="flex gap-1 flex-col flex-1">
                    <p className='text-sm font-semibold text-[var(--text-primary)]'>Địa chỉ</p>
                    <input name="address" value={formData.address} onChange={handleInputChange} type='text' placeholder='Địa chỉ' className={`px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none w-[calc(100%-24px)]`} />
                </div>
            </div>
            <div className="px-4 pb-4 pt-0 flex gap-2">
                <div className={`px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5`} style={{ background: 'gray', borderRadius: 5 }} onClick={isSubmitting ? undefined : handleAttemptClose}>
                    <p className="text-sm font-normal text-[var(--text-primary)] text-white">Hủy bỏ</p>
                </div>
                <div className={`px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5 bg-[var(--main_d)] rounded flex items-center gap-2 cursor-pointer`} onClick={isSubmitting ? undefined : handleSubmit}>
                    <Svg_Pen w={16} h={16} c={'white'} />
                    <p className="text-sm font-normal text-[var(--text-primary)] text-white">Cập nhật</p>
                </div>
            </div>
        </>
    );
}));
UpdateStudentForm.displayName = 'UpdateStudentForm';

export default function Update({ data_area, onStudentUpdated, reloadData, data }) {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [notification, setNotification] = useState({ open: false, status: false, mes: '' });
    const [showCloseConfirm, setShowCloseConfirm] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const formRef = useRef(null);

    const handleOpenPopup = useCallback(() => setIsPopupOpen(true), []);
    const handleClosePopup = useCallback(() => setIsPopupOpen(false), []);
    const handleCloseConfirm = useCallback(() => setShowCloseConfirm(false), []);

    const handleShowNotification = useCallback((mes, status) => {
        setNotification({ open: true, mes, status });
    }, []);

    const handleShowCloseConfirm = useCallback(() => {
        setShowCloseConfirm(true);
    }, []);

    const triggerFormCloseCheck = useCallback(() => {
        formRef.current?.triggerAttemptClose();
    }, []);

    const handleConfirmAndClose = useCallback(() => {
        setShowCloseConfirm(false);
        handleClosePopup();
    }, [handleClosePopup]);

    const handleCloseNoti = useCallback(() => {
        setNotification(prev => ({ ...prev, open: false }));
    }, []);

    const alertActions = useMemo(() => (
        <div className="flex gap-2 justify-end w-full">
            <div className={`px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5`} style={{ background: 'gray', borderRadius: 5 }} onClick={handleCloseConfirm}>
                <p className="text-sm font-normal text-[var(--text-primary)] text-white">Ở lại</p>
            </div>
            <div className={`px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5`} style={{ background: 'var(--red)', borderRadius: 5 }} onClick={handleConfirmAndClose}>
                <p className="text-sm font-normal text-[var(--text-primary)] text-white">Xác nhận</p>
            </div>
        </div>
    ), [handleCloseConfirm, handleConfirmAndClose]);

    return (
        <>
            <div onClick={handleOpenPopup} className="p-1.5 rounded flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5" style={{ background: 'var(--yellow)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <Svg_Pen w={16} h={16} c={'white'} />
            </div>

            {isLoading && (
                <div className="fixed inset-0 bg-black/60 flex justify-center items-center z-[9999] backdrop-blur">
                    <Loading content={<p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Đang thực thi...</p>} />
                </div>
            )}

            <FlexiblePopup
                open={isPopupOpen}
                onClose={triggerFormCloseCheck}
                title="Cập nhật thông tin học sinh"
                renderItemList={() => (
                    <UpdateStudentForm
                        ref={formRef}
                        onClose={handleClosePopup}
                        onShowNotification={handleShowNotification}
                        onShowCloseConfirm={handleShowCloseConfirm}
                        data_area={data_area}
                        onRefreshData={onStudentUpdated}
                        reloadData={reloadData}
                        setIsLoading={setIsLoading}
                        data={data}
                    />
                )}
                width={700}
            />

            <Noti open={notification.open} status={notification.status} mes={notification.mes} onClose={handleCloseNoti}
                button={
                    <div className={`px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5`} style={{ width: 'calc(100% - 24px)', justifyContent: 'center' }} onClick={handleCloseNoti}>
                        <p className="text-sm font-normal text-[var(--text-primary)] text-white">Tắt thông báo</p>
                    </div>
                }
            />

            <AlertPopup open={showCloseConfirm} onClose={handleCloseConfirm} title="Cảnh báo"
                content={<p className='text-xs font-medium text-[var(--text-primary)]'>Dữ liệu đã thay đổi sẽ không được lưu. Bạn có chắc chắn muốn thoát?</p>}
                type="warning" actions={alertActions}
            />
        </>
    );
}
