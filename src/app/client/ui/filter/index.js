'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState, useMemo, useRef } from 'react';
import Menu from '@/components/(ui)/(button)/menu';

export default function FilterControls({
    sources = [],
    areas = [],
    zaloAccounts = [],
    users = [],
    labels = []
}) {
    const searchParams = useSearchParams();
    const pathname = usePathname();
    const { replace } = useRouter();
    const currentType = searchParams.get('type');
    const [isSourceMenuOpen, setIsSourceMenuOpen] = useState(false);
    const [isUidMenuOpen, setIsUidMenuOpen] = useState(false);
    const [isCampaignMenuOpen, setIsCampaignMenuOpen] = useState(false);
    const [isCareStatusMenuOpen, setIsCareStatusMenuOpen] = useState(false);
    const [isAreaMenuOpen, setIsAreaMenuOpen] = useState(false);
    const [isLabelMenuOpen, setIsLabelMenuOpen] = useState(false);
    const [isZaloMenuOpen, setIsZaloMenuOpen] = useState(false);
    const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
    const searchTimeout = useRef(null);
    const createURL = useCallback((paramsToUpdate) => {
        const params = new URLSearchParams(searchParams);
        for (const [key, value] of Object.entries(paramsToUpdate)) {
            if (value || value === false || value === 0) params.set(key, String(value));
            else params.delete(key);
        }
        params.set('page', '1');
        replace(`${pathname}?${params.toString()}`);
    }, [searchParams, pathname, replace]);
    const handleSearch = useCallback((term) => {
        clearTimeout(searchTimeout.current);
        searchTimeout.current = setTimeout(() => {
            createURL({ query: term });
        }, 500);
    }, [createURL]);
    const staticOptions = useMemo(() => ({
        uidStatus: [{ value: 'true', name: 'Đã có' }, { value: 'not_searched', name: 'Chưa tìm' }, { value: 'not_found', name: 'Không có' }],
        campaignStatus: [{ value: 'true', name: 'Đang chạy' }, { value: 'false', name: 'Không chạy' }],
        careStatus: [{ value: '4', name: 'Đang chăm sóc' }, { value: '0', name: 'Chưa có kết quả' }, { value: '2', name: 'Không quan tâm' }, { value: '3', name: 'Tạm thời không quan tâm' }]
    }), []);
    const getSelectedName = useCallback((param, data, defaultText, keyField = '_id', nameField = 'name') => {
        const value = searchParams.get(param);
        if (!value) return defaultText;
        if (param === 'source' && value === 'null') return 'Thiếu nguồn';
        const selected = data.find(item => String(item[keyField]) === value);
        return selected ? selected[nameField] : defaultText;
    }, [searchParams]);
    return (
        <div className={'flex flex-col gap-2 p-3 rounded-md border border-[var(--border-color)] bg-[var(--bg-primary)]'}>
            <div className={'flex gap-2'} style={{ justifyContent: 'space-between' }}>
                <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                    <div className={'flex bg-[var(--bg-primary)] rounded-md p-[5.2px] border border-[var(--border-color)]'}>
                        <button className={!currentType ? 'bg-[var(--border-color)] text-[var(--text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : ''} onClick={() => createURL({ type: '' })}><h6>Khách hàng</h6></button>
                        <button className={currentType === 'true' ? 'bg-[var(--border-color)] text-[var(--text-primary)] shadow-[0_1px_3px_rgba(0,0,0,0.1)]' : ''} onClick={() => createURL({ type: 'true' })}><h6>Học sinh</h6></button>
                    </div>
                    <input type="text" placeholder="Tìm theo tên, SĐT..." className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none' style={{ flex: 1 }} defaultValue={searchParams.get('query') || ''} onChange={(e) => handleSearch(e.target.value)} />
                </div>
                <div style={{ flex: 1, display: 'flex', gap: 8 }}>
                    <Menu isOpen={isSourceMenuOpen} onOpenChange={setIsSourceMenuOpen} customButton={<div className='input text-sm font-normal text-[var(--text-primary)]'>{getSelectedName('source', sources, 'Tất cả nguồn')}</div>} menuItems={<div className={'p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col'}><p className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { createURL({ source: '' }); setIsSourceMenuOpen(false); }}>Tất cả nguồn</p>{sources.map(s => <p key={s._id} className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { createURL({ source: s._id }); setIsSourceMenuOpen(false); }}>{s.name}</p>)}<p className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { createURL({ source: 'null' }); setIsSourceMenuOpen(false); }}>Thiếu nguồn</p></div>} menuPosition="bottom" />
                    <Menu isOpen={isUidMenuOpen} onOpenChange={setIsUidMenuOpen} customButton={<div className='input text-sm font-normal text-[var(--text-primary)]'>{getSelectedName('uidStatus', staticOptions.uidStatus, 'Trạng thái UID', 'value')}</div>} menuItems={<div className={'p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col'}><p className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { createURL({ uidStatus: '' }); setIsUidMenuOpen(false); }}>Tất cả UID</p>{staticOptions.uidStatus.map(s => <p key={s.value} className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { createURL({ uidStatus: s.value }); setIsUidMenuOpen(false); }}>{s.name}</p>)}</div>} menuPosition="bottom" />
                    <Menu isOpen={isCampaignMenuOpen} onOpenChange={setIsCampaignMenuOpen} customButton={<div className='input text-sm font-normal text-[var(--text-primary)]'>{getSelectedName('campaignStatus', staticOptions.campaignStatus, 'Trạng thái chiến dịch', 'value')}</div>} menuItems={<div className={'p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col'}><p className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { createURL({ campaignStatus: '' }); setIsCampaignMenuOpen(false); }}>Trạng thái chiến dịch</p>{staticOptions.campaignStatus.map(s => <p key={s.value} className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { createURL({ campaignStatus: s.value }); setIsCampaignMenuOpen(false); }}>{s.name}</p>)}</div>} menuPosition="bottom" />
                </div>
            </div>
            {!currentType && (
                <div className={'flex gap-2'}>
                    <Menu isOpen={isCareStatusMenuOpen} onOpenChange={setIsCareStatusMenuOpen} customButton={<div className='input text-sm font-normal text-[var(--text-primary)]'>{getSelectedName('careStatus', staticOptions.careStatus, 'Trạng thái chăm sóc', 'value')}</div>} menuItems={<div className={'p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col'}><p className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { createURL({ careStatus: '' }); setIsCareStatusMenuOpen(false); }}>Trạng thái chăm sóc</p>{staticOptions.careStatus.map(s => <p key={s.value} className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { createURL({ careStatus: s.value }); setIsCareStatusMenuOpen(false); }}>{s.name}</p>)}</div>} menuPosition="bottom" />
                    <Menu isOpen={isAreaMenuOpen} onOpenChange={setIsAreaMenuOpen} customButton={<div className='input text-sm font-normal text-[var(--text-primary)]'>{searchParams.get('area') || 'Tất cả khu vực'}</div>} menuItems={<div className={'p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col'}><p className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { createURL({ area: '' }); setIsAreaMenuOpen(false); }}>Tất cả khu vực</p>{areas.map(a => <p key={a} className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { createURL({ area: a }); setIsAreaMenuOpen(false); }}>{a}</p>)}</div>} menuPosition="bottom" />
                    <Menu isOpen={isZaloMenuOpen} onOpenChange={setIsZaloMenuOpen} customButton={<div className='input text-sm font-normal text-[var(--text-primary)]'>{getSelectedName('zaloAccount', zaloAccounts, 'Tất cả tài khoản Zalo')}</div>} menuItems={<div className={'p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col'}><p className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { createURL({ zaloAccount: '' }); setIsZaloMenuOpen(false); }}>Tất cả tài khoản Zalo</p>{zaloAccounts.map(a => <p key={a._id} className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { createURL({ zaloAccount: a._id }); setIsZaloMenuOpen(false); }}>{a.name}</p>)}</div>} menuPosition="bottom" />
                    <Menu isOpen={isUserMenuOpen} onOpenChange={setIsUserMenuOpen} customButton={<div className='input text-sm font-normal text-[var(--text-primary)]'>{getSelectedName('user', users, 'Tất cả người dùng')}</div>} menuItems={<div className={'p-2 mt-1 rounded-md bg-[var(--bg-primary)] border border-[var(--border-color)] flex flex-col'}><p className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { createURL({ user: '' }); setIsUserMenuOpen(false); }}>Tất cả người dùng</p>{users.map(u => <p key={u._id} className='text-sm font-normal text-[var(--text-primary)]' onClick={() => { createURL({ user: u._id }); setIsUserMenuOpen(false); }}>{u.name}</p>)}</div>} menuPosition="bottom" />
                </div>
            )}
        </div>
    );
}