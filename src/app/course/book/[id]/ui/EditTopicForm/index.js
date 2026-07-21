'use client';

import React, { useState } from 'react';

const EditTopicForm = ({ initialData, onSave, onCancel }) => {
    const [formData, setFormData] = useState(initialData);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit} className='flex flex-col gap-5 h-[calc(100%-32px)] p-4'>
            <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-semibold text-[var(--text-primary)]' htmlFor="Name">Tên chủ đề</label>
                <input id="Name" name="Name" value={formData.Name} onChange={handleChange} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' />
            </div>
            <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-semibold text-[var(--text-primary)]' htmlFor="Period">Thời lượng (tiết)</label>
                <input id="Period" name="Period" type="number" value={formData.Period} onChange={handleChange} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' />
            </div>
            <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-semibold text-[var(--text-primary)]' htmlFor="Content">Giới thiệu chủ đề, kỹ năng đạt được</label>
                <textarea id="Content" name="Content" value={formData.Content} onChange={handleChange} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none'
                    style={{ height: 150, resize: 'none' }} />
            </div>
            <div className='flex flex-col gap-1.5'>
                <label className='text-sm font-semibold text-[var(--text-primary)]' htmlFor="Slide">Link Google Slide</label>
                <input id="Slide" name="Slide" value={formData.Slide} onChange={handleChange} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' />
            </div>
            <div className='mt-auto pt-4 flex gap-4 border-t border-[var(--border-color)]'>
                <button type="button" onClick={onCancel} className='inline-flex items-center justify-center gap-[0.6rem] px-5 py-2.5 rounded-md cursor-pointer border border-transparent transition-all duration-200 no-underline whitespace-nowrap hover:-translate-y-0.5 bg-[var(--bg-secondary)] text-[var(--text-secondary)] border-[var(--border-color)] hover:bg-[var(--hover)]'>Hủy</button>
                <button type="submit" className='inline-flex items-center justify-center gap-[0.6rem] px-5 py-2.5 rounded-md cursor-pointer border border-transparent transition-all duration-200 no-underline whitespace-nowrap hover:-translate-y-0.5 bg-[var(--main_b)] text-white flex-1 hover:bg-[var(--main_d)]'>
                    Lưu thay đổi
                </button>
            </div>

        </form>
    );
};

export default EditTopicForm;