'use client';

import React, { useState, useCallback } from 'react';
import FlexiblePopup from '@/components/(features)/(popup)/popup_right';
import { Svg_Bill, Svg_Check, Svg_Pay } from "@/components/(icon)/svg";
import TextNoti from '@/components/(features)/(noti)/textnoti';
import { formatCurrencyVN, formatDate } from '@/function';
import WrapIcon from '@/components/(ui)/(button)/hoveIcon';
import CenterPopup from '@/components/(features)/(popup)/popup_center';
import Title from '@/components/(features)/(popup)/title';
import Menu from '@/components/(ui)/(button)/menu';
import Noti from '@/components/(features)/(noti)/noti';
import { getBankInfo } from '@/data/banks';
import { useRouter } from 'next/navigation';
import { student_data, invoices_data } from '@/data/actions/get';

const COMPANY = {
    name: 'CÔNG TY TNHH GIÁO DỤC AI ROBOTIC',
    taxCode: '3603893101',
    address: '1256/7, Phạm Văn Thuận, Tổ 95, Khu phố 22, Phường Tam Hiệp, Thành phố Đồng Nai, Việt Nam',
    hotline: '0943325065',
}

const PAYMENT_METHODS = { 0: 'Tiền mặt', 1: 'Chuyển khoản' }

