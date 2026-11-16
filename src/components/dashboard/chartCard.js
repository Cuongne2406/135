export default function ChartCard({ title, children, className = '' }) {
    return (
        <div className={`rounded-xl border border-[var(--border-color)] bg-[var(--bg-primary)] p-4 ${className}`}>
            <h3 className="mb-3 text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
            <div className="w-full">
                {children}
            </div>
        </div>
    )
}
