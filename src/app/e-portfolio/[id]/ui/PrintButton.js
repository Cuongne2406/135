'use client';

import React from 'react';
import { Printer } from 'lucide-react';

export default function PrintButton() {
    return (
        <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--main_d)] hover:bg-[var(--main_b)] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
            <Printer className="w-3.5 h-3.5" />
            In / Lưu PDF
        </button>
    );
}