function numberToWords(n) {
    if (!n || n === 0) return 'Không đồng'
    const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín']
    const tens = ['', 'mười', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi']
    function readBlock(num) {
        const h = Math.floor(num / 100), t = Math.floor((num % 100) / 10), o = num % 10
        let s = ''
        if (h) s += ones[h] + ' trăm '
        if (t === 0 && h && o) s += 'lẻ '
        else if (t) s += tens[t] + ' '
        if (o) {
            if (t > 1 && o === 1) s += 'mốt '
            else if (t > 0 && o === 5) s += 'lăm '
            else s += ones[o] + ' '
        }
        return s.trim()
    }
    const billion = Math.floor(n / 1e9)
    const million = Math.floor((n % 1e9) / 1e6)
    const thousand = Math.floor((n % 1e6) / 1e3)
    const remainder = n % 1e3
    let result = ''
    if (billion) result += readBlock(billion) + ' tỷ '
    if (million) result += readBlock(million) + ' triệu '
    if (thousand) result += readBlock(thousand) + ' nghìn '
    if (remainder) result += readBlock(remainder)
    const text = (result.trim() || 'không') + ' đồng'
    return text.charAt(0).toUpperCase() + text.slice(1)
}

const promotionsData = [
    { description: "Không áp dụng", value: 0 },
    { description: "Giảm giá khai trương", value: 10 },
    { description: "Học sinh cũ", value: 15 },
    { description: "Hè 2025", value: 25 },
]

const PopupContent = React.memo(({ data, onStartInvoice, onDetailClick }) => {
    const tuition = data?.Course?.filter(course => course.tuition === null) || [];
    const tuitiondone = data?.Course?.filter(course => course.tuition !== null) || [];
    return (
        <>
            <div style={{ padding: 16, paddingBottom: 0 }}>
                <TextNoti title={'Học phí'} mes='Phần xác nhận học phí và xem lịch sử học phí của 1 học sinh liên quan tới các khóa học mà học sinh đã tham gia.' color={'blue'} />
            </div>
            <div style={{ margin: 16, border: 'thin solid var(--main_d)', borderRadius: 5, overflow: 'hidden' }}>
                <p className='text-base font-semibold text-[var(--text-primary)]' style={{ padding: '10px 8px', background: 'var(--main_d)', color: 'white' }}>Thông tin nợ học phí</p>
                {tuition.length > 0 ? (
                    tuition.map((course, index) => (
                        <div key={index} className='text-sm font-normal text-[var(--text-primary)]' style={{ padding: '5px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'thin solid var(--border-color)' }}>
                            <p>Khóa học: {course.ID}</p>
                            <p>{formatCurrencyVN(course.Book?.Price || 0)}</p>
                            <WrapIcon icon={<Svg_Check w={16} h={16} c={'white'} />} content={'Tạo hóa đơn'} placement={'left'} style={{ background: 'var(--main_d)', color: 'white', cursor: 'pointer' }} click={() => onStartInvoice(course)} />
                        </div>
                    ))
                ) : (
                    <p className='text-sm font-normal text-[var(--text-primary)]' style={{ padding: 12, textAlign: 'center', fontStyle: 'italic' }}>Không có thông tin nợ học phí</p>
                )}
            </div>
            <div style={{ padding: '0 16px' }}>
                <TextNoti title={'Lịch sử'} mes='Lịch sử giao dịch sẽ được phép xem lại các hóa đơn đã thanh toán trước đó.' color={'blue'} />
            </div>
            <div style={{ margin: 16, border: 'thin solid var(--main_d)', borderRadius: 5, overflow: 'hidden' }}>
                <p className='text-base font-semibold text-[var(--text-primary)]' style={{ padding: '10px 8px', background: 'var(--main_d)', color: 'white', borderRadius: '5px 5px 0 0' }}>Lịch sử đóng học phí</p>
                {tuitiondone.length > 0 ? (
                    tuitiondone.map((course, index) => (
                        <div key={index} className='text-sm font-normal text-[var(--text-primary)]' style={{ padding: '5px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: 'thin solid var(--border-color)' }}>
                            <p>Khóa học: {course.ID}</p>
                            <p>{formatCurrencyVN(course.Book?.Price || 0)}</p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                <WrapIcon icon={<Svg_Bill w={16} h={16} c={'white'} />} content={'Chi tiết giao dịch'} placement={'left'} style={{ background: 'var(--main_d)', color: 'white', cursor: 'pointer' }} click={() => onDetailClick(course)} />
                            </div>
                        </div>
                    ))
                ) : (
                    <p className='text-sm font-normal text-[var(--text-primary)]' style={{ padding: 12, textAlign: 'center', fontStyle: 'italic' }}>Không có lịch sử đóng học phí</p>
                )}
            </div>
        </>
    );
});
PopupContent.displayName = 'PopupContent';

export default function Pay({ _id, courseId = null, status = false }) {
    const router = useRouter();
    const [isPopupOpen, setIsPopupOpen] = useState(false);
    const [isConfirmOpen, setConfirmOpen] = useState(false);
    const [isQrOpen, setQrOpen] = useState(false);
    const [isDetailOpen, setDetailOpen] = useState(false);
    const [studentData, setStudentData] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [amount, setAmount] = useState(0);
    const [promotion, setPromotion] = useState(promotionsData[0]);
    const [qrInfo, setQrInfo] = useState(null);
    const [invoiceState, setInvoiceState] = useState({ isLoading: false, data: null, error: null });
    const [noti, setNoti] = useState({ open: false, status: false, mes: '' });
    const [isPaymentConfirmOpen, setPaymentConfirmOpen] = useState(false);
    const [pendingAction, setPendingAction] = useState(null);
    const [banks, setBanks] = useState([]);
    const [selectedBankId, setSelectedBankId] = useState(null);

    const handleFetchStudentData = useCallback(async () => {
        if (!_id) throw new Error("ID học sinh không hợp lệ.");
        const data = await student_data(_id);
        let finalData = (Array.isArray(data) && data.length > 0) ? data[0] : data;
        if (courseId && finalData?.Course) {
            finalData.Course = finalData.Course.filter(c => c._id === courseId);
        }
        setStudentData(finalData);
        return finalData;
    }, [_id, courseId]);

    const handleOpenPopup = () => setIsPopupOpen(true);
    const handleClosePopup = useCallback(() => {
        setIsPopupOpen(false);
        setStudentData(null);
    }, []);

    const handleStartInvoice = useCallback((course) => {
        setSelectedCourse(course);
        setAmount(course.Book?.Price || 0);
        setPromotion(promotionsData[0]);
        setConfirmOpen(true);
    }, []);

    const handleCloseConfirm = useCallback(() => {
        setConfirmOpen(false);
        setSelectedCourse(null);
    }, []);

    const finalAmount = Math.round(amount - amount * promotion.value / 100)

    const handlePayCash = useCallback(async () => {
        if (!studentData || !selectedCourse) return;
        setPendingAction('cash');
        setPaymentConfirmOpen(true);
    }, [studentData, selectedCourse]);

    const executePayCash = useCallback(async () => {
        if (!studentData || !selectedCourse) return;
        setPaymentConfirmOpen(false);
        try {
            const response = await fetch('/api/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: studentData._id,
                    courseId: selectedCourse._id,
                    amountInitial: amount,
                    amountPaid: finalAmount,
                    paymentMethod: 0,
                    discount: promotion.value,
                }),
            });
            const result = await response.json();
            if (result.status === 2) {
                handleCloseConfirm();
                handleClosePopup();
                setNoti({ open: true, status: true, mes: result.mes });
                router.refresh();
            } else {
                setNoti({ open: true, status: false, mes: result.mes || 'Tạo hóa đơn thất bại' });
            }
        } catch {
            setNoti({ open: true, status: false, mes: 'Không thể kết nối đến máy chủ.' });
        }
    }, [studentData, selectedCourse, amount, finalAmount, promotion, router]);

    const handlePayQr = useCallback(async () => {
        if (!studentData || !selectedCourse) return;
        try {
            const response = await fetch('/api/pay', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    studentId: studentData._id,
                    courseId: selectedCourse._id,
                    amountInitial: amount,
                    amountPaid: finalAmount,
                    paymentMethod: 1,
                    discount: promotion.value,
                }),
            });
            const result = await response.json();
            if (result.status === 2) {
                const invoice = result.data?.[0];
                const invoiceIdShort = invoice?._id ? invoice._id.slice(-8).toUpperCase() : '';
                const content = `Hoc phi ${studentData.ID} ${selectedCourse.ID} HD${invoiceIdShort}`;
                setQrInfo({
                    amount: finalAmount,
                    content,
                    studentId: studentData.ID,
                    studentName: studentData.Name,
                    studentPhone: studentData.Phone || '',
                    courseName: selectedCourse.ID,
                    courseBook: selectedCourse.Book?.Name || '',
                    invoiceId: invoice?._id || '',
                });
                const bankRes = await fetch('/api/bank');
                const bankJson = await bankRes.json();
                const bankList = bankJson.status ? (bankJson.data || []) : [];
                setBanks(bankList);
                const defaultBank = bankList.find(b => b.isDefault) || bankList[0];
                setSelectedBankId(defaultBank?._id || null);
                handleCloseConfirm();
                handleClosePopup();
                setQrOpen(true);
                router.refresh();
            } else {
                setNoti({ open: true, status: false, mes: result.mes || 'Tạo hóa đơn thất bại' });
            }
        } catch {
            setNoti({ open: true, status: false, mes: 'Không thể kết nối đến máy chủ.' });
        }
    }, [studentData, selectedCourse, amount, finalAmount, promotion, router]);

    const handleOpenDetail = useCallback(async (courseData) => {
        const invoiceId = courseData?.tuition;
        setDetailOpen(true);
        if (!invoiceId) {
            setInvoiceState({ isLoading: false, data: null, error: "Dữ liệu hóa đơn không hợp lệ." });
            return;
        }
        setInvoiceState({ isLoading: true, data: null, error: null });
        try {
            const response = await invoices_data(invoiceId);
            setInvoiceState({ isLoading: false, data: response, error: null });
        } catch {
            setInvoiceState({ isLoading: false, data: null, error: "Lỗi kết nối máy chủ." });
        }
    }, []);

    const handleCloseDetail = () => setDetailOpen(false);
    const [popupFlag, setPopupFlag] = useState(0);

    const handleConfirmPayment = useCallback(async () => {
        setPendingAction('confirm');
        setQrOpen(false);
        setPaymentConfirmOpen(true);
    }, []);

    const executeConfirmPayment = useCallback(async () => {
        setPaymentConfirmOpen(false);
        handleCloseQr();
        handleClosePopup();
        setNoti({ open: true, status: true, mes: 'Đã xác nhận thanh toán thành công.' });
        setTimeout(() => {
            setIsPopupOpen(true);
            setPopupFlag(f => f + 1);
        }, 350);
        router.refresh();
    }, [router]);

    const handleCloseQr = useCallback(() => { setQrOpen(false); setQrInfo(null); }, []);
    const handleCloseNoti = useCallback(() => setNoti(prev => ({ ...prev, open: false })), []);

    const promotionItems = (
        <div className="bg-[var(--bg-primary)] overflow-hidden shadow-[var(--boxshaw2)] rounded-lg">
            {promotionsData.map((p, i) => (
                <div key={i} className="px-[15px] py-2.5 cursor-pointer border-b border-[var(--border-color)] bg-white flex items-center gap-2 hover:bg-[var(--hover)] last:border-b-0" onClick={() => setPromotion(p)}>
                    <p className='text-sm font-normal text-[var(--text-primary)]'>{p.description}</p>
                    <p className='text-sm font-normal text-[var(--text-primary)]'>Giảm: {p.value}%</p>
                </div>
            ))}
        </div>
    );

    const customPromotionBtn = (
        <div className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ background: 'var(--hover)', margin: 0, transform: 'none', width: 'calc(100% - 16px)' }}>
            <p className='text-sm font-normal text-[var(--text-primary)]'>{promotion.description} ({promotion.value}%)</p>
        </div>
    );

    return (
        <>
            <div onClick={handleOpenPopup} className="p-1.5 rounded flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5" style={{ background: status ? 'var(--green)' : 'var(--red)', cursor: 'pointer', display: 'inline-flex' }} role="button">
                <Svg_Pay w={16} h={16} c={'white'} />
            </div>

            <FlexiblePopup key={popupFlag} open={isPopupOpen} onClose={handleClosePopup} title="Học phí" width={500} fetchData={handleFetchStudentData} renderItemList={(data) => (data ? <PopupContent data={data} onStartInvoice={handleStartInvoice} onDetailClick={handleOpenDetail} /> : null)} />

            <CenterPopup open={isConfirmOpen} onClose={handleCloseConfirm} size="md">
                {selectedCourse && studentData && (
                    <>
                        <Title content='Tạo hóa đơn' click={handleCloseConfirm} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5, padding: 16 }}>
                            <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ padding: 8, background: 'var(--main_b)', color: 'white', borderRadius: 5 }}>Thông tin học sinh</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 8, fontSize: 13 }}>
                                <p><span className='font-semibold'>ID:</span> {studentData.ID}</p>
                                <p><span className='font-semibold'>Họ tên:</span> {studentData.Name}</p>
                                <p><span className='font-semibold'>Liên hệ:</span> {studentData.Phone}</p>
                            </div>

                            <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ padding: 8, background: 'var(--main_b)', color: 'white', borderRadius: 5 }}>Thông tin khóa học</p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, padding: 8, fontSize: 13 }}>
                                <p><span className='font-semibold'>Khóa học:</span> {selectedCourse.ID}</p>
                                <p><span className='font-semibold'>Chương trình:</span> {selectedCourse.Book?.Name || '—'}</p>
                            </div>

                            <p className='text-sm font-semibold text-[var(--text-primary)]' style={{ padding: 8, background: 'var(--main_b)', color: 'white', borderRadius: 5 }}>Thông tin thanh toán</p>
                            <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <p className='font-semibold' style={{ minWidth: 100 }}>Số tiền:</p>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(Number(e.target.value) || 0)}
                                        className="flex-1 px-3 py-1.5 border border-gray-200 rounded text-sm outline-none text-gray-700"
                                    />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    <p className='font-semibold' style={{ minWidth: 100 }}>Giảm giá:</p>
                                    <Menu menuItems={promotionItems} customButton={customPromotionBtn} menuPosition="top" style={{ flex: 1 }} />
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 4 }}>
                                    <p className='font-semibold' style={{ minWidth: 100 }}>Thành tiền:</p>
                                    <p style={{ color: 'var(--red)', fontWeight: 700, fontSize: 16 }}>{formatCurrencyVN(finalAmount)}</p>
                                </div>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 12, padding: '10px 16px', borderTop: 'thin solid var(--border-color)' }}>
                            <div className='flex-1 px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 rounded text-white text-sm font-medium cursor-pointer justify-center hover:bg-[var(--main_d)]' onClick={handlePayCash}>
                                💵 Tiền mặt
                            </div>
                            <div className='flex-1 px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 rounded text-white text-sm font-medium cursor-pointer justify-center hover:bg-[var(--main_d)]' onClick={handlePayQr}>
                                📱 QR Chuyển khoản
                            </div>
                        </div>
                    </>
                )}
            </CenterPopup>

            <CenterPopup open={isPaymentConfirmOpen} onClose={() => setPaymentConfirmOpen(false)} size="sm">
                <div style={{ padding: 32, textAlign: 'center' }}>
                    <p style={{ fontSize: 16, fontWeight: 600, marginBottom: 24 }}>Xác nhận thanh toán</p>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', marginBottom: 28 }}>
                        {pendingAction === 'cash'
                            ? `Thu ${formatCurrencyVN(finalAmount)} của học sinh ${studentData?.Name || ''}?`
                            : 'Xác nhận đã nhận được tiền chuyển khoản?'}
                    </p>
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                        <div
                            className='px-4 py-2 border border-[var(--border-color)] rounded text-sm font-medium cursor-pointer hover:bg-gray-50'
                            onClick={() => setPaymentConfirmOpen(false)}
                            role="button"
                        >
                            Hủy
                        </div>
                        <div
                            className='px-4 py-2 bg-[var(--main_b)] rounded text-sm font-medium text-white cursor-pointer hover:bg-[var(--main_d)]'
                            onClick={() => {
                                if (pendingAction === 'cash') executePayCash()
                                else if (pendingAction === 'confirm') executeConfirmPayment()
                            }}
                            role="button"
                        >
                            Xác nhận
                        </div>
                    </div>
                </div>
            </CenterPopup>

            <CenterPopup open={isQrOpen} onClose={handleCloseQr} size="md">
                {qrInfo && (() => {
                    const selectedBank = banks.find(b => b._id === selectedBankId) || banks[0]
                    const qrUrl = selectedBank
                        ? `https://img.vietqr.io/image/${selectedBank.bankName}-${selectedBank.accountNumber}-compact2.png?${new URLSearchParams({ amount: String(qrInfo.amount), addInfo: qrInfo.content, accountName: selectedBank.accountName }).toString()}`
                        : ''
                    return (
                        <>
                            <Title content='Quét mã QR để thanh toán' click={handleCloseQr} />
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px 24px 24px', alignItems: 'center' }}>
                                {banks.length > 0 && (
                                    <div style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10 }}>
                                        <span className='text-sm text-[var(--text-secondary)]'>Tài khoản:</span>
                                        <select
                                            style={{ flex: 1, padding: '8px 10px', border: 'thin solid var(--border-color)', borderRadius: 6, fontSize: 13, outline: 'none', background: 'white' }}
                                            value={selectedBankId || ''}
                                            onChange={e => setSelectedBankId(e.target.value)}
                                        >
                                            {banks.map(b => {
                                                const info = getBankInfo(b.bankName)
                                                return (
                                                <option key={b._id} value={b._id}>{info.name} - {b.accountNumber}</option>
                                                )
                                            })}
                                        </select>
                                    </div>
                                )}
                                {qrUrl && (
                                    <div style={{ width: 260, height: 260, background: 'white', borderRadius: 8, border: 'thin solid var(--border-color)', padding: 8, boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
                                        <img
                                            src={qrUrl}
                                            alt="Mã QR chuyển khoản"
                                            style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                                        />
                                    </div>
                                )}
                                {selectedBank && (
                                    <div style={{
                                        width: '100%',
                                        background: '#eff6ff',
                                        border: 'thin solid #bfdbfe',
                                        borderRadius: 10,
                                        padding: '14px 18px',
                                        fontSize: 13,
                                        lineHeight: 2,
                                        color: '#1e40af'
                                    }}>
                                        <p>Ngân hàng: <span style={{ fontWeight: 600 }}>{getBankInfo(selectedBank.bankName).name}</span></p>
                                        <p>Số TK: <span style={{ fontWeight: 600 }}>{selectedBank.accountNumber}</span></p>
                                        <div style={{ borderTop: 'thin solid #bfdbfe', marginTop: 8, paddingTop: 8, textAlign: 'center' }}>
                                            <p style={{ fontSize: 12, marginBottom: 2 }}>Nội dung chuyển khoản</p>
                                            <p style={{ fontWeight: 700, fontSize: 14, letterSpacing: 0.5 }}>{qrInfo.content}</p>
                                        </div>
                                    </div>
                                )}
                                <div style={{
                                    width: '100%',
                                    background: '#f8f8f8',
                                    borderRadius: 8,
                                    padding: '12px 16px',
                                    fontSize: 13,
                                    lineHeight: 2,
                                    color: '#374151'
                                }}>
                                    <p className='font-medium' style={{ fontSize: 14 }}>{qrInfo.studentName}</p>
                                    <p className='text-[var(--text-secondary)]'>Mã HS: <span className='font-medium text-[var(--text-primary)]'>{qrInfo.studentId}</span></p>
                                    <p className='text-[var(--text-secondary)]'>Khóa học: <span className='font-medium text-[var(--text-primary)]'>{qrInfo.courseName}</span></p>
                                    <p className='text-[var(--text-secondary)]'>Mã HĐ: <span className='font-medium text-[var(--text-primary)]'>{qrInfo.invoiceId.slice(-8).toUpperCase()}</span></p>
                                </div>
                                <div style={{ textAlign: 'center', width: '100%' }}>
                                    <p className='text-sm text-[var(--text-secondary)]' style={{ marginBottom: 2 }}>Thành tiền</p>
                                    <p style={{ color: 'var(--red)', fontSize: 22, fontWeight: 800 }}>{formatCurrencyVN(qrInfo.amount)}</p>
                                </div>
                                <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                                    <div
                                        className='flex-1 px-3 py-2.5 bg-[var(--green)] flex items-center gap-2 rounded-lg text-white text-sm font-medium cursor-pointer justify-center hover:opacity-90'
                                        onClick={handleConfirmPayment}
                                        role="button"
                                    >
                                        Xác nhận đã thanh toán
                                    </div>
                                    <div
                                        className='px-4 py-2.5 bg-[var(--hover)] flex items-center gap-2 rounded-lg text-[var(--text-primary)] text-sm font-medium cursor-pointer justify-center hover:opacity-90'
                                        onClick={handleCloseQr}
                                        role="button"
                                    >
                                        Đóng
                                    </div>
                                </div>
                            </div>
                        </>
                    )
                })()}
            </CenterPopup>

            <CenterPopup open={isDetailOpen} onClose={handleCloseDetail} size="lg">
                {invoiceState.isLoading ? (
                    <div style={{ height: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <p className='text-sm text-[var(--text-secondary)]'>Đang tải...</p>
                    </div>
                ) : invoiceState.error ? (
                    <>
                        <Title content='Lỗi' click={handleCloseDetail} />
                        <div style={{ padding: 32, textAlign: 'center' }}>
                            <p className='text-xs font-medium' style={{ color: 'var(--red)' }}>{invoiceState.error}</p>
                        </div>
                    </>
                ) : invoiceState.data ? (
                    (() => {
                        const inv = invoiceState.data
                        const date = inv.createdAt ? formatDate(new Date(inv.createdAt)) : '—'
                        const sessions = inv.courseId?.Detail?.length || 0
                        const discountAmount = Math.round((inv.amountInitial || 0) * (inv.discount || 0) / 100)
                        return (
                            <>
                                <Title content='Hóa đơn thanh toán' click={handleCloseDetail} />
                                 <div style={{ padding: '24px 32px 32px', fontSize: 14, lineHeight: 1.7, maxHeight: 'calc(90vh - 80px)', overflowY: 'auto' }}>
                                    {/* Header */}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', paddingBottom: 16, borderBottom: '2px solid var(--main_d)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                                            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 1 }}>
                                                <span style={{ color: '#000' }}>AI</span>
                                                <span style={{ color: '#2563EB' }}> ROBOTIC</span>
                                            </div>
                                            <div style={{ borderLeft: '2px solid var(--border-color)', paddingLeft: 14 }}>
                                                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>CÔNG TY TNHH GIÁO DỤC AI ROBOTIC</p>
                                                <p style={{ fontSize: 12, color: '#2563EB', fontStyle: 'italic', fontWeight: 500, marginTop: 1 }}>"Learn AI - Grasp your future"</p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: 'right', fontSize: 12, color: 'var(--text-secondary)' }}>
                                            <p>MST: <span className='font-medium text-[var(--text-primary)]'>{COMPANY.taxCode}</span></p>
                                        </div>
                                    </div>

                                    {/* Address */}
                                    <p style={{ fontSize: 12, color: 'var(--text-secondary)', paddingTop: 6, paddingBottom: 16 }}>Địa chỉ: {COMPANY.address}</p>

                                    {/* Title */}
                                    <h2 style={{ textAlign: 'center', fontSize: 28, fontWeight: 800, margin: '16px 0 4px', color: 'var(--text-primary)', letterSpacing: 2 }}>HÓA ĐƠN THANH TOÁN</h2>
                                    <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)', marginBottom: 20 }}>Mã HĐ: {inv._id.slice(-12).toUpperCase()}  |  Ngày: {date}</p>

                                    <div style={{ display: 'flex', gap: 20, marginBottom: 20 }}>
                                        <div style={{ flex: 1, border: 'thin solid var(--border-color)', borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                                            <div style={{ padding: '10px 14px', background: 'var(--main_d)', color: 'white', fontWeight: 600, fontSize: 13 }}>
                                                📋 THÔNG TIN HỌC SINH & KHÓA HỌC
                                            </div>
                                            <div style={{ padding: '14px 16px', fontSize: 13, lineHeight: 2.2, flex: 1 }}>
                                                <p>Họ tên: <span className='font-medium'>{inv.studentId?.Name || '—'}</span></p>
                                                <p>Mã HS: <span className='font-medium'>{inv.studentId?.ID || '—'}</span></p>
                                                <p>Khóa học: <span className='font-medium'>{inv.courseId?.ID || '—'}</span></p>
                                                <p>Chương trình: <span className='font-medium'>{inv.courseId?.Book?.Name || '—'}</span></p>
                                                <p>Số buổi học: <span className='font-medium'>{sessions} buổi</span></p>
                                            </div>
                                        </div>
                                        <div style={{ flex: 1, border: 'thin solid var(--border-color)', borderRadius: 6, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignSelf: 'flex-start' }}>
                                            <div style={{ padding: '10px 14px', background: 'var(--main_d)', color: 'white', fontWeight: 600, fontSize: 13 }}>
                                                💳 NỘI DUNG THANH TOÁN
                                            </div>
                                            <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                                                <tbody>
                                                    <tr style={{ borderTop: 'thin solid var(--border-color)' }}>
                                                        <td style={{ padding: '10px 14px' }}>Học phí khóa học {inv.courseId?.ID || ''}</td>
                                                        <td style={{ padding: '10px 14px', textAlign: 'right', width: 160 }}>{formatCurrencyVN(inv.amountInitial || 0)}</td>
                                                    </tr>
                                                    {inv.discount > 0 && (
                                                        <tr style={{ borderTop: 'thin solid var(--border-color)' }}>
                                                            <td style={{ padding: '10px 14px', color: 'var(--green)' }}>Giảm giá ({inv.discount}%)</td>
                                                            <td style={{ padding: '10px 14px', textAlign: 'right', color: 'var(--green)' }}>-{formatCurrencyVN(discountAmount)}</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                            <div style={{ padding: '12px 14px', borderTop: '2px solid var(--main_d)', background: '#f8f8f8', display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15 }}>
                                                <span>TỔNG CỘNG</span>
                                                <span style={{ color: 'var(--red)' }}>{formatCurrencyVN(inv.amountPaid || 0)}</span>
                                            </div>
                                            <div style={{ padding: '10px 14px', borderTop: 'thin solid var(--border-color)', fontSize: 13, fontStyle: 'italic', color: 'var(--text-secondary)' }}>
                                                Bằng chữ: <span className='font-medium text-[var(--text-primary)]'>{numberToWords(inv.amountPaid || 0)}</span>
                                            </div>
                                            <div style={{ padding: '10px 14px', borderTop: 'thin solid var(--border-color)', fontSize: 13, background: '#f0f9ff' }}>
                                                💳 Hình thức: <span className='font-medium'>{PAYMENT_METHODS[inv.paymentMethod] || '—'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer */}
                                    <div style={{ borderTop: 'thin solid var(--border-color)', paddingTop: 16, textAlign: 'center', fontSize: 12, color: 'var(--text-secondary)' }}>
                                        <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-primary)', marginBottom: 4 }}>CÔNG TY TNHH GIÁO DỤC AI ROBOTIC</p>
                                        <p>Hotline: <span className='font-medium' style={{ color: 'var(--main_d)' }}>{COMPANY.hotline}</span></p>
                                        <p style={{ fontWeight: 500, fontStyle: 'italic', marginTop: 8, color: '#2563EB' }}>Trân trọng cảm ơn Quý phụ huynh đã tin tưởng đồng hành cùng AI ROBOTIC!</p>
                                    </div>
                                </div>
                            </>
                        )
                    })()
                ) : (
                    <>
                        <Title content='Thông báo' click={handleCloseDetail} />
                        <div style={{ padding: 32, textAlign: 'center' }}>
                            <p className='text-sm text-[var(--text-secondary)]'>Không có dữ liệu.</p>
                        </div>
                    </>
                )}
            </CenterPopup>

            <Noti open={noti.open} onClose={handleCloseNoti} status={noti.status} mes={noti.mes} button={
                <div className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer justify-center hover:bg-[var(--main_d)]' onClick={handleCloseNoti} style={{ width: 'calc(100% - 24px)', justifyContent: 'center' }}>
                    <p className='text-sm font-normal' style={{ color: 'white' }}>Tắt thông báo</p>
                </div>
            } />
        </>
    );
}
