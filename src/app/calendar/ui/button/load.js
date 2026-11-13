'use client';
import { Re_calendar } from '@/data/course';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoadButton({month, year}) {
    const router = useRouter();
    const [isReloading, setIsReloading] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleClick = async () => {
        setIsReloading(true);
        try {
            await Re_calendar(month, year);
            router.refresh();
        } finally {
            setIsReloading(false);
        }
    };

    const buttonStyle = {
        padding: '10px 16px',
        borderRadius: '8px',
        fontWeight: 500,
        cursor: isReloading ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s',
        border: '1px solid #e2e8f0',
        backgroundColor: isHovered && !isReloading ? '#f1f5f9' : '#f8fafc',
        color: '#0f172a',
        opacity: isReloading ? 0.6 : 1,
    };

    return (
        <button
            style={buttonStyle}
            onClick={handleClick}
            disabled={isReloading}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {isReloading ? 'Đang tải...' : 'Làm mới dữ liệu'}
        </button>
    );
}
