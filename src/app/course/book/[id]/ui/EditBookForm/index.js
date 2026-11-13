'use client';
import React, { useState } from 'react';
import { Svg_Save } from '@/components/(icon)/svg';

const getFileName = (file) => {
    if (file instanceof File) return file.name;
    if (typeof file === 'string' && file) return file.substring(file.lastIndexOf('/') + 1);
    return null;
};

const truncateString = (str, start, end) => {
    if (!str) return null;
    return str.length > start + end ? `${str.slice(0, start)}...${str.slice(-end)}` : str;
};

const EditBookForm = ({ initialData, onSave, onCancel, isLoading }) => {
    const [formData, setFormData] = useState({
        Name: initialData?.Name || '',
        Price: initialData?.Price || 0,
        Describe: initialData?.Describe || '',
        Image: initialData?.Image || null,
        Badge: initialData?.Badge || null,
    });
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files.length > 0) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.Name) {
            setError('Vui lòng nhập tên chương trình.');
            return;
        }
        setError('');

        const dataToSubmit = new FormData();
        dataToSubmit.append('Name', formData.Name);
        dataToSubmit.append('Price', Number(formData.Price) || 0);
        dataToSubmit.append('Describe', formData.Describe || '');
        dataToSubmit.append('ID', initialData?._id || '');
        if (formData.Image && formData.Image instanceof File) {
            dataToSubmit.append('Image', formData.Image);
        }
        if (formData.Badge && formData.Badge instanceof File) {
            dataToSubmit.append('Badge', formData.Badge);
        }

        onSave(dataToSubmit);
    };

    return (
        <form onSubmit={handleSubmit} className='flex flex-col gap-5 h-[calc(100%-32px)] p-4'>
            <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-semibold text-[var(--text-primary)]' htmlFor="Name">Tên sách/khóa học</label>
                <input id="Name" name="Name" value={formData.Name} onChange={handleChange} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' required />
            </div>

            <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-semibold text-[var(--text-primary)]' htmlFor="Price">Học phí (VND)</label>
                <input id="Price" name="Price" type="number" value={formData.Price} onChange={handleChange} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' />
            </div>

            <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-semibold text-[var(--text-primary)]' htmlFor="Describe">Mô tả ngắn</label>
                <textarea id="Describe" name="Describe" value={formData.Describe} onChange={handleChange} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' placeholder='Mô tả ngắn gọn' style={{ height: 100, resize: 'none' }} />
            </div>

            <div className='flex items-center gap-3 font-sans w-[calc(100%-8px)] border border-[#ddd] rounded-lg p-1'>
                <input type="file" id="cover-image-upload" name="Image" className='w-[0.1px] h-[0.1px] opacity-0 overflow-hidden absolute z-[-1]' onChange={handleFileChange} accept="image/*" />
                <label htmlFor="cover-image-upload" className='inline-flex items-center gap-2 px-4 py-2 bg-[var(--main_d)] rounded-md cursor-pointer font-medium'>
                    <Svg_Save w={16} h={16} c="white" />
                    <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Tải ảnh bìa</p>
                </label>
                <span className='text-sm text-[#555] whitespace-nowrap overflow-hidden text-ellipsis'>{truncateString(getFileName(formData.Image), 20, 10) || "Chưa có tệp nào được chọn"}</span>
            </div>

            <div className='flex items-center gap-3 font-sans w-[calc(100%-8px)] border border-[#ddd] rounded-lg p-1'>
                <input type="file" id="badge-image-upload" name="Badge" className='w-[0.1px] h-[0.1px] opacity-0 overflow-hidden absolute z-[-1]' onChange={handleFileChange} accept="image/*" />
                <label htmlFor="badge-image-upload" className='inline-flex items-center gap-2 px-4 py-2 bg-[var(--main_d)] rounded-md cursor-pointer font-medium'>
                    <Svg_Save w={16} h={16} c="white" />
                    <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Tải ảnh huy hiệu</p>
                </label>
                <span className='text-sm text-[#555] whitespace-nowrap overflow-hidden text-ellipsis'>{truncateString(getFileName(formData.Badge), 20, 10) || "Chưa có tệp nào được chọn"}</span>
            </div>

            {error && <p className='text-[var(--red)] text-xs italic' style={{ marginTop: 8 }}>{error}</p>}

            <div className='mt-auto pt-4 flex gap-4 border-t border-[var(--border-color)]'>
                <button type="button" onClick={onCancel} className='inline-flex items-center justify-center gap-[0.6rem] px-5 py-2.5 rounded-md cursor-pointer border border-transparent transition-all duration-200 no-underline whitespace-nowrap hover:-translate-y-0.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--hover)]'>Hủy</button>
                <button type="submit" className='inline-flex items-center justify-center gap-[0.6rem] px-5 py-2.5 rounded-md cursor-pointer border border-transparent transition-all duration-200 no-underline whitespace-nowrap hover:-translate-y-0.5 bg-[var(--main_b)] text-white flex-1 hover:bg-[var(--main_d)]' disabled={isLoading}>
                    {isLoading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
            </div>
        </form>
    );
};

export default EditBookForm;