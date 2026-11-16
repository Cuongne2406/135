import React, { useState } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import { Svg_Add } from '@/components/(icon)/svg';
import Noti from '@/components/(features)/(noti)/noti';
import { useRouter } from 'next/navigation';
import Loading from '@/components/(ui)/(loading)/loading';

const CreateArea = () => {
    const router = useRouter();
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [notification, setNotification] = useState({ open: false, status: false, mes: '' });
    const initialFormData = { name: '', color: '#00D097', rooms: [] };
    const [formData, setFormData] = useState(initialFormData);
    const [newRoom, setNewRoom] = useState('');
    const [colorError, setColorError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const validateHexColor = (hex) => { return /^#[0-9a-fA-F]{6}$/.test(hex) };

    const handleOpenPopup = () => { setFormData(initialFormData); setColorError(''); setIsPopupOpen(true); };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (name === 'color') {
            if (!validateHexColor(value)) {
                setColorError('Định dạng màu không hợp lệ (ví dụ: #1A2B3C).');
            } else {
                setColorError('');
            }
        }
    };

    const handleAddRoom = () => {
        const trimmedRoom = newRoom.trim();
        if (trimmedRoom && !formData.rooms.includes(trimmedRoom)) {
            setFormData(prev => ({ ...prev, rooms: [...prev.rooms, trimmedRoom] }));
            setNewRoom('');
        }
    };

    const handleRemoveRoom = (roomToRemove) => {
        setFormData(prev => ({
            ...prev,
            rooms: prev.rooms.filter(room => room !== roomToRemove)
        }));
    };

    const handleCreateArea = async () => {
        if (!formData.name.trim()) {
            setNotification({ open: true, status: false, mes: 'Tên khu vực không được để trống.' });
            return;
        }
        if (colorError) {
            setNotification({ open: true, status: false, mes: 'Vui lòng sửa định dạng màu sắc.' });
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`/api/area`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const result = await response.json();

            if (result.status) {
                router.refresh();
                setNotification({ open: true, status: true, mes: result.mes });
            } else {
                setNotification({ open: true, status: false, mes: result.mes });
            }
            setIsPopupOpen(false)
        } catch (error) {
            setNotification({ open: true, status: false, mes: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const renderPopupContent = () => {
        return (
            <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    <p className='text-sm font-semibold text-[var(--text-primary)]'>Tên khu vực</p>
                    <input
                        type='text' name='name' className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none'
                        placeholder='Nhập tên khu vực...' value={formData.name}
                        onChange={handleInputChange}
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    <p className='text-sm font-semibold text-[var(--text-primary)]'>Màu hiển thị</p>
                    <div className='flex items-center rounded-md p-[0_8px] gap-2.5 input'>
                        <label
                            htmlFor="color-picker-input-create"
                            className='w-6 h-6 rounded-md cursor-pointer border border-[#e0e0e0]'
                            style={{ backgroundColor: formData.color }}
                        />
                        <input
                            id="color-picker-input-create" type="color" name="color"
                            value={formData.color} onChange={handleInputChange}
                            className='absolute opacity-0 w-0 h-0 border-none p-0'
                        />
                        <input
                            type="text" name="color"
                            value={formData.color.toUpperCase()} onChange={handleInputChange}
                            className='flex-1 border-none outline-none p-[10px_0] text-sm bg-transparent text-[#1a202c]' placeholder="#FFFFFF"
                        />
                    </div>
                    {colorError && <p style={{ color: 'var(--red)', fontSize: '12px', marginTop: 4 }}>{colorError}</p>}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                    <p className='text-sm font-semibold text-[var(--text-primary)]'>Phòng học</p>
                    <div className='flex flex-wrap gap-4 rounded'>
                        {formData.rooms.map((room, index) => (
                            <div key={index} className='flex items-center bg-[#e0e0e0] p-[6px_16px] rounded-lg gap-2'>
                                <p className='text-sm font-normal text-[var(--text-primary)]'>{room}</p>
                                <span className='cursor-pointer text-base' onClick={() => handleRemoveRoom(room)}>×</span>
                            </div>
                        ))}
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                        <input
                            type='text' className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' placeholder='Thêm phòng mới...'
                            value={newRoom} onChange={(e) => setNewRoom(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddRoom()} style={{ flex: 1 }}
                        />
                        <button className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' onClick={handleAddRoom} style={{ flexShrink: 0, margin: 0, borderRadius: 5, transform: 'none' }}>Thêm</button>
                    </div>
                </div>

                <button
                    className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5'
                    onClick={handleCreateArea}
                    disabled={isLoading}
                    style={{ width: '100%', justifyContent: 'center', borderRadius: 5, padding: 10, marginTop: 32, opacity: isLoading ? 0.6 : 1 }}
                >
                    {isLoading ? 'Đang tạo...' : 'Tạo khu vực'}
                </button>
            </div>
        );
    };

    return (
        <>
            <div className='p-2.5 bg-[var(--main_d)] flex items-center gap-2 w-max rounded-md text-white text-sm font-medium cursor-pointer' onClick={handleOpenPopup}>
                <Svg_Add w={16} h={16} c="white" />
                <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Thêm khu vực</p>
            </div>

            <FlexiblePopup
                open={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                title={'Thêm khu vực'}
                renderItemList={renderPopupContent}
            />
            {isLoading && <div className='loadingOverlay'>
                <Loading content={<p style={{ color: 'white', }} className='text-sm font-normal text-[var(--text-primary)]'>Đang tạo khu vực mới...</p>} />
            </div>}
            <Noti
                open={notification.open}
                onClose={() => setNotification({ ...notification, open: false })}
                status={notification.status}
                mes={notification.mes}
                button={
                    <button
                        className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5'
                        onClick={() => setNotification({ ...notification, open: false })}
                        style={{ width: '100%', justifyContent: 'center', borderRadius: 5, transform: 'none' }}
                    >
                        Đóng
                    </button>
                }
            />
        </>
    );
};

export default CreateArea;