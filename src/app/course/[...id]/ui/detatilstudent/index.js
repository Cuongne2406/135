'use client';

import React, { useState, useMemo, useCallback } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Title from '@/components/(features)/(popup)/title';
import Loading from '@/components/(ui)/(loading)/loading';
import Noti from '@/components/(features)/(noti)/noti';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import { Svg_Canlendar, Svg_Course, Svg_Profile } from '@/components/(icon)/svg';
import { formatDate } from '@/function';
import Link from 'next/link';

const toArr = (v) =>
    Array.isArray(v) ? v : v == null ? [] : typeof v === 'object' ? Object.values(v) : [v];

const SummaryBox = ({ title, data }) => (
    <div className={'bg-white rounded-md border border-[var(--border-color)] shadow-[0_2px_4px_rgba(0,0,0,0.05)] flex flex-col'}>
        <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ padding: '8px 16px', borderBottom: 'thin solid var(--border-color)' }}>{title}</p>
        <div className={'flex gap-2 p-2'}>
            {data.map(item => (
                <div key={item.label} className={'flex flex-col aspect-[16/14] w-[70px] items-center justify-center border border-[var(--border-color)] rounded-lg'}>
                    <span className='text-xl font-semibold text-[var(--text-primary)]'>{item.value}</span>
                    <span className='text-xs font-normal text-[var(--text-primary)]'>{item.label}</span>
                </div>
            ))}
        </div>
    </div>
);

