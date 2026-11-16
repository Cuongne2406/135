// FlexiblePopup.js
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Loading from '@/components/(ui)/(loading)/loading';

const ANIMATION_DURATION = 300;

export default function FlexiblePopup({
    open,
    onClose,
    fetchData = null,
    data: providedData = null,
    renderItemList = () => null,
    title = 'Danh sách',
    secondaryOpen = false,
    onCloseSecondary = () => { },
    fetchDataSecondary = null,
    dataSecondary: providedDataSecondary = null,
    renderSecondaryList = () => null,
    secondaryTitle = 'Chi tiết',
    secondaryCentered = false,
    width = 500,
    width2 = 500,
    globalZIndex = 1000
}) {
    // primary state
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [mounted, setMounted] = useState(false);
    const [visible, setVisible] = useState(false);
    const [showContent, setShowContent] = useState(false);
    if (typeof width === 'number') {
        width = `${width}px`
    }
    // secondary state
    const [data2, setData2] = useState([]);
    const [loading2, setLoading2] = useState(false);
    const [error2, setError2] = useState('');
    const [mounted2, setMounted2] = useState(false);
    const [visible2, setVisible2] = useState(false);
    const [showContent2, setShowContent2] = useState(false);

    // refs để lắng nghe transitionend
    const popupRef = useRef(null);
    const popup2Ref = useRef(null);

    // 1) Khi open=true: mount popup1
    useEffect(() => {
        if (open) {
            setMounted(true);
            // load data ngay khi mount
            if (providedData) {
                setData(providedData);
            } else if (fetchData) {
                setLoading(true);
                setError('');
                fetchData()
                    .then(res => setData(res))
                    .catch(err => setError(err.message || 'Lỗi tải dữ liệu'))
                    .finally(() => setLoading(false));
            }
        }
    }, [open, providedData, fetchData]);

    // 2) Khi popup1 đã mounted, bật visible trong next frame để chạy CSS transition
    useEffect(() => {
        if (mounted) {
            const raf = requestAnimationFrame(() => {
                setVisible(true);
            });
            return () => cancelAnimationFrame(raf);
        }
    }, [mounted]);

    // 3) Khi visible=true, delay ANIMATION_DURATION rồi cho render nội dung
    useEffect(() => {
        let t;
        if (visible) {
            t = setTimeout(() => setShowContent(true), ANIMATION_DURATION);
        } else {
            setShowContent(false);
        }
        return () => clearTimeout(t);
    }, [visible]);

    // 4) Khi open=false nhưng vẫn đang mounted: tắt visible rồi đợi transitionend mới unmount
    useEffect(() => {
        if (!open && mounted) {
            setVisible(false);
            const el = popupRef.current;
            if (!el) {
                setMounted(false);
                return;
            }
            const onEnd = (e) => {
                if (e.propertyName === 'transform') {
                    setMounted(false);
                    el.removeEventListener('transitionend', onEnd);
                }
            };
            el.addEventListener('transitionend', onEnd);
            const safetyTimeout = setTimeout(() => {
                setMounted(false);
                el.removeEventListener('transitionend', onEnd);
            }, 500);
            return () => {
                clearTimeout(safetyTimeout);
                el.removeEventListener('transitionend', onEnd);
            };
        }
    }, [open, mounted]);

    // --- Tương tự cho popup2 ---
    useEffect(() => {
        if (secondaryOpen) {
            setMounted2(true);
            if (providedDataSecondary) {
                setData2(providedDataSecondary);
            } else if (fetchDataSecondary) {
                setLoading2(true);
                setError2('');
                fetchDataSecondary()
                    .then(res => setData2(res))
                    .catch(err => setError2(err.message || 'Lỗi tải dữ liệu'))
                    .finally(() => setLoading2(false));
            }
        }
    }, [secondaryOpen, providedDataSecondary, fetchDataSecondary]);

    useEffect(() => {
        if (mounted2) {
            const raf2 = requestAnimationFrame(() => {
                setVisible2(true);
            });
            return () => cancelAnimationFrame(raf2);
        }
    }, [mounted2]);

    useEffect(() => {
        let t2;
        if (visible2) {
            t2 = setTimeout(() => setShowContent2(true), ANIMATION_DURATION);
        } else {
            setShowContent2(false);
        }
        return () => clearTimeout(t2);
    }, [visible2]);

    useEffect(() => {
        if (!secondaryOpen && mounted2) {
            setVisible2(false);
            const el2 = popup2Ref.current;
            if (!el2) {
                setMounted2(false);
                return;
            }
            const onEnd2 = (e) => {
                if (e.propertyName === 'transform') {
                    setMounted2(false);
                    el2.removeEventListener('transitionend', onEnd2);
                }
            };
            el2.addEventListener('transitionend', onEnd2);
            const safetyTimeout = setTimeout(() => {
                setMounted2(false);
                el2.removeEventListener('transitionend', onEnd2);
            }, 500);
            return () => {
                clearTimeout(safetyTimeout);
                el2.removeEventListener('transitionend', onEnd2);
            };
        }
    }, [secondaryOpen, mounted2]);

    // Nếu chưa mount popup1, không render gì
    if (!mounted) return null;

    return (
        <>
            {/* Popup 1 */}
            <div
                className={`fixed inset-0 bg-black/50 opacity-0 transition-opacity duration-300 ease-in-out will-change-opacity ${visible ? 'opacity-100' : 'pointer-events-none'}`}
                style={{ zIndex: globalZIndex }}
                onMouseDown={onClose}
            >
                <div
                    ref={popupRef}
                    className='fixed top-0 right-0 h-full bg-[var(--bg-primary)] flex flex-col'
                    style={{ zIndex: globalZIndex, width: width, transform: visible2 ? `translateX(-${width2})` : visible ? 'translateX(0)' : `translateX(${width})`, transition: 'transform 300ms ease-in-out' }}
                    onMouseDown={e => e.stopPropagation()}
                >
                    <div className='flex justify-between items-center px-4 py-3 h-7 border-b border-[var(--border-color)]'>
                        <h4 className='font-normal'>{title}</h4>
                        <button className='bg-transparent border-none text-2xl cursor-pointer text-[var(--text-primary)]' onClick={onClose}>&times;</button>
                    </div>
                    <div className='scroll' style={{ flex: 1 }}>
                        {loading && <Loading content="Đang tải" />}
                        {error && <p className='text-red'>{error}</p>}
                        {!loading && !error && showContent && renderItemList(data)}
                    </div>
                </div>
            </div>

            {/* Popup 2 */}
            {mounted2 && (
                <div
                    className={`fixed inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 ease-in-out will-change-opacity ${visible2 ? 'opacity-100' : 'pointer-events-none'}`}
                    style={{ zIndex: globalZIndex + 1 }}
                    onMouseDown={secondaryCentered ? undefined : onCloseSecondary}
                >
                    <div
                        ref={popup2Ref}
                        className={secondaryCentered
                            ? `bg-[var(--bg-primary)] rounded-2xl shadow-2xl flex flex-col max-h-[85vh] transition-all duration-300 ease-in-out ${visible2 ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`
                            : `fixed top-0 right-0 h-full max-w-[80%] bg-[var(--bg-primary)] flex flex-col translate-x-full transition-transform duration-300 ease-in-out will-change-transform ${visible2 ? 'translate-x-0' : ''}`
                        }
                        style={{
                            zIndex: globalZIndex + 2,
                            width: width2,
                            maxWidth: secondaryCentered ? 'calc(100vw - 32px)' : undefined,
                        }}
                        onMouseDown={e => e.stopPropagation()}
                    >
                        <div className='flex justify-between items-center px-4 py-3 border-b border-[var(--border-color)]'>
                            <h4 className='font-normal'>{secondaryTitle}</h4>
                            <button className='bg-transparent border-none text-2xl cursor-pointer text-[var(--text-primary)]' onClick={onCloseSecondary}>&times;</button>
                        </div>
                        <div className='flex-1 overflow-auto'>
                            {loading2 && <Loading content="Đang tải" />}
                            {error2 && <p className='text-red'>{error2}</p>}
                            {!loading2 && !error2 && showContent2 && renderSecondaryList(data2)}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}