export function KPISkeleton() {
    return (
        <>
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
                <div key={i} className="flex items-center gap-3 rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 animate-pulse">
                    <div className="h-11 w-11 shrink-0 rounded-lg bg-gray-200" />
                    <div className="flex-1 space-y-1.5">
                        <div className="h-3 w-20 rounded bg-gray-200" />
                        <div className="h-5 w-16 rounded bg-gray-200" />
                    </div>
                </div>
            ))}
        </>
    )
}

export function ChartSkeleton({ rows = 3 }) {
    return (
        <div className="animate-pulse space-y-3 p-1">
            {[1, 2, 3].slice(0, rows).map(i => (
                <div key={i} className="flex items-center gap-3">
                    <div className="h-4 w-16 rounded bg-gray-200" />
                    <div className="h-4 flex-1 rounded bg-gray-200" style={{ opacity: 1 - i * 0.2 }} />
                </div>
            ))}
        </div>
    )
}
