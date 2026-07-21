'use client';
import React, { useState, useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { addZaloAccountAction, updateZaloRolesAction } from '@/app/actions/zalo.actions';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Noti from '@/components/(features)/(noti)/noti';
import Title from '@/components/(features)/(popup)/title';
import Menu from '@/components/(ui)/(button)/menu';
import { Svg_Add, Svg_Delete } from '@/components/(icon)/svg';
import Image from 'next/image';

function SubmitBtn({ text = 'Lưu' }) {
    const { pending } = useFormStatus();
    return (
        <button type="submit" disabled={pending}
            className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 hover:bg-[var(--main_d)] hover:-translate-y-0.5'>
            {pending ? 'Đang xử lý...' : text}
        </button>
    );
}

function AddAccountForm({ formAction, formState, onClose }) {
    const [token, setToken] = useState('');
    useEffect(() => { if (formState.status === true) setToken(''); }, [formState]);
    return (
        <form action={formAction} className='flex flex-col gap-4 p-4'>
            <div className='flex flex-col gap-1'>
                <label className='text-sm font-medium text-[var(--text-primary)]'>Zalo Access Token</label>
                <textarea name="token" placeholder="Dán Access Token của bạn vào đây" required
                    value={token}
                    onChange={(e) => setToken(e.target.value)}
                    className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none'
                    style={{ height: 200, resize: 'none' }} />
            </div>
            <div className='flex gap-2 justify-end'>
                <button type="button" onClick={onClose}
                    className='px-3 py-2 rounded bg-gray-200 text-sm cursor-pointer border-none hover:bg-gray-100'>
                    Hủy
                </button>
                <SubmitBtn text="Thêm tài khoản" />
            </div>
        </form>
    );
}

function RoleManager({ zaloAccount, allUsers, formAction, onClose }) {
    const [assignedUserIds, setAssignedUserIds] = useState(() => new Set(zaloAccount.roles?.map(r => r._id) || []));
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const availableUsers = allUsers.filter(u => !assignedUserIds.has(u._id) && (u.role[0] === 'Sale' || u.role[0] === 'Admin'));
    const assignedUsers = allUsers.filter(u => assignedUserIds.has(u._id));

    const handleAddUser = (user) => {
        setAssignedUserIds(prev => new Set(prev).add(user._id));
        setIsMenuOpen(false);
    };
    const handleRemoveUser = (userId) => {
        setAssignedUserIds(prev => { const s = new Set(prev); s.delete(userId); return s; });
    };

    return (
        <form action={formAction} className='flex flex-col'>
            <input type="hidden" name="zaloAccountId" value={zaloAccount._id} />
            <input type="hidden" name="userIds" value={JSON.stringify(Array.from(assignedUserIds))} />
            <Title content={`Phân quyền - ${zaloAccount.name}`} click={onClose} />
            <div className='flex flex-col gap-2 max-h-[250px] overflow-y-auto p-4'>
                <h6 className='text-sm font-medium text-[var(--text-primary)]'>Người dùng được cấp quyền:</h6>
                {assignedUsers.length > 0 ? assignedUsers.map(user => (
                    <div key={user._id} className='flex justify-between items-center p-2 bg-[var(--bg-secondary)] rounded'>
                        <div className='flex items-center gap-2.5'>
                            <Image src={user.avt || 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG'} alt={user.name} width={36} height={36} className='w-9 h-9 rounded-full object-cover' />
                            <div>
                                <h5 className='text-sm font-medium'>{user.name}</h5>
                                <p className='text-xs text-[var(--text-secondary)]'>{user.phone || 'Chưa có SĐT'}</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => handleRemoveUser(user._id)}
                            className='bg-none border-none cursor-pointer p-1 rounded-full hover:bg-[var(--bg-secondary)]'>
                            <Svg_Delete w='14' h='14' c='var(--text-secondary)' />
                        </button>
                    </div>
                )) : (
                    <p className='text-xs text-[var(--text-secondary)] text-center p-4'>Chưa có người dùng nào.</p>
                )}
            </div>
            <div className='flex justify-between items-center px-4 py-2 border-t border-[var(--border-color)]'>
                <Menu isOpen={isMenuOpen} onOpenChange={setIsMenuOpen}
                    customButton={
                        <button type="button"
                            className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 cursor-pointer border-none text-sm hover:bg-gray-100'>
                            <Svg_Add w='14' h='14' c='var(--text-primary)' />
                            Thêm người dùng
                        </button>
                    }
                    menuItems={
                        <div className='p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col max-h-[200px] overflow-y-auto'>
                            {availableUsers.length > 0 ? availableUsers.map(user => (
                                <h5 key={user._id} onClick={() => handleAddUser(user)}
                                    className='text-sm px-2 py-1.5 rounded cursor-pointer hover:bg-[var(--hover)]'>{user.name}</h5>
                            )) : (
                                <p className='text-xs text-[var(--text-secondary)] text-center p-4'>Đã gán hết</p>
                            )}
                        </div>
                    }
                    menuPosition="top"
                />
                <SubmitBtn text="Lưu thay đổi" />
            </div>
        </form>
    );
}

export default function ZaloConfig({ zaloData = [], allUsers = [] }) {
    const router = useRouter();
    const [showAddForm, setShowAddForm] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState(null);
    const [editingProxy, setEditingProxy] = useState(null);
    const [proxyInput, setProxyInput] = useState('');
    const [savingProxy, setSavingProxy] = useState(false);
    const [notification, setNotification] = useState({ open: false, status: true, mes: '' });
    const [updateState, updateAction] = useActionState(updateZaloRolesAction, { message: null, status: null });
    const [addState, addAction] = useActionState(addZaloAccountAction, { message: null, status: null });

    useEffect(() => {
        if (updateState.message) {
            setNotification({ open: true, status: updateState.status, mes: updateState.message });
            if (updateState.status === true) { setSelectedAccount(null); router.refresh(); }
        }
    }, [updateState, router]);
    useEffect(() => {
        if (addState.message) {
            setNotification({ open: true, status: addState.status, mes: addState.message });
            if (addState.status === true) { setShowAddForm(false); router.refresh(); }
        }
    }, [addState, router]);

    const handleDelete = async (id) => {
        if (!confirm('Xóa tài khoản Zalo này?')) return;
        try {
            const res = await fetch(`/api/zalo/${id}`, { method: 'DELETE' });
            const json = await res.json();
            setNotification({ open: true, status: json.success, mes: json.success ? 'Đã xóa tài khoản' : json.message || 'Lỗi' });
            if (json.success) router.refresh();
        } catch {
            setNotification({ open: true, status: false, mes: 'Lỗi kết nối' });
        }
    };

    useEffect(() => {
        if (editingProxy) setProxyInput(editingProxy.proxy || '');
    }, [editingProxy]);

    const handleSaveProxy = async () => {
        if (!editingProxy) return;
        setSavingProxy(true);
        try {
            const res = await fetch(`/api/zalo/${editingProxy._id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ proxy: proxyInput }),
            });
            const json = await res.json();
            setNotification({ open: true, status: json.success, mes: json.success ? 'Đã cập nhật proxy' : json.error || 'Lỗi' });
            if (json.success) { setEditingProxy(null); router.refresh(); }
        } catch {
            setNotification({ open: true, status: false, mes: 'Lỗi kết nối' });
        } finally { setSavingProxy(false); }
    };

    const saleUsers = allUsers.filter(u => u.role[0] === 'Sale' || u.role[0] === 'Admin');

    return (
        <div className='flex flex-col gap-3 flex-1'>
            <div className='bg-[var(--bg-primary)] rounded-md border border-[var(--border-color)] p-4'>
                <div className='flex items-center justify-between mb-4'>
                    <h5 className='font-semibold text-[var(--text-primary)]'>Danh sách tài khoản Zalo</h5>
                    <button onClick={() => setShowAddForm(true)}
                        className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 rounded text-white text-sm font-medium cursor-pointer border-none hover:bg-[var(--main_d)]'>
                        <Svg_Add w='14' h='14' c='white' />
                        Thêm tài khoản
                    </button>
                </div>
                {zaloData.length === 0 ? (
                    <div className='text-center py-12 text-sm text-[var(--text-secondary)]'>Chưa có tài khoản Zalo nào.</div>
                ) : (
                    <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3'>
                        {zaloData.map(acc => (
                            <div key={acc._id}
                                className='border border-[var(--border-color)] rounded-lg p-3 flex flex-col gap-2 hover:shadow-sm transition-shadow'>
                                <div className='flex items-center gap-3'>
                                    <Image src={acc.avt} alt={acc.name} width={44} height={44}
                                        className='w-11 h-11 rounded-full object-cover' />
                                    <div className='flex-1 min-w-0'>
                                        <h5 className='text-sm font-semibold text-[var(--text-primary)] truncate'>{acc.name}</h5>
                                        <p className='text-xs text-[var(--text-secondary)]'>{acc.phone}</p>
                                    </div>
                                </div>
                                <div className='flex flex-col gap-1 text-xs text-[var(--text-secondary)]'>
                                    <span>UID: {acc.uid}</span>
                                    <span>Giới hạn: {acc.rateLimitPerHour || 30} tin/giờ</span>
                                    <span className='flex items-center gap-1'>
                                        Proxy: {acc.proxy || <span className='italic'>Chưa cấu hình</span>}
                                        <button onClick={(e) => { e.stopPropagation(); setEditingProxy(acc); }}
                                            className='ml-1 px-1.5 py-0.5 rounded bg-gray-200 text-[10px] cursor-pointer border-none hover:bg-gray-100'>
                                            Sửa
                                        </button>
                                    </span>
                                    <span>Người dùng: {acc.roles?.length || 0}</span>
                                </div>
                                <div className='flex gap-2 mt-1'>
                                    <button onClick={() => setSelectedAccount(acc)}
                                        className='flex-1 px-2 py-1.5 rounded bg-gray-200 text-xs cursor-pointer border-none hover:bg-gray-100'>
                                        Phân quyền
                                    </button>
                                    <button onClick={() => handleDelete(acc._id)}
                                        className='px-2 py-1.5 rounded bg-red-50 text-red-500 text-xs cursor-pointer border-none hover:bg-red-100'>
                                        Xóa
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add account popup */}
            <CenterPopup open={showAddForm} onClose={() => setShowAddForm(false)} size="md">
                <Title content="Thêm tài khoản Zalo" click={() => setShowAddForm(false)} />
                <AddAccountForm formAction={addAction} formState={addState} onClose={() => setShowAddForm(false)} />
            </CenterPopup>

            {/* Role management popup */}
            {selectedAccount && (
                <CenterPopup key={selectedAccount._id} open={!!selectedAccount} onClose={() => setSelectedAccount(null)}>
                    <RoleManager zaloAccount={selectedAccount} allUsers={saleUsers}
                        formAction={updateAction} onClose={() => setSelectedAccount(null)} />
                </CenterPopup>
            )}

            {/* Proxy edit popup */}
            <CenterPopup open={!!editingProxy} onClose={() => setEditingProxy(null)} size="sm">
                {editingProxy && (
                    <div className='p-4 flex flex-col gap-3'>
                        <h5 className='font-semibold text-[var(--text-primary)]'>Cấu hình Proxy - {editingProxy.name}</h5>
                        <div className='flex flex-col gap-1'>
                            <label className='text-sm font-medium text-[var(--text-primary)]'>Proxy URL</label>
                            <input type="text" value={proxyInput}
                                onChange={(e) => setProxyInput(e.target.value)}
                                placeholder="vd: http://user:pass@host:port"
                                className='px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700' />
                        </div>
                        <div className='flex gap-2 justify-end'>
                            <button onClick={() => setEditingProxy(null)}
                                className='px-3 py-2 rounded bg-gray-200 text-sm cursor-pointer border-none hover:bg-gray-100'>Hủy</button>
                            <button onClick={handleSaveProxy} disabled={savingProxy}
                                className='px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm cursor-pointer border-none hover:bg-[var(--main_d)]'>
                                {savingProxy ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                )}
            </CenterPopup>

            <Noti open={notification.open} onClose={() => setNotification(p => ({ ...p, open: false }))}
                status={notification.status} mes={notification.mes} />
        </div>
    );
}
