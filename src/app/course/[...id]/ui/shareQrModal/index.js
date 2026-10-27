'use client';

import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';

export default function ShareQrModal({ isOpen, onClose, course, students = [] }) {
    const [qrMap, setQrMap] = useState({});
    const [copiedId, setCopiedId] = useState(null);
    const [copiedAll, setCopiedAll] = useState(false);
    const [origin, setOrigin] = useState('');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            setOrigin(window.location.origin);
        }
    }, []);

    // Sinh mã QR cho từng học sinh
    useEffect(() => {
        if (!isOpen || !course?._id || !Array.isArray(students) || students.length === 0 || !origin) return;

        let isMounted = true;
        const generateQRs = async () => {
            const map = {};
            for (const stu of students) {
                const sId = stu.ID || stu.id;
                const link = `${origin}/share/portfolio/${course._id}/${sId}`;
                try {
                    const dataUrl = await QRCode.toDataURL(link, {
                        width: 140,
                        margin: 1,
                        color: { dark: '#0f172a', light: '#ffffff' }
                    });
                    map[sId] = { link, dataUrl };
                } catch (e) {
                    console.error('Lỗi sinh QR:', e);
                }
            }
            if (isMounted) setQrMap(map);
        };

        generateQRs();
        return () => { isMounted = false; };
    }, [isOpen, course?._id, students, origin]);

    if (!isOpen) return null;

    const handleCopy = (sId, link) => {
        navigator.clipboard.writeText(link);
        setCopiedId(sId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCopyAll = () => {
        const textLines = students.map((stu, idx) => {
            const sId = stu.ID || stu.id;
            const item = qrMap[sId];
            return `${idx + 1}. ${stu.name || stu.Name || sId}: ${item?.link || ''}`;
        }).join('\n');

        navigator.clipboard.writeText(textLines);
        setCopiedAll(true);
        setTimeout(() => setCopiedAll(false), 2000);
    };

    const handleDownloadQr = (sId, name) => {
        const item = qrMap[sId];
        if (!item?.dataUrl) return;
        const a = document.createElement('a');
        a.href = item.dataUrl;
        a.download = `QR_${sId}_${name || 'hoc_sinh'}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full flex flex-col max-h-[85vh] border border-slate-200">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                    <div>
                        <h2 className="text-base font-bold text-slate-800 m-0">Danh sách mã QR & Liên kết phụ huynh</h2>
                        <p className="text-xs text-slate-500 m-0 mt-0.5">
                            Khóa học: {course?.ID || '---'} • {students.length} học viên
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 flex items-center justify-center border-none cursor-pointer text-base font-bold transition"
                        title="Đóng"
                    >
                        ✕
                    </button>
                </div>

                {/* Thanh công cụ sao chép toàn bộ */}
                <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <span className="text-xs text-slate-600">
                        Phụ huynh quét mã hoặc bấm liên kết để xem hồ sơ ePortfolio không cần đăng nhập.
                    </span>
                    <button
                        onClick={handleCopyAll}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition cursor-pointer whitespace-nowrap"
                    >
                        {copiedAll ? 'Đã sao chép tất cả' : 'Sao chép tất cả'}
                    </button>
                </div>

                {/* Danh sách học sinh */}
                <div className="p-5 overflow-y-auto divide-y divide-slate-100">
                    {students.map((stu) => {
                        const sId = stu.ID || stu.id;
                        const sName = stu.name || stu.Name || sId;
                        const item = qrMap[sId];
                        const isCopied = copiedId === sId;

                        return (
                            <div key={sId} className="py-3 flex items-center justify-between gap-4">
                                {/* Thông tin học sinh */}
                                <div className="flex items-center gap-3 min-w-0">
                                    {item?.dataUrl ? (
                                        <img
                                            src={item.dataUrl}
                                            alt={`QR ${sId}`}
                                            className="w-14 h-14 border border-slate-200 rounded-md shrink-0 bg-white"
                                        />
                                    ) : (
                                        <div className="w-14 h-14 bg-slate-100 border border-slate-200 rounded-md shrink-0 flex items-center justify-center text-[10px] text-slate-400">
                                            Đang tạo...
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-800 m-0 truncate">{sName}</p>
                                        <p className="text-xs text-slate-500 m-0">Mã: {sId}</p>
                                        {item?.link && (
                                            <p className="text-[11px] text-blue-600 truncate max-w-xs m-0 mt-0.5">
                                                {item.link}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Nút thao tác */}
                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        onClick={() => handleCopy(sId, item?.link)}
                                        className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
                                            isCopied
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                                        }`}
                                    >
                                        {isCopied ? 'Đã chép' : 'Sao chép link'}
                                    </button>
                                    <button
                                        onClick={() => handleDownloadQr(sId, sName)}
                                        className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold transition cursor-pointer"
                                    >
                                        Tải QR
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Footer */}
                <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer border-none transition"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
