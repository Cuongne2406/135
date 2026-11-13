'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import { student_data } from '@/data/actions/get';

const SendingSpinner = () => (
    <svg className={'w-4 h-4 animate-spin'} viewBox="0 0 50 50">
        <circle className={'stroke-[var(--main_d)] stroke-linecap-round'} cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
    </svg>
);

const SuccessIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill="var(--green)">
        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" />
    </svg>
);

const ErrorIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill="var(--red)">
        <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z" />
    </svg>
);

const ProgressOverlay = ({ progress }) => (
    <div className={'w-full h-full fixed inset-0 z-[9999] bg-black/40 flex items-center justify-center backdrop-blur-[4px]'}>
        <div className={'bg-white rounded-xl p-6 min-w-[320px] text-center shadow-[0_8px_32px_rgba(0,0,0,0.12)]'}>
            <Loading content='Đang xử lý...' />
            <div style={{ marginTop: 16 }}>
                <p className="text-sm font-semibold text-[var(--text-primary)]" style={{ marginBottom: 8 }}>
                    Đang gửi tin nhắn hàng loạt
                </p>
                <div className={'bg-[#f0f0f0] rounded-lg h-2 mb-2 overflow-hidden'}>
                    <div
                        className={'bg-[var(--main_d)] h-full transition-all duration-300'}
                        style={{ width: progress.total > 0 ? `${(progress.completed / progress.total) * 100}%` : '0%' }}
                    />
                </div>
                <p className="text-xs font-semibold text-[var(--text-primary)]" style={{ color: '#666' }}>
                    Đã hoàn tất: {progress.completed} / {progress.total}
                </p>
            </div>
        </div>
    </div>
);


const toArr = (v) =>
    Array.isArray(v) ? v : v == null ? [] : typeof v === 'object' ? Object.values(v) : [v];


export default function AnnounceStudentWrapper({ course }) {
    const [isSending, setIsSending] = useState(false);
    const [progress, setProgress] = useState({ completed: 0, total: 0 });

    return (
        <>
            {isSending && <ProgressOverlay progress={progress} />}
            <AnnounceStudent
                course={course}
                setIsSending={setIsSending}
                setProgress={setProgress}
            />
        </>
    );
}


