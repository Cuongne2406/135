'use client';

import React, { useState } from 'react';
import { Svg_Add } from "@/components/(icon)/svg";
import AlertPopup from '@/components/(features)/(noti)/alert';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import { useRouter } from 'next/navigation';

export default function Reinstate({ onStudentUpdated, reloadData, data }) {
    const router = useRouter();
    const [isAlertOpen, setIsAlertOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [reason, setReason] = useState('');
    const [notification, setNotification] = useState({
        open: false,
        status: true,
        mes: ''
    });

    const handleOpenPopup = () => setIsAlertOpen(true);
    const handleClosePopup = () => { setIsAlertOpen(false); setReason(''); };

    const handleConfirm = async () => {
        if (!data?._id) {
            setNotification({ open: true, status: false, mes: 'Lỗi: Không tìm thấy ID học sinh.' });
            return;
        }

        if (!reason.trim()) {
            setNotification({ open: true, status: false, mes: 'Vui lòng nhập lý do học lại.' });
            setIsAlertOpen(false);
            return;
        }

        setIsAlertOpen(false);
        setIsLoading(true);

        try {
            const response = await fetch(`/api/student/${data._id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'reactivate', note: reason }),
            });

            const result = await response.json();
            if (!response.ok) throw new Error(result.message || 'Đã có lỗi xảy ra từ máy chủ.');

            setIsLoading(false);
            setNotification({ open: true, status: true, mes: 'Học lại thành công!' });
            setReason('');
            onStudentUpdated?.();
            reloadData?.();
        } catch (error) {
            setIsLoading(false);
            setNotification({ open: true, status: false, mes: error.message || 'Đã có lỗi xảy ra.' });
        }
    };

    const handleCloseNoti = () => {
        setNotification({ ...notification, open: false });
        if (notification.status) router.refresh();
    };

    return (
        <>
            <WrapIcon
                icon={<Svg_Add w={16} h={16} c={'white'} />}
                content='Học lại'
                placement='left'
                style={{ background: 'var(--green)' }}
                click={handleOpenPopup}
            />
            {isLoading && (
                <div style={{ zIndex: 9999, position: 'fixed', top: 0, left: 0, bottom: 0, right: 0, background: 'rgba(0, 0, 0, 0.8)' }}>
                    <Loading content={<p className='text-sm font-normal' style={{ color: 'white' }}>Đang xử lý...</p>} />
                </div>
            )}
            <AlertPopup
                open={isAlertOpen}
                onClose={handleClosePopup}
                type="info"
                title="Xác nhận học lại"
                content={
                    <>
                        <p className='text-sm font-normal text-[var(--text-primary)]' style={{ margin: '8px 0' }}>Bạn có chắc chắn muốn cho học sinh này học lại không?</p>
                        <TextNoti color={'blue'} title={'Khôi phục trạng thái'} mes={'Học sinh sẽ được chuyển sang trạng thái "Đang học" và các khóa đang bảo lưu sẽ được kích hoạt lại.'} />
                        <textarea
                            className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none'
                            style={{ width: 'calc(100% - 24px)', height: 70, fontFamily: 'Roboto', marginTop: 12 }}
                            placeholder='Lý do học lại (bắt buộc)'
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
                        <div className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ background: 'var(--green)' }} onClick={handleConfirm}>
                            <p className='text-sm font-normal' style={{ color: 'white' }}>Xác nhận</p>
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
