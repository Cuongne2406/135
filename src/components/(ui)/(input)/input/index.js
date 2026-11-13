import React, { forwardRef } from 'react';

const Input = forwardRef(function Input(
    { label, type = "text", placeholder, value, onChange, name, error, padding, ...props },
    ref
) {
    return (
        <div className='flex flex-col w-full'>
            {label && (
                <label htmlFor={name} className='text-sm mb-2 text-[#333]'>
                    {label}
                </label>
            )}
            <input
                ref={ref}
                type={type}
                name={name}
                style={{ padding: padding }}
                id={name}
                className={`border border-[var(--border-color)] rounded outline-none text-sm transition-[border-color,box-shadow] duration-300 ease focus:border-[var(--border-color)] focus:shadow-[0_0_0_0.5px_var(--border-color)] ${error ? 'border-[#ff4d4f]' : ''}`}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                {...props}
            />
            {error && <p className='text-[#ff4d4f] text-xs mt-1'>{error}</p>}
        </div>
    );
});

export default Input;
