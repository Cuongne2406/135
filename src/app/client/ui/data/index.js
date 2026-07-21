'use client';

import React, { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createAreaAction, updateAreaAction, deleteAreaAction, syncCustomersFromSheetAction } from '@/app/actions/data.actions';
import AlertPopup from '@/components/(features)/(noti)/alert';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Noti from '@/components/(features)/(noti)/noti';
import Loading from '@/components/(ui)/(loading)/loading';
import { Svg_Add, Svg_Data, Svg_Area, Svg_Delete, Svg_Coppy, Svg_Download } from '@/components/(icon)/svg';
import Title from '@/components/(features)/(popup)/title';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import { formatDate } from '@/function';
import { revalidateData } from '@/app/actions/customer.actions';

function SubmitButton({ text = 'Thực hiện' }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ transform: 'none', margin: 0 }}>
            {pending ? 'Đang xử lý...' : text}
        </button>
    );
}

// Component chọn trường hiển thị
const fieldOptions = [
    { id: 1, label: 'Họ và Tên' },
    { id: 2, label: 'Tên phụ huynh' },
    { id: 3, label: 'Số điện thoại' },
    { id: 4, label: 'Email' },
    { id: 5, label: 'Khu vực' },
    { id: 6, label: 'Ngày sinh' },
];

function FieldSelector({ selectedFields, setSelectedFields }) {
    const handleToggleField = (fieldId) => {
        setSelectedFields(prev =>
            prev.includes(fieldId) ? prev.filter(id => id !== fieldId) : [...prev, fieldId]
        );
    };

    return (
        <div className={'flex flex-col gap-1 mb-4'}>
            <label>Các trường hiển thị trên form</label>
            <div className={'flex flex-wrap gap-2'}>
                {fieldOptions.map(field => (
                    <button
                        key={field.id}
                        type="button"
                        className={`${'p-[8px_12px] rounded border border-[var(--hover)] bg-[var(--bg-secondary)] text-[var(--text-primary)] cursor-pointer transition-all duration-200 text-xs'} ${selectedFields.includes(field.id) ? 'bg-[var(--main_d)] text-white border-[var(--border-color)]' : ''}`}
                        onClick={() => handleToggleField(field.id)}
                    >
                        {field.label}
                    </button>
                ))}
            </div>
        </div>
    );
}


// AreaForm được cập nhật để chứa logic chọn trường
function AreaForm({ formAction, formState, initialData = null, submitText }) {
    const [name, setName] = useState('');
    const [describe, setDescribe] = useState('');
    const defaultFields = [1, 2, 3, 4, 5, 6];
    const [selectedFields, setSelectedFields] = useState(defaultFields);

    useEffect(() => {
        if (formState.status === true && !initialData) {
            setName('');
            setDescribe('');
            setSelectedFields(defaultFields);
        }
    }, [formState, initialData]);

    useEffect(() => {
        setName(initialData?.name || '');
        setDescribe(initialData?.describe || '');
        setSelectedFields(
            initialData?.formInput && initialData.formInput.length > 0
                ? initialData.formInput
                : defaultFields
        );
    }, [initialData]);

    return (
        <form action={formAction} className={'flex flex-col gap-4'}>
            {initialData?._id && <input type="hidden" name="id" value={initialData._id} />}

            {/* Thêm các input ẩn để gửi dữ liệu mảng formInput */}
            {selectedFields.map(fieldId => (
                <input type="hidden" name="formInput" key={fieldId} value={fieldId} />
            ))}

            <div className={'flex flex-col gap-1 mb-4'}>
                <label htmlFor="name">Tên nguồn</label>
                <input
                    className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none'
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Ví dụ: Dữ liệu Marketing"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>
            <div className={'flex flex-col gap-1 mb-4'}>
                <label htmlFor="describe">Mô tả nguồn nhận dữ liệu</label>
                <textarea
                    style={{ resize: 'none', height: 100 }}
                    className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none'
                    id="describe"
                    name="describe"
                    rows={3}
                    placeholder="Mô tả ngắn về nguồn dữ liệu này"
                    value={describe}
                    onChange={(e) => setDescribe(e.target.value)}
                />
            </div>

            {/* Component chọn trường được tích hợp */}
            <FieldSelector selectedFields={selectedFields} setSelectedFields={setSelectedFields} />

            <SubmitButton text={submitText} />
        </form>
    );
}

