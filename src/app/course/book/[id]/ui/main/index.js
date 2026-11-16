'use client';
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Svg_Delete, Svg_Add, Svg_Pen, Svg_Slide } from '@/components/(icon)/svg';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import EditBookForm from '../EditBookForm';
import AddTopicForm from '../AddTopicForm';
import EditTopicForm from '../EditTopicForm';
import AlertPopup from '@/components/(features)/(noti)/alert';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import { driveImage } from '@/function';

const reorder = (list, startIndex, endIndex) => {
    const result = Array.from(list);
    const [removed] = result.splice(startIndex, 1);
    result.splice(endIndex, 0, removed);
    return result;
};

// --- Sub-components for better structure ---

const InfoPanel = React.memo(({ bookData, formattedPrice, onEditClick }) => (
    <aside className={'flex-1 min-w-[300px] flex flex-col'}>
        <div className={'w-full rounded-md overflow-hidden mb-6 shadow-[var(--boxshaw2)] flex gap-2'}>
            <Image
                src={driveImage(bookData.Image)}
                alt={bookData.Name}
                width={400}
                height={533}
                priority
                sizes="(max-width: 768px) 100vw, 33vw"
                className={'w-[calc(50%-4px)] h-auto aspect-[3/4] object-cover block'}
                style={{ width: bookData.Badge ? 'calc(50% - 4px)' : '100%' }}
            />
            {bookData.Badge && <Image
                src={driveImage(bookData.Badge)}
                alt={bookData.Name}
                width={400}
                height={533}
                priority
                sizes="(max-width: 768px) 100vw, 33vw"
                className={'w-[calc(50%-4px)] h-auto aspect-[3/4] object-cover block'}
            />}
        </div>
        <p className='text-xl font-semibold text-[var(--text-primary)]' style={{ marginBottom: '8px' }}>{bookData.Name}</p>
        <div className={'flex flex-col gap-1 mb-4'}>
            <p className='text-sm font-normal text-[var(--text-primary)]'><strong>Loại chương trình:</strong> {bookData.Type}</p>
            <p className='text-sm font-normal text-[var(--text-primary)]'><strong>Học phí:</strong> {formattedPrice}</p>
            <p className='text-sm font-normal text-[var(--text-primary)]'><strong>Số chủ đề:</strong> {bookData.Topics.length} chủ đề</p>
            <p className='text-sm font-normal text-[var(--text-primary)]'><strong>Số tiết quy định:</strong> {bookData.Topics.reduce((total, item) => total + (item.Period || 0), 0)} tiết</p>
            <p className='text-sm font-normal text-[var(--text-primary)]'><strong>Mô tả:</strong> {bookData.Describe}</p>
        </div>
        <button onClick={onEditClick} className={`${'inline-flex items-center justify-center gap-[0.6rem] px-5 py-2.5 rounded-md cursor-pointer border border-transparent transition-all duration-200 no-underline whitespace-nowrap hover:-translate-y-0.5'} ${'border-[var(--main_b)] bg-[var(--main_b)] mt-auto p-[10px] text-white hover:border-[var(--main_d)] hover:bg-[var(--main_d)]'}`}>
            <Svg_Pen w={18} h={18} c='white' />
            <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Chỉnh sửa thông tin</p>
        </button>
    </aside>
));
InfoPanel.displayName = 'InfoPanel';

