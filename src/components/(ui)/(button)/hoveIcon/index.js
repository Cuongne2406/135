export default function WrapIcon({
    icon,
    content,
    placement = 'top',
    style = {},
    click,
    className = ''
}) {
    const placementClasses = {
        top: 'bottom-full left-1/2 -translate-x-1/2 -translate-y-2 after:content-[\'\'] after:absolute after:top-full after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-t-[var(--bg-primary)]',
        bottom: 'top-full left-1/2 -translate-x-1/2 translate-y-2 after:content-[\'\'] after:absolute after:bottom-full after:left-1/2 after:-translate-x-1/2 after:border-[6px] after:border-transparent after:border-b-[var(--bg-primary)]',
        left: 'right-full top-1/2 -translate-x-2 -translate-y-1/2 after:content-[\'\'] after:absolute after:right-[-6px] after:top-1/2 after:-translate-y-1/2 after:border-[6px] after:border-transparent after:border-r-[var(--bg-primary)]',
        right: 'left-full top-1/2 translate-x-2 -translate-y-1/2 after:content-[\'\'] after:absolute after:left-[-6px] after:top-1/2 after:-translate-y-1/2 after:border-[6px] after:border-transparent after:border-l-[var(--bg-primary)]',
    };

    return (
        <div className='relative cursor-pointer group' onClick={click}>
            <div className={`p-1.5 rounded flex items-center justify-center transition-all duration-100 hover:-translate-y-0.5 ${className}`} style={style}>
                {icon}
            </div>
            <span className={`absolute px-2 py-1 text-xs leading-[1.4] text-[var(--text-primary)] bg-[var(--bg-primary)] rounded whitespace-nowrap opacity-0 invisible transition-opacity duration-[0.18s] ease z-[2000] shadow-[var(--boxshaw2)] after:content-[\'\'] after:absolute after:border-[6px] after:border-transparent group-hover:opacity-100 group-hover:visible ${placementClasses[placement] || placementClasses.top}`}>{content}</span>
        </div>
    );
}
