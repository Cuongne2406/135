// Lesson_m.jsx
'use client';

import React, { useState, useEffect } from 'react';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Loading from '@/components/(ui)/(loading)/loading';
import Title from '@/components/(features)/(popup)/title';
import BoxFile from '@/components/(ui)/(box)/file';

export default function Lesson_m({ time, topic, courseID, room, id, type, d }) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [detail, setDetail] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!open || !id) return;

        setLoading(true);
        setError(null);
        setDetail(null);

        fetch(`/api/calendar/${id}`)
            .then(res => {
                if (!res.ok) throw new Error(`Lỗi HTTP ${res.status}`);
                return res.json();
            })
            .then(json => {
                if (!json.success) throw new Error(json.error || 'Lỗi không xác định');
                setDetail(json.data);
            })
            .catch(err => {
                console.error(err);
                setError('Không tải được dữ liệu chi tiết.');
            })
            .finally(() => setLoading(false));
    }, [open, id]);

    const handleClose = () => setOpen(false);

    return (
        <>
            <div className="flex gap-0.5 bg-[var(--bg-primary)] text-[#3b4056] border-b border-[var(--border-color)] cursor-pointer hover:bg-[var(--bg-secondary)]" onClick={() => setOpen(true)} style={{ cursor: 'pointer' }}>
                <h5 className="flex gap-1.5 items-center flex-1 py-3 pl-4">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={14} height={14} fill="var(--text-primary)">
                        <path d="M256 0a256 256 0 1 1 0 512A256 256 0 1 1 256 0zM232 120l0 136c0 8 4 15.5 10.7 20l96 64c11 7.4 25.9 4.4 33.3-6.7s4.4-25.9-6.7-33.3L280 243.2 280 120c0-13.3-10.7-24-24-24s-24 10.7-24 24z" />
                    </svg>
                    {time}
                </h5>
                <div className="flex-[4] flex justify-start items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#00851b]" />
                    <h5>Chủ đề:  {topic?.Name || 'Không có chủ đề'} - Lớp: {courseID}</h5>
                </div>
                <div className="flex-[0.7] flex justify-end items-center pr-4" style={{ gap: 8, display: 'flex' }}>
                    {d && <h6 className="px-2 py-1 rounded-full text-white m-0" style={{ background: `var(--red)`, whiteSpace: 'nowrap' }}>{d}</h6>}
                    <h6 className="px-2 py-1 rounded-full text-white m-0" style={{ background: `${room.color}`, whiteSpace: 'nowrap' }}>{room.area}</h6>
                </div>
            </div>

            <CenterPopup open={open} onClose={handleClose} size="md" globalZIndex={1000}>
                {(loading || !detail) && !error && (
                    <div style={{ height: 400 }}>
                        <Title content={'Lớp ...'} click={handleClose} />
                        <Loading content={'Đang tải dữ liệu'} />
                    </div>
                )}
                {error && <div style={{ padding: '1rem', color: 'red' }}>{error}</div>}
                {!loading && detail && (
                    <>
                        <Title content={`Lớp: ${detail.course.ID}`} click={handleClose} />
                        <div className="p-4 bg-[var(--bg-secondary)]">
                            <p className='text-base font-semibold text-[var(--text-primary)]'>Thông tin buổi học</p>
                            <div className="my-2 rounded shadow-[var(--boxshaw2)] p-2">
                                <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ padding: 4 }}>Chủ đề: <span style={{ fontWeight: 400 }}>{detail.session.Topic?.Name || '-'}</span></p>
                                <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ padding: 4 }}>Giáo viên: <span style={{ fontWeight: 400 }}>{detail.session.Teacher?.name || '-'}</span></p>
                                <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ padding: 4 }}>Trợ giảng: <span style={{ fontWeight: 400 }}>{detail.session.TeachingAs?.name || '-'}</span></p>
                                <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ padding: 4 }}>Thời gian: <span style={{ fontWeight: 400 }}>{detail.session.Time || '-'}</span></p>
                                <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ padding: 4 }}>Phòng học: <span style={{ fontWeight: 400 }}>{detail.session.Room || '-'}</span></p>
                            </div>

                            <p className='text-base font-semibold text-[var(--text-primary)]'>Thông tin học sinh (sĩ số: {detail.students.length})</p>
                            <div className="my-2 rounded shadow-[var(--boxshaw2)] p-2">
                                {detail.students.length > 0 ? (
                                    <div style={{ maxHeight: 180, overflowY: 'auto' }}>
                                        {detail.students.map(student => (
                                            <div key={student._id} className='text-sm font-normal text-[var(--text-primary)]' style={{ padding: '6px 4px', display: 'flex', justifyContent: 'space-between' }}>
                                                <p>{student.Name || student.ID}</p>
                                                <p>
                                                    {student.attendance.Checkin === 1 ? 'Có mặt' :
                                                        student.attendance.Checkin === 2 ? 'Xin nghỉ' :
                                                            type ? 'Chưa điểm danh' : 'Vắng mặt'}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                ) : <p className='text-sm font-normal text-[var(--text-primary)]' style={{ padding: '6px 4px' }}>Không có học sinh nào</p>}
                            </div>

                            <p className='text-base font-semibold text-[var(--text-primary)]' style={{ padding: '8px 0' }}>Tài nguyên buổi học</p>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                {detail.session.image &&
                                    <BoxFile type={'Image'} name='Hình ảnh' href={`https://drive.google.com/drive/folders/${detail.session.image}`} />
                                }
                                {detail.session.Topic?.Slide &&
                                    <div style={{ width: 150 }}>
                                        <BoxFile type={'Ppt'} name='Slide giảng dạy' href={detail.session.Topic.Slide} />
                                    </div>
                                }
                            </div>
                        </div>
                    </>
                )}
            </CenterPopup>
        </>
    );
}
