'use client';
import React, { useState, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';
import { selectZaloAccountAction } from '@/app/actions/zalo.actions';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import Noti from '@/components/(features)/(noti)/noti';
import Loading from '@/components/(ui)/(loading)/loading';
import { Svg_Logout, Svg_Setting } from '@/components/(icon)/svg';
import { truncateString } from '@/function';
import Image from 'next/image';
function SelectableZaloItem({ item, action }) {
    const { pending } = useFormStatus();
    return (
        <form action={action} className={pending ? 'flex items-center gap-3 p-3 rounded bg-[var(--bg-primary)] cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)] w-full' : ''}>
            <input type="hidden" name="zaloAccountId" value={item._id} />
            <button type="submit" className={'flex items-center gap-3 p-3 rounded-md bg-[var(--bg-primary)] cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)] w-full'} disabled={pending}>
                <div className='flex items-center gap-2'>
                    <div className={'relative w-10 h-10 rounded-full overflow-hidden'}>
                        <Image src={item.avt} alt={item.name} fill />
                    </div>
                    <div className='flex flex-col items-start gap-1'>
                        <h5>{item.name}</h5>
                        <h6 className="text-xs font-normal">{item.phone}</h6>
                    </div>
                </div>
                <div className='flex items-center gap-2'>
                    <div className='w-2 h-2 rounded-full bg-[var(--green)]'></div>
                    <h6>Đang hoạt động</h6>
                </div>
            </button>
        </form>
    );
}
export default function SettingZalo({ user, zalo }) {
    const router = useRouter();
    const [isRightPopupOpen, setIsRightPopupOpen] = useState(false);
    const [notification, setNotification] = useState({ open: false, status: true, mes: '' });
    const [selectState, selectAction, isSelectPending] = useActionState(selectZaloAccountAction, { message: null, status: null });
    useEffect(() => {
        if (selectState.message) {
            setNotification({ open: true, status: selectState.status, mes: selectState.message });
            if (selectState.status === true) {
                router.refresh();
                setIsRightPopupOpen(false);
            }
        }
    }, [selectState, router]);
    const handleCloseNoti = () => setNotification(prev => ({ ...prev, open: false }));
    return (
        <>
            <div className='flex items-center'>
                <div className='w-[150px] border border-[var(--border-color)] h-[calc(100%-2px)] rounded-l-[5px] flex items-center justify-center'>
                    <h5>{user?.zalo ? truncateString(user.zalo.name, 10) : 'Chưa chọn'}</h5>
                </div>
                <button className='px-3 py-2 bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100 rounded-l-none rounded-r-[5px]' onClick={() => setIsRightPopupOpen(true)}>
                    <Svg_Setting w={'var(--font-size-xs)'} h={'var(--font-size-xs)'} c={'var(--text-primary)'} />
                    <h5 className='font-normal'>Cấu hình</h5>
                </button>
            </div>
            <FlexiblePopup
                open={isRightPopupOpen}
                onClose={() => setIsRightPopupOpen(false)}
                title="Chọn tài khoản Zalo"
                width={'600px'}
                renderItemList={() => (
                    <div className={'p-4 flex flex-col gap-2 h-[calc(100%-32px)]'}>
                        <div className={'p-4 border border-[var(--border-color)] rounded-md flex-1 flex flex-col overflow-hidden'}>
                            <div className={'pb-2 mb-2 border-b border-dashed border-[var(--border-color)] flex items-center gap-2'}>
                                {user?.zalo ? (
                                    <div className={'flex items-center gap-3 p-3 rounded-md cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)] w-full'}>
                                        <div className='flex items-center gap-2'>
                                            <div className={'relative w-10 h-10 rounded-full overflow-hidden'}>
                                                <Image src={user.zalo.avt} alt={user.zalo.name} fill />
                                            </div>
                                            <div className='flex flex-col items-start gap-1'>
                                                <h5>{user.zalo.name}</h5>
                                                <h6>{user.zalo.phone}</h6>
                                            </div>
                                        </div>
                                        <form action={selectAction}>
                                            <input type="hidden" name="zaloAccountId" value="" />
                                            <button type="submit" className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100' disabled={isSelectPending}>
                                                <Svg_Logout w={'var(--font-size-xs)'} h={'var(--font-size-xs)'} c={'var(--text-primary)'} />
                                                <h5>{isSelectPending ? 'Đang xử lý...' : 'Thoát tài khoản'}</h5>
                                            </button>
                                        </form>
                                    </div>
                                ) : (
                                    <div className='py-3 px-4 w-[calc(100%-32px)] border border-dashed border-[var(--border-color)] rounded-[5px]'>
                                        <h5>Chưa chọn tài khoản</h5>
                                    </div>
                                )}
                            </div>
                            <div className={'flex items-center gap-3 p-3 rounded-md bg-[var(--bg-primary)] cursor-pointer transition-colors duration-200 hover:bg-[var(--hover)] w-full'}>
                                {zalo?.map((item) => {
                                    if (user?.zalo?._id === item._id) return null;
                                    return <SelectableZaloItem key={item._id} item={item} action={selectAction} />;
                                })}
                            </div>
                        </div>
                    </div>
                )}
            />
            {isSelectPending && (
                <div className='loadingOverlay'>
                    <Loading content={<h5>Đang xử lý...</h5>} />
                </div>
            )}
            <Noti
                open={notification.open}
                onClose={handleCloseNoti}
                status={notification.status}
                mes={notification.mes}
            />
        </>
    );
}