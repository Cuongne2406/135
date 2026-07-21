'use client';

import { useState, useMemo } from 'react';
// Đổi tên file CSS để khớp
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import { Svg_History } from '@/components/(icon)/svg';

// --- CÁC COMPONENT CON & HÀM HỖ TRỢ ---

const getActionTypeName = (type) => {
    switch (type) {
        case 'findUid': return 'Tìm UID';
        case 'sendMessage': return 'Gửi Tin';
        case 'addFriend': return 'Kết bạn';
        default: return 'Hành động';
    }
}

function HistoryItem({ job, onShowTasks, onShowJobDetails }) {
    if (!job || !job._id) return null; 
    const { total, completed, failed } = job.statistics;

    return (
        <div className={'p-4 border-b border-[var(--border-color)]'}>
            <div className={'flex justify-between items-center mb-3'}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <h5>{job.jobName}</h5>
                    <h6>Người tạo: {job.createdBy?.name || 'Không rõ'}</h6>
                </div>
                <h6>{job.zaloAccount?.name || 'Không rõ'} - {getActionTypeName(job.actionType)}</h6>
            </div>
            <div className={'flex justify-between items-center mb-2'}>
                <h6>Hoàn thành: {new Date(job.updatedAt).toLocaleString('vi-VN')}</h6>
            </div>
            <div className={'mt-3'}>
                <h6>Thống kê:
                    <span style={{ color: 'var(--green)', marginLeft: '8px' }}>Thành công: {completed}</span>,
                    <span style={{ color: 'var(--red)', marginLeft: '8px' }}>Thất bại: {failed}</span>,
                    <span style={{ marginLeft: '8px' }}>Tổng: {total}</span>
                </h6>
            </div>
            <div className={'mt-4 flex gap-2'}>
                <button className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100' onClick={() => onShowTasks(job)}>
                    <h6 style={{ color: 'var(--text-primary)' }}>Danh sách thực hiện</h6>
                </button>
                <button className='px-3 py-2 rounded bg-[var(--main_d)] text-white flex items-center gap-2 justify-center whitespace-nowrap border-none cursor-pointer transition-all duration-200 hover:bg-[var(--main_b)]' onClick={() => onShowJobDetails(job)}>
                    <h6>Chi tiết lịch trình</h6>
                </button>
            </div>
        </div>
    );
}

// Component hiển thị chi tiết một Task
function HistoryTaskItem({ task }) {
    const didSucceed = task.history?.status?.status === true;
    const statusText = didSucceed ? 'Thành công' : 'Thất bại';
    const statusKey = didSucceed ? 'success' : 'failed';
    const errorMessage = !didSucceed ? task.history?.status?.message : null;

    return (
        <div className={'flex justify-between items-center p-3 border-b border-[var(--border-color)]'}>
            <div className={'flex flex-col gap-1'}>
                <h5>{task.person.name}</h5>
                <h6>{task.person.phone}</h6>
                {errorMessage && <h6 className={'text-[var(--red)] italic'}>Lý do: {errorMessage}</h6>}
            </div>
            <div className={'flex items-center gap-2 text-right whitespace-nowrap'}>
                <div className={`${'w-2 h-2 rounded-full'} ${styles[statusKey]}`}></div>
                <h6>{statusText}</h6>
                <h6>{new Date(task.scheduledFor).toLocaleTimeString('vi-VN')}</h6>
            </div>
        </div>
    );
}

// Component mới: Hiển thị chi tiết Lịch trình
function ScheduleDetailsView({ job }) {
    if( !job || !job._id) return null;
    return (
        <div className={'p-4 border-b border-[var(--border-color)]'} style={{ border: 'none' }}>
            <div className={'flex justify-between items-center mb-3'}>
                <h5>{job.jobName}</h5>
                <h6>{getActionTypeName(job.actionType)}</h6>
            </div>
            <div className={'mt-3 grid grid-cols-2 gap-3'}>
                <div>
                    <h6>Tài khoản Zalo:</h6>
                    <h5>{job.zaloAccount?.name || 'N/A'}</h5>
                </div>
                <div>
                    <h6>Người tạo:</h6>
                    <h5>{job.createdBy?.name || 'N/A'}</h5>
                </div>
                <div>
                    <h6>Ngày tạo:</h6>
                    <h5>{new Date(job.createdAt).toLocaleString('vi-VN')}</h5>
                </div>
                <div>
                    <h6>Hoàn thành:</h6>
                    <h5>{new Date(job.updatedAt).toLocaleString('vi-VN')}</h5>
                </div>
            </div>
            {job.config.messageTemplate && (
                <div className={'mt-3'}>
                    <h5>Nội dung tin nhắn:</h5>
                    <blockquote style={{ marginTop: 5 }}>{job.config.messageTemplate}</blockquote>
                </div>
            )}
        </div>
    );
}


