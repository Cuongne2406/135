import React from 'react';

export default function AnimatedButton({
  children,
  onClick,
  padding = '10px 20px',
  background = '#1677ff',
  hoverColor = '#4096ff',
  border = 'null',
  borderRadius = '8px',
  disabled = false,
}) {
  return (
    <button
      className='relative border-none text-white text-base font-bold text-center cursor-pointer overflow-hidden z-0 flex items-center transition-colors duration-300 ease-in-out after:content-[\'\'] after:absolute after:-bottom-1/2 after:-right-1/2 after:w-0 after:h-0 after:rounded-full after:z-[-1] after:transition-all after:duration-[0.8s] after:ease after:hover:w-[250%] after:hover:h-[250px] disabled:opacity-60 disabled:cursor-not-allowed'
      onClick={onClick}
      disabled={disabled}
      style={{
        padding,
        backgroundColor: background,
        '--hover-color': hoverColor,
        border: border,
        borderRadius: borderRadius
      }}
    >
      {children}
    </button>
  );
}