const TopicItem = React.memo(({ topic, index, i, dragHandlers, actionHandlers }) => {
    const isDragging = dragHandlers.draggedIndex === index;
    const dragItemClass = `${'flex gap-2 mb-2 cursor-move transition-all duration-200'} ${isDragging ? 'opacity-50 scale-[1.01] shadow-[0_5px_15px_rgba(0,0,0,0.2)]' : ''}`;

    return (
        <React.Fragment>
            {dragHandlers.dragOverIndex === index && !isDragging && <div className={'h-[70px] bg-[rgba(0,123,255,0.1)] border-2 border-dashed border-[var(--main_b)] rounded-lg my-1'} />}
            <div
                draggable
                onDragStart={(e) => dragHandlers.onDragStart(e, index)}
                onDragEnter={(e) => dragHandlers.onDragEnter(e, index)}
                onDragEnd={dragHandlers.onDragEnd}
                className={dragItemClass}
            >
                <div className={'w-[100px] aspect-[4/3] overflow-hidden rounded-lg flex items-center justify-center bg-[var(--border-color)]'}><p className='text-xs font-semibold text-[var(--text-primary)]'>Chủ đề: {i}</p></div>
                <li className={'flex-1 flex items-center gap-4 bg-transparent p-4 rounded-lg border border-[var(--border-color)] border-l-3 border-[var(--border-color)] transition-all duration-200 hover:bg-[var(--bg-secondary)]'}>
                    <div className={'flex-1'}>
                        <p className='text-base font-semibold text-[var(--text-primary)]'>{topic.Name}</p>
                        <p className={'text-[0.9rem] text-[var(--text-secondary)] m-0'}>Thời lượng: {topic.Period || 'N/A'} tiết</p>
                    </div>
                    <div className={'flex gap-2'}>
                        <div className={`p-1.5 rounded flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5 ${'bg-[var(--yellow)]'}`} onClick={() => actionHandlers.onEdit(topic)}><Svg_Pen w={18} h={18} c='white' /></div>
                        <a href={topic.Slide} target="_blank" rel="noopener noreferrer" className={`p-1.5 rounded flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5 ${'bg-[var(--main_b)]'}`}><Svg_Slide w={18} h={18} c='white' /></a>
                        <div className={`p-1.5 rounded flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5 ${'bg-[var(--red)] m-0'}`} onClick={() => actionHandlers.onDelete(topic._id, topic.Name)}><Svg_Delete w={15} h={15} c='white' /></div>
                    </div>
                </li>
            </div>
        </React.Fragment>
    );
});
TopicItem.displayName = 'TopicItem';

const TopicsPanel = React.memo(({ topics, dragHandlers, actionHandlers, onAddTopic }) => {
    let i = 0;
    return (
        <main className={'flex-[3] min-w-[400px] flex flex-col border-l border-[var(--border-color)] pl-4'} onDrop={dragHandlers.onDrop} onDragOver={(e) => e.preventDefault()}>
            <div className={'flex justify-between items-center pb-4 mb-2 border-b border-[var(--border-color)]'}>
                <p className='text-xl font-semibold text-[var(--text-primary)]'>Danh sách chủ đề</p>
                <button onClick={onAddTopic} className={`${'inline-flex items-center justify-center gap-[0.6rem] px-5 py-2.5 rounded-md cursor-pointer border border-transparent transition-all duration-200 no-underline whitespace-nowrap hover:-translate-y-0.5'} ${'bg-[var(--main_b)] text-white hover:bg-[var(--main_d)]'}`}>
                    <Svg_Add w={18} h={18} c='white' />
                    <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Thêm chủ đề</p>
                </button>
            </div>
            <ul className={'flex-1 list-none p-0 m-0 overflow-y-auto pr-[10px]'}>
                {topics.map((topic, index) => {
                    if (topic.Status === false) return null;
                    i++;
                    return <TopicItem key={topic._id} topic={topic} index={index} i={i} dragHandlers={dragHandlers} actionHandlers={actionHandlers} />;
                })}
            </ul>
        </main>
    );
});
TopicsPanel.displayName = 'TopicsPanel';

