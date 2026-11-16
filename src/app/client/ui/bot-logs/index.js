'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

const ACTION_LABELS = {
    sendMessage: 'Gửi tin',
    addFriend: 'Kết bạn',
    findUid: 'Tìm UID',
    checkFriend: 'Kiểm tra bạn',
};

const ACTION_COLORS = {
    sendMessage: 'bg-blue-100 text-blue-600',
    addFriend: 'bg-green-100 text-green-600',
    findUid: 'bg-purple-100 text-purple-600',
    checkFriend: 'bg-orange-100 text-orange-600',
};

export default function BotLogs({ zaloData = [] }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [filterZalo, setFilterZalo] = useState('');
    const [filterType, setFilterType] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [search, setSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const fetchLogs = useCallback(async (p = 1) => {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page: p, limit: '40' });
            if (filterZalo) params.set('zaloId', filterZalo);
            if (filterType) params.set('actionType', filterType);
            if (filterStatus) params.set('status', filterStatus);
            if (searchQuery) params.set('search', searchQuery);

            const res = await fetch(`/api/bot-logs?${params}`);
            const json = await res.json();
            if (json.success) {
                setLogs(json.data);
                setPage(json.pagination.page);
                setTotalPages(json.pagination.totalPages);
                setTotal(json.pagination.total);
            }
        } catch { } finally { setLoading(false); }
    }, [filterZalo, filterType, filterStatus, searchQuery]);

    useEffect(() => { fetchLogs(1); }, [fetchLogs]);

    const handleSearch = () => setSearchQuery(search);

    return (
        <div className='flex flex-col gap-3 flex-1'>
            <div className='bg-[var(--bg-primary)] rounded-md border border-[var(--border-color)] p-4'>
                <div className='flex items-center justify-between mb-4 flex-wrap gap-2'>
                    <h5 className='font-semibold text-[var(--text-primary)]'>Lịch sử hoạt động Bot</h5>
                    <div className='flex gap-2 items-center flex-wrap'>
                        <input type="text" placeholder="Tìm nội dung..."
                            value={search} onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className='px-3 py-1.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 w-48' />
                        <select value={filterZalo} onChange={(e) => setFilterZalo(e.target.value)}
                            className='px-3 py-1.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700'>
                            <option value="">Tất cả Zalo</option>
                            {zaloData.map(z => <option key={z._id} value={z._id}>{z.name}</option>)}
                        </select>
                        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
                            className='px-3 py-1.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700'>
                            <option value="">Tất cả hành động</option>
                            {Object.entries(ACTION_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
                            className='px-3 py-1.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700'>
                            <option value="">Tất cả trạng thái</option>
                            <option value="success">Thành công</option>
                            <option value="failed">Thất bại</option>
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className='text-center py-12 text-sm text-[var(--text-secondary)]'>Đang tải...</div>
                ) : logs.length === 0 ? (
                    <div className='text-center py-12 text-sm text-[var(--text-secondary)]'>Chưa có hoạt động nào.</div>
                ) : (
                    <div className='overflow-x-auto'>
                        <table className='w-full text-sm'>
                            <thead>
                                <tr className='border-b border-[var(--border-color)] text-[var(--text-secondary)]'>
                                    <th className='text-left py-2 px-2 font-medium'>Thời gian</th>
                                    <th className='text-left py-2 px-2 font-medium'>Zalo</th>
                                    <th className='text-left py-2 px-2 font-medium'>Hành động</th>
                                    <th className='text-left py-2 px-2 font-medium'>Đối tượng</th>
                                    <th className='text-left py-2 px-2 font-medium'>Kết quả</th>
                                    <th className='text-left py-2 px-2 font-medium'>Nội dung</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map(log => (
                                    <tr key={log._id} className='border-b border-[var(--border-color)] hover:bg-[var(--hover)]'>
                                        <td className='py-2 px-2 text-xs whitespace-nowrap text-[var(--text-secondary)]'>
                                            {new Date(log.createdAt).toLocaleString('vi-VN')}
                                        </td>
                                        <td className='py-2 px-2'>
                                            <div className='flex items-center gap-2'>
                                                {log.zalo?.avt && (
                                                    <Image src={log.zalo.avt} alt='' width={24} height={24}
                                                        className='w-6 h-6 rounded-full object-cover' />
                                                )}
                                                <span className='text-xs'>{log.zalo?.name || 'N/A'}</span>
                                            </div>
                                        </td>
                                        <td className='py-2 px-2'>
                                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ACTION_COLORS[log.type] || 'bg-gray-100'}`}>
                                                {ACTION_LABELS[log.type] || log.type}
                                            </span>
                                        </td>
                                        <td className='py-2 px-2 text-xs'>
                                            {log.customer?.Name || log.student?.Name || 'N/A'}
                                            {log.customer?.phone || log.student?.phone ? ` (${log.customer?.phone || log.student?.phone})` : ''}
                                        </td>
                                        <td className='py-2 px-2'>
                                            <span className={`inline-flex items-center gap-1 text-xs ${log.status?.status ? 'text-green-600' : 'text-red-500'}`}>
                                                <span className={`w-1.5 h-1.5 rounded-full ${log.status?.status ? 'bg-green-500' : 'bg-red-500'}`}></span>
                                                {log.status?.status ? 'Thành công' : 'Thất bại'}
                                            </span>
                                        </td>
                                        <td className='py-2 px-2 text-xs text-[var(--text-secondary)] max-w-[200px] truncate' title={log.message}>
                                            {log.message || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {totalPages > 1 && (
                    <div className='flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-color)]'>
                        <span className='text-xs text-[var(--text-secondary)]'>Tổng: {total} bản ghi</span>
                        <div className='flex gap-1'>
                            <button onClick={() => fetchLogs(page - 1)} disabled={page <= 1}
                                className='px-3 py-1 rounded bg-gray-200 text-xs cursor-pointer border-none disabled:opacity-50 hover:bg-gray-100'>Trước</button>
                            <span className='px-3 py-1 text-xs text-[var(--text-secondary)]'>{page} / {totalPages}</span>
                            <button onClick={() => fetchLogs(page + 1)} disabled={page >= totalPages}
                                className='px-3 py-1 rounded bg-gray-200 text-xs cursor-pointer border-none disabled:opacity-50 hover:bg-gray-100'>Sau</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
