'use client';

import React, { useEffect, useState } from 'react';
import { ExternalLink, Compass, X } from 'lucide-react';

export default function ZaloBrowserGuard() {
    const [isZalo, setIsZalo] = useState(false);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        const ua = navigator.userAgent || navigator.vendor || window.opera || '';
        const inZalo = /zalo/i.test(ua);

        if (!inZalo) return;

        setIsZalo(true);

        const isAndroid = /android/i.test(ua);
        if (isAndroid) {
            try {
                // Tự động kích hoạt Android Intent Scheme để Zalo tự động mở link ngoài bằng Google Chrome
                const cleanUrl = window.location.href.replace(/^https?:\/\//i, '');
                const chromeIntent = `intent://${cleanUrl}#Intent;scheme=https;package=com.android.chrome;end;`;
                window.location.href = chromeIntent;
            } catch (err) {
                console.warn('[ZaloBrowserGuard] Không thể tự động kích hoạt intent Chrome:', err);
            }
        }
    }, []);

    if (!isZalo || isDismissed) return null;

    return (
        <div className="fixed inset-0 z-[999999] bg-slate-950/85 backdrop-blur-md text-white flex flex-col p-5 select-none animate-fadeIn">
            {/* Mũi tên động chỉ vào dấu 3 chấm góc trên bên phải Zalo */}
            <div className="flex justify-end pr-1 pt-1">
                <div className="text-right flex flex-col items-end animate-bounce">
                    <span className="text-3xl text-amber-300 font-extrabold leading-none drop-shadow-md">↗</span>
                    <span className="text-xs font-bold text-amber-300 bg-amber-500/20 border border-amber-400/40 px-2.5 py-1 rounded-full mt-1 shadow-sm">
                        Bấm vào dấu ( ... ) ở đây
                    </span>
                </div>
            </div>

            {/* Khung hướng dẫn trung tâm */}
            <div className="my-auto max-w-sm w-full mx-auto bg-slate-900/90 border border-slate-800 rounded-2xl p-6 shadow-2xl text-center">
                <div className="w-14 h-14 bg-[var(--main_d)]/20 text-[var(--main_d)] rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--main_d)]/30">
                    <Compass className="w-7 h-7 text-sky-400 animate-spin-slow" />
                </div>

                <h2 className="text-base font-bold text-white mb-1.5">
                    Mở Bằng Trình Duyệt Web
                </h2>
                <p className="text-xs text-slate-300 leading-relaxed mb-5">
                    Để xem ảnh sắc nét, tải ảnh sản phẩm và mở hồ sơ từng khóa học ở tab mới mượt mà, vui lòng mở trang này bằng trình duyệt Safari hoặc Chrome.
                </p>

                <div className="bg-slate-950/70 rounded-xl p-4 text-left border border-slate-800 text-xs space-y-3 mb-5">
                    <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-sky-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            1
                        </span>
                        <span className="text-slate-200">
                            Bấm vào biểu tượng <b>( ... )</b> hoặc <b>Chia sẻ</b> ở góc trên cùng bên phải màn hình Zalo.
                        </span>
                    </div>
                    <div className="flex items-start gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-sky-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            2
                        </span>
                        <span className="text-slate-200">
                            Chọn <b>"Mở bằng trình duyệt"</b> (Open in Safari / Chrome).
                        </span>
                    </div>
                </div>

                <div className="flex items-center justify-center gap-2">
                    <button
                        type="button"
                        onClick={() => setIsDismissed(true)}
                        className="text-[11px] text-slate-400 hover:text-slate-200 underline cursor-pointer bg-transparent border-none py-1 transition"
                    >
                        Tôi vẫn muốn tiếp tục xem trên Zalo
                    </button>
                </div>
            </div>
        </div>
    );
}
