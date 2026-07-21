'use client';

import { useState, useEffect } from 'react';

export default function Switch({
  checked,
  onChange,
  size = 'medium',
  activeColor = '#4caf50',
  inactiveColor = '#ccc',
}) {
  const [internalChecked, setInternalChecked] = useState(checked !== undefined ? checked : false);

  useEffect(() => {
    if (checked !== undefined) {
      setInternalChecked(checked);
    }
  }, [checked]);

  const handleToggle = () => {
    const newChecked = !internalChecked;
    if (onChange) onChange(newChecked);
    if (checked === undefined) {
      setInternalChecked(newChecked);
    }
  };

  let switchWidth, switchHeight, circleSize;
  if (typeof size === 'number') {
    switchWidth = size * 2;
    switchHeight = size;
    circleSize = size - 2;
  } else {
    switch (size) {
      case 'small':
        switchWidth = 32;
        switchHeight = 16;
        circleSize = 12.5;
        break;
      case 'large':
        switchWidth = 80;
        switchHeight = 40;
        circleSize = 36;
        break;
      case 'medium':
      default:
        switchWidth = 60;
        switchHeight = 30;
        circleSize = 26;
        break;
    }
  }

  const containerStyle = {
    width: switchWidth,
    height: switchHeight,
    backgroundColor: internalChecked ? activeColor : inactiveColor,
  };

  const circleStyle = {
    width: circleSize,
    height: circleSize,
    top: (switchHeight - circleSize) / 2,
    left: internalChecked ? switchWidth - circleSize - 2 : 2,
  };

  return (
    <div className='relative rounded-full cursor-pointer transition-colors duration-200' style={containerStyle} onClick={handleToggle}>
      <div className='absolute rounded-full bg-[var(--bg-secondary)] transition-all duration-200 shadow-md' style={circleStyle} />
    </div>
  );
}