export default function DetailStudent({ data: student, course, c, users, studentsx }) {
    Object.assign(student, studentsx.find(i => i.ID === student.ID) || {})
    const allDates = c.Detail.map(item => new Date(item.Day));
    const dateRange = [formatDate(new Date(Math.min(...allDates))), formatDate(new Date(Math.max(...allDates)))];
    const [openMain, setOpenMain] = useState(false);
    const [commentPop, setCommentPop] = useState({ open: false, lessonId: '', comments: [] });
    const [imagePop, setImagePop] = useState({ open: false, lessonId: '', imageId: '' });
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState({ open: false, status: false, mes: '', link: '' });

    /* ───────── HELPERS ───────── */
    const parseDMY = useCallback(dmy => {
        if (typeof dmy !== 'string' || !dmy.includes('/')) return null;
        const parts = dmy.split('/');
        if (parts.length !== 3) return null;
        const [d, m, y] = parts.map(Number);
        if (isNaN(d) || isNaN(m) || isNaN(y)) return null;
        return new Date(y, m - 1, d);
    }, []);

    const mapCheckin = useCallback(val => {
        switch (String(val)) {
            case '1': return 'Có mặt';
            case '2': return 'Vắng mặt';
            case '3': return 'Có phép';
            default: return 'Chưa điểm danh';
        }
    }, []);

    /* ───────── DATA PROCESSING ───────── */
    const { rows, summaryStats } = useMemo(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const studentLearnData = student.Learn || {};
        const allLessonsInCourse = toArr(c?.Detail);

        let attendedOfficial = 0, absentExcused = 0, absentUnexcused = 0;
        let attendedMakeup = 0, missedMakeup = 0;
        const topicsToMakeUp = new Set();

        const officialLessons = allLessonsInCourse.filter(les => les.Type !== 'Học bù');

        officialLessons.forEach(officialLesson => {
            const learnRecord = Object.values(studentLearnData).find(lr => lr.Lesson === officialLesson._id);
            if (officialLesson.Type === 'Báo nghỉ') {
                topicsToMakeUp.add(officialLesson.Topic);
                return;
            }
            if (learnRecord) {
                if (learnRecord.Checkin == '1') {
                    attendedOfficial++;
                } else if (learnRecord.Checkin == '2') {
                    absentUnexcused++;
                    topicsToMakeUp.add(officialLesson.Topic);
                } else if (learnRecord.Checkin == '3') {
                    absentExcused++;
                    topicsToMakeUp.add(officialLesson.Topic);
                }
            }
        });

        const studentMakeupLessons = course.filter(les => les.Type === 'Học bù');
        studentMakeupLessons.forEach(makeupLesson => {
            const learnRecord = Object.values(studentLearnData).find(lr => lr.Lesson === makeupLesson._id);
            if (learnRecord) {
                if (learnRecord.Checkin === '1') {
                    attendedMakeup++;
                } else {
                    missedMakeup++;
                }
            }
        });

        const processedRows = course.map((les, idx) => {
            const lessonDate = new Date(les.Day);
            const Status = lessonDate && lessonDate <= today ? 'Đã diễn ra' : 'Chưa diễn ra';
            const learnRecord = Object.values(studentLearnData).find(lr => lr.Lesson === les._id) || { Checkin: 0, Cmt: [] };

            return {
                ...les,
                index: idx + 1,
                Status,
                attendance: mapCheckin(learnRecord.Checkin),
                comments: learnRecord.Cmt,
                imagestudent: learnRecord.Image,
                Date: `${les.Time} - ${les.Day}`,
            };
        });

        return {
            rows: processedRows,
            summaryStats: {
                official: {
                    total: officialLessons.length,
                    attended: attendedOfficial,
                    excused: absentExcused,
                    unexcused: absentUnexcused,
                },
                makeupNeeded: {
                    count: topicsToMakeUp.size,
                },
                makeupTaken: {
                    total: studentMakeupLessons.length,
                    attended: attendedMakeup,
                    missed: missedMakeup,
                },
            }
        };
    }, [course, student.Learn, c, parseDMY, mapCheckin]);

    /* ───────── EXPORT EXCEL ───────── */
    const handleExport = async () => {
        try {
            setLoading(true);
            const lessonsPayload = rows.map((r, i) => ({
                Index: i + 1,
                Topic: r.LessonDetails,
                Teacher: r.Teacher,
                Status: r.Status,
                Day: r.Day,
                Time: r.Time,
                Attendance: r.attendance,
                Comments: Array.isArray(r.comments) ? r.comments.join(' | ') : '',
            }));

            const res = await fetch('/api/exportx', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    teacherHR: c.TeacherHR.name,
                    lessons: lessonsPayload,
                    course: c,
                    student,
                    summaryStats,
                    date: dateRange
                }),
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = URL.createObjectURL(blob);
                setToast({ open: true, status: true, mes: 'Xuất Excel thành công!', link: url });
            } else {
                const msg = await res.text();
                setToast({ open: true, status: false, mes: msg || 'Xuất thất bại', link: '' });
            }
        } catch (err) {
            console.error(err);
            setToast({ open: true, status: false, mes: 'Có lỗi khi gọi API', link: '' });
        } finally {
            setLoading(false);
        }
    };

    /* ───────── CELL UI ───────── */
    const Cell = ({ flex, align, header = false, children }) => (
        <div
            style={{ flex, justifyContent: align, fontWeight: header ? 500 : undefined }}
            className={`${'flex p-[8px_8px]'} text-sm font-normal text-[var(--text-primary)]`}
        >
            {children}
        </div>
    );

    /* ───────── LEGEND ───────── */
    const LegendBlock = () => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {[
                ['#e3ffe3', 'var(--green)', 'Có mặt'],
                ['#ffebeb', 'var(--red)', 'Vắng mặt'],
                ['#fffadd', 'var(--yellow)', 'Có phép'],
            ].map(([bg, border, label]) => (
                <div key={label} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <div style={{ width: 16, height: 16, background: bg, border: `thin solid ${border}` }} />
                    <p className="text-sm font-normal text-[var(--text-primary)]">{label}</p>
                </div>
            ))}
        </div>
    );

    /* ───────── ICONS ───────── */
    const MoreIcons = ({ onShowImg, onShowCmt }) => (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <div className="p-1.5 rounded flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5" style={{ background: 'var(--main_d)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={onShowImg}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><title>photo_album_fill</title><g fill="none"><path d="M24 0v24H0V0z" /><path fill="#FFF" d="M5 3a3 3 0 0 0-3 3v10a2 2 0 0 0 2 2V6a1 1 0 0 1 1-1h14a2 2 0 0 0-2-2zm0 5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v11.333a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2zm15 0H7v7.848L10.848 12a1.25 1.25 0 0 1 1.768 0l3.241 3.24.884-.883a1.25 1.25 0 0 1 1.768 0L20 15.848zm-2 3a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0" /></g></svg>
            </div>
            <div className="p-1.5 rounded flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5" style={{ background: 'var(--main_d)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }} onClick={onShowCmt}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"><title>chat_1_line</title><g fill="none"><path d="M24 0v24H0V0z" /><path fill="#FFF" d="M12 2c5.523 0 10 4.477 10 10s-4.477 10-10 10H4a2 2 0 0 1-2-2v-8C2 6.477 6.477 2 12 2m0 2a8 8 0 0 0-8 8v8h8a8 8 0 1 0 0-16m0 10a1 1 0 0 1 .117 1.993L12 16H9a1 1 0 0 1-.117-1.993L9 14zm3-4a1 1 0 1 1 0 2H9a1 1 0 1 1 0-2z" /></g></svg>
            </div>
        </div>
    );
    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(`https://airobotic.edu.vn/${student._id}${c._id}`);
        } catch (err) {
            console.error('Không thể sao chép: ', err);
        }
    };
    /* ───────── TABLE INSIDE POPUP ───────── */
    const renderItemList = () => (
        <>
            <div style={{ display: 'flex', margin: 16, gap: 16, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p className='text-base font-semibold text-[var(--text-primary)]'>Thông tin khóa học</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Svg_Course w={14} h={14} c='var(--text-primary)' />
                        <span className='text-sm font-semibold text-[var(--text-primary)]'>Tên khóa học :</span>
                        <span className="text-sm font-normal text-[var(--text-primary)]">{c.ID}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512" width={14} height={14} fill='var(--text-primary)'>
                            <path d="M0 48V487.7C0 501.1 10.9 512 24.3 512c5 0 9.9-1.5 14-4.4L192 400 345.7 507.6c4.1 2.9 9 4.4 14 4.4c13.4 0 24.3-10.9 24.3-24.3V48c0-26.5-21.5-48-48-48H48C21.5 0 0 21.5 0 48z" /></svg>
                        <span className='text-sm font-semibold text-[var(--text-primary)]'>Chương trình học :</span>
                        <span className="text-sm font-normal text-[var(--text-primary)]">{c.Book.Name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Svg_Canlendar w={14} h={14} c='var(--text-primary)' />
                        <span className='text-sm font-semibold text-[var(--text-primary)]'>Thời gian học :</span>
                        <span className="text-sm font-normal text-[var(--text-primary)]">{dateRange[0] || 'Không có'} - {dateRange[1] || 'Không có'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Svg_Profile w={14} h={14} c='var(--text-primary)' />
                        <span className='text-sm font-semibold text-[var(--text-primary)]'>Chủ nhiệm :</span>
                        <span className="text-sm font-normal text-[var(--text-primary)]">{c.TeacherHR.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Svg_Profile w={14} h={14} c='var(--text-primary)' />
                        <span className='text-sm font-semibold text-[var(--text-primary)]'>Số điện thoại :</span>
                        <span className="text-sm font-normal text-[var(--text-primary)]">{c.TeacherHR.phone}</span>
                    </div>
                </div>
                <div className={'flex gap-4'}>
                    <SummaryBox
                        title="Buổi học chính thức"
                        data={[
                            { value: summaryStats.official.total, label: 'Tổng buổi' },
                            { value: summaryStats.official.attended, label: 'Đã học' },
                            { value: summaryStats.official.excused, label: 'Vắng (P)' },
                            { value: summaryStats.official.unexcused, label: 'Vắng (K)' },
                        ]}
                    />
                    <SummaryBox
                        title="Chủ đề cần bù"
                        data={[{ value: summaryStats.makeupNeeded.count, label: 'Chủ đề' }]}
                    />
                    <SummaryBox
                        title="Thống kê học bù"
                        data={[
                            { value: summaryStats.makeupTaken.total, label: 'Tổng buổi' },
                            { value: summaryStats.makeupTaken.attended, label: 'Có mặt' },
                            { value: summaryStats.makeupTaken.missed, label: 'Vắng' },
                        ]}
                    />
                </div>
            </div>
            <div className={'flex items-center justify-between p-2 rounded-md border border-[var(--border-color)] mx-4 mb-2'}>
                <LegendBlock />
                <div style={{ display: 'flex', gap: 8 }}>
                    <div className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' style={{ display: 'flex', padding: 2, margin: 0, alignItems: 'center' }}>
                        <p className='text-sm font-normal text-[var(--text-primary)]' style={{ padding: 10, borderRight: 'thin solid var(--border-color)' }}>Link công khai: </p>
                        <p className='text-sm font-normal text-[var(--text-primary)]' style={{ padding: 10, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>https://airobotic.edu.vn/{student._id}{c._id}</p>
                        <div style={{ display: 'flex', gap: 2 }}>
                            <p onClick={handleCopy} style={{ background: 'var(--border-color)', borderRadius: 5, padding: 8, display: 'flex', alignItems: 'center', color: 'var(--text-primary)', borderLeft: 'thin solid var(--border-color)' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={18} height={18} fill='var(--text-primary)'>
                                    <path d="M480 400L288 400C279.2 400 272 392.8 272 384L272 128C272 119.2 279.2 112 288 112L421.5 112C425.7 112 429.8 113.7 432.8 116.7L491.3 175.2C494.3 178.2 496 182.3 496 186.5L496 384C496 392.8 488.8 400 480 400zM288 448L480 448C515.3 448 544 419.3 544 384L544 186.5C544 169.5 537.3 153.2 525.3 141.2L466.7 82.7C454.7 70.7 438.5 64 421.5 64L288 64C252.7 64 224 92.7 224 128L224 384C224 419.3 252.7 448 288 448zM160 192C124.7 192 96 220.7 96 256L96 512C96 547.3 124.7 576 160 576L352 576C387.3 576 416 547.3 416 512L416 496L368 496L368 512C368 520.8 360.8 528 352 528L160 528C151.2 528 144 520.8 144 512L144 256C144 247.2 151.2 240 160 240L176 240L176 192L160 192z" />
                                </svg>
                            </p>
                            <Link target='_blank' href={`https://airobotic.edu.vn/${student._id}${c._id}`} style={{ background: 'var(--main_d)', borderRadius: 5, padding: 8, display: 'flex', alignItems: 'center', color: 'var(--text-primary)', borderLeft: 'thin solid var(--border-color)' }}>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" width={18} height={18} fill='white'>
                                    <path d="M384 64C366.3 64 352 78.3 352 96C352 113.7 366.3 128 384 128L466.7 128L265.3 329.4C252.8 341.9 252.8 362.2 265.3 374.7C277.8 387.2 298.1 387.2 310.6 374.7L512 173.3L512 256C512 273.7 526.3 288 544 288C561.7 288 576 273.7 576 256L576 96C576 78.3 561.7 64 544 64L384 64zM144 160C99.8 160 64 195.8 64 240L64 496C64 540.2 99.8 576 144 576L400 576C444.2 576 480 540.2 480 496L480 416C480 398.3 465.7 384 448 384C430.3 384 416 398.3 416 416L416 496C416 504.8 408.8 512 400 512L144 512C135.2 512 128 504.8 128 496L128 240C128 231.2 135.2 224 144 224L224 224C241.7 224 256 209.7 256 192C256 174.3 241.7 160 224 160L144 160z" /></svg>
                            </Link>
                        </div>
                    </div>
                    <div className={'p-2.5 bg-[var(--main_d)] flex items-center gap-2 w-max rounded-lg text-white text-sm font-medium cursor-pointer'} style={{ borderRadius: 5, background: 'var(--green)', opacity: loading ? 0.6 : 1 }} onClick={loading ? undefined : handleExport}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"><g fill="none"><path d="M24 0v24H0V0z" /><path fill="#FFF" d="M15 5.5a3.5 3.5 0 1 1 .994 2.443L11.67 10.21c.213.555.33 1.16.33 1.79a4.99 4.99 0 0 1-.33 1.79l4.324 2.267a3.5 3.5 0 1 1-.93 1.771l-4.475-2.346a5 5 0 1 1 0-6.963l4.475-2.347A3.524 3.524 0 0 1 15 5.5" /></g></svg>
                        <p className="text-sm font-normal text-[var(--text-primary)]" style={{ color: '#fff' }}>{loading ? 'Đang xuất...' : 'Xuất Excel'}</p>
                    </div>
                </div>
            </div>
            <div className={'m-4 border border-[var(--border-color)] rounded-md overflow-hidden'}>
                <div style={{ display: 'flex', background: 'var(--border-color)', padding: '8px 0' }}>
                    {columns.map(col => {
                        const { key: colKey, ...colProps } = col;
                        return (<Cell key={colKey} {...colProps} header>{col.label}</Cell>);
                    })}
                </div>
                {rows.map((row, rowIdx) => {

                    return (
                        <div
                            key={rowIdx}
                            style={{ display: 'flex', borderTop: '1px solid var(--border-color)', alignItems: 'center' }}
                        >
                            {columns.map(col => {
                                const { key: colKey, ...colProps } = col;
                                if (colKey === 'Topic') {
                                    return (
                                        <Cell key={colKey} {...colProps}>
                                            {row.LessonDetails.Name || 'Chưa có'}
                                        </Cell>
                                    );
                                }
                                if (colKey === 'Teacher') {
                                    return (
                                        <Cell key={colKey} {...colProps}>
                                            {row.Teacher.name || 'Chưa có'}
                                        </Cell>
                                    );
                                }
                                if (colKey === 'more') {
                                    return (
                                        <Cell key={colKey} {...colProps}>
                                            <MoreIcons
                                                onShowImg={() => setImagePop({ open: true, lessonId: row.ID, imageId: row.imagestudent })}
                                                onShowCmt={() => setCommentPop({ open: true, lessonId: row.ID, comments: row.comments })}
                                            />
                                        </Cell>
                                    );
                                }
                                if (colKey === 'Date') {
                                    return (
                                        <Cell key={colKey} {...colProps}>
                                            <span className="text-sm font-normal text-[var(--text-primary)]">{row.Date.split(' - ')[0]} - {formatDate(new Date(row.Date.split(' - ')[1].trim()))}</span>
                                        </Cell>
                                    );
                                }
                                if (colKey === 'Status') {
                                    return (
                                        <Cell key={colKey} {...colProps}>
                                            <span className={'p-[3px_8px] rounded-lg text-[11px] text-white font-normal'} style={{ background: row.Status === 'Đã diễn ra' ? 'var(--green)' : 'var(--red)' }}>
                                                {row.Status}
                                            </span>
                                        </Cell>
                                    );
                                }
                                return (<Cell key={colKey} {...colProps}>{row[colKey]}</Cell>);
                            })}
                        </div>
                    )
                })}
            </div>
        </>
    );
    return (
        <>
            <WrapIcon
                icon={<svg viewBox="0 0 512 512" width="16" height="16" fill="white"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM216 336l24 0 0-64h-24c-13.3 0-24-10.7-24-24s10.7-24 24-24h48c13.3 0 24 10.7 24 24v88h8c13.3 0 24 10.7 24 24s-10.7 24-24 24h-80c-13.3 0-24-10.7-24-24s10.7-24 24-24Zm40-208a32 32 0 1 1 0 64 32 32 0 1 1 0-64Z" /></svg>}
                content={'Chi tiết'}
                placement={'bottom'}
                style={{ background: 'var(--main_d)', color: 'white', cursor: 'pointer' }}
                click={() => setOpenMain(true)}
            />
            <FlexiblePopup
                open={openMain}
                onClose={() => setOpenMain(false)}
                providedData={[student]}
                renderItemList={renderItemList}
                title={`Học sinh: ${studentsx?.filter(stu => stu.ID === student.ID)[0]?.Name}`}
                width={1300}
            />
            {loading && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
                    <Loading content="Đang xuất Excel..." />
                </div>
            )}
            <Noti
                open={toast.open}
                status={toast.status}
                mes={toast.mes}
                onClose={() => setToast({ ...toast, open: false })}
                button={
                    <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                        <button className={'p-2.5 bg-[var(--main_d)] flex items-center gap-2 w-max rounded-lg text-white text-sm font-medium cursor-pointer'} style={{ marginRight: 8, border: 'none' }} onClick={() => setToast({ ...toast, open: false })}>Thoát</button>
                        <button
                            className={'p-2.5 bg-[var(--main_d)] flex items-center gap-2 w-max rounded-lg text-white text-sm font-medium cursor-pointer'}
                            style={{ border: 'none', background: 'var(--green)', opacity: toast.link ? 1 : 0.6, cursor: toast.link ? 'pointer' : 'not-allowed' }}
                            disabled={!toast.link}
                            onClick={() => {
                                if (toast.link) window.open(toast.link, '_blank');
                                setToast({ ...toast, open: false });
                            }}
                        > Tải Excel </button>
                    </div>
                }
            />
            <CenterPopup open={commentPop.open} size="lg" onClose={() => setCommentPop({ ...commentPop, open: false })}>
                <Title content={<p>Nhận xét buổi học</p>} click={() => setCommentPop({ ...commentPop, open: false })} />
                <div style={{ padding: 16 }}>
                    {commentPop.comments.length
                        ? commentPop.comments.map((c, i) => <p key={i} className="text-sm font-normal text-[var(--text-primary)]">• {c}</p>)
                        : <p className="text-sm font-normal text-[var(--text-primary)]">Chưa có nhận xét</p>}
                </div>
            </CenterPopup>
            <CenterPopup open={imagePop.open} size="lg" onClose={() => setImagePop({ ...imagePop, open: false })}>
                <Title content={<p>Hình ảnh buổi học</p>} click={() => setImagePop({ ...imagePop, open: false })} />
                <div style={{ padding: 16, textAlign: 'center' }}>
                    {imagePop.imageId
                        ? <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            {imagePop.imageId.map((img, i) => (
                                <img key={i} src={`https://lh3.googleusercontent.com/d/${img.id}`} alt={`Hình ảnh buổi học ${i + 1}`} style={{ width: 'calc(25% - 3/4*8px)', aspectRatio: 1, objectFit: 'cover' }} />
                            ))}
                        </div>
                        : <p className="text-sm font-normal text-[var(--text-primary)]">Chưa có hình ảnh</p>}
                </div>
            </CenterPopup>
        </>
    );
}

const columns = [
    { key: 'Topic', label: 'Tên chủ đề', flex: 2, align: 'start' },
    { key: 'Status', label: 'Trạng thái', flex: 1, align: 'center' },
    { key: 'Teacher', label: 'Giáo viên', flex: 1.5, align: 'start' },
    { key: 'Date', label: 'Thời gian', flex: 1.5, align: 'start' },
    { key: 'attendance', label: 'Điểm danh', flex: .8, align: 'center' },
    { key: 'more', label: 'Thêm', flex: 1, align: 'center' },
];