const ActionPopups = React.memo(({ popups, handlers, bookData, currentEditingTopic }) => (
    <>
        <FlexiblePopup open={popups.isEditPopupOpen} onClose={handlers.onCloseEditBook} title="Chỉnh sửa thông tin sách" width={500}
            renderItemList={() => <EditBookForm initialData={bookData} onSave={handlers.onSaveBook} onCancel={handlers.onCloseEditBook} isLoading={handlers.isLoading} />}
        />
        <FlexiblePopup open={popups.isAddTopicPopupOpen} onClose={handlers.onCloseAddTopic} title="Thêm chủ đề mới" width={500}
            renderItemList={() => <AddTopicForm onSave={handlers.onSaveTopic} onCancel={handlers.onCloseAddTopic} isLoading={handlers.isLoading} />}
        />
        {currentEditingTopic && (
            <FlexiblePopup open={popups.isEditTopicPopupOpen} onClose={handlers.onCloseEditTopic} title={`Chỉnh sửa: ${currentEditingTopic.Name}`} width={500}
                renderItemList={() => <EditTopicForm initialData={currentEditingTopic} onSave={handlers.onSaveEditedTopic} onCancel={handlers.onCloseEditTopic} isLoading={handlers.isLoading} />}
            />
        )}
    </>
));
ActionPopups.displayName = 'ActionPopups';

