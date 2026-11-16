export default function Loading({ content }) {
  return (
    <div className='flex flex-col items-center justify-center gap-3'>
      <div className='w-10 h-10 border-4 border-gray-200 border-t-[var(--main_d)] rounded-full animate-spin' />
      <div className='text-sm font-semibold text-[var(--text-primary)]'>{content}</div>
    </div>
  );
}
