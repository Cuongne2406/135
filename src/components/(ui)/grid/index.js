"use client";

import React, { useState } from 'react';

const ResponsiveGrid = ({ items = [], columns, type = 'grid', style = {}, width }) => {
    const [isPopupOpen, setPopupOpen] = useState(false);
    const isListMode = type === 'list';
    const maxItemsOnList = columns.desktop;

    const shouldShowMoreButton = isListMode && items.length > maxItemsOnList;
    const itemsToRender = shouldShowMoreButton
        ? items.slice(0, maxItemsOnList - 1)
        : items;

    const hiddenItemsCount = items.length - (maxItemsOnList - 1);
    const gridStyles = {
        '--mobile-cols': columns.mobile,
        '--tablet-cols': columns.tablet,
        '--desktop-cols': columns.desktop,
        display: 'grid',
        gap: '16px',
        gridTemplateColumns: `repeat(${columns.mobile}, 1fr)`,
    };
    const handleOpenPopup = () => setPopupOpen(true);
    const handleClosePopup = () => setPopupOpen(false);
    return (
        <>
            <div className='grid gap-4' style={gridStyles}>
                {itemsToRender.map((item, index) => (
                    <div key={`grid-item-${index}`} className='w-full'>
                        {item}
                    </div>
                ))}
                {shouldShowMoreButton && (
                    <div className='flex items-center justify-center border-2 border-dashed border-[#ccc] rounded-lg cursor-pointer bg-[#f8f9fa] transition-all duration-200 hover:bg-[#e9ecef] hover:border-[#adb5bd]' onClick={handleOpenPopup}>
                        <div className='flex flex-col items-center text-2xl font-bold text-[#495057] [&_span]:text-sm [&_span]:font-normal [&_span]:mt-1'>
                            +{hiddenItemsCount}
                            <span>Xem thêm</span>
                        </div>
                    </div>
                )}
            </div >
            {isPopupOpen && (
                <div className='fixed inset-0 w-screen h-screen bg-black/70 flex justify-center items-center z-[1000]' style={{ left: width ? `-${width}px` : '0' }} onClick={handleClosePopup}>
                    <div className='bg-white p-4 rounded-lg max-w-[90vw] h-[80vh] relative overflow-hidden w-[1200px] shadow-lg' onClick={(e) => e.stopPropagation()}>
                        <div style={{ width: '100%', height: '100%', overflow: 'hidden', overflowY: 'auto' }}>
                            <div className='grid gap-4' style={gridStyles}>
                                {items.map((item, index) => (
                                    <div key={`popup-item-${index}`} className='w-full'>
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )
            }
        </>
    );
};

export default ResponsiveGrid;