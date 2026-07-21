'use client';

export default function CenterPopup({
    open,
    onClose,
    title = '',
    children,
    size = 'md'
}) {
    if (!open) return null;

    const sizeClass = size === 'sm' ? 'max-w-[300px]' : size === 'lg' ? 'max-w-[1100px]' : 'max-w-[500px]';

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center" onMouseDown={onClose}>
            <div className="absolute inset-0 bg-black/50" />
            <div
                className={`relative bg-[var(--bg-primary)] rounded-lg shadow-lg flex flex-col max-h-[90vh] w-[90%] ${sizeClass}`}
                onMouseDown={e => e.stopPropagation()}
            >
                {title && (
                    <div className="flex justify-between items-center px-4 py-3 border-b border-gray-200">
                        <h3 className="m-0 text-xl">{title}</h3>
                        <button className="bg-transparent border-none text-2xl cursor-pointer text-[var(--text-primary)]" onClick={onClose}>&times;</button>
                    </div>
                )}
                <div className="flex-1 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}
