import { colorText_noti } from '@/data/style/color';

export default function TextNoti({ mes, title, color }) {
    color = colorText_noti({ key: color ? color : 'default' });

    return (
        <div className='p-3 bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-md' style={{ borderColor: color.color, background: color.background }}>
            <p className='text-base font-semibold text-[var(--text-primary)]' style={{ color: color.color, marginBottom: 4 }}>{title}</p>
            <div className='text-sm font-normal text-[var(--text-primary)]' style={{ color: color.color }}>  {mes}  </div>
        </div>
    )
}