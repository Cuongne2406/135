export default function Title({ content, click }) {
    return (
        <div className='flex justify-between items-center px-4 py-3 border-b border-[var(--border-color)]'>
            <h4>{content}</h4>
            <button className='bg-transparent border-none text-2xl cursor-pointer text-[var(--text-primary)]' onClick={click}>&times;</button>
        </div>
    )
}