function AnnounceStudent({ course, setIsSending, setProgress }) {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [selectedStudentIds, setSelectedStudentIds] = useState([]);
    const [noti, setNoti] = useState({ open: false, mes: '', status: false });
    const [masterStudentList, setMasterStudentList] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [sendStatuses, setSendStatuses] = useState({});

    const studentsInCourse = useMemo(() => toArr(course?.Student), [course]);
    const studentNameMap = useMemo(() => new Map(masterStudentList.map(s => [s.ID, s.Name])), [masterStudentList]);

    useEffect(() => {
        if (isOpen && masterStudentList.length === 0) {
            setIsLoading(true);
            (async () => {
                const data = await student_data();
                setMasterStudentList(data);
                setIsLoading(false);
            })();
        }
    }, [isOpen, masterStudentList.length]);

    useEffect(() => {
        if (isOpen) {
            setSelectedStudentIds(studentsInCourse.map(s => s.ID));
        }
    }, [isOpen, studentsInCourse]);

    const handleToggleStudent = useCallback((studentId) => {
        setSelectedStudentIds(prev => prev.includes(studentId) ? prev.filter(id => id !== studentId) : [...prev, studentId]);
    }, []);

    const handleSelectAll = useCallback(() => {
        setSelectedStudentIds(studentsInCourse.map(s => s.ID));
    }, [studentsInCourse]);

    const handleDeselectAll = useCallback(() => {
        setSelectedStudentIds([]);
    }, []);

    const resetPopup = useCallback(() => {
        setIsOpen(false);
        setMessage('');
        setSelectedStudentIds([]);
        setSendStatuses({});
    }, []);

    const handleSend = useCallback(async () => {
        if (!message.trim() || selectedStudentIds.length === 0) {
            setNoti({ open: true, mes: 'Vui lòng nhập thông báo và chọn ít nhất một người nhận.', status: false });
            return;
        }

        const totalSends = selectedStudentIds.length;
        setIsSending(true);
        setProgress({ completed: 0, total: totalSends });

        const initialStatuses = {};
        selectedStudentIds.forEach(id => { initialStatuses[id] = 'sending'; });
        setSendStatuses(initialStatuses);
        setIsOpen(false);

        const historyResults = [];

        const sendPromises = selectedStudentIds.map(async (studentId) => {
            const studentData = masterStudentList.find(s => s.ID === studentId);
            const personalizedMessage = message
                .replace(/{namestudent}/g, studentData?.Name || '')
                .replace(/{nameparents}/g, studentData?.ParentName || '');

            try {
                const res = await fetch(`/api/senduser`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mes: personalizedMessage, id: studentId })
                });
                const data = await res.json();
                if (!res.ok || data.status !== 2) throw new Error(data.message || 'Lỗi không xác định.');

                setSendStatuses(prev => ({ ...prev, [studentId]: 'success' }));

                // ===== THAY ĐỔI Ở ĐÂY (Success Case) =====
                // Tạo định danh người nhận từ TÊN và UID trả về từ Zalo API
                const recipientName = data.data?.name || 'Không rõ tên';
                const recipientIdentifier = `${recipientName} (${studentData?.Phone || 'N/A'})`;
                historyResults.push({ phone: recipientIdentifier, status: 'success' });
                // ===========================================

                return { status: 'fulfilled', value: data };
            } catch (error) {
                setSendStatuses(prev => ({ ...prev, [studentId]: 'error' }));

                // ===== THAY ĐỔI Ở ĐÂY (Error Case) =====
                // Tạo định danh từ TÊN và SĐT trong database khi gửi lỗi
                const recipientIdentifier = studentData?.Name ? `${studentData.Name} (${studentData.Phone || 'N/A'})` : (studentData?.Phone || 'N/A');
                historyResults.push({ phone: recipientIdentifier, status: 'failed', error: error.message });
                // ========================================

                return { status: 'rejected', reason: error.message };
            } finally {
                setProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
            }
        });

        const results = await Promise.all(sendPromises);

        try {
            await fetch('/api/hissmes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mes: message, labels: [course?.Name || 'General'], results: historyResults })
            });
        } catch (error) {
            console.error("Failed to save send history:", error);
        }

        setIsSending(false);
        const successfulSends = results.filter(r => r.status === 'fulfilled').length;
        setNoti({
            open: true,
            mes: `Hoàn tất: ${successfulSends}/${totalSends} tin nhắn đã được gửi thành công.`,
            status: successfulSends === totalSends
        });
        resetPopup();
    }, [message, selectedStudentIds, masterStudentList, resetPopup, course?.Name, setIsSending, setProgress]);

    const renderStatusIndicator = (studentId, isSelected) => {
        const status = sendStatuses[studentId];
        if (status === 'sending') return <SendingSpinner />;
        if (status === 'success') return <SuccessIcon />;
        if (status === 'error') return <ErrorIcon />;
        if (isSelected) {
            return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={16} height={16} fill='white'><path d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zM337 209L209 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L303 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z" /></svg>;
        }
        return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width={16} height={16} fill='var(--red)'><path d="M64 32C28.7 32 0 60.7 0 96L0 416c0 35.3 28.7 64 64 64l320 0c35.3 0 64-28.7 64-64l0-320c0-35.3-28.7-64-64-64L64 32zm79 143c9.4-9.4 24.6-9.4 33.9 0l47 47 47-47c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9l-47 47 47 47c9.4 9.4 9.4 24.6 0 33.9s-24.6 9.4-33.9 0l-47-47-47 47c-9.4 9.4-24.6 9.4-33.9 0s-9.4-24.6 0-33.9l47-47-47-47c-9.4-9.4-9.4-24.6 0-33.9z" /></svg>;
    };

    const renderForm = () => (
        <div className={'flex flex-col gap-5 p-4'}>
            <div>
                <TextNoti mes={`Gửi thông báo sẽ gửi đoạn tin nhắn bạn nhập tới tài khoản Zalo phụ huynh các học sinh trong danh sách được chọn.`} title='Gửi thông báo' color='blue' />
                <div style={{ marginTop: 8 }}>
                    <TextNoti mes={`Nhập kí tự {namestudent} để thay thế tên học sinh, kí tự {nameparents} để thay thế tên phụ huynh học sinh khi gửi tin.`} title='Cá nhân hóa tin nhắn' color='yellow' />
                </div>
                <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ margin: '16px 0 8px 0' }}>Nội dung gửi đi</p>
                <textarea id="announcement_message" className={'p-3 text-sm border border-[#e2e8f0] bg-[#f8fafc] rounded-lg outline-none font-sans min-h-[100px] max-h-[200px] w-[calc(100%-24px)]'} rows="5" placeholder="Nhập nội dung cần thông báo..." value={message} onChange={(e) => setMessage(e.target.value)} />
            </div>
            <div>
                <div className={'flex justify-between items-center mb-2'}>
                    <label className='text-sm font-semibold text-[var(--text-primary)]'>Chọn người nhận ({selectedStudentIds.length}/{studentsInCourse.length})</label>
                    <div className={'flex gap-2'}>
                        <button onClick={handleSelectAll}>Chọn tất cả</button>
                        <button onClick={handleDeselectAll}>Bỏ chọn</button>
                    </div>
                </div>
                <div className={'max-h-[250px] overflow-y-auto border border-[var(--border-color)] rounded-md'}>
                    {isLoading ? (<Loading content="Đang tải..." />) : studentsInCourse.length > 0 ? (
                        studentsInCourse.map(student => {
                            const isSelected = selectedStudentIds.includes(student.ID);
                            const name = studentNameMap.get(student.ID) || 'Không tìm thấy tên';
                            return (
                                <div key={student.ID} className={'flex items-center gap-3 p-[10px] cursor-pointer border-b border-[var(--border-color-light)] transition-colors duration-200 hover:bg-[var(--bg-secondary)]'} style={{ background: isSelected ? 'var(--main_d)' : 'transparent', color: isSelected ? 'white' : 'var(--text-primary)', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }} onClick={() => handleToggleStudent(student.ID)}>
                                    <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
                                        <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: isSelected ? 'var(--bg-secondary)' : 'var(--text-secondary)' }}>ID: {student.ID}</p>
                                        <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: isSelected ? 'var(--bg-secondary)' : 'var(--text-secondary)' }}>Họ và Tên: {name}</p>
                                    </div>
                                    <div className={'flex items-center justify-center w-4 h-4'}>
                                        {renderStatusIndicator(student.ID, isSelected)}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className={'p-5 text-center text-[var(--text-secondary)]'}>Khóa học chưa có học sinh.</p>
                    )}
                </div>
            </div>
            <div className={'flex justify-start gap-2 pt-4 border-t border-[var(--border-color)]'}>
                <button className="px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5" onClick={handleSend} style={{ gap: 8, borderRadius: 5, background: 'var(--green)' }} disabled={!message.trim() || selectedStudentIds.length === 0}>
                    <>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill='white'>
                            <path d="M498.1 5.6c10.1 7 15.4 19.1 13.5 31.2l-64 416c-1.5 9.7-7.4 18.2-16 23s-18.9 5.4-28 1.6L284 427.7l-68.5 74.1c-8.9 9.7-22.9 12.9-35.2 8.1S160 493.2 160 480l0-83.6c0-4 1.5-7.8 4.2-10.8L331.8 202.8c5.8-6.3 5.6-16-.4-22s-15.7-6.4-22-.7L106 360.8 17.7 316.6C7.1 311.3 .3 300.7 0 288.9s5.9-22.8 16.1-28.7l448-256c10.7-6.1 23.9-5.5 34 1.4z" />
                        </svg>
                        <div className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}> Gửi tin </div>
                    </>
                </button>
            </div>
        </div>
    );

    return (
        <>
            <div className={'flex items-center flex-col justify-center gap-2 rounded-md cursor-pointer w-full h-full bg-[#f5ffe5] transition-all duration-100 hover:-translate-y-0.5 hover:bg-[#f6ffde]'} onClick={() => setIsOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={16} height={16} fill='var(--text-primary)'>
                    <path d="M480 32c0-12.9-7.8-24.6-19.8-29.6s-25.7-2.2-34.9 6.9L381.7 53c-48 48-113.1 75-181 75l-8.7 0-32 0-96 0c-35.3 0-64 28.7-64 64l0 96c0 35.3 28.7 64 64 64l0 128c0 17.7 14.3 32 32 32l64 0c17.7 0 32-14.3 32-32l0-128 8.7 0c67.9 0 133 27 181 75l43.6 43.6c9.2 9.2 22.9 11.9 34.9 6.9s19.8-16.6 19.8-29.6l0-147.6c18.6-8.8 32-32.5 32-60.4s-13.4-51.6-32-60.4L480 32zm-64 76.7L416 240l0 131.3C357.2 317.8 280.5 288 200.7 288l-8.7 0 0-96 8.7 0c79.8 0 156.5-29.8 215.3-83.3z" />
                </svg>
                <p className="text-xs font-semibold text-[var(--text-primary)]">Thông báo</p>
            </div>

            <FlexiblePopup
                open={isOpen}
                onClose={resetPopup}
                width={600}
                title="Gửi thông báo đến học sinh"
                renderItemList={renderForm}
            />

            <Noti
                open={noti.open}
                onClose={() => setNoti(n => ({ ...n, open: false }))}
                status={noti.status}
                mes={noti.mes}
                button={
                    <button className="px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setNoti(n => ({ ...n, open: false }))}>
                        Đã hiểu
                    </button>
                }
            />
        </>
    );
}