'use client';

import React, { useState } from 'react';
import { Svg_Out } from "@/components/(icon)/svg";
import AlertPopup from '@/components/(features)/(noti)/alert';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import { useRouter } from 'next/navigation';

export default function Out({ onStudentUpdated, reloadData, data }) {
    const router = useRouter();
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [reason, setReason] = useState('');
    const [notification, setNotification] = useState({
        open: false,
        status: true,
        mes: ''
    });

    const handleOpenPopup = () => {
        setIsAlertOpen(true);
    };

    const handleClosePopup = () => {
        setIsAlertOpen(false);
        setReason('');
    };

    const handleConfirmUpdate = async () => {
        if (!data?._id) {
            setNotification({
                open: true,
                status: false,
                mes: 'Lỗi: Không tìm thấy ID học sinh.'
            });
            return;
        }

        if (!reason.trim()) {
            setNotification({
                open: true,
                status: false,
                mes: 'Vui lòng nhập lý do báo nghỉ.'
            });
            setIsAlertOpen(false);
            return;
        }

        setIsAlertOpen(false);
        setIsLoading(true);

        try {
            const response = await fetch(`/api/student/${data._id}/status`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'leave_permanently',
                    note: reason
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Đã có lỗi xảy ra từ máy chủ.');
            }
            setIsLoading(false);
            setNotification({
                open: true,
                status: true,
                mes: 'Báo nghỉ học sinh thành công!'
            });
            setReason('');
            onStudentUpdated?.();
            reloadData?.();

        } catch (error) {
            setIsLoading(false);
            setNotification({
                open: true,
                status: false,
                mes: error.message || 'Đã có lỗi xảy ra. Vui lòng thử lại.'
            });
        }
    };

    const handleCloseNoti = () => {
        setNotification({ ...notification, open: false });
        if (notification.status) router.refresh();
    };

    return (
        <>
            <WrapIcon
                icon={<Svg_Out w={16} h={16} c={'white'} />}
                content='Báo nghỉ'
                placement='left'
                style={{ background: 'var(--red)' }}
                click={handleOpenPopup}
            />
            {isLoading && <div style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, bottom: 0, right: 0, background: 'rgba(0, 0, 0, 0.8)' }}>
                <Loading content={<p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Đang xử lý...</p>} />
            </div>}
            <AlertPopup
                open={isAlertOpen}
                onClose={handleClosePopup}
                type="warning"
                title="Xác nhận báo nghỉ"
                content={
                    <>
                        <p className='text-sm font-normal text-[var(--text-primary)]' style={{ margin: '8px 0' }}>Bạn có chắc chắn muốn cho học sinh này nghỉ hẳn không?</p>
                        <TextNoti color={'yellow'} title={'Hành động vĩnh viễn'} mes={'Học sinh sẽ được gỡ khỏi tất cả các khóa học đang hoạt động và chuyển sang trạng thái "Đã nghỉ".'} />
                        <textarea
                            className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none'
                            style={{ width: 'calc(100% - 24px)', height: 70, fontFamily: 'Roboto', marginTop: 12 }}
                            placeholder='Lý do báo nghỉ (bắt buộc)'
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </>
                }
                actions={
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <div className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ background: 'var(--border-color)' }} onClick={handleClosePopup}>
                            <p className='text-sm font-normal text-[var(--text-primary)]'>Hủy bỏ</p>
                        </div>
                        <div className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ background: 'var(--red)' }} onClick={handleConfirmUpdate} >
                            <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Xác nhận</p>
                        </div>
                    </div>
                }
            />
            <Noti
                open={notification.open}
                onClose={handleCloseNoti}
                status={notification.status}
                mes={notification.mes}
                button={<div onClick={handleCloseNoti} className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ width: 'calc(100% - 24px)', justifyContent: 'center' }}>Tắt thông báo</div>}
            />
        </>
    );
}