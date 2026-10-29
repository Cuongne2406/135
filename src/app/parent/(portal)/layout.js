'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { Home, Calendar, Award, LogOut, ChevronDown, Check, User } from 'lucide-react';
import { ParentProvider, useParent } from './context';

function ParentLayoutInner({ children }) {
    const pathname = usePathname();
    const { overviewData, loading, switching, switchStudent, logout } = useParent();
    const [showSwitchMenu, setShowSwitchMenu] = useState(false);

    const navItems = [
        { label: 'Trang chủ', href: '/parent', icon: Home, exact: true },
        { label: 'Lộ trình', href: '/parent/timeline', icon: Calendar },
        { label: 'Kỷ yếu', href: '/parent/showcase', icon: Award },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans">
                <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                <p className="text-xs text-slate-500 font-medium">Đang mở Sổ liên lạc của bé...</p>
            </div>
        );
    }

    const currentStudent = overviewData?.student;
    const allChildren = overviewData?.allChildren || [];

    return (
        <div className="min-h-screen bg-slate-100/70 flex flex-col font-sans text-slate-800">
            {/* Mobile App Container Wrapper */}
            <div className="max-w-md w-full mx-auto min-h-screen bg-slate-50 flex flex-col shadow-sm border-x border-slate-200/80 relative pb-20">
                {/* Header cố định */}
                <header className="sticky top-0 z-30 bg-white border-b border-slate-200 px-4 py-2.5 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                            AIR
                        </div>
                        <div className="flex flex-col">
                            <h1 className="text-xs font-bold text-slate-900 leading-none">SYS-AIR ROBOTIC</h1>
                            <p className="text-[10px] text-slate-500 mt-0.5">Sổ Liên Lạc Điện Tử</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Dropdown chuyển đổi con (nếu có >1 bé) */}
                        {allChildren.length > 1 ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                                    disabled={switching}
                                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
                                >
                                    {switching ? (
                                        <span className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                    ) : null}
                                    <span className="truncate max-w-[100px]">{currentStudent?.Name || 'Chọn bé'}</span>
                                    <ChevronDown className="w-3.5 h-3.5 shrink-0" />
                                </button>

                                {showSwitchMenu && (
                                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                                        <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] text-slate-400 font-medium">
                                            Chuyển đổi sổ liên lạc:
                                        </div>
                                        {allChildren.map((child) => (
                                            <button
                                                key={child.ID}
                                                onClick={() => {
                                                    setShowSwitchMenu(false);
                                                    switchStudent(child.ID);
                                                }}
                                                className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 cursor-pointer transition-colors ${child.ID === currentStudent?.ID ? 'text-blue-600 font-bold bg-blue-50/50' : 'text-slate-700'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className="w-7 h-7 rounded-full overflow-hidden bg-slate-100 flex items-center justify-center relative shrink-0 border border-slate-200 shadow-2xs">
                                                        {child.Avt ? (
                                                            <img
                                                                src={child.Avt}
                                                                alt={child.Name}
                                                                className="w-full h-full object-cover relative z-10"
                                                                onError={(e) => {
                                                                    e.currentTarget.style.display = 'none';
                                                                }}
                                                            />
                                                        ) : null}
                                                        <User className="w-4 h-4 text-slate-400 absolute" />
                                                    </div>
                                                    <div className="truncate">
                                                        <p className="font-semibold truncate">{child.Name}</p>
                                                        <p className="text-[10px] text-slate-400 font-mono">Mã: {child.ID}</p>
                                                    </div>
                                                </div>
                                                {child.ID === currentStudent?.ID && <Check className="w-4 h-4 text-blue-600 shrink-0 ml-1" />}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 truncate max-w-[130px]">
                                {currentStudent?.Name}
                            </span>
                        )}

                        {/* Nút đăng xuất */}
                        <button
                            onClick={logout}
                            title="Đăng xuất"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                {/* Nội dung trang con */}
                <main className="flex-1 p-4 space-y-4">
                    {children}
                </main>

                {/* Bottom Navigation Bar - Cố định 100% ở đáy màn hình, không dịch chuyển khi cuộn */}
                <nav className="fixed bottom-0 inset-x-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                    <div className="max-w-md mx-auto flex items-center justify-around py-2 px-2 pb-[max(0.6rem,env(safe-area-inset-bottom))]">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all ${isActive
                                            ? 'text-blue-600 font-bold'
                                            : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.8px]'}`} />
                                    <span className="text-[11px] leading-tight">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </div>
    );
}

export default function ParentLayout({ children }) {
    return (
        <ParentProvider>
            <ParentLayoutInner>{children}</ParentLayoutInner>
        </ParentProvider>
    );
}
