const ICONS = {
    Image: 'https://assets.minimals.cc/public/assets/icons/files/ic-img.svg',
    Ppt: 'https://lh3.googleusercontent.com/d/1JKzT-6E0tVU99RLRQ7Q0r6GcIs2_k6S3',
    Video: 'https://assets.minimals.cc/public/assets/icons/files/ic-video.svg',
    default: 'https://assets.minimals.cc/public/assets/icons/files/ic-zip.svg',
};

export default function BoxFile({ type, name, href }) {
    const iconSrc = ICONS[type] || ICONS.default;

    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className='flex flex-col items-start gap-1 p-4 rounded border border-[var(--border-color)] no-underline cursor-pointer'
        >
            <img
                src={iconSrc}
                alt={`${type} icon`}
                loading="lazy"
                className='w-8 h-8'
            />
            <div className='mt-1 text-base text-[var(--text-primary)]'>{name}</div>
        </a>
    );
}
