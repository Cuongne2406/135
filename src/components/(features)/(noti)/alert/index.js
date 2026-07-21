'use client';
import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { Svg_Waring } from '@/components/(icon)/svg';

const AlertIcon = memo(({ type }) => {
    const icons = { success: '✔', error: '✖', warning: <Svg_Waring h={24} c={'var(--yellow)'} w={24} />, info: 'ℹ' };
    const colorMap = { info: 'var(--main_b)', success: 'var(--green)', error: 'var(--red)', warning: 'var(--yellow)' };
    return <span className='text-xl leading-none' style={{ color: colorMap[type] || colorMap.info }}>{icons[type]}</span>;
});
AlertIcon.displayName = 'AlertIcon';

const AlertPopup = ({ open, onClose, title, content, type = 'info', actions, width = 600 }) => {
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const popupRef = useRef(null);

    useEffect(() => {
        if (open) {
            setMounted(true);
        }
    }, [open]);

    useEffect(() => {
        if (mounted) {
            const rafId = requestAnimationFrame(() => {
                setVisible(true);
            });
            return () => cancelAnimationFrame(rafId);
        }
    }, [mounted]);

    useEffect(() => {
        if (!open && mounted) {
            setVisible(false);
            const node = popupRef.current;
            if (!node) return;

            const handleTransitionEnd = (event) => {
                if (event.target === node) {
                    setMounted(false);
                }
            };
            node.addEventListener('transitionend', handleTransitionEnd);
            return () => {
                node.removeEventListener('transitionend', handleTransitionEnd);
            };
        }
    }, [open, mounted]);

    const handleBackdropClick = useCallback(() => {
        onClose?.();
    }, [onClose]);

    const handlePopupClick = useCallback((e) => e.stopPropagation(), []);

    if (!mounted) {
        return null;
    }

    const colorMap = { info: 'var(--main_b)', success: 'var(--green)', error: 'var(--red)', warning: 'var(--yellow)' };
    const indicatorColor = colorMap[type] || colorMap.info;

    return (
        <div className={`fixed inset-0 bg-black/50 z-[2000] flex justify-center items-center opacity-0 invisible transition-opacity duration-300 ease-in-out ${visible ? 'opacity-100 visible' : ''}`} onClick={handleBackdropClick}>
            <div
                ref={popupRef}
                className={`relative bg-[var(--bg-primary)] w-full rounded-2xl shadow-[0_-5px_20px_rgba(0,0,0,0.15)] overflow-hidden scale-95 transition-all duration-300 ease-[cubic-bezier(0.25,0.8,0.25,1)] ${visible ? 'scale-100 opacity-100' : 'opacity-0'}`}
                style={{ width }}
                onClick={handlePopupClick}
            >
                <div className='absolute left-0 top-0 bottom-0 w-[6px]' style={{ backgroundColor: indicatorColor }} />
                <div className='flex items-center gap-3 px-8 py-4'>
                    <AlertIcon type={type} />
                    <h4>{title || 'Thông báo'}</h4>
                </div>
                <div className='px-8'>
                    {content}
                </div>
                {actions && (
                    <div className='mt-4 px-8 py-3 flex justify-end gap-3' >
                        {actions}
                    </div>
                )}
            </div>
        </div>
    );
};

export default memo(AlertPopup);