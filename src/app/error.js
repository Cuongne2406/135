'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import logger from '@/utils/logger';

export default function DashboardError({ error, reset }) {
    useEffect(() => {
        logger.error('APP_ROOT', 'Lỗi cấp cao nhất ứng dụng:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 text-center animate-fadeIn">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-md w-full p-8 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center text-3xl font-bold shadow-inner">
                    ⚙️
                </div>

                <div className="flex flex-col gap-1">
                    <h2 className="text-xl font-bold text-gray-800 m-0">
                        Rất tiếc, đã có lỗi xảy ra!
                    </h2>
                    <p className="text-xs text-gray-500 m-0">
                        Hệ thống đã ghi nhận lỗi để xử lý. Vui lòng thử tải lại hoặc quay lại trang chủ.
                    </p>
                </div>

                {error?.message && (
                    <div className="w-full bg-amber-50/70 border border-amber-200 rounded-xl p-3 text-left">
                        <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                            Thông điệp lỗi:
                        </span>
                        <code className="text-xs text-amber-700 font-mono break-all line-clamp-3">
                            {error.message}
                        </code>
                    </div>
                )}

                <div className="flex items-center gap-3 w-full mt-2">
                    <button
                        type="button"
                        onClick={() => reset()}
                        className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer border-none shadow-xs transition-colors"
                    >
                        🔄 Thử lại
                    </button>
                    <Link
                        href="/"
                        className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold text-center no-underline transition-colors"
                    >
                        🏠 Trang chủ
                    </Link>
                </div>
            </div>
        </div>
    );
}