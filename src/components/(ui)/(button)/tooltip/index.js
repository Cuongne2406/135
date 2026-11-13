'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';

const Tooltip = React.memo(function Tooltip({
  children,
  tooltipContent,
  position = 'top', 
  offset = 8,
  customStyle = {} 
}) {
  const [visible, setVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState({});
  const triggerRef = useRef(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    let top = 0, left = 0;
    switch (position) {
      case 'top':
        top = rect.top - offset + window.scrollY;
        left = rect.left + rect.width / 2 + window.scrollX;
        break;
      case 'bottom':
        top = rect.bottom + offset + window.scrollY;
        left = rect.left + rect.width / 2 + window.scrollX;
        break;
      case 'left':
        top = rect.top + rect.height / 2 + window.scrollY;
        left = rect.left - offset + window.scrollX;
        break;
      case 'right':
        top = rect.top + rect.height / 2 + window.scrollY;
        left = rect.right + offset + window.scrollX;
        break;
      default:
        top = rect.top - offset + window.scrollY;
        left = rect.left + rect.width / 2 + window.scrollX;
    }
    let transform = '';
    if (position === 'top') transform = 'translate(-50%, -100%)';
    else if (position === 'bottom') transform = 'translate(-50%, 0)';
    else if (position === 'left') transform = 'translate(-100%, -50%)';
    else if (position === 'right') transform = 'translate(0, -50%)';

    setTooltipStyle({ top, left, transform, ...customStyle });
  }, [position, offset, customStyle]);

  const showTooltip = useCallback(() => {
    setVisible(true);
    calculatePosition();
  }, [calculatePosition]);

  const hideTooltip = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (!visible) return;
    const handleUpdate = () => calculatePosition();
    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('resize', handleUpdate);
    return () => {
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('resize', handleUpdate);
    };
  }, [visible, calculatePosition]);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>
      {visible &&
        createPortal(
          <div className='absolute bg-[var(--bg-secondary)] text-[var(--text-primary)] px-3 py-2 rounded shadow-[var(--boxshaw)] border border-[var(--border-color)] text-xs pointer-events-none z-[9999] opacity-100 transition-opacity duration-300 ease-in-out whitespace-nowrap' style={tooltipStyle}>
            {tooltipContent}
          </div>,
          document.body
        )}
    </>
  );
});

export default Tooltip;
