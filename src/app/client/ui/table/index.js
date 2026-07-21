'use client';
import React, { useState, useEffect, useTransition, useCallback, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { Svg_Delete, Svg_Eye, Svg_Setting } from '@/components/(icon)/svg';
import CustomerRow from './row';
const Svg_View = ({ w, h, c }) => (<svg width={w} height={h} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" fill={c} /></svg>);
const ALL_COLUMNS = [
    { key: 'nameparent', header: 'Tên phụ huynh' },
    { key: 'phone', header: 'SĐT' },
    { key: 'name', header: 'Tên học viên' },
    { key: 'type', header: 'Loại' },
    { key: 'email', header: 'Email' },
    { key: 'area', header: 'Khu vực' },
    { key: 'bd', header: 'Ngày sinh' },
    { key: 'source', header: 'Nguồn' },
    { key: 'status', header: 'Trạng thái chăm sóc' },
    { key: 'statusaction', header: 'Trạng thái hành động' },
];
const INITIAL_VISIBLE_COLUMNS = ['nameparent', 'name', 'phone', 'status', 'source', 'statusaction'];
function CustomerTableHeader({ onSelectPage, areAllSelected, visibleColumns, viewMode }) {
    return (
        <div className="flex shrink-0 min-w-full">
            {viewMode === 'manage' && (
                <div className="p-3 text-left font-semibold text-[var(--text-primary)] border-b-2 border-[var(--border-color)] whitespace-nowrap w-15 shrink-0 text-center">
                    <label className='flex items-center justify-center cursor-pointer w-5 h-5'>
                        <input type="checkbox" className='w-4 h-4 accent-[var(--main_d)]' onChange={() => onSelectPage(areAllSelected)} checked={areAllSelected} />
                    </label>
                </div>
            )}
            <div className="p-3 text-left font-semibold text-[var(--text-primary)] border-b-2 border-[var(--border-color)] whitespace-nowrap shrink-0 w-15 text-center"><h5>STT</h5></div>
            {visibleColumns.map(colKey => {
                const column = ALL_COLUMNS.find(c => c.key === colKey);
                return <div key={colKey} className="flex-1 p-3 text-left font-semibold text-[var(--text-primary)] border-b-2 border-[var(--border-color)] truncate"><h5 className="truncate">{column?.header}</h5></div>;
            })}
        </div>
    );
}
function TableControls({ total, limit, page, onDeselectAll, createURL, selectedCount, visibleColumns, onVisibleColumnsChange, viewMode, onToggleViewMode }) {
    const [currentLimit, setCurrentLimit] = useState(limit);
    const [pageInput, setPageInput] = useState(page);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const settingsRef = useRef(null);
    const totalPages = Math.ceil(total / limit);
    useEffect(() => {
        const handler = setTimeout(() => { if (currentLimit >= 10 && currentLimit <= 200 && currentLimit !== limit) createURL({ limit: currentLimit }); }, 800);
        return () => clearTimeout(handler);
    }, [currentLimit, limit, createURL]);
    useEffect(() => { setPageInput(page) }, [page]);
    useEffect(() => {
        function handleClickOutside(event) { if (settingsRef.current && !settingsRef.current.contains(event.target)) setIsSettingsOpen(false); }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [settingsRef]);
    const handlePageInputBlur = () => {
        let newPage = Number(pageInput);
        if (isNaN(newPage) || newPage < 1) newPage = 1;
        if (newPage > totalPages && totalPages > 0) newPage = totalPages;
        if (page !== newPage) createURL({ page: newPage });
    };
    const handlePageInputKeyPress = (e) => { if (e.key === 'Enter') e.target.blur(); };
    const handleColumnToggle = (colKey) => {
        const newVisibleColumns = visibleColumns.includes(colKey) ? visibleColumns.filter(key => key !== colKey) : [...visibleColumns, colKey];
        if (newVisibleColumns.length > 6) { alert('Bạn chỉ có thể chọn tối đa 6 cột để hiển thị.'); return; }
        onVisibleColumnsChange(newVisibleColumns);
    };
    return (
        <div className={'flex justify-between items-center p-2.5 border-t border-[var(--border-color)] bg-[var(--bg-primary)] flex-shrink-0'}>
            <div className={'flex items-center gap-3'}>
                <input type="number" min="10" max="200" value={currentLimit} onChange={(e) => setCurrentLimit(Number(e.target.value))} className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' />
                <h5>/ trang</h5>
                {viewMode === 'manage' && selectedCount > 0 && (
                    <div onClick={onDeselectAll} className={`px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100`}>
                        <Svg_Delete w={'var(--font-size-xs)'} h={'var(--font-size-xs)'} c={'var(--text-primary)'} />
                        <h5>Bỏ chọn ({selectedCount})</h5>
                    </div>
                )}
                <div className={'relative'} ref={settingsRef}>
                    <div onClick={() => setIsSettingsOpen(prev => !prev)} className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100'>
                        <Svg_Setting w={'var(--font-size-xs)'} h={'var(--font-size-xs)'} c={'var(--text-primary)'} />
                        <h5>Chỉnh sửa cột</h5>
                    </div>
                    {isSettingsOpen && (
                        <div className={'absolute bottom-full left-0 bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-md shadow-[0_4px_8px_rgba(0,0,0,0.1)] p-[10px] z-20 w-[200px] flex flex-col gap-2 mb-[5px]'}>
                            <h5 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 8 }}>Chọn cột (tối đa 6)</h5>
                            {ALL_COLUMNS.map(col => (
                                <label key={col.key} className={'flex items-center gap-2 cursor-pointer'}>
                                    <input type="checkbox" checked={visibleColumns.includes(col.key)} onChange={() => handleColumnToggle(col.key)} disabled={!visibleColumns.includes(col.key) && visibleColumns.length >= 6} />
                                    {col.header}
                                </label>
                            ))}
                        </div>
                    )}
                </div>
                <div onClick={onToggleViewMode} className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100'>
                    <Svg_Eye w={'var(--font-size-xs)'} h={'var(--font-size-xs)'} c={'var(--text-primary)'} />
                    <h5>{viewMode === 'manage' ? 'Chế độ xem' : 'Chế độ chăm sóc'}</h5>
                </div>
            </div>
            {totalPages > 0 && (
                <div className={'flex items-center gap-3'}>
                    <button onClick={() => createURL({ page: page - 1 })} disabled={page <= 1} className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100'><h5>«</h5></button>
                    <div className={'flex gap-1 items-center'}>
                        <button onClick={() => createURL({ page: 1 })} disabled={page === 1} className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100'><h5>1</h5></button>
                        <input type="number" value={pageInput} onChange={(e) => setPageInput(e.target.value)} onBlur={handlePageInputBlur} onKeyPress={handlePageInputKeyPress} className={`px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none`} style={{ width: 50 }} />
                        <button onClick={() => createURL({ page: totalPages })} disabled={page === totalPages || totalPages <= 1} className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100'><h5>{totalPages}</h5></button>
                    </div>
                    <button onClick={() => createURL({ page: page + 1 })} disabled={page >= totalPages} className='px-3 py-2 rounded bg-gray-200 flex items-center gap-2 justify-center cursor-pointer border-none transition-all duration-200 hover:bg-gray-100'><h5>»</h5></button>
                </div>
            )}
        </div>
    );
}
export default function CustomerTable({ zalo, data = [], total = 0, user, selectedCustomers, setSelectedCustomers, viewMode, onToggleViewMode }) {
    const [visibleColumns, setVisibleColumns] = useState(INITIAL_VISIBLE_COLUMNS);
    const [isPending, startTransition] = useTransition();
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const page = Number(searchParams.get('page')) || 1;
    const limit = Number(searchParams.get('limit')) || 10;
    const createURL = useCallback((paramsToUpdate) => {
        const params = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(paramsToUpdate)) {
            if (value) params.set(key, String(value));
            else params.delete(key);
        }
        if (paramsToUpdate.query !== undefined || paramsToUpdate.limit) {
            params.set('page', '1');
        }
        startTransition(() => {
            replace(`${pathname}?${params.toString()}`);
        });
    }, [searchParams, pathname, replace]);
    const handleSelect = (customer, shouldSelect) => {
        setSelectedCustomers(prev => {
            const newMap = new Map(prev);
            if (shouldSelect) {
                newMap.set(customer.phone, customer);
            } else {
                newMap.delete(customer.phone);
            }
            return newMap;
        });
    };
    const handleSelectPage = (areAllSelectedOnPage) => {
        setSelectedCustomers(prev => {
            const newMap = new Map(prev);
            if (areAllSelectedOnPage) {
                data.forEach(c => newMap.delete(c.phone));
            } else {
                data.forEach(c => newMap.set(c.phone, c));
            }
            return newMap;
        });
    };
    const handleDeselectAll = () => {
        setSelectedCustomers(new Map());
    };
    const phonesOnPage = data.map(c => c.phone);
    const areAllSelectedOnPage = phonesOnPage.length > 0 && phonesOnPage.every(phone => selectedCustomers.has(phone));
    return (
        <div className={'flex flex-col bg-[var(--bg-primary)] border border-[var(--border-color)] rounded relative flex-1'}>
            <div className={'flex-1 overflow-x-auto h-[calc(100%-50px)]'}>
                <div className='flex flex-col min-w-fit'>
                    <CustomerTableHeader onSelectPage={handleSelectPage} areAllSelected={areAllSelectedOnPage} visibleColumns={visibleColumns} viewMode={viewMode} />
                    <div className='overflow-y-auto'>{data.map((customer, index) => (
                            <CustomerRow zalo={zalo} viewMode={viewMode} user={user} key={customer._id} customer={customer} index={(page - 1) * limit + index + 1} isSelected={selectedCustomers.has(customer.phone)} onSelect={handleSelect} visibleColumns={visibleColumns} />
                        ))}
                        {data.length === 0 && (
                            <div style={{ height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <h5 style={{ fontStyle: 'italic' }}>Không có dữ liệu khách hàng phù hợp!</h5>
                            </div>
                        )}
                    </div>
                </div>
            </div>
            {isPending && <div className={'absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px] z-10'}><h5>Đang tải...</h5></div>}
            <TableControls total={total} limit={limit} page={page} onDeselectAll={handleDeselectAll} createURL={createURL} selectedCount={selectedCustomers.size} visibleColumns={visibleColumns} onVisibleColumnsChange={setVisibleColumns} viewMode={viewMode} onToggleViewMode={onToggleViewMode} />
        </div>
    );
}