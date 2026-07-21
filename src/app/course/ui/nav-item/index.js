import React from 'react';

function Nav({ status, icon, title, sl }) {
    return (
        <div className={`flex justify-between border-r border-[var(--border-color)] p-4 box-border w-full ${status ? 'bg-[var(--main_d)] rounded-md' : 'cursor-pointer'}`}>
            <div className='flex flex-col'>
                <div className='text-xl font-semibold text-[var(--text-primary)]' style={{ color: status ? 'white' : '' }}>{sl}</div>
                <div className='text-base font-medium text-[var(--text-primary)]' style={{ color: status ? 'white' : '' }}>{title}</div>
            </div>
            <div className={`flex items-center justify-center w-9 h-9 p-2 rounded-sm box-border ${status ? 'bg-[var(--bg-primary)]' : 'bg-[var(--bg-btn)]'}`}>{icon}</div>
        </div>
    );
}

export default React.memo(Nav);
