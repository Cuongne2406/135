'use client';

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import { Svg_Chat, Svg_Pen, Svg_Send } from '@/components/(icon)/svg';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Title from '@/components/(features)/(popup)/title';
import Noti from '@/components/(features)/(noti)/noti';
import TextNoti from '@/components/(features)/(noti)/textnoti';
import { useRouter } from 'next/navigation';

export default function CommentPopup({ data, course, lesson }) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [isUpdating, setIsUpdating] = useState(false);
    const [isConverting, setIsConverting] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [noti, setNoti] = useState({ open: false, mes: '', status: false });

    const initialCmt = useMemo(() => {
        if (data?.cmtfn) {
            return [2, { text: data.cmtfn }];
        }
        if (data?.cmt && Array.isArray(data.cmt) && data.cmt.length > 0) {
            return [1, data.cmt];
        }
        return [0, 'Chưa có nhận xét'];
    }, [data, lesson]);

    const [cmt, setCmt] = useState(initialCmt);
    const [editableComment, setEditableComment] = useState('');

    useEffect(() => {
        if (cmt[0] === 2) {
            setEditableComment(cmt[1]?.text || '');
        } else {
            setEditableComment('');
        }
    }, [cmt]);

    const handleOpen = useCallback(() => setIsOpen(true), []);
    const handleClose = useCallback(() => {
        setIsOpen(false);
        if (isConverting) setIsConverting(false);
        if (isSending) setIsSending(false);
        setCmt(initialCmt);
    }, [initialCmt, isConverting, isSending]);

    const handleConvertComment = async () => {
        if (isConverting || cmt[0] !== 1) return;
        const studentId = data?.ID;
        const courseId = course;
        const lessonId = lesson;

        if (!studentId || !courseId || !lessonId) {
            setNoti({ open: true, mes: 'Thiếu thông tin cần thiết.', status: false });
            return;
        }

        setIsConverting(true);
        const prompt = 'Hãy chuyển đổi mảng các câu nhận xét dưới đây thành 1 văn bản hoàn chỉnh để gửi cho phụ huynh. Giữ vai trò là một giáo viên, sử dụng giọng văn nhẹ nhàng, trang trọng, lịch sự và rõ ràng. Nội dung cần mạch lạc, mang tính xây dựng và chia thành 3 mục chính: Thái độ học tập, Kết quả học tập, và Điểm cần cải thiện. Mỗi đoạn chỉ cần xuống dòng, không cần tạo khoảng cách giữa các đoạn.';
        const rawComments = cmt[1];

        try {
            const response = await fetch('/api/reaicmt', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ prompt, data: rawComments, studentId, courseId, lessonId })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Chuyển đổi thất bại.');
            }
            const result = await response.json();
            setCmt([2, { text: result.output }]);
            await Re_course_one(data.course);
            router.refresh();
        } catch (error) {
            setNoti({ open: true, mes: error.message, status: false });
        } finally {
            setIsConverting(false);
        }
    };

    const handleUpdateComment = async () => {
        if (isUpdating || !editableComment.trim()) return;

        const studentId = data?.ID;
        const courseId = course;
        const lessonId = lesson;

        if (!studentId || !courseId || !lessonId) {
            setNoti({ open: true, mes: 'Thiếu thông tin để cập nhật.', status: false });
            return;
        }

        setIsUpdating(true);
        try {
            const response = await fetch('/api/updatecmtfn', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    commentText: editableComment,
                    studentId,
                    courseId,
                    lessonId,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Cập nhật thất bại.');
            }

            setNoti({ open: true, mes: 'Cập nhật nhận xét thành công!', status: true });
            await Re_course_one(data.course);
            router.refresh();
        } catch (error) {
            setNoti({ open: true, mes: error.message, status: false });
        } finally {
            setIsUpdating(false);
        }
    };

    const handleSendComment = async () => {
        if (isSending || !editableComment.trim()) return;

        setIsSending(true);
        try {
            const response = await fetch('/api/senduser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    mes: ` THÔNG BÁO NHẬN XÉT SAU BUỔI HỌC\n\nHọ và tên học sinh: ${data.Name}\nLớp: ${data.course}\nBuổi học: Ngày ${data.lesson.Day}\n\nKính thưa quý phụ huynh, AI Robotic xin gửi đến quý phụ huynh một số nhận xét về buổi học hôm nay của học viên ${data.Name} tại Trung tâm:\n\n${editableComment}\n\nNếu có bất kỳ câu hỏi hoặc thắc mắc nào, xin quý phụ huynh vui lòng liên hệ với Trung tâm. Xin chân thành cảm ơn! `,
                    id: data.ID,
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Gửi nhận xét thất bại.');
            }

            setNoti({ open: true, mes: 'Gửi nhận xét thành công!', status: true });
        } catch (error) {
            setNoti({ open: true, mes: error.message, status: false });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <>
            <WrapIcon
                icon={<Svg_Chat w={16} h={16} c='white' />}
                content={'Nhận xét'}
                placement={'bottom'}
                style={{ background: 'var(--main_d)', color: 'white', cursor: 'pointer' }}
                click={handleOpen}
            />

            <CenterPopup open={isOpen} onClose={handleClose} size="lg">
                <>
                    <Title content={cmt[0] === 0 ? 'Nhận xét' : cmt[0] === 1 ? 'Nhận xét thô' : 'Soạn nhận xét chi tiết'} click={handleClose} />

                    <div className={'text-base leading-relaxed text-[var(--text-primary)] whitespace-pre-wrap break-words p-4 max-h-[60vh] overflow-y-auto'}>
                        {cmt[0] === 0 && <p className={'text-[var(--text-primary)]'}>{cmt[1]}</p>}

                        {cmt[0] === 1 && cmt[1].map((item, index) => (
                            <div key={index} className={''}><p className='text-sm font-normal text-[var(--text-primary)]'>{item}</p></div>
                        ))}

                        {cmt[0] === 2 && (
                            <div className={''}>
                                <TextNoti
                                    title='Lưu ý'
                                    mes='Hệ thống đã dùng AI để tạo nhận xét. Vui lòng kiểm tra và chỉnh sửa lại nội dung sau đó cập nhập nhận xét sao cho nội dung nhận xét cho phù hợp trước khi gửi.'
                                    color='yellow'
                                />
                                <div className='text-sm font-normal text-[var(--text-primary)]' style={{ whiteSpace: 'pre-wrap', padding: 8 }}>
                                    <p>THÔNG BÁO NHẬN XÉT SAU BUỔI HỌC</p>
                                    <p>Họ và tên học sinh: {data.Name}</p>
                                    <p>Lớp: {data.course}</p>
                                    <p>Buổi học: Ngày {data.lesson.Day}</p>
                                    <p>Kính thưa quý phụ huynh, AI Robotic xin gửi đến quý phụ huynh một số nhận xét về buổi học hôm nay của học viên {data.Name} tại Trung tâm AI Robotic:</p>
                                </div>
                                <textarea
                                    className={`${'w-[calc(100%-24px)] p-3 text-sm border border-[#e2e8f0] bg-[#f8fafc] rounded-lg outline-none font-sans min-h-[150px] max-h-[250px]'} text-sm font-normal text-[var(--text-primary)]`}
                                    value={editableComment}
                                    onChange={(e) => setEditableComment(e.target.value)}
                                    rows={10}
                                    style={{ textAlign: 'justify' }}
                                />
                                <div className='text-sm font-normal text-[var(--text-primary)]' style={{ whiteSpace: 'pre-wrap', padding: 8 }}>
                                    <p>Nếu có bất kỳ câu hỏi hoặc thắc mắc nào liên quan đến buổi học hôm nay, xin quý phụ huynh vui lòng liên hệ với Trung tâm qua số điện thoại 0943325065 hoặc email nmson@lhu.edu.vn.Xin chân thành cảm ơn quý phụ huynh!</p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className={'p-3 border-t border-[var(--border-color)] flex gap-2 justify-end bg-[var(--bg-secondary)]'}>
                        <div className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ background: 'var(--red)', margin: 0 }} onClick={handleClose}>
                            <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Đóng</p>
                        </div>

                        {cmt[0] === 1 && (
                            <div
                                className={`px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5 ${isConverting ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
                                style={{ background: 'var(--main_d)', margin: 0 }}
                                onClick={handleConvertComment}
                            >
                                {isConverting ? (
                                    <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Đang xử lý...</p>
                                ) : (
                                    <>
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16" fill='white'><path d="M105.1 202.6c7.7-21.8 20.2-42.3 37.8-59.8c62.5-62.5 163.8-62.5 226.3 0L386.3 160 352 160c-17.7 0-32 14.3-32 32s14.3 32 32 32l111.5 0c0 0 0 0 0 0l.4 0c17.7 0 32-14.3 32-32l0-112c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 35.2L414.4 97.6c-87.5-87.5-229.3-87.5-316.8 0C73.2 122 55.6 150.7 44.8 181.4c-5.9 16.7 2.9 34.9 19.5 40.8s34.9-2.9 40.8-19.5zM39 289.3c-5 1.5-9.8 4.2-13.7 8.2c-4 4-6.7 8.8-8.1 14c-.3 1.2-.6 2.5-.8 3.8c-.3 1.7-.4 3.4-.4 5.1L16 432c0 17.7 14.3 32 32 32s32-14.3 32-32l0-35.1 17.6 17.5c0 0 0 0 0 0c87.5 87.4 229.3 87.4 316.7 0c24.4-24.4 42.1-53.1 52.9-83.8c5.9-16.7-2.9-34.9-19.5-40.8s-34.9 2.9-40.8 19.5c-7.7 21.8-20.2 42.3-37.8 59.8c-62.5 62.5-163.8 62.5-226.3 0l-.1-.1L125.6 352l34.4 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L48.4 288c-1.6 0-3.2 .1-4.8 .3s-3.1 .5-4.6 1z" /></svg>
                                        <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Tạo nhận xét AI</p>
                                    </>
                                )}
                            </div>
                        )}

                        {cmt[0] === 2 && (
                            <>
                                <div className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ background: 'var(--green)', margin: 0 }} onClick={handleUpdateComment}>
                                    <Svg_Pen w={16} h={16} c='white' />
                                    <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Cập nhập nhận xét</p>
                                </div>
                                <div
                                    className={`px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5 ${isSending ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}`}
                                    style={{ background: 'var(--main_d)', margin: 0 }}
                                    onClick={handleSendComment}
                                >
                                    {isSending ? (
                                        <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Đang gửi...</p>
                                    ) : (
                                        <>
                                            <Svg_Send w={15} h={15} c='white' />
                                            <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: 'white' }}>Gửi nhận xét</p>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </>
            </CenterPopup >

            <Noti
                open={noti.open}
                onClose={() => setNoti(n => ({ ...n, open: false }))}
                status={noti.status}
                mes={noti.mes}
            />
        </>
    );
}