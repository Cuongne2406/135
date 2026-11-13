'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function CourseDetailError({ error, reset }) {
    useEffect(() => {
        console.error('[CourseDetailError] Lỗi trang chi tiết khóa học:', error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 text-center animate-fadeIn">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xl max-w-md w-full p-8 flex flex-col items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center text-3xl font-bold shadow-inner">
                    ⚠️
                </div>

                <div className="flex flex-col gap-1">
                    <h2 className="text-lg font-bold text-gray-800 m-0">
                        Không thể tải thông tin khóa học
                    </h2>
                    <p className="text-xs text-gray-500 m-0">
                        Đã có lỗi phát sinh khi kết nối cơ sở dữ liệu hoặc dịch vụ Google Workspace
                    </p>
                </div>

                {error?.message && (
                    <div className="w-full bg-red-50/70 border border-red-200 rounded-xl p-3 text-left">
                        <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block mb-1">
                            Chi tiết lỗi kỹ thuật:
                        </span>
                        <code className="text-xs text-red-600 font-mono break-all line-clamp-3">
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
                        🔄 Thử tải lại
                    </button>
                    <Link
                        href="/course"
                        className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold text-center no-underline transition-colors"
                    >
                        📚 Về danh sách lớp
                    </Link>
                </div>
            </div>
        </div>
    );
}