// --- Main Component ---
const BookDetail = ({ data: initialData }) => {
    const router = useRouter();
    const [bookData, setBookData] = useState({ ...initialData, Topics: initialData.Topics || [] });
    const [popups, setPopups] = useState({ isEditPopupOpen: false, isAddTopicPopupOpen: false, isEditTopicPopupOpen: false });
    const [currentEditingTopic, setCurrentEditingTopic] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [notiState, setNotiState] = useState({ open: false, status: true, mes: '' });
    const [alertConfig, setAlertConfig] = useState({ open: false, title: '', content: null, actions: null, type: 'info' });
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const API_ENDPOINT = useMemo(() => `/api/book/${bookData._id}`, [bookData._id]);
    const formattedPrice = useMemo(() => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(bookData.Price), [bookData.Price]);

    useEffect(() => { setBookData({ ...initialData, Topics: initialData.Topics || [] }); }, [initialData]);

    const handleCloseNoti = useCallback(() => setNotiState(prev => ({ ...prev, open: false })), []);
    const handleCloseAlert = useCallback(() => setAlertConfig(prev => ({ ...prev, open: false })), []);

    const callApi = useCallback(async (method, body, endpoint = API_ENDPOINT) => {
        setIsLoading(true);
        const fetchOptions = { method };
        if (body) {
            if (body instanceof FormData) {
                fetchOptions.body = body;
            } else {
                fetchOptions.headers = { 'Content-Type': 'application/json' };
                fetchOptions.body = JSON.stringify(body);
            }
        }
        try {
            const response = await fetch(endpoint, fetchOptions);
            const result = await response.json();
            if (!response.ok) throw new Error(result.mes || `Lỗi ${response.status}`);
            setNotiState({ open: true, status: true, mes: result.mes });
            router.refresh();
            return true;
        } catch (error) {
            setNotiState({ open: true, status: false, mes: error.message });
            return false;
        } finally {
            setIsLoading(false);
        }
    }, [API_ENDPOINT, router]);

    const handleDragStart = useCallback((e, index) => { setDraggedIndex(index); e.dataTransfer.effectAllowed = 'move'; }, []);
    const handleDragEnter = useCallback((e, index) => { e.preventDefault(); if (index !== dragOverIndex) setDragOverIndex(index); }, [dragOverIndex]);
    const handleDragEnd = useCallback(() => { setDraggedIndex(null); setDragOverIndex(null); }, []);

    const handleDrop = useCallback(async (e) => {
        e.preventDefault();
        if (draggedIndex === null || dragOverIndex === null || draggedIndex === dragOverIndex) return handleDragEnd();
        const originalTopics = [...bookData.Topics];
        const reorderedTopics = reorder(originalTopics, draggedIndex, dragOverIndex);
        setBookData(prev => ({ ...prev, Topics: reorderedTopics }));
        handleDragEnd();
        const success = await callApi('PUT', { orderedTopicIds: reorderedTopics.map(t => t._id) });
        if (!success) setBookData(prev => ({ ...prev, Topics: originalTopics }));
    }, [draggedIndex, dragOverIndex, bookData.Topics, handleDragEnd, callApi]);

    const handleSaveBook = useCallback(async (formData) => {
        const success = await callApi('PUT', formData, '/api/book');
        if (success) setPopups(prev => ({ ...prev, isEditPopupOpen: false }));
    }, [callApi, bookData._id]);

    const handleSaveTopic = useCallback(async (newTopicData) => {
        const success = await callApi('POST', { topics: [newTopicData] });
        if (success) setPopups(prev => ({ ...prev, isAddTopicPopupOpen: false }));
    }, [callApi]);

    const handleOpenEditTopic = useCallback((topic) => {
        setCurrentEditingTopic(topic);
        setPopups(prev => ({ ...prev, isEditTopicPopupOpen: true }));
    }, []);

    const handleCloseEditTopic = useCallback(() => {
        setPopups(prev => ({ ...prev, isEditTopicPopupOpen: false }));
        setCurrentEditingTopic(null);
    }, []);

    const handleSaveEditedTopic = useCallback(async (updatedTopicData) => {
        if (!currentEditingTopic) return;
        const success = await callApi('PUT', { topicId: currentEditingTopic._id, updateData: updatedTopicData });
        if (success) handleCloseEditTopic();
    }, [callApi, currentEditingTopic, handleCloseEditTopic]);

    const executeDelete = useCallback(async (topicId) => {
        handleCloseAlert();
        await callApi('DELETE', { topicId });
    }, [callApi, handleCloseAlert]);

    const handleDeleteTopic = useCallback((topicId, topicName) => {
        setAlertConfig({
            open: true,
            type: 'warning',
            title: 'Xác nhận xóa chủ đề',
            content: <p>Bạn có chắc chắn muốn xóa chủ đề <strong>{topicName}</strong>? Hành động này không thể hoàn tác.</p>,
            actions: (
                <>
                    <button onClick={handleCloseAlert} className={`px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5 ${'bg-[var(--gray_b)] m-0'}`}>Hủy</button>
                    <button onClick={() => executeDelete(topicId)} className={`px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5 ${'bg-[var(--red)] m-0'}`}>Xóa</button>
                </>
            )
        });
    }, [executeDelete, handleCloseAlert]);

    return (
        <>
            <div className={'flex w-[calc(100%-34px)] h-[calc(100%-34px)] border border-[var(--border-color)] rounded-lg overflow-hidden p-4 gap-4'}>
                <InfoPanel
                    bookData={bookData}
                    formattedPrice={formattedPrice}
                    onEditClick={() => setPopups(prev => ({ ...prev, isEditPopupOpen: true }))}
                />
                <TopicsPanel
                    topics={bookData.Topics}
                    dragHandlers={{
                        draggedIndex, dragOverIndex,
                        onDragStart: handleDragStart, onDragEnter: handleDragEnter,
                        onDragEnd: handleDragEnd, onDrop: handleDrop
                    }}
                    actionHandlers={{ onEdit: handleOpenEditTopic, onDelete: handleDeleteTopic }}
                    onAddTopic={() => setPopups(prev => ({ ...prev, isAddTopicPopupOpen: true }))}
                />
            </div>
            <ActionPopups
                popups={popups}
                handlers={{
                    onCloseEditBook: () => setPopups(prev => ({ ...prev, isEditPopupOpen: false })),
                    onSaveBook: handleSaveBook,
                    onCloseAddTopic: () => setPopups(prev => ({ ...prev, isAddTopicPopupOpen: false })),
                    onSaveTopic: handleSaveTopic,
                    onCloseEditTopic: handleCloseEditTopic,
                    onSaveEditedTopic: handleSaveEditedTopic,
                    isLoading: isLoading,
                }}
                bookData={bookData}
                currentEditingTopic={currentEditingTopic}
            />
            {isLoading && <div className='loadingOverlay'><Loading content={<p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Đang xử lý...</p>} /></div>}
            <Noti open={notiState.open} onClose={handleCloseNoti} status={notiState.status} mes={notiState.mes} />
            <AlertPopup {...alertConfig} onClose={handleCloseAlert} />
        </>
    );
};
export default BookDetail;