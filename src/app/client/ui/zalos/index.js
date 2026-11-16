'use client';
import React, { useState, useEffect, useActionState, useMemo } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { updateZaloRolesAction, addZaloAccountAction } from '@/app/actions/zalo.actions';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Noti from '@/components/(features)/(noti)/noti';
import Loading from '@/components/(ui)/(loading)/loading';
import Menu from '@/components/(ui)/(button)/menu';
import Title from '@/components/(features)/(popup)/title';
import { Svg_Add, Svg_Delete, Svg_Mode } from '@/components/(icon)/svg';
import Image from 'next/image';
function RoleSubmitButton({ text = 'Lưu thay đổi' }) {
    const { pending } = useFormStatus();
    return (<button type="submit" disabled={pending} className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5'><h5>{pending ? 'Đang lưu...' : text}</h5></button>);
}
function AddAccountSubmitButton({ text = 'Thêm tài khoản' }) {
    const { pending } = useFormStatus();
    return (<button type="submit" disabled={pending} className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ transform: 'none', margin: 0, width: '100%' }}>{pending ? 'Đang xử lý...' : text}</button>);
}
function TokenForm({ formAction, formState }) {
    const [token, setToken] = useState('');
    useEffect(() => { if (formState.status === true) setToken(''); }, [formState]);
    return (
        <form action={formAction} className='flex flex-col gap-4 p-4'>
            <div className={'flex flex-col gap-1 mb-4'}>
                <label htmlFor="token">Zalo Access Token</label>
                <textarea className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' id="token" name="token" placeholder="Dán Access Token của bạn vào đây" required value={token} style={{ height: 250, resize: 'none', width: 'calc(100% - 24px)' }} onChange={(e) => setToken(e.target.value)} />
            </div>
            <AddAccountSubmitButton />
        </form>
    );
}
function RoleManager({ zaloAccount, allUsers, formAction, onClose }) {
    const [assignedUserIds, setAssignedUserIds] = useState(() => new Set(zaloAccount.roles?.map(role => role._id) || []));
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const availableUsers = useMemo(() => allUsers.filter(user => !assignedUserIds.has(user._id)), [allUsers, assignedUserIds]);
    const assignedUsers = useMemo(() => allUsers.filter(user => assignedUserIds.has(user._id)), [allUsers, assignedUserIds]);
    const handleAddUser = (user) => {
        setAssignedUserIds(prev => new Set(prev).add(user._id));
        setIsMenuOpen(false);
    };
    const handleRemoveUser = (userId) => {
        setAssignedUserIds(prev => {
            const newSet = new Set(prev);
            newSet.delete(userId);
            return newSet;
        });
    };
    return (
        <form action={formAction} className={'flex flex-col'}>
            <input type="hidden" name="zaloAccountId" value={zaloAccount._id} />
            <input type="hidden" name="userIds" value={JSON.stringify(Array.from(assignedUserIds))} />
            <Title content={`Phân quyền cho ${zaloAccount.name}`} click={onClose} />
            <div className={`${'flex flex-col gap-2 max-h-[250px] overflow-y-auto pr-2 p-4'} scroll`}>
                <h6>Người dùng được cấp quyền:</h6>
                {assignedUsers.length > 0 ? (
                    assignedUsers.map(user => (
                        <div key={user._id} className={'flex justify-between items-center p-2 bg-[var(--bg-secondary)] rounded'}>
                            <div className={'flex items-center gap-2.5'}>
                                <Image src={user.avt || 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG'} alt={user.name} width={40} height={40} className='w-10 h-10 rounded-full object-cover' />
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <h5>{user.name}</h5>
                                    <h6 className="text-xs">{user.phone || 'Chưa có SĐT'}</h6>
                                </div>
                            </div>
                            <button type="button" onClick={() => handleRemoveUser(user._id)} className={'bg-none border-none cursor-pointer p-1 flex items-center justify-center rounded-full hover:bg-[var(--bg-secondary)]'}>
                                <Svg_Delete w='16' h='16' c='var(--text-secondary)' />
                            </button>
                        </div>
                    ))
                ) : <p className={'text-xs text-[var(--text-secondary)] text-center p-4'}>Chưa có người dùng nào được cấp quyền.</p>}
            </div>
            <div className={'flex justify-between items-center px-4 py-2 border-t border-[var(--border-color)]'}>
                <Menu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen} customButton={<button type="button" className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100'><Svg_Add w='14' h='14' c='var(--text-primary)' /><h5>Thêm người dùng</h5></button>} menuItems={<div className={`${'p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col max-h-[200px]'} scroll`}>{availableUsers.length > 0 ? availableUsers.map(user => (<h5 key={user._id} onClick={() => handleAddUser(user)}>{user.name}</h5>)) : <p className={'text-xs text-[var(--text-secondary)] text-center p-4'}>Đã gán hết người dùng</p>}</div>} menuPosition="top" />
                <RoleSubmitButton />
            </div>
        </form>
    );
}
export default function SettingZaloRoles({ data, allUsers = [] }) {
    const router = useRouter();
    const [isListOpen, setIsListOpen] = useState(false);
    const [isManagerOpen, setIsManagerOpen] = useState(false);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [selectedZalo, setSelectedZalo] = useState(null);
    const [notification, setNotification] = useState({ open: false, status: true, mes: '' });
    const [updateState, updateAction, isUpdatePending] = useActionState(updateZaloRolesAction, { message: null, status: null });
    const [addState, addAction, isAddPending] = useActionState(addZaloAccountAction, { message: null, status: null });
    const handleActionComplete = (state, closePopupCallback) => {
        if (state.message) {
            setNotification({ open: true, status: state.status, mes: state.message });
            if (state.status === true) {
                router.refresh();
                if (closePopupCallback) closePopupCallback();
            }
        }
    };
    useEffect(() => { handleActionComplete(updateState, () => { if (updateState.status) { setIsManagerOpen(false); setSelectedZalo(null); } }); }, [updateState]);
    useEffect(() => { handleActionComplete(addState, () => { if (addState.status) setIsCreateOpen(false); }); }, [addState]);
    const handleOpenManager = (zaloAccount) => {
        const populatedRoles = zaloAccount.roles?.map(roleId => allUsers.find(u => u._id === roleId)).filter(Boolean) || [];
        setSelectedZalo({ ...zaloAccount, roles: populatedRoles });
        setIsManagerOpen(true);
    };
    const handleCloseNoti = () => setNotification(p => ({ ...p, open: false }));
    return (
        <>
            <button className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100' onClick={() => setIsListOpen(true)}>
                <Svg_Mode w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'var(--text-primary)'} />
                <h5 className='font-normal'>Quản lý Zalo</h5>
            </button>
            <FlexiblePopup open={isListOpen} onClose={() => setIsListOpen(false)} title="Danh sách tài khoản Zalo" width={'500px'}
                renderItemList={() => (
                    <div className={`${'flex flex-col gap-2 p-2'} scroll`}>
                        {data.map((item) => (
                            <div key={item._id} className={'flex items-center gap-3 p-3 rounded-md bg-[var(--bg-primary)] cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)]'} onClick={() => handleOpenManager(item)}>
                                <Image src={item.avt} alt={item.name} width={40} height={40} className={'w-10 h-10 rounded-full object-cover'} />
                                <div className={''}>
                                    <h5>{item.name}</h5>
                                    <p>{item.phone}</p>
                                </div>
                            </div>
                        ))}
                        <div className={'flex items-center gap-3 p-3 rounded-md bg-[var(--bg-primary)] cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)]'} style={{}} onClick={() => setIsCreateOpen(true)}>
                            <div className='w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full' style={{ background: 'var(--bg-secondary)' }}>
                                <Svg_Add w={'var(--font-size-base)'} h={'var(--font-size-base)'} c={'var(--text-primary)'} />
                            </div>
                            <div className={''}>
                                <h5>Thêm tài khoản Zalo mới</h5>
                            </div>
                        </div>
                    </div>
                )}
            />
            <CenterPopup key={selectedZalo?._id || 'manager'} open={isManagerOpen} onClose={() => setIsManagerOpen(false)}>
                {selectedZalo && (<RoleManager zaloAccount={selectedZalo} allUsers={allUsers} formAction={updateAction} onClose={() => setIsManagerOpen(false)} />)}
            </CenterPopup>
            <CenterPopup open={isCreateOpen} onClose={() => setIsCreateOpen(false)} size="md">
                <Title content="Thêm tài khoản & cập nhập Zalo" click={() => setIsCreateOpen(false)} />
                <div className={'p-4'}>
                    <TokenForm formAction={addAction} formState={addState} />
                </div>
            </CenterPopup>
            <Noti open={notification.open} onClose={handleCloseNoti} status={notification.status} mes={notification.mes} />
            {(isUpdatePending || isAddPending) && (<div className='loadingOverlay' style={{ zIndex: 9999 }}><Loading content={<h5>Đang xử lý...</h5>} /></div>)}
        </>
    );
}