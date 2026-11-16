'use client'

import { useState } from 'react'
import Report from '@/app/teacher/ui/report'
import AttendanceTab from './attendance-tab'
import TestTab from './test-tab'
import SlaTab from './sla-tab'

export default function ReportClient({ initialReports }) {
    const [tab, setTab] = useState('attendance')

    return (
        <div className="flex flex-col gap-3 p-4 h-full">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Báo cáo chuyên cần</h2>
            </div>

            <div className="flex gap-0 border-b border-[var(--border-color)]">
                <button
                    className={`px-4 py-2 text-sm font-medium transition-colors ${tab === 'report' ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    onClick={() => setTab('report')}
                >
                    Báo cáo
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium transition-colors ${tab === 'attendance' ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    onClick={() => setTab('attendance')}
                >
                    Chuyên cần
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium transition-colors ${tab === 'sla' ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    onClick={() => setTab('sla')}
                >
                    SLA
                </button>
                <button
                    className={`px-4 py-2 text-sm font-medium transition-colors ${tab === 'test' ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
                    onClick={() => setTab('test')}
                >
                    Test
                </button>
            </div>

            {tab === 'report' ? (
                <div className="flex-1 overflow-auto">
                    <Report initialReports={initialReports} />
                </div>
            ) : tab === 'attendance' ? (
                <AttendanceTab />
            ) : tab === 'sla' ? (
                <SlaTab />
            ) : (
                <TestTab />
            )}
        </div>
    )
}