export default function SettingData({ data }) {
    const router = useRouter();
    const [isRightPopupOpen, setIsRightPopupOpen] = useState(false);
    const [isCreatePopupOpen, setIsCreatePopupOpen] = useState(false);
    const [isUpdatePopupOpen, setIsUpdatePopupOpen] = useState(false);
    const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [copyStatus, setCopyStatus] = useState('idle');
    const [notification, setNotification] = useState({ open: false, status: true, mes: '' });

    const [createState, createAction, isCreatePending] = useActionState(createAreaAction, { message: null, status: null });
    const [updateState, updateAction, isUpdatePending] = useActionState(updateAreaAction, { message: null, status: null });
    const [deleteState, deleteAction, isDeletePending] = useActionState(deleteAreaAction, { message: null, status: null });
    const [syncState, syncAction, isSyncPending] = useActionState(syncCustomersFromSheetAction, { message: null, status: null });

    const handleActionComplete = (state, closePopupCallback) => {
        if (state.message) {
            setNotification({ open: true, status: state.status, mes: state.message });
            if (state.status === true) {
                revalidateData();
                router.refresh();
                if (closePopupCallback) closePopupCallback();
            }
        }
    };

    useEffect(() => handleActionComplete(createState, () => setIsCreatePopupOpen(false)), [createState]);
    useEffect(() => {
        handleActionComplete(updateState, () => {
            if (updateState.status) {
                setIsUpdatePopupOpen(false);
                setEditingItem(null);
            }
        });
    }, [updateState]);
    useEffect(() => {
        handleActionComplete(deleteState, () => {
            setIsDeleteConfirmOpen(false);
            if (deleteState.status) {
                setIsUpdatePopupOpen(false);
                setItemToDelete(null);
            }
        });
    }, [deleteState]);
    useEffect(() => handleActionComplete(syncState, null), [syncState]);

    const handleOpenUpdatePopup = (item) => {
        setEditingItem(item);
        setIsUpdatePopupOpen(true);
    };

    const handleOpenDeleteConfirm = (item) => {
        setItemToDelete(item);
        setIsDeleteConfirmOpen(true);
    };

    const handleCloseDeleteConfirm = () => setIsDeleteConfirmOpen(false);
    const handleCloseNoti = () => setNotification(prev => ({ ...prev, open: false }));

    const handleCopyToClipboard = async (textToCopy) => {
        if (!navigator.clipboard) {
            setCopyStatus('error');
            setTimeout(() => setCopyStatus('idle'), 2000);
            return;
        }
        try {
            await navigator.clipboard.writeText(textToCopy);
            setCopyStatus('copied');
        } catch (err) {
            setCopyStatus('error');
        } finally {
            setTimeout(() => setCopyStatus('idle'), 2000);
        }
    };

    return (
        <>
            <button className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100' onClick={() => setIsRightPopupOpen(true)}>
                <Svg_Data w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'var(--text-primary)'} />
                <h5 className='font-normal'>Dữ liệu</h5>
            </button>

            <FlexiblePopup
                open={isRightPopupOpen}
                onClose={() => setIsRightPopupOpen(false)}
                title="Cài đặt nguồn dữ liệu"
                width={'600px'}
                renderItemList={() => (
                    <div className={'p-4 flex flex-col gap-2 h-[calc(100%-32px)]'}>
                        <div className={'flex justify-between'}>
                            <button className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100' onClick={() => setIsCreatePopupOpen(true)}>
                                <Svg_Add w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'var(--text-primary)'} />
                                <h5 className='font-normal'>Tạo Form mới</h5>
                            </button>
                            <form action={syncAction}>
                                <button type="submit" className='px-3 py-2 rounded bg-[var(--main_d)] text-white flex items-center gap-2 justify-center whitespace-nowrap border-none cursor-pointer transition-all duration-200 hover:bg-[var(--main_b)]' disabled={isCreatePending || isUpdatePending || isDeletePending || isSyncPending}>
                                    <Svg_Download w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'white'} />
                                    <h5 className='font-normal' style={{ color: 'white' }}>Nhận data từ ggsheet</h5>
                                </button>
                            </form>
                        </div>
                        <div className={'p-4 border border-[var(--border-color)] rounded-md flex-1 flex flex-col overflow-hidden'}>
                            <div className={'pb-2 mb-2 border-b border-dashed border-[var(--border-color)] flex items-center gap-2'}>
                                <Svg_Area w={'var(--font-size-xs)'} h={'var(--font-size-xs)'} c={'var(--text-primary)'} />
                                <h4>Danh sách sự kiện - nguồn dữ liệu</h4>
                            </div>
                            <div className={'flex flex-col gap-1 overflow-y-auto mr-[-12px] pr-1'}>
                                {data.map((item) => (
                                    <div key={item._id} className={'p-2 rounded-md bg-[var(--bg-primary)] cursor-pointer transition-all duration-300 hover:bg-[var(--hover)]'} onClick={() => handleOpenUpdatePopup(item)}>
                                        <h5 style={{ textTransform: 'uppercase' }}>{item.name}</h5>
                                        <div style={{ display: 'flex', gap: 16 }}>
                                            <h6>Ngày tạo: {formatDate(new Date(item.createdAt)) || 'Không rõ'}</h6>
                                            <h6>Được tạo bởi: {item.createdBy?.name || 'Không rõ'}</h6>
                                            <h6>Số khách hàng: {item.customerCount || 0}</h6>
                                        </div>
                                        <h5 className="font-normal">{item.describe}</h5>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            />

            <CenterPopup open={isCreatePopupOpen} onClose={() => setIsCreatePopupOpen(false)} size="md">
                <Title content="Tạo Form mới" click={() => setIsCreatePopupOpen(false)} />
                <div className={'p-4'}>
                    <AreaForm
                        formAction={createAction}
                        formState={createState}
                        submitText="Tạo form mới"
                    />
                </div>
            </CenterPopup>

            <CenterPopup
                key={editingItem?._id || 'update-popup'}
                open={isUpdatePopupOpen}
                onClose={() => { setIsUpdatePopupOpen(false) }}
                size="md"
            >
                {editingItem && (
                    <>
                        <Title content="Chỉnh sửa Form" click={() => { setIsUpdatePopupOpen(false) }} />
                        <div className={'p-4'}>
                            <div className={'flex flex-col gap-1 mb-4'}>
                                <h5>Đường dẫn tới form</h5>
                                <div style={{ display: 'flex', justifyContent: 'space-between', borderRadius: 3, border: ' thin solid var(--border-color)', alignItems: 'center', padding: 3, paddingLeft: 8 }}>
                                    <h5> {`https://airobotic.edu.vn/form/${editingItem._id}`}</h5>
                                    <div style={{ display: 'flex', gap: 4 }}>
                                        <WrapIcon
                                            icon={<Svg_Coppy w={'var(--font-size-base)'} h={'var(--font-size-base)'} c={'var(--text-primary)'} />}
                                            click={() => handleCopyToClipboard(`https://airobotic.edu.vn/form/${editingItem._id}`)}
                                            className='mainIcon'
                                            content={copyStatus === 'copied' ? 'Đã sao chép!' : copyStatus === 'error' ? 'Sao chép lỗi!' : 'Sao chép đường dẫn'}
                                        />
                                        <WrapIcon
                                            icon={<Svg_Delete w={'var(--font-size-base)'} h={'var(--font-size-base)'} c={'white'} />}
                                            click={() => handleOpenDeleteConfirm(editingItem)}
                                            className='deleteIcon'
                                            content="Xóa form này"
                                        />
                                    </div>
                                </div>
                            </div>
                            <AreaForm
                                formAction={updateAction}
                                formState={updateState}
                                initialData={editingItem}
                                submitText="Cập nhật"
                            />
                        </div>
                    </>
                )}
            </CenterPopup>

            <AlertPopup
                open={isDeleteConfirmOpen}
                onClose={handleCloseDeleteConfirm}
                title="Bạn có chắc chắn muốn xóa form này?"
                type="warning"
                width={600}
                content={
                    itemToDelete && (
                        <h5>
                            Hành động này sẽ xóa vĩnh viễn form <strong>"{itemToDelete.name}"</strong>.
                            Bạn sẽ không thể hoàn tác hành động này.
                        </h5>
                    )
                }
                actions={
                    <form action={deleteAction}>
                        <input type="hidden" name="id" value={itemToDelete?._id || ''} />
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button type="button" style={{ whiteSpace: 'nowrap' }} onClick={handleCloseDeleteConfirm} className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100'>
                                <h5>Quay lại</h5>
                            </button>
                            <SubmitButton text="Tiếp tục xóa" />
                        </div>
                    </form>
                }
            />

            {(isCreatePending || isUpdatePending || isDeletePending || isSyncPending) && (
                <div className='loadingOverlay'>
                    <Loading content={<h5>Đang xử lý...</h5>} />
                </div>
            )}

            <Noti
                open={notification.open}
                onClose={handleCloseNoti}
                status={notification.status}
                mes={notification.mes}
                button={<button onClick={handleCloseNoti} className="px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5" style={{ width: '100%' }}>Tắt thông báo</button>}
            />
        </>
    );
}