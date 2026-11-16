export default function StatCard({ label, value, icon, growth }) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
            {icon && (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[var(--main_l)] text-[var(--main_d)]">
                    {icon}
                </div>
            )}
            <div className="min-w-0 flex-1">
                <p className="text-xs text-[var(--text-secondary)]">{label}</p>
                <div className="flex items-center gap-2">
                    <p className="text-lg font-bold text-[var(--text-primary)] truncate">{value}</p>
                    {growth !== undefined && growth !== null && (
                        <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium shrink-0 ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" height={8} width={8} fill="currentColor" className={growth >= 0 ? '' : 'rotate-180'}>
                                <path d="M182.6 137.4c-12.5-12.5-32.8-12.5-45.3 0l-128 128c-9.2 9.2-11.9 22.9-6.9 34.9s16.6 19.8 29.6 19.8l256 0c12.9 0 24.6-7.8 29.6-19.8s2.2-25.7-6.9-34.9l-128-128z"/>
                            </svg>
                            {growth >= 0 ? '+' : ''}{growth}%
                        </span>
                    )}
                </div>
            </div>
        </div>
    )
}
