'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Phone, ArrowRight, ShieldCheck, User, Sparkles, CheckCircle2, Bot, ExternalLink } from 'lucide-react';

export default function ParentLoginPage() {
    const router = useRouter();
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [studentList, setStudentList] = useState([]);
    const [parentName, setParentName] = useState('');
    const [showStudentPicker, setShowStudentPicker] = useState(false);

    const handleSearch = async (e) => {
        if (e) e.preventDefault();
        setErrorMsg('');
        const trimmed = phone.trim();
        if (!trimmed) {
            setErrorMsg('Vui lòng nhập số điện thoại đã đăng ký với trung tâm.');
            return;
        }

        setLoading(true);
        try {
            const res = await fetch('/api/parent/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: trimmed })
            });

            const data = await res.json();
            if (!res.ok || !data.success) {
                setErrorMsg(data.mes || 'Không tìm thấy hồ sơ học viên với số điện thoại này.');
                setLoading(false);
                return;
            }

            setParentName(data.parentName || 'Quý phụ huynh');
            setStudentList(data.students || []);

            // Nếu chỉ có 1 học sinh -> Chuyển thẳng vào sổ liên lạc
            if (data.students && data.students.length === 1) {
                router.push('/parent');
            } else if (data.students && data.students.length > 1) {
                // Nếu có từ 2 bé trở lên -> Hiện popup chọn con
                setShowStudentPicker(true);
                setLoading(false);
            } else {
                router.push('/parent');
            }
        } catch (err) {
            setErrorMsg('Có lỗi kết nối đến máy chủ. Vui lòng thử lại sau.');
            setLoading(false);
        }
    };

    const handleSelectStudent = async (studentId) => {
        setLoading(true);
        try {
            const res = await fetch('/api/parent/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ phone: phone.trim(), activeStudentId: studentId })
            });
            if (res.ok) {
                router.push('/parent');
            } else {
                router.push('/parent');
            }
        } catch {
            router.push('/parent');
        }
    };

    const fillSamplePhone = () => {
        setPhone('0923409668');
        setErrorMsg('');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-between font-sans text-slate-800">
            {/* Thanh tiêu đề tối giản */}
            <header className="w-full bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-10 shadow-xs">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                            AIR
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-slate-900 leading-none">SYS-AIR ROBOTIC</h1>
                            <p className="text-[11px] text-slate-500 mt-0.5">Sổ Liên Lạc Điện Tử</p>
                        </div>
                    </div>
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> Phụ huynh
                    </span>
                </div>
            </header>

            {/* Khung nội dung chính */}
            <main className="flex-1 max-w-md w-full mx-auto p-4 flex flex-col justify-center">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                    <div className="text-center mb-6">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                            <Phone className="w-6 h-6" />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900">Tra Cứu Sổ Liên Lạc</h2>
                        <p className="text-xs text-slate-500 mt-1">
                            Nhập số điện thoại đã đăng ký để xem điểm danh, hình ảnh thực hành và nhận xét của con.
                        </p>
                    </div>

                    {errorMsg && (
                        <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs leading-relaxed">
                            {errorMsg}
                        </div>
                    )}

                    <form onSubmit={handleSearch} className="space-y-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                                Số điện thoại phụ huynh
                            </label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                    <span className="text-xs font-semibold text-slate-500 mr-1.5 border-r border-slate-200 pr-1.5">+84</span>
                                </div>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    placeholder="Nhập số điện thoại (ví dụ: 0912345678)"
                                    className="w-full pl-16 pr-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl outline-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all font-medium text-slate-900"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                        >
                            {loading ? (
                                <>
                                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    <span>Đang tra cứu...</span>
                                </>
                            ) : (
                                <>
                                    <span>Mở Sổ Liên Lạc</span>
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Nút thử nghiệm nhanh */}
                    <div className="mt-5 pt-4 border-t border-slate-100 text-center">
                        <button
                            type="button"
                            onClick={fillSamplePhone}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium inline-flex items-center gap-1.5 cursor-pointer bg-blue-50/70 hover:bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Dùng thử với SĐT mẫu: 0923409668
                        </button>
                    </div>
                </div>

                {/* KHỐI KẾT NỐI TRỢ LÝ TỰ ĐỘNG ZALO BOT (THIẾT KẾ TỐI GIẢN - ĐỒNG BỘ HỆ THỐNG) */}
                <div className="mt-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3.5">
                    {/* Header: Tối giản, thanh lịch, dễ đọc */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold shrink-0 border border-blue-100">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div>
                                <h3 className="text-xs font-bold text-slate-800 m-0">
                                    Trợ Lý Tự Động Zalo (24/7)
                                </h3>
                                <p className="text-[11px] text-slate-500 m-0">Nhận thông báo của bé trực tiếp qua Zalo</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Trực tuyến
                        </span>
                    </div>

                    {/* Danh sách 3 tiện ích tự động - Nền xám nhạt, chữ tương phản cao */}
                    <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2 text-xs text-slate-600">
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>Tự động báo điểm danh có mặt ngay khi con đến lớp</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>Gửi hình ảnh thực hành & nhận xét của Thầy/Cô cuối buổi</span>
                        </div>
                        <div className="flex items-start gap-2">
                            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>Nhắc lịch học thông minh và hỗ trợ xin nghỉ phép</span>
                        </div>
                    </div>

                    {/* Nút hành động Chat 1-1 với Zalo Bot */}
                    <div className="space-y-2">
                        <a
                            href="https://zalo.me/s/bot.XhbsDIes"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 px-4 bg-[#0068FF] hover:bg-[#0057d6] text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer no-underline group active:scale-[0.99]"
                        >
                            <div className="w-4 h-4 rounded-full bg-white text-[#0068FF] flex items-center justify-center text-[9px] font-black shrink-0">
                                Z
                            </div>
                            <span>Nhắn Tin 1-1 Với Bot Zalo</span>
                            <ExternalLink className="w-3.5 h-3.5 text-blue-200 group-hover:translate-x-0.5 transition-transform" />
                        </a>
                        <p className="text-[11px] text-slate-400 text-center m-0">
                            Hoặc tìm kiếm từ khóa <strong className="text-slate-600 font-semibold">Bot 135Tiet</strong> trên ứng dụng Zalo
                        </p>
                    </div>
                </div>

                {/* Hướng dẫn trợ giúp */}
                <div className="mt-5 text-center text-xs text-slate-400 space-y-1">
                    <p>Hệ thống bảo mật dữ liệu theo tiêu chuẩn đào tạo trẻ em.</p>
                    <p>Nếu đổi số điện thoại, vui lòng liên hệ phòng Học vụ trung tâm.</p>
                </div>
            </main>

            {/* Modal chọn học sinh (nếu 1 SĐT có từ 2 bé theo học) */}
            {showStudentPicker && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-5 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-center mb-4">
                            <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-2">
                                <User className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">Chọn Sổ Liên Lạc Của Bé</h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Kính chào phụ huynh <strong className="text-slate-800">{parentName}</strong>, ba mẹ muốn xem thông tin của bé nào?
                            </p>
                        </div>

                        <div className="space-y-2.5 max-h-60 overflow-y-auto mb-4">
                            {studentList.map((stu) => (
                                <div
                                    key={stu.ID}
                                    onClick={() => handleSelectStudent(stu.ID)}
                                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-blue-50/60 hover:border-blue-300 transition-all cursor-pointer flex items-center gap-3 group"
                                >
                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200 relative shadow-2xs">
                                        {stu.Avt ? (
                                            <img
                                                src={stu.Avt}
                                                alt={stu.Name}
                                                className="w-full h-full object-cover relative z-10"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                }}
                                            />
                                        ) : null}
                                        <User className="w-5 h-5 text-slate-400 absolute" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-blue-600">
                                            {stu.Name}
                                        </h4>
                                        <p className="text-[11px] font-mono text-slate-500">Mã: {stu.ID}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                                </div>
                            ))}
                        </div>

                        <button
                            type="button"
                            onClick={() => setShowStudentPicker(false)}
                            className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium text-xs rounded-xl transition-colors cursor-pointer"
                        >
                            Quay lại nhập số khác
                        </button>
                    </div>
                </div>
            )}

            {/* Footer */}
            <footer className="w-full text-center py-3 text-[11px] text-slate-400 border-t border-slate-200/60">
                SYS-AIR Robotic & STEM © 2026. All rights reserved.
            </footer>
        </div>
    );
}
