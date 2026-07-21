'use client';
import React, { useState, useCallback } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import TopicForm from '@/app/course/book/[id]/ui/AddTopicForm';
import { useRouter } from 'next/navigation';
import { Svg_Add, Svg_Slide, Svg_Pen, Svg_Delete, Svg_Save } from '@/components/(icon)/svg';
import Link from 'next/link';
export default function Create() {
    const router = useRouter();
    const [openPopup, setOpenPopup] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const initialProgramData = { ID: '', Name: '', Price: '', Image: null, Badge: null, Describe: '' };
    const [programData, setProgramData] = useState(initialProgramData);
    const [topics, setTopics] = useState([]);
    const [secondaryOpen, setSecondaryOpen] = useState(false);
    const [secondaryType, setSecondaryType] = useState('add');
    const [editingIndex, setEditingIndex] = useState(null);
    const [notiOpen, setNotiOpen] = useState(false);
    const [notiStatus, setNotiStatus] = useState(false);
    const [notiMessage, setNotiMessage] = useState('');
    const openPopupHandler = useCallback(() => setOpenPopup(true), []);
    const closePopupHandler = useCallback(() => {
        setOpenPopup(false);
        setProgramData(initialProgramData);
        setTopics([]);
        setErrorMsg('');
        setNotiOpen(false);
    }, []);
    const closeSecondary = () => {
        setSecondaryOpen(false);
        setEditingIndex(null);
    };
    const handleProgramDataChange = (e) => {
        const { name, value } = e.target;
        setProgramData(prev => ({ ...prev, [name]: value }));
    };
    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setProgramData(prev => ({ ...prev, [name]: files[0] || null }));
    };
    const addTopic = (topic) => setTopics((prev) => [...prev, topic]);
    const updateTopic = (index, updatedTopic) => {
        setTopics((prev) => prev.map((topic, i) => (i === index ? updatedTopic : topic)));
    };
    const deleteTopic = (index) => setTopics((prev) => prev.filter((_, i) => i !== index));
    const openAddTopicForm = () => {
        setSecondaryType('add');
        setSecondaryOpen(true);
    };
    const openEditTopicForm = (index) => {
        setEditingIndex(index);
        setSecondaryType('edit');
        setSecondaryOpen(true);
    };
    const TopicList = () => {
        if (topics.length === 0) return <p className={'p-3 text-xs text-center text-[var(--text-secondary)]'}>Chưa có chủ đề nào được thêm</p>;
        return (
            <div className={'border border-[var(--border-color)] rounded-lg overflow-hidden'}>
                {topics.map((topic, i) => (
                    <div key={i} className={'border-b border-[var(--border-color)] p-3 bg-[var(--bg-primary)] flex gap-2 mb-3 items-center justify-between'}>
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span className={'font-semibold text-sm mr-1'}>{i + 1}. {topic.Name}</span>
                            <span className={'text-sm'}>
                                {topic.Period ? `${topic.Period} tiết` : 'Chưa có thời lượng'}
                                {' – '}
                                {topic.Slide ? <a href={topic.Slide} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>Link slide</a> : 'Chưa có slide'}
                            </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                            <Link target='_blank' href={`${topic.Slide}`} className='p-1.5 rounded flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5' style={{ background: 'var(--main_b)', cursor: 'pointer' }}><Svg_Slide w={16} h={16} c="white" /></Link>
                            <div className='p-1.5 rounded flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5' style={{ background: 'var(--yellow)', cursor: 'pointer' }} onClick={() => openEditTopicForm(i)}><Svg_Pen w={16} h={16} c="white" /></div>
                            <div className='p-1.5 rounded flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5' style={{ background: 'var(--red)', cursor: 'pointer' }} onClick={() => deleteTopic(i)}><Svg_Delete w={16} h={16} c="white" /></div>
                        </div>
                    </div>
                ))}
            </div>
        );
    };
    const handleSaveProgram = (e) => {
        e.preventDefault();
        if (!programData.ID || !programData.Name || programData.ID.length !== 3) {
            setErrorMsg('Vui lòng nhập ID và Tên chương trình. ID phải có 3 ký tự.');
            return;
        }
        setErrorMsg('');
        const formData = new FormData();
        formData.append('ID', programData.ID);
        formData.append('Name', programData.Name);
        formData.append('Price', Number(programData.Price) || 0);
        formData.append('Type', 'AI Robotic');
        formData.append('Topics', JSON.stringify(topics));
        formData.append('Describe', programData.Describe || '');
        if (programData.Image) formData.append('Image', programData.Image);
        if (programData.Badge) formData.append('Badge', programData.Badge);
        setIsLoading(true);
        fetch('/api/book', { method: 'POST', body: formData })
            .then(async (r) => {
                if (!r.ok) throw await r.json().catch(() => ({ mes: 'Lỗi không xác định' }));
                return r.json();
            })
            .then(() => {
                setNotiStatus(true);
                setNotiMessage('Đã tạo chương trình thành công!');
                setNotiOpen(true);
                router.refresh();
            })
            .catch((err) => {
                setNotiStatus(false);
                setNotiMessage(err.mes || 'Lỗi từ server, không thể tạo chương trình.');
                setNotiOpen(true);
            })
            .finally(() => setIsLoading(false));
    };
    const renderProgramForm = () => (
        <form className={'flex flex-col gap-4 p-4'} onSubmit={handleSaveProgram}>
            <TextNoti title="Thông tin chương trình học" color="blue" mes="Điền thông tin và thêm các chủ đề cấu thành nên chương trình. ID quy định phải có 3 kí tự" />
            <input name="ID" value={programData.ID} onChange={handleProgramDataChange} type='text' className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' placeholder='ID chương trình (ví dụ: FZ1)' required />
            <input name="Name" value={programData.Name} onChange={handleProgramDataChange} type='text' className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' placeholder='Tên chương trình (ví dụ: Lập trình Scratch cấp độ 1)' required />
            <input name="Price" value={programData.Price} onChange={handleProgramDataChange} type='number' className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' placeholder='Học phí' />
            <textarea name="Describe" value={programData.Describe} onChange={handleProgramDataChange} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' placeholder='Mô tả chương trình' style={{ height: 100, resize: 'none' }} />
            <TextNoti title="Hình ảnh chương trình học" color="blue" mes="Hình ảnh bìa và huy hiệu sẽ được sử dụng cho hồ sơ điện tử học sinh." />
            <div className={'flex items-center gap-3 font-sans w-[calc(100%-8px)] border border-[#ddd] rounded-lg p-1'}>
                <input type="file" id="cover-image-upload" name="Image" className={'w-[0.1px] h-[0.1px] opacity-0 overflow-hidden absolute z-[-1]'} onChange={handleFileChange} accept="image/*" />
                <label htmlFor="cover-image-upload" className={'inline-flex items-center gap-2 px-4 py-2 bg-[var(--main_d)] rounded-md cursor-pointer font-medium'}>
                    <Svg_Save w={16} h={16} c="white" />
                    <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Tải ảnh bìa</p>
                </label>
                <span className={'text-sm text-[#555] whitespace-nowrap overflow-hidden text-ellipsis'}>{programData.Image?.name || "Chưa có tệp nào được chọn"}</span>
            </div>
            <div className={'flex items-center gap-3 font-sans w-[calc(100%-8px)] border border-[#ddd] rounded-lg p-1'}>
                <input type="file" id="badge-image-upload" name="Badge" className={'w-[0.1px] h-[0.1px] opacity-0 overflow-hidden absolute z-[-1]'} onChange={handleFileChange} accept="image/*" />
                <label htmlFor="badge-image-upload" className={'inline-flex items-center gap-2 px-4 py-2 bg-[var(--main_d)] rounded-md cursor-pointer font-medium'}>
                    <Svg_Save w={16} h={16} c="white" />
                    <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Tải ảnh huy hiệu</p>
                </label>
                <span className={'text-sm text-[#555] whitespace-nowrap overflow-hidden text-ellipsis'}>{programData.Badge?.name || "Chưa có tệp nào được chọn"}</span>
            </div>

            {errorMsg && <p className={'text-[var(--red)] text-xs italic'} style={{ marginTop: 8 }}>{errorMsg}</p>}
            <TextNoti title="Danh sách chủ đề" color="blue" mes="Thêm các chủ đề sẽ có trong chương trình này." />
            <div className={'flex gap-2'}>
                <button type="button" style={{ display: 'flex', gap: 8, alignItems: 'center' }} className={'px-4 py-2 bg-[var(--main_d)] text-white border-none rounded-md cursor-pointer font-semibold'} onClick={openAddTopicForm}>
                    <Svg_Add w={16} h={16} c="white" />
                    <span className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Thêm chủ đề</span>
                </button>
            </div>
            <TopicList />
            <button type="submit" className={'self-end px-5 py-2 bg-[var(--main_d)] text-white border-none rounded-md cursor-pointer font-semibold'} disabled={isLoading}>{isLoading ? 'Đang lưu...' : 'Lưu chương trình'}</button>
        </form>
    );
    return (
        <>
            <div className={'p-2.5 bg-[var(--main_d)] flex items-center gap-2 w-max rounded-lg text-white text-sm font-medium cursor-pointer'} onClick={openPopupHandler}>
                <Svg_Add w={16} h={16} c="white" />
                <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Thêm chương trình</p>
            </div>
            <FlexiblePopup open={openPopup} onClose={closePopupHandler} title="Tạo chương trình học mới" width={600} renderItemList={renderProgramForm} secondaryOpen={secondaryOpen} onCloseSecondary={closeSecondary}
                renderSecondaryList={() => {
                    if (secondaryType === 'edit') {
                        return <TopicForm initialData={topics[editingIndex]} onSave={(updatedTopic) => { updateTopic(editingIndex, updatedTopic); closeSecondary(); }} onCancel={closeSecondary} isLoading={isLoading} />;
                    }
                    return <TopicForm onSave={(newTopic) => { addTopic(newTopic); closeSecondary(); }} onCancel={closeSecondary} isLoading={isLoading} />;
                }}
                secondaryTitle={secondaryType === 'edit' ? 'Chỉnh sửa chủ đề' : 'Thêm chủ đề mới'}
            />
            {isLoading && <div className='loadingOverlay'><Loading content={<p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Đang xử lý...</p>} /></div>}
            <Noti open={notiOpen} onClose={() => setNotiOpen(false)} status={notiStatus} mes={notiMessage}
                button={
                    <div className={'w-[calc(100%-24px)] justify-center p-2.5 bg-[var(--main_d)] flex items-center gap-2 rounded-lg text-white text-sm font-medium cursor-pointer'} onClick={() => { setNotiOpen(false); if (notiStatus) closePopupHandler(); }}>Đóng</div>
                }
            />
        </>
    );
}