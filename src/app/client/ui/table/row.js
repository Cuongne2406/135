'use client';
import { useState, useEffect, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { truncateString } from '@/function';
import { updateCustomerInfo, addCareNoteAction, convertToStudentAction, updateCustomerStatusAction, revalidateData } from '@/app/actions/customer.actions';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Title from '@/components/(features)/(popup)/title';
import Noti from '@/components/(features)/(noti)/noti';
import Loading from '@/components/(ui)/(loading)/loading';
import Image from 'next/image';
import { Svg_Send, Svg_Pen, Svg_Check, Svg_Out, Svg_History, Svg_Chat_1 } from '@/components/(icon)/svg';
import { history_data } from '@/data/actions/get';

function HistoryLogItem({ log }) {
    const getActionTypeName = (type) => {
        switch (type) {
            case 'findUid': return 'Tìm UID';
            case 'sendMessage': return 'Gửi Tin Nhắn';
            case 'addFriend': return 'Kết Bạn';
            default: return 'Hành động';
        }
    };

    const statusSuccess = log.status?.status === true;
    const escapeHtml = s => s.replace(/[&<>"']/g, m => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
    const message = (log.status?.message ?? '').replace(/\r\n?/g, '\n');
    console.log(message);

    return (
        <div className='flex gap-3 py-3 px-4 border-b border-gray-100 items-start'>
            <Image
                src={log.zalo?.avt || 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG'}
                alt={log.zalo?.name || 'Zalo'}
                width={40} height={40}
                className='object-cover rounded-full'
            />
            <div className='flex-1 flex flex-col gap-1'>
                <h5 className='leading-[1.3]'>
                    {getActionTypeName(log.type)} -  Zalo thực hiện: {log.zalo?.name || 'Không rõ'}
                </h5>
                <div className='flex gap-2'>
                    <h6>Người thực hiện: {log.createBy?.name || 'Hệ thống'}</h6>
                    <h6>Thời gian: {new Date(log.createdAt).toLocaleString('vi-VN')}</h6>
                </div>
                <div className='flex items-center gap-2 mt-2'>
                    <span style={{
                        width: 8, height: 8, borderRadius: '50%',
                        backgroundColor: statusSuccess ? 'var(--green)' : 'var(--red)'
                    }}></span>

                    {log.type == 'checkFriend' ?
                        <h5 className='font-normal italic' style={{ color: statusSuccess ? 'var(--green)' : 'var(--red)' }}>
                            {log.status?.data?.error_message == 1 ? 'Đã là bạn bè' : 'Chưa là bạn bè'}
                        </h5> :
                        <h5 className='font-normal italic' style={{ color: statusSuccess ? 'var(--green)' : 'var(--red)' }}>
                            {log.status?.data?.error_message == 'Successful.' ? 'Thực hiện hành động thành công!' : 'Lỗi'}
                        </h5>
                    }

                </div>
                {log.type != 'findUid' && log.type != 'checkFriend' &&
                    <div className='flex flex-col gap-2 mt-2'>
                        <h6 className='font-normal'>
                            Nội dung gửi :
                        </h6>
                        <h6 className='whitespace-pre-line'>{message}</h6>
                    </div>
                }
            </div>
        </div>
    );
}

function MiniSubmitButton({ text, pending }) {
    return <button type="submit" disabled={pending} className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100'>
        <Svg_Send w={'var(--font-size-xs)'} h={'var(--font-size-xs)'} c={'var(--text-primary)'} />
        <h5>{text}</h5>
    </button>;
}

function CustomerUpdateForm({ formAction, initialData, onClose, isAnyActionPending }) {
    const { pending } = useFormStatus();
    const formatDateForInput = (isoDate) => {
        if (!isoDate) return '';
        try {
            return new Date(isoDate).toISOString().split('T')[0];
        } catch {
            return '';
        }
    };
    return (
        <form action={formAction} className='flex flex-col gap-4 p-4'>
            <input type="hidden" name="_id" value={initialData._id} />
            <div className='flex flex-col gap-1'>
                <label htmlFor="name">Tên khách hàng</label>
                <input id="name" name="name" defaultValue={initialData.name} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' required disabled={isAnyActionPending} />
            </div>
            <div className='flex flex-col gap-1'>
                <label htmlFor="bd">Ngày sinh</label>
                <input id="bd" name="bd" type="date" defaultValue={formatDateForInput(initialData.bd)} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' disabled={isAnyActionPending} />
            </div>
            <div className='flex flex-col gap-1'>
                <label htmlFor="nameparent">Tên phụ huynh</label>
                <input id="nameparent" name="nameparent" defaultValue={initialData.nameparent} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' disabled={isAnyActionPending} />
            </div>
            <div className='flex flex-col gap-1'>
                <label htmlFor="phone">Số điện thoại</label>
                <input id="phone" name="phone" defaultValue={initialData.phone} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' required disabled={isAnyActionPending} />
            </div>
            <div className='flex flex-col gap-1'>
                <label htmlFor="email">Email</label>
                <input id="email" name="email" type="email" defaultValue={initialData.email} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' disabled={isAnyActionPending} />
            </div>
            <div className='flex justify-end gap-2 pt-4'>
                <button type="button" onClick={onClose} className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100' disabled={pending || isAnyActionPending}>
                    <h5>Hủy</h5>
                </button>
                <button type="submit" className='px-3 py-2 rounded bg-[var(--main_d)] text-white flex items-center gap-2 justify-center whitespace-nowrap border-none cursor-pointer transition-all duration-200 hover:bg-[var(--main_b)]' disabled={pending || isAnyActionPending}>
                    <h5>Lưu thay đổi</h5>
                </button>
            </div>
        </form>
    );
}

export default function CustomerRow({ customer, index, isSelected, onSelect, visibleColumns, user, viewMode, zalo }) {


    const router = useRouter();
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [notification, setNotification] = useState({ open: false, status: true, mes: '' });
    const [isUpdatePopupOpen, setIsUpdatePopupOpen] = useState(false);
    const [infoState, updateInfoAction, isInfoPending] = useActionState(updateCustomerInfo, null);
    const [noteState, addNoteAction, isNotePending] = useActionState(addCareNoteAction, null);
    const [statusState, updateStatusAction, isStatusPending] = useActionState(updateCustomerStatusAction, null);
    const [conversionState, convertToStudentActionFn, isConversionPending] = useActionState(convertToStudentAction, null);
    const [comment, setComment] = useState('');
    const [totudent, setToStudent] = useState(false);
    const noteFormRef = useRef(null);
    const [historyData, setHistoryData] = useState(null);
    const [isLoadingHistory, setIsLoadingHistory] = useState(false);
    const [historyError, setHistoryError] = useState('');

    const isAnyActionPending = isInfoPending || isNotePending || isStatusPending || isConversionPending;
    const handleClosePopup = () => setIsPopupOpen(false);
    useEffect(() => {
        if (!infoState) return;
        if (infoState.success) {
            setNotification({ open: true, status: true, mes: 'Cập nhật thông tin thành công!' });
            router.refresh();
            setIsUpdatePopupOpen(false);
        } else if (infoState.error) {
            setNotification({ open: true, status: false, mes: infoState.error });
        }
    }, [infoState, router]);
    useEffect(() => {
        if (noteState?.success) {
            setNotification({ open: true, status: true, mes: 'Thêm ghi chú thành công!' });
            setComment('');
            noteFormRef.current?.reset();
            router.refresh();
        } else if (noteState?.error) {
            setNotification({ open: true, status: false, mes: noteState.error });
        }
        if (statusState?.success) {
            setNotification({ open: true, status: true, mes: statusState.message });
            router.refresh();
        } else if (statusState?.error) {
            setNotification({ open: true, status: false, mes: statusState.error });
        }
        if (conversionState?.success) {
            setToStudent(true);
            setNotification({ open: true, status: true, mes: conversionState.message });
            router.refresh();
        } else if (conversionState?.error) {
            setNotification({ open: true, status: false, mes: conversionState.error });
        }
    }, [noteState, statusState, conversionState, router]);
    const handleOpenPopup = (e) => {
        if (!e.target.closest('.checkbox-container') && !isAnyActionPending) {
            setIsPopupOpen(true);
        }
    };
    const handleCloseNoti = () => {
        setNotification(p => ({ ...p, open: false }));
        totudent ? (revalidateData(), setToStudent(false)) : null;
    };
    const getStatusText = (status) => {
        switch (status) {
            case 0: return 'Chưa chăm sóc';
            case 1: return 'Nhập học';
            case 2: return 'Không quan tâm';
            case 3: return 'Chăm sóc sau';
            case 4: return 'Đang chăm sóc';
            default: return 'Chưa chăm sóc';
        }
    };
    const [isHistoryPopupOpen, setIsHistoryPopupOpen] = useState(false);
    const handleShowHistory = async () => {
        if (isAnyActionPending) return;

        setIsHistoryPopupOpen(true);
        setIsLoadingHistory(true);
        setHistoryError('');
        const result = await history_data(
            customer._id,
            customer.type ? 'student' : 'customer'
        );
        if (result.success) {
            setHistoryData(result.data);
        } else {
            setHistoryError(result.error);
        }
        setIsLoadingHistory(false);
    };

    const handleCloseHistory = () => {
        setIsHistoryPopupOpen(false);
        setHistoryData(null);
        setHistoryError('');
    };

    return (
        <>
            <div className={`flex shrink-0 min-w-full cursor-pointer hover:bg-[var(--hover)] ${isAnyActionPending ? 'opacity-50 pointer-events-none' : ''}`} onClick={handleOpenPopup}>
                {viewMode === 'manage' && <div className="p-3 text-left text-[var(--text-primary)] border-b border-[var(--border-color)] whitespace-nowrap shrink-0 w-15 text-center">
                    <label className='flex items-center justify-center cursor-pointer'>
                        <input
                            type="checkbox"
                            className='w-4 h-4 accent-[var(--main_d)]'
                            checked={isSelected}
                            onChange={(e) => onSelect(customer, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            disabled={isAnyActionPending}
                        />
                    </label>
                </div>}
                <div className="p-3 text-left text-[var(--text-primary)] border-b border-[var(--border-color)] whitespace-nowrap shrink-0 w-15 text-center"><h6>{index}</h6></div>
                {visibleColumns.map(colKey => (
                    <div key={colKey} className="flex-1 p-3 text-left text-[var(--text-primary)] border-b border-[var(--border-color)] truncate">
                        <h6 className="truncate flex items-center gap-2">
                            {(() => {
                                const value = customer[colKey];
                                if (value === null || value === undefined || value === '') return '-';
                                switch (colKey) {
                                    case 'bd': return new Date(value).toLocaleDateString('vi-VN');
                                    case 'status': return <>
                                        <span style={{
                                            width: 8, height: 8, borderRadius: 50, display: 'block',
                                            background: customer.status == 4 ? 'var(--green)' : customer.status == 2 ? 'var(--red)' : customer.status == 3 ? 'var(--yellow)' : '#989898'
                                        }}></span> {getStatusText(customer.status)} ({customer.care.length} ghi chú)</>;
                                    case 'type': return value ? 'Học viên' : 'Khách hàng';
                                    case 'statusaction': return value ? value.actionType == "findUid" ? "Đang tìm uid" : 'Đang gửi tin nhắn' : 'Chưa có hành động';
                                    default: return truncateString(value.toString(), 30, 1);
                                }
                            })()}
                        </h6>
                    </div>
                ))}
            </div>
            {isAnyActionPending && (
                <div className='loadingOverlay z-[9999]'>
                    <Loading content={<h5>Đang xử lý...</h5>} />
                </div>
            )}
            <FlexiblePopup
                open={isPopupOpen}
                onClose={handleClosePopup}
                title={`Chi tiết: ${customer.name}`}
                width={'500px'}
                secondaryOpen={isHistoryPopupOpen}
                onCloseSecondary={handleCloseHistory}
                secondaryTitle={`Lịch sử hành động`}
                providedDataSecondary={customer.care}
                width2={'550px'}
                renderSecondaryList={() => (
                    <div className='scroll flex flex-col gap-2 p-2'>
                        {isLoadingHistory && <Loading content="Đang tải lịch sử..." />}
                        {historyError && <p className='text-red-500 text-center p-4'>{historyError}</p>}

                        {!isLoadingHistory && !historyError && (
                            historyData && historyData.length > 0 ? (
                                historyData.map((log) => (
                                    <HistoryLogItem key={log._id} log={log} />
                                ))
                            ) : (
                                <div className='flex items-center justify-center h-[30px]'>
                                    <h5 className='font-normal italic'>
                                        Không có lịch sử Zalo nào
                                    </h5>
                                </div>
                            )
                        )}
                    </div>
                )}
                renderItemList={() => (
                    <div className='flex flex-col'>
                        <div className='border-b border-[var(--border-color)] p-4'>
                            <h4 className='pb-2 border-b border-dashed border-[var(--border-color)]'>Hành động</h4>
                            <div className='grid grid-cols-2 gap-3 p-4'>
                                {customer.type === false && (
                                    <>
                                        <form action={updateStatusAction} className='flex flex-col p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors'>
                                            <input type="hidden" name="customerId" value={customer._id} />
                                            <input type="hidden" name="status" value="4" />
                                            <button type="submit" disabled={isAnyActionPending} className='w-full text-left bg-transparent border-none cursor-pointer flex flex-col gap-1 p-0'>
                                                <div className='flex gap-2 items-center'>
                                                    <Svg_Chat_1 w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'var(--text-primary)'} />
                                                    <h5 className='font-medium'>Đang chăm sóc</h5>
                                                </div>
                                                <h6 className='font-normal'>Đang tiến hành chăm sóc</h6>
                                            </button>
                                        </form>
                                        <button className='flex flex-col p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors' onClick={() => setIsUpdatePopupOpen(true)} disabled={isAnyActionPending}>
                                            <div className='flex gap-2 items-center'>
                                                <Svg_Pen w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'var(--text-primary)'} />
                                                <h5 className='font-medium'>Cập nhật thông tin</h5>
                                            </div>
                                            <h6 className='font-normal'>Chỉnh sửa thông tin khách hàng</h6>
                                        </button>
                                        <form action={updateStatusAction} className='flex flex-col p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors'>
                                            <input type="hidden" name="customerId" value={customer._id} />
                                            <input type="hidden" name="status" value="2" />
                                            <button type="submit" disabled={isAnyActionPending} className='w-full text-left bg-transparent border-none cursor-pointer flex flex-col gap-1 p-0'>
                                                <div className='flex gap-2 items-center'>
                                                    <Svg_Out w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'var(--text-primary)'} />
                                                    <h5 className='font-medium'>Không quan tâm</h5>
                                                </div>
                                                <h6 className='font-normal'>Kết thúc chăm sóc</h6>
                                            </button>
                                        </form>
                                        <form action={convertToStudentActionFn} className='flex flex-col p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors'>
                                            <input type="hidden" name="customerId" value={customer._id} />
                                            <button type="submit" disabled={isAnyActionPending} className='w-full text-left bg-transparent border-none cursor-pointer flex flex-col gap-1 p-0'>
                                                <div className='flex gap-2 items-center'>
                                                    <Svg_Check w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'var(--text-primary)'} />
                                                    <h5 className='font-medium'>Chuyển thành học sinh</h5>
                                                </div>
                                                <h6 className='font-normal'>Xác nhận chăm sóc thành công</h6>
                                            </button>
                                        </form>
                                        <form action={updateStatusAction} className='flex flex-col p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors'>
                                            <input type="hidden" name="customerId" value={customer._id} />
                                            <input type="hidden" name="status" value="3" />
                                            <button type="submit" disabled={isAnyActionPending} className='w-full text-left bg-transparent border-none cursor-pointer flex flex-col gap-1 p-0'>
                                                <div className='flex gap-2 items-center'>
                                                    <Svg_History w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'var(--text-primary)'} />
                                                    <h5 className='font-medium'>Tạm thời</h5>
                                                </div>
                                                <h6 className='font-normal'>Chăm sóc lại sau</h6>
                                            </button>
                                        </form>
                                    </>)}
                                <button className='flex flex-col p-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 cursor-pointer transition-colors' onClick={handleShowHistory} disabled={isAnyActionPending}>
                                    <div className='flex gap-2 items-center'>
                                        <Svg_History w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'var(--text-primary)'} />
                                        <h5 className='font-medium'>Lịch sử chăm sóc</h5>
                                    </div>
                                    <h6 className='font-normal'>Lịch sử gửi tin nhắn zalo</h6>
                                </button>
                            </div>
                        </div>
                        {customer.type === false && (
                            <>
                                <div className='p-4 border-b border-gray-200' >
                                    <h4 className='pb-2 border-b border-dashed border-[var(--border-color)]'>Chi tiết khách hàng</h4>
                                    <div className='pt-4 flex flex-col gap-1'>
                                        <div className='flex gap-2 items-center'><h5>Tên:</h5> <h5>{customer.name}</h5></div>
                                        <div className='flex gap-2 items-center'><h5>Ngày sinh: </h5><h5>{customer.bd ? new Date(customer.bd).toLocaleDateString('vi-VN') : 'Thiếu thông tin'}</h5></div>
                                        <div className='flex gap-2 items-center'><h5>Tên phụ huynh:</h5> <h5>{customer.nameparent || 'Thiếu thông tin'}</h5></div>
                                        <div className='flex gap-2 items-center'><h5>Số điện thoại: </h5><h5>{customer.phone}</h5></div>
                                        <div className='flex gap-2 items-center'><h5>Email: </h5><h5>{customer.email || 'Thiếu thông tin'}</h5></div>
                                        <div className='flex gap-2 items-center'><h5>Kết quả chăm sóc: </h5><h5>{getStatusText(customer.status)}</h5></div>
                                        <div className='flex gap-2 items-center'><h5>Nguồn dữ liệu: </h5><h5>{customer.source}</h5></div>
                                    </div>
                                </div>
                                <div className='p-4 border-b border-gray-200' >
                                    <h4 className='pb-2 border-b border-dashed border-[var(--border-color)]'>Thông tin zalo</h4>
                                    <div className='flex gap-2 pt-2 flex-col'>
                                        {customer.uid == null ? (
                                            <h5>Không tìm được zalo</h5>
                                        ) : <>
                                            {customer.uid.length > 0 ?
                                                customer.zaloname &&
                                                <div className='flex gap-2'>
                                                    <div className='w-10 h-10 object-cover rounded-full' style={{ backgroundImage: `url(${customer.zaloavt || 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG'})` }} />
                                                    <div className='flex flex-col gap-1'>
                                                        <h5 >{customer.zaloname || 'Chưa rõ'}</h5>
                                                        <h6>{customer.phone}</h6>
                                                    </div>
                                                </div> :
                                                customer.uid.length === 0 ?
                                                    <h6 className='italic'>Chưa tìm kiếm uid</h6> :
                                                    <h6 className='italic'>Không tìm thấy tài khoản zalo</h6>
                                            }
                                            <h4 className='pt-4 pb-2 border-b border-dashed border-[var(--border-color)]'>Zalo chăm sóc</h4>
                                            {customer.uid.map((r, index) => {
                                                let ac = zalo.filter(t => t._id == r.zalo)
                                                if (ac.length) ac = ac[0]
                                                if (!ac) return
                                                return (
                                                    <div>
                                                        <div className='flex gap-2 items-center'>
                                                            <h5>{ac.name} </h5> <h6>{ac.phone}</h6>
                                                        </div>
                                                        <h6>Trạng thái kết bạn: {r.isReques ? 'Đang chờ xác nhận' : 'Chưa gửi kết bạn'} ({r.isFriend ? 'Bạn bè' : 'Không phải bạn bè'})</h6>
                                                    </div>
                                                )
                                            })}
                                        </>}

                                    </div>
                                </div>
                                <div className='border-b border-[var(--border-color)] p-4'>
                                    <h4 className='pb-2 border-b border-dashed border-[var(--border-color)]'>Ghi chú chăm sóc</h4>
                                    <div className='scroll flex flex-col gap-3 max-h-60 overflow-y-auto p-4'>
                                        {customer.care?.slice().reverse().map((note, index) => (
                                            <div key={index} className='flex gap-3 p-3 border-b border-gray-100'>
                                                <Image src={note.createBy?.avt || 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG'} alt={note.createBy?.name || 'Chưa rõ'} width={40} height={40} className='object-cover rounded-full' />
                                                <div className='flex-1 flex flex-col gap-1'>
                                                    <h5 className='leading-[1.3]'>{note.createBy?.name || 'Chưa rõ'}<small className='ml-2 font-normal'>{new Date(note.createAt).toLocaleString('vi-VN')}</small></h5>
                                                    <h5 className='font-normal mt-2 leading-[1.3]'>{note.content}</h5>
                                                </div>
                                            </div>
                                        ))}
                                        {(!customer.care || customer.care.length === 0) && (
                                            <div className='flex items-center justify-center h-[30px]'>
                                                <h5 className='font-normal italic'>Chưa có ghi chú nào</h5>
                                            </div>
                                        )}
                                    </div>
                                    <form action={addNoteAction} ref={noteFormRef} className='flex items-start gap-3 p-4 border-t border-gray-200'>
                                        <Image src={user.avt || 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG'} alt={user.name || 'Chưa rõ'} width={40} height={40} className='object-cover rounded-full' />
                                        <input type="hidden" name="customerId" value={customer._id} />
                                        <textarea name="content" placeholder="Viết bình luận chăm sóc..." className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none w-full' value={comment} onChange={(e) => setComment(e.target.value)} rows={3} disabled={isAnyActionPending} />
                                        <MiniSubmitButton text={'Gửi'} pending={isAnyActionPending} />
                                    </form>
                                </div>
                            </>
                        )}
                    </div >
                )
                }
            />
            < CenterPopup open={isUpdatePopupOpen} onClose={() => !isAnyActionPending && setIsUpdatePopupOpen(false)} size="md" >
                <Title content="Chỉnh sửa thông tin khách hàng" click={() => !isAnyActionPending && setIsUpdatePopupOpen(false)} />
                <div className='p-4'>
                    <CustomerUpdateForm
                        formAction={updateInfoAction}
                        initialData={customer}
                        onClose={() => setIsUpdatePopupOpen(false)}
                        isAnyActionPending={isAnyActionPending}
                    />
                </div>
            </CenterPopup >
            <Noti open={notification.open} onClose={handleCloseNoti} status={notification.status} mes={notification.mes} />
        </>
    );
}