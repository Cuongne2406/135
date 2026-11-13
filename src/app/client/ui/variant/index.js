'use client';
import React, { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { createVariantAction, updateVariantAction } from '@/app/actions/variant.actions';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Noti from '@/components/(features)/(noti)/noti';
import Loading from '@/components/(ui)/(loading)/loading';
import { Svg_Add, Svg_Variant } from '@/components/(icon)/svg';
import Title from '@/components/(features)/(popup)/title';
import { formatDate } from '@/function';

function SubmitButton({ text = 'Thực hiện' }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending} className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ transform: 'none', margin: 0 }}>
            {text}
        </button>
    );
}
function VariantForm({ formAction, formState, initialData = null, submitText }) {
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [phrases, setPhrases] = useState(initialData?.phrases?.join('\n') || '');
    useEffect(() => {
        if (formState.status === true && !initialData) {
            setName('');
            setDescription('');
            setPhrases('');
        }
    }, [formState, initialData]);
    useEffect(() => {
        setName(initialData?.name || '');
        setDescription(initialData?.description || '');
        setPhrases(initialData?.phrases?.join('\n') || '');
    }, [initialData]);
    return (
        <form action={formAction} className={'flex flex-col gap-4'}>
            {initialData?._id && <input type="hidden" name="id" value={initialData._id} />}
            <div className={'flex flex-col gap-1 mb-4'}>
                <label htmlFor="name">Tên biến thể</label>
                <input className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' type="text" id="name" name="name" placeholder="Ví dụ: Lời chào hỏi" required value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className={'flex flex-col gap-1 mb-4'}>
                <label htmlFor="description">Mô tả biến thể</label>
                <textarea style={{ resize: 'none', height: 50 }} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' id="description" name="description" rows={3} placeholder="Mô tả ngắn về mục đích của biến thể này" value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>
            <div className={'flex flex-col gap-1 mb-4'}>
                <label htmlFor="phrases">Các cụm từ (mỗi cụm từ một dòng)</label>
                <textarea style={{ resize: 'vertical', height: 150 }} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' id="phrases" name="phrases" rows={5} placeholder={'Ví dụ:\nXin chào\nChào bạn\nHello'} value={phrases} onChange={(e) => setPhrases(e.target.value)} />
            </div>
            <SubmitButton text={submitText} />
        </form>
    );
}
export default function SettingVariant({ data }) {
    const router = useRouter();
    const [isListOpen, setIsListOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isUpdateOpen, setIsUpdateOpen] = useState(false);
    const [editingItem, setEditingItem] = useState(null);
    const [notification, setNotification] = useState({ open: false, status: true, mes: '' });
    const [createState, createAction] = useActionState(createVariantAction, { message: null, status: null });
    const [updateState, updateAction] = useActionState(updateVariantAction, { message: null, status: null });
    const isActionPending = createState.pending || updateState.pending;
    const handleActionComplete = (state, callback) => {
        if (state.message) {
            setNotification({ open: true, status: state.status, mes: state.message });
            if (state.status) {
                router.refresh();
                if (callback) callback();
            }
        }
    };
    useEffect(() => { handleActionComplete(createState, () => setIsCreateOpen(false)) }, [createState]);
    useEffect(() => { handleActionComplete(updateState, () => setIsUpdateOpen(false)) }, [updateState]);
    const handleOpenUpdate = (item) => {
        setEditingItem(item);
        setIsUpdateOpen(true);
    };
    return (
        <>
            <button className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100' onClick={() => setIsListOpen(true)}>
                <Svg_Variant w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'var(--text-primary)'} />
                <h5 className='font-normal'>Biến thể</h5>
            </button>
            <FlexiblePopup open={isListOpen} onClose={() => setIsListOpen(false)} title="Cài đặt Biến thể" width={'600px'}
                renderItemList={() => (
                    <div className={'p-4 flex flex-col gap-2 h-[calc(100%-32px)]'}>
                        <div className={'flex justify-between'} style={{ paddingBottom: 8, borderBottom: 'thin solid var(--border-color)' }}>
                            <button className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100' onClick={() => setIsCreateOpen(true)}>
                                <Svg_Add w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'var(--text-primary)'} />
                                <h5 className='font-normal'>Tạo biến thể mới</h5>
                            </button>
                        </div>
                        <div className={'flex flex-col gap-1 overflow-y-auto mr-[-12px] pr-1'} >
                            {data.map((item) => (
                                <div key={item._id} className={'p-2 rounded-md bg-[var(--bg-primary)] cursor-pointer transition-all duration-300 hover:bg-[var(--hover)] flex flex-col gap-2'} onClick={() => handleOpenUpdate(item)}>
                                    <h5 style={{ textTransform: 'uppercase' }}>{item.name}</h5>
                                    <div style={{ display: 'flex', gap: 16 }}>
                                        <h6>Ngày tạo: {formatDate(new Date(item.createdAt)) || 'Không rõ'}</h6>
                                    </div>
                                    <h5 className="font-normal">{item.description}</h5>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            />
            <CenterPopup open={isCreateOpen} onClose={() => setIsCreateOpen(false)} size="md">
                <Title content="Tạo biến thể mới" click={() => setIsCreateOpen(false)} />
                <div className={'p-4'}>
                    <VariantForm formAction={createAction} formState={createState} submitText="Tạo biến thể" />
                </div>
            </CenterPopup>
            <CenterPopup key={editingItem?._id || 'update'} open={isUpdateOpen} onClose={() => setIsUpdateOpen(false)} size="md">
                {editingItem && (
                    <>
                        <Title content="Chỉnh sửa biến thể" click={() => setIsUpdateOpen(false)} />
                        <div className={'p-4'}>
                            <VariantForm formAction={updateAction} formState={updateState} initialData={editingItem} submitText="Cập nhật" />
                        </div>
                    </>
                )}
            </CenterPopup>
            <Noti open={notification.open} onClose={() => setNotification(p => ({ ...p, open: false }))} status={notification.status} mes={notification.mes} />
            {isActionPending && (
                <div className='loadingOverlay' style={{ zIndex: 9999 }}>
                    <Loading content={<h5>Đang xử lý...</h5>} />
                </div>
            )}
        </>
    );
}