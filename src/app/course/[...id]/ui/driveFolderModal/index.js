'use client';

import React, { useState } from 'react';

export default function DriveFolderModal({ isOpen, onClose, course, onSuccess }) {
    const currentFolderId = course?.Detail?.[0]?.Image || '';
    const [inputValue, setInputValue] = useState(currentFolderId);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    if (!isOpen) return null;

    const handleSave = async (folderToSave = inputValue) => {
        if (!folderToSave.trim()) {
            setMessage({ text: 'Vui lòng nhập đường dẫn hoặc mã Folder ID.', type: 'error' });
            return;
        }

        setLoading(true);
        setMessage({ text: '', type: '' });

        try {
            const res = await fetch('/api/test/update-drive-folder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    courseId: course._id,
                    driveUrlOrId: folderToSave.trim()
                })
            });

            const data = await res.json();

            if (!res.ok || data.status !== 2) {
                throw new Error(data.mes || 'Không thể cập nhật thư mục Drive.');
            }

            setMessage({ text: data.mes, type: 'success' });
            setTimeout(() => {
                if (onSuccess) onSuccess();
                onClose();
            }, 900);
        } catch (err) {
            setMessage({ text: err.message || 'Đã có lỗi xảy ra.', type: 'error' });
        } finally {
            setLoading(false);
        }
    };

    const handlePreset = (id) => {
        setInputValue(id);
        handleSave(id);
    };

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 flex flex-col gap-4 border border-gray-100 animate-scaleUp">
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center text-lg font-bold">
                            📁
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-800 m-0">
                                Đổi Folder Google Drive (Demo)
                            </h3>
                            <p className="text-xs text-gray-500 m-0 mt-0.5">
                                Bản thử nghiệm trình diễn — không ảnh hưởng hệ thống thật
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 text-xl font-bold bg-transparent border-none cursor-pointer p-1"
                    >
                        ✕
                    </button>
                </div>

                {/* Banner lưu ý Demo */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800 flex items-start gap-2">
                    <span className="text-sm">💡</span>
                    <div>
                        <strong className="font-semibold">Mục đích thử nghiệm:</strong> Bạn có thể đổi linh hoạt giữa các kho ảnh Drive để kiểm tra khả năng load ảnh và duyệt Portfolio trên giao diện.
                    </div>
                </div>

                {/* Folder hiện tại */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200 text-xs">
                    <span className="text-gray-500 font-medium">Folder ID hiện tại của lớp:</span>
                    <div className="mt-1 font-mono text-blue-600 truncate font-semibold flex items-center justify-between">
                        <span>{currentFolderId || 'Chưa thiết lập'}</span>
                        {currentFolderId && (
                            <a
                                href={`https://drive.google.com/drive/folders/${currentFolderId}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-xs text-teal-600 hover:underline font-sans ml-2"
                            >
                                Mở Drive ↗
                            </a>
                        )}
                    </div>
                </div>

                {/* Quick Presets */}
                <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-gray-600">Chọn nhanh thư mục mẫu có sẵn:</span>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => handlePreset('1tzO-JZ3h6JW56Bi3ZiD013mxDk_hdpx4')}
                            className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 cursor-pointer transition-colors"
                        >
                            🎪 Trại hè Titan 2026 (Ảnh JPG)
                        </button>
                        <button
                            type="button"
                            disabled={loading}
                            onClick={() => handlePreset('1T1TLDFWXAdmEM-rbPpSoCel9pW0LNPoR')}
                            className="px-2.5 py-1.5 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 cursor-pointer transition-colors"
                        >
                            🏆 AIR History 2026 (Bằng khen PDF)
                        </button>
                    </div>
                </div>

                {/* Input dán URL mới */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-700">
                        Hoặc dán URL / ID Thư Mục Google Drive mới:
                    </label>
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="https://drive.google.com/drive/folders/1tzO... hoặc mã ID"
                        className="w-full px-3 py-2 rounded-lg border border-gray-300 text-xs focus:outline-none focus:border-teal-500 font-mono transition-colors"
                    />
                    <span className="text-[11px] text-gray-400">
                        * Có thể dán cả đường link Drive đầy đủ, hệ thống tự trích xuất mã Folder ID.
                    </span>
                </div>

                {/* Thông báo */}
                {message.text && (
                    <div className={`p-2.5 rounded-lg text-xs font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-600 border border-red-200'}`}>
                        {message.text}
                    </div>
                )}

                {/* Actions */}
                <div className="flex items-center justify-end gap-2 border-t pt-3 border-gray-100">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2 rounded-lg text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 border-none cursor-pointer transition-colors"
                    >
                        Đóng
                    </button>
                    <button
                        type="button"
                        onClick={() => handleSave()}
                        disabled={loading || !inputValue.trim()}
                        className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 border-none cursor-pointer transition-all shadow-sm disabled:opacity-50 flex items-center gap-1.5"
                    >
                        {loading ? 'Đang lưu...' : 'Lưu Thay Đổi Demo'}
                    </button>
                </div>
            </div>
        </div>
    );
}
