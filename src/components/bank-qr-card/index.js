'use client'

import { useState } from 'react'

export default function BankQrCard({
    bankName,
    accountNumber,
    accountName,
    qrUrl,
    isDefault = false,
    onEdit,
    onDelete,
    onToggleDefault,
    className = ''
}) {
    const [menuOpen, setMenuOpen] = useState(false)
    const hasActions = onEdit || onDelete || onToggleDefault

    return (
        <article
            aria-label="Thông tin chuyển khoản ngân hàng"
            className={`relative overflow-hidden rounded-[9px] select-none ${className}`}
            style={{
                width: '100%',
                maxWidth: 302,
                aspectRatio: '302 / 155',
            }}
        >
            <div
                className="absolute inset-0"
                style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
                }}
            />
            <div aria-hidden="true" className="absolute top-0 right-0 pointer-events-none" style={{ zIndex: 0 }}>
                <svg width="105" height="90" viewBox="0 0 105 90" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M105 0H75C75 0 70 30 50 45C30 60 10 55 0 50V90H105V0Z" fill="#ffffff" opacity="0.08" />
                    <path d="M95 0H85C85 5 80 20 65 30C50 40 35 38 25 35V40C40 45 55 48 70 38C85 28 92 10 95 0Z" fill="#ffffff" opacity="0.06" />
                    <circle cx="80" cy="15" r="8" fill="#ffffff" opacity="0.05" />
                </svg>
            </div>

            {isDefault && (
                <div className="absolute bottom-2 right-2 z-10">
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold text-white uppercase"
                        style={{ background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(2px)' }}>
                        Mặc định
                    </span>
                </div>
            )}

            {hasActions && (
                <div className="absolute top-2 right-2 z-10">
                    <button
                        onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen) }}
                        className="w-7 h-7 flex items-center justify-center rounded hover:bg-white/10 transition-colors text-white"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                            <circle cx="5" cy="12" r="1.8" />
                            <circle cx="12" cy="12" r="1.8" />
                            <circle cx="19" cy="12" r="1.8" />
                        </svg>
                    </button>
                    {menuOpen && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                            <div className="absolute right-0 top-8 z-20 bg-white rounded-lg shadow-lg border min-w-[160px] py-1">
                                {onEdit && (
                                    <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={() => { setMenuOpen(false); onEdit() }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                                        Sửa
                                    </button>
                                )}
                                {onToggleDefault && (
                                    <button className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={() => { setMenuOpen(false); onToggleDefault() }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                                        {isDefault ? 'Bỏ mặc định' : 'Đặt mặc định'}
                                    </button>
                                )}
                                {onDelete && (
                                    <button className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2" onClick={() => { setMenuOpen(false); onDelete() }}>
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                        Xóa
                                    </button>
                                )}
                            </div>
                        </>
                    )}
                </div>
            )}

            <div className="relative flex flex-col h-full" style={{ zIndex: 1 }}>
                <div className="flex items-center gap-[7px] pt-[14px] pl-[14px] pr-10">
                    <div className="w-[34px] h-[34px] bg-white rounded-[5px] flex items-center justify-center overflow-hidden shrink-0">
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="#2563eb" xmlns="http://www.w3.org/2000/svg">
                            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="#2563eb" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                    </div>
                    <p style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.75)' }} className="truncate">
                        {bankName}
                    </p>
                </div>

                <div className="flex-1 flex items-end px-[14px] pb-[10px]">
                    <div className="flex-1 min-w-0 pr-2">
                        <p style={{ fontSize: 15, fontWeight: 700, color: '#ffffff', lineHeight: '18px', letterSpacing: 1 }} className="font-bold truncate tabular-nums">
                            {accountNumber}
                        </p>
                        <p style={{ fontSize: 12, fontWeight: 400, color: 'rgba(255,255,255,0.6)', lineHeight: '15px', marginTop: 1 }} className="truncate uppercase">
                            {accountName}
                        </p>
                    </div>
                    {qrUrl && (
                        <div className="shrink-0" style={{ width: 88, height: 90, background: 'white', borderRadius: 2, border: 'thin solid rgba(255,255,255,0.15)', padding: 4 }}>
                            <img
                                src={qrUrl}
                                alt={`Mã QR chuyển khoản đến tài khoản ${accountNumber}`}
                                className="w-full h-full object-contain"
                                style={{ display: 'block' }}
                            />
                        </div>
                    )}
                </div>
            </div>
        </article>
    )
}