// --- COMPONENT CHÍNH ---
export default function ActionHistory({ history = [] }) {
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [viewingDetailsFor, setViewingDetailsFor] = useState(null);
    const [secondaryView, setSecondaryView] = useState('tasks'); // 'tasks' hoặc 'details'
    const [activeFilter, setActiveFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');

    const jobsToDisplay = useMemo(() => {
        let list = history;
        if (searchTerm) {
            const lowercasedFilter = searchTerm.toLowerCase();
            list = list.filter(job =>
                job.jobName.toLowerCase().includes(lowercasedFilter) ||
                job.zaloAccount?.name.toLowerCase().includes(lowercasedFilter)
            );
        }
        return list;
    }, [history, searchTerm]);

    const categorizedTasks = useMemo(() => {
        if (!viewingDetailsFor) return { success: [], failed: [], all: [] };
        const success = [], failed = [];
        viewingDetailsFor.tasks.forEach(task => {
            if (task.history?.status?.status === true) success.push(task);
            else failed.push(task);
        });
        return { success, failed, all: [...success, ...failed] };
    }, [viewingDetailsFor]);

    const filteredTasks = useMemo(() => categorizedTasks[activeFilter] || [], [activeFilter, categorizedTasks]);

    if (!history || history.length === 0) return null;

    const handleOpenPopup = () => {
        setSearchTerm('');
        setIsPopupOpen(true);
    };
    const handleShowTasks = (job) => {
        setViewingDetailsFor(job);
        setSecondaryView('tasks');
        setActiveFilter('all');
    };
    const handleShowJobDetails = (job) => {
        setViewingDetailsFor(job);
        setSecondaryView('details');
    };
    const handleCloseSecondary = () => setViewingDetailsFor(null);

    return (
        <>
            <button className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100' onClick={handleOpenPopup}>
                <Svg_History w={'var(--font-size-sm)'} h={'var(--font-size-sm)'} c={'var(--text-primary)'}/>
                <h5>Lịch sử: {history.length}</h5>
            </button>
            <FlexiblePopup
                open={isPopupOpen}
                onClose={() => setIsPopupOpen(false)}
                title="Lịch sử hành động"
                width={'600px'}
                renderItemList={() => (
                    <div>
                        <div className={'p-3 flex gap-2 border-b border-[var(--border-color)]'}>
                            <input
                                type="text"
                                placeholder="Tìm theo tên lịch, tên zalo..."
                                value={searchTerm}
                                style={{ flex: 1 }}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none ${''}`}
                            />
                        </div>
                        <div className={`${'flex flex-col'} scroll`}>
                            {jobsToDisplay.length > 0 ? jobsToDisplay.map(job => (
                                <HistoryItem
                                    key={job._id}
                                    job={job}
                                    onShowTasks={handleShowTasks}
                                    onShowJobDetails={handleShowJobDetails}
                                />
                            )) : (
                                <div className={'text-center p-8 text-[var(--text-secondary)] italic'}><h6>Không có lịch sử nào phù hợp.</h6></div>
                            )}
                        </div>
                    </div>
                )}
                secondaryOpen={!!viewingDetailsFor}
                onCloseSecondary={handleCloseSecondary}
                secondaryTitle={secondaryView === 'tasks' ? `Danh sách thực hiện (${viewingDetailsFor?.tasks?.length || 0})` : `Chi tiết lịch trình`}
                dataSecondary={viewingDetailsFor}
                width2={'550px'}
                renderSecondaryList={() => (
                    <div className={`${'flex flex-col'} scroll`}>
                        {secondaryView === 'tasks' ? (
                            <>
                                <div className={'flex gap-1 p-2 bg-[var(--bg-primary)] border-b border-[var(--border-color)] sticky top-0 z-10'}>
                                    <button className={activeFilter === 'all' ? 'bg-[var(--hover)] text-[var(--text-primary)] border-[var(--hover)]' : ''} onClick={() => setActiveFilter('all')}><h6>Tất cả ({categorizedTasks.all.length})</h6></button>
                                    <button className={activeFilter === 'success' ? 'bg-[var(--hover)] text-[var(--text-primary)] border-[var(--hover)]' : ''} onClick={() => setActiveFilter('success')}><h6>Thành công ({categorizedTasks.success.length})</h6></button>
                                    <button className={activeFilter === 'failed' ? 'bg-[var(--hover)] text-[var(--text-primary)] border-[var(--hover)]' : ''} onClick={() => setActiveFilter('failed')}><h6>Thất bại ({categorizedTasks.failed.length})</h6></button>
                                </div>
                                {filteredTasks.map(task => (<HistoryTaskItem key={task._id} task={task} />))}
                            </>
                        ) : (
                            <ScheduleDetailsView job={viewingDetailsFor} />
                        )}
                    </div>
                )}
            />
        </>
    );
}