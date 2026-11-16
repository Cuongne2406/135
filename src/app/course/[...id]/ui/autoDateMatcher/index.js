'use client';

import React, { useState, useRef, useMemo } from 'react';
import { getPhotoCaptureDate, matchPhotoToSessions } from '@/utils/exifReader';
import { compressImage, formatBytes } from '@/utils/imageCompressor';
import { formatDate } from '@/function';

export default function AutoDateMatcherModal({ isOpen, onClose, course, onSuccess }) {
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [analyzing, setAnalyzing] = useState(false);
    const [matchedGroups, setMatchedGroups] = useState([]);
    const [unmatchedFiles, setUnmatchedFiles] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0, sessionName: '', status: '' });
    const [enableCompress, setEnableCompress] = useState(true);
    const [stats, setStats] = useState({ originalBytes: 0, compressedBytes: 0, savedPercent: 0 });

    const fileInputRef = useRef(null);
    const sessions = useMemo(() => course?.Detail || [], [course]);

    if (!isOpen) return null;

    const handleFilesSelected = async (e) => {
        const rawFiles = Array.from(e.target.files || []).filter(f => f.type.startsWith('image/'));
        if (rawFiles.length === 0) return;

        setAnalyzing(true);
        setSelectedFiles(rawFiles);

        // Khởi tạo các nhóm buổi học rỗng
        const groups = sessions.map((sess, idx) => ({
            sessionIndex: idx,
            session: sess,
            name: `Buổi ${idx + 1} (${sess.Day || 'Chưa có ngày'})`,
            folderId: sess.Image,
            files: []
        }));

        const unmatched = [];
        let totalOrig = 0;
        let totalComp = 0;

        for (let i = 0; i < rawFiles.length; i++) {
            const rawFile = rawFiles[i];
            totalOrig += rawFile.size;

            // 1. Đọc EXIF ngày chụp
            const { date: captureDate, source } = await getPhotoCaptureDate(rawFile);

            // 2. Nén ảnh nếu người dùng bật
            let finalFile = rawFile;
            let fileSavedPercent = 0;

            if (enableCompress) {
                const compRes = await compressImage(rawFile, { maxDimension: 1920, quality: 0.8 });
                finalFile = compRes.file;
                fileSavedPercent = compRes.savedPercent;
                totalComp += compRes.compressedSize;
            } else {
                totalComp += rawFile.size;
            }

            const item = {
                id: `${i}-${finalFile.name}`,
                originalFile: rawFile,
                file: finalFile,
                name: finalFile.name,
                previewUrl: URL.createObjectURL(finalFile),
                captureDate,
                dateSource: source,
                savedPercent: fileSavedPercent,
                targetSessionIndex: -1
            };

            // 3. Khớp ngày với các buổi học
            if (captureDate) {
                const matchRes = matchPhotoToSessions(captureDate, sessions);
                if (matchRes.matchedIndex !== -1 && matchRes.confidence !== 'unmatched') {
                    item.targetSessionIndex = matchRes.matchedIndex;
                    item.confidence = matchRes.confidence;
                    groups[matchRes.matchedIndex].files.push(item);
                } else {
                    unmatched.push(item);
                }
            } else {
                unmatched.push(item);
            }
        }

        const savedPercent = totalOrig > 0 ? Math.round(((totalOrig - totalComp) / totalOrig) * 100) : 0;
        setStats({ originalBytes: totalOrig, compressedBytes: totalComp, savedPercent });
        setMatchedGroups(groups);
        setUnmatchedFiles(unmatched);
        setAnalyzing(false);
    };

    const handleReassign = (fileItem, newSessionIndex) => {
        // Xóa file khỏi nhóm cũ
        setMatchedGroups(prevGroups => {
            return prevGroups.map(group => ({
                ...group,
                files: group.files.filter(f => f.id !== fileItem.id)
            }));
        });
        setUnmatchedFiles(prev => prev.filter(f => f.id !== fileItem.id));

        if (newSessionIndex === -1) {
            setUnmatchedFiles(prev => [...prev, { ...fileItem, targetSessionIndex: -1 }]);
        } else {
            setMatchedGroups(prevGroups => {
                const next = [...prevGroups];
                next[newSessionIndex].files.push({ ...fileItem, targetSessionIndex: newSessionIndex });
                return next;
            });
        }
    };

    const handleUploadAll = async () => {
        const totalToUpload = matchedGroups.reduce((acc, g) => acc + g.files.length, 0);
        if (totalToUpload === 0) {
            alert('Không có ảnh nào được gán vào buổi học để tải lên!');
            return;
        }

        setUploading(true);
        let uploadedCount = 0;

        for (const group of matchedGroups) {
            if (group.files.length === 0) continue;

            const folderId = group.folderId;
            if (!folderId) {
                console.warn(`Buổi ${group.sessionIndex + 1} chưa có folderId Google Drive!`);
                continue;
            }

            for (const item of group.files) {
                uploadedCount++;
                setUploadProgress({
                    current: uploadedCount,
                    total: totalToUpload,
                    sessionName: group.name,
                    status: `Đang tải: ${item.name} (${uploadedCount}/${totalToUpload})`
                });

                try {
                    const formData = new FormData();
                    formData.append('folderId', folderId);
                    formData.append('images', item.file);
                    formData.append('fileType', 'image');

                    const res = await fetch('/api/updateimage', {
                        method: 'POST',
                        body: formData
                    });

                    if (!res.ok) {
                        const err = await res.json();
                        console.error('Lỗi upload:', err);
                    }
                } catch (err) {
                    console.error('Lỗi upload file:', err);
                }
            }
        }

        setUploading(false);
        setUploadProgress({ current: totalToUpload, total: totalToUpload, sessionName: '', status: 'Hoàn tất!' });

        setTimeout(() => {
            if (onSuccess) onSuccess();
            onClose();
        }, 1200);
    };

    const totalMatchedCount = matchedGroups.reduce((acc, g) => acc + g.files.length, 0);

    return (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 flex flex-col gap-4 border border-gray-100 max-h-[90vh] overflow-hidden animate-scaleUp">
                {/* Header */}
                <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center text-xl font-bold shadow-xs">
                            ⚡
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-gray-800 m-0">
                                Tự Động Khớp Ảnh Theo Ngày Học (Auto-date Matching)
                            </h3>
                            <p className="text-xs text-gray-500 m-0 mt-0.5">
                                Đọc EXIF ngày chụp • Tự động nén ảnh client-side • Phân loại vào 7 buổi học
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={uploading}
                        className="text-gray-400 hover:text-gray-600 text-xl font-bold bg-transparent border-none cursor-pointer p-1"
                    >
                        ✕
                    </button>
                </div>

                {/* Chọn file và tùy chọn nén */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-xl border border-gray-200 text-xs">
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={analyzing || uploading}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold cursor-pointer border-none flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                            <span>📁</span>
                            <span>{selectedFiles.length > 0 ? 'Chọn lại ảnh khác' : 'Chọn ảnh từ máy tính (nhiều ảnh)'}</span>
                        </button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/jpeg,image/png,image/jpg"
                            onChange={handleFilesSelected}
                            style={{ display: 'none' }}
                        />
                        <span className="text-gray-500">
                            {selectedFiles.length > 0 ? `Đã chọn: ${selectedFiles.length} ảnh` : 'Hỗ trợ chọn hàng loạt ảnh từ máy ảnh / thẻ nhớ'}
                        </span>
                    </div>

                    <div className="flex items-center gap-4">
                        <label className="flex items-center gap-1.5 cursor-pointer font-medium text-gray-700">
                            <input
                                type="checkbox"
                                checked={enableCompress}
                                onChange={(e) => setEnableCompress(e.target.checked)}
                                disabled={uploading || selectedFiles.length > 0}
                                className="w-4 h-4 text-blue-600 rounded"
                            />
                            <span>Bật nén ảnh thông minh (-70% dung lượng)</span>
                        </label>
                    </div>
                </div>

                {/* Banner thống kê nén & phân loại */}
                {selectedFiles.length > 0 && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-emerald-900">
                        <div className="flex items-center gap-3">
                            <span>📊 <strong>{totalMatchedCount} / {selectedFiles.length}</strong> ảnh đã tự động khớp ngày</span>
                            {unmatchedFiles.length > 0 && (
                                <span className="text-amber-700 font-semibold">({unmatchedFiles.length} ảnh chưa khớp)</span>
                            )}
                        </div>
                        {stats.savedPercent > 0 && (
                            <div className="bg-white/80 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
                                Dung lượng: <span className="line-through text-gray-500">{formatBytes(stats.originalBytes)}</span>
                                {' → '}
                                <strong className="text-emerald-700">{formatBytes(stats.compressedBytes)}</strong>
                                {' '}(Giảm {stats.savedPercent}%)
                            </div>
                        )}
                    </div>
                )}

                {/* Danh sách các nhóm buổi học */}
                <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-3 min-h-[260px]">
                    {analyzing ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-3 text-gray-500 text-xs">
                            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span>Đang đọc EXIF metadata và tối ưu nén ảnh...</span>
                        </div>
                    ) : selectedFiles.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-48 gap-2 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50 text-gray-400 text-xs">
                            <span className="text-3xl">📸</span>
                            <span>Bấm nút <strong>&quot;Chọn ảnh từ máy tính&quot;</strong> để tự động đọc ngày và phân bổ vào 7 buổi học</span>
                        </div>
                    ) : (
                        <>
                            {/* Nhóm đã khớp */}
                            {matchedGroups.map((group) => (
                                <div key={group.sessionIndex} className="border border-gray-200 rounded-xl p-3 bg-white">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs text-gray-800">{group.name}</span>
                                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                                                {group.files.length} ảnh
                                            </span>
                                        </div>
                                        <span className="text-[10px] text-gray-400 font-mono truncate max-w-[200px]">
                                            Drive: {group.folderId ? group.folderId.slice(0, 10) + '...' : 'Chưa có folder'}
                                        </span>
                                    </div>

                                    {group.files.length === 0 ? (
                                        <p className="text-[11px] text-gray-400 italic m-0">Chưa có ảnh khớp với ngày của buổi này.</p>
                                    ) : (
                                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-36 overflow-y-auto p-1 bg-gray-50 rounded-lg">
                                            {group.files.map((item) => (
                                                <div key={item.id} className="relative group rounded-md overflow-hidden bg-gray-200 aspect-square border border-gray-200">
                                                    <img src={item.previewUrl} alt={item.name} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-x-0 bottom-0 bg-black/60 text-white text-[9px] p-0.5 truncate text-center">
                                                        {item.captureDate ? formatDate(item.captureDate) : 'Ko ngày'}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}

                            {/* Nhóm chưa khớp */}
                            {unmatchedFiles.length > 0 && (
                                <div className="border border-amber-200 rounded-xl p-3 bg-amber-50/50">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-xs text-amber-900">⚠️ Ảnh chưa nhận diện được ngày học ({unmatchedFiles.length} ảnh)</span>
                                        </div>
                                        <span className="text-[10px] text-amber-700">Chọn buổi học để gán thủ công</span>
                                    </div>

                                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                                        {unmatchedFiles.map((item) => (
                                            <div key={item.id} className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-amber-200">
                                                <img src={item.previewUrl} alt={item.name} className="w-10 h-10 object-cover rounded-md" />
                                                <div className="flex-1 min-w-0 text-[10px]">
                                                    <p className="truncate font-medium text-gray-700 m-0">{item.name}</p>
                                                    <select
                                                        value={item.targetSessionIndex}
                                                        onChange={(e) => handleReassign(item, parseInt(e.target.value, 10))}
                                                        className="mt-1 w-full text-[10px] p-1 rounded border border-gray-200 bg-gray-50"
                                                    >
                                                        <option value="-1">Chọn buổi gán...</option>
                                                        {sessions.map((s, idx) => (
                                                            <option key={idx} value={idx}>Buổi {idx + 1} ({s.Day})</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Progress khi đang upload */}
                {uploading && (
                    <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl flex flex-col gap-1.5 text-xs text-blue-900">
                        <div className="flex justify-between items-center font-semibold">
                            <span>{uploadProgress.status}</span>
                            <span>{uploadProgress.current}/{uploadProgress.total}</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-blue-200 overflow-hidden">
                            <div
                                className="h-full bg-blue-600 transition-all duration-150 rounded-full"
                                style={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Footer action */}
                <div className="flex items-center justify-between border-t pt-3 border-gray-100">
                    <span className="text-xs text-gray-500">
                        {totalMatchedCount > 0 ? `Sẵn sàng tải lên ${totalMatchedCount} ảnh vào Google Shared Drive` : 'Chưa có ảnh nào được phân loại'}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={uploading}
                            className="px-4 py-2 border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            type="button"
                            onClick={handleUploadAll}
                            disabled={uploading || totalMatchedCount === 0}
                            className={`px-5 py-2 rounded-lg text-xs font-bold text-white border-none flex items-center gap-1.5 shadow-sm transition-all ${
                                totalMatchedCount > 0 && !uploading
                                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 cursor-pointer'
                                    : 'bg-gray-300 cursor-not-allowed'
                            }`}
                        >
                            <span>🚀</span>
                            <span>{uploading ? 'Đang tải lên...' : `Tải lên ${totalMatchedCount} ảnh vào Drive`}</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
