'use client';
import { useState, Suspense, useMemo } from 'react';
import CustomerTable from './ui/table';
import FilterControls from "./ui/filter";
import SettingLabel from "./ui/label";
import SettingData from "./ui/data";
import SettingZalo from './ui/zalo';
import BulkActions from './ui/run';
import RunningActions from './ui/action';
import SettingVariant from './ui/variant';
import SettingZaloRoles from './ui/zalos';
import ActionHistory from './ui/hisotry';
import ZaloConfig from './ui/zalo-config';
import BotLogs from './ui/bot-logs';

function TableSkeleton() {
    return <div style={{ height: '500px', background: '#f8f9fa', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Đang tải dữ liệu...</div>;
}
export default function CustomerView({ c, running, initialResult, user, sources, labelData, formData, zaloData, users, variant }) {
    const [selectedCustomers, setSelectedCustomers] = useState(new Map());
    const [viewMode, setViewMode] = useState('manage');
    const [activeTab, setActiveTab] = useState('care');

    const handleActionComplete = () => {
        setSelectedCustomers(new Map());
    };
    const toggleViewMode = () => {
        setViewMode(prev => prev === 'manage' ? 'view' : 'manage');
    };

    // Chia lịch thành 2 trường hợp là đang chạy và đã hoàn thành
    const { runningSchedules, historySchedules } = useMemo(() => {
        return running.reduce((acc, schedule) => {
            const stats = schedule.statistics;
            if ((stats.completed + stats.failed) < stats.total) {
                acc.runningSchedules.push(schedule);
            } else {
                acc.historySchedules.push(schedule);
            }
            return acc;
        }, { runningSchedules: [], historySchedules: [] });

    }, [running]);
    return (
        <div className={'flex flex-col gap-3 mx-auto h-full'}>
            <div className="flex gap-1 bg-[var(--bg-primary)] rounded-md border border-[var(--border-color)] p-1 w-fit flex-wrap">
                <button
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'care' ? 'bg-[var(--main_d)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)]'}`}
                    onClick={() => setActiveTab('care')}
                >
                    Chăm sóc
                </button>
                <button
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'zalo-config' ? 'bg-[var(--main_d)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)]'}`}
                    onClick={() => setActiveTab('zalo-config')}
                >
                    Cấu hình Zalo
                </button>
                <button
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'bot-logs' ? 'bg-[var(--main_d)] text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--hover)]'}`}
                    onClick={() => setActiveTab('bot-logs')}
                >
                    Logs Bot
                </button>
            </div>

            {activeTab === 'care' ? (
                <>
                    {viewMode === 'manage' && (
                        <>
                            <div className={'bg-[var(--bg-primary)] rounded-md border border-[var(--border-color)]'}>
                                <div className={'flex justify-between items-center p-3 border-b border-[var(--border-color)]'}>
                                    <h5 className="font-semibold text-[var(--text-primary)]">Quản lý chăm sóc</h5>
                                    <div className="flex gap-2">
                                        <ActionHistory history={historySchedules} />
                                        <SettingZaloRoles data={zaloData} allUsers={users.filter(u => u.role[0] === 'Sale' || u.role[0] === 'Admin')} />
                                        <SettingVariant data={variant} />
                                        <SettingLabel data={labelData} />
                                        <SettingData data={formData} />
                                    </div>
                                </div>
                                <div className={'flex flex-wrap items-center gap-2 p-3'}>
                                    <SettingZalo user={user[0]} zalo={zaloData} />
                                    <RunningActions user={user} running={runningSchedules} />
                                    {!c.type && (
                                        <BulkActions
                                            selectedCustomers={selectedCustomers}
                                            onActionComplete={handleActionComplete}
                                            labels={labelData}
                                            variants={variant}
                                            users={users.filter(u => u.role[0] === 'Sale' || u.role[0] === 'Admin')}
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="bg-[var(--bg-primary)] rounded-md border border-[var(--border-color)] p-3">
                                <h5 className="font-semibold text-[var(--text-primary)] mb-3">Bộ lọc</h5>
                                <FilterControls zaloAccounts={zaloData} users={users.filter(u => u.role[0] === 'Sale' || u.role[0] === 'Admin')} labels={labelData} sources={sources} areas={['Biên Hòa', 'Long Khánh', 'Long Thành', 'TP HCM', 'Khác']} />
                            </div>
                        </>
                    )}
                    <div className="flex-1">
                        <Suspense fallback={<TableSkeleton />}>
                            <CustomerTable
                                data={initialResult.data}
                                total={initialResult.total}
                                user={user}
                                selectedCustomers={selectedCustomers}
                                setSelectedCustomers={setSelectedCustomers}
                                viewMode={viewMode}
                                onToggleViewMode={toggleViewMode}
                                zalo={zaloData}
                            />
                        </Suspense>
                    </div>
                </>
            ) : activeTab === 'zalo-config' ? (
                <ZaloConfig zaloData={zaloData} allUsers={users} />
            ) : (
                <BotLogs zaloData={zaloData} />
            )}
        </div>
    );
}