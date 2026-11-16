export default function EmptyState({ message = 'Không có dữ liệu' }) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-[var(--text-secondary)]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" height={48} width={48} fill="currentColor" className="mb-3 opacity-40">
                <path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .1 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.6-20.1s-7.2-27.7 .1-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z"/>
            </svg>
            <p className="text-sm">{message}</p>
        </div>
    )
}
