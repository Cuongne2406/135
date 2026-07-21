'use client'

import React, { useState, useEffect } from 'react'
import FlexiblePopup from '@/components/(features)/(popup)/popup_right'
import Noti from '@/components/(features)/(noti)/noti'
import Loading from '@/components/(ui)/(loading)/loading'
import { useRouter } from 'next/navigation'

/* ────────────────── Card ────────────────── */
const AreaCard = ({ area, onClick }) => (
    <div className='bg-white border border-[#e0e0e0] rounded-lg cursor-pointer overflow-hidden hover:shadow-[0_2px_8px_rgba(0,0,0,0.15)]' onClick={() => onClick(area)}>
        <div className='p-3 flex flex-col gap-2' style={{ borderLeft: `5px solid ${area.color || '#ccc'}` }}>
            <p className='text-base font-semibold'>Tên khu vực: {area.name}</p>
            <p className='text-sm font-semibold'>
                Số phòng học: <span style={{ fontWeight: 400 }}>{area.rooms.length}</span>
            </p>
        </div>
    </div>
)

/* ────────────────── Main list ────────────────── */
export default function ProgramList({ programs = [] }) {
    const router = useRouter()
    const [selected, setSelected] = useState(null)
    const [form, setForm] = useState({ name: '', color: '#000000', rooms: [] })
    const [newRoom, setNewRoom] = useState('')
    const [colorErr, setColorErr] = useState('')
    const [loading, setLoading] = useState(false)
    const [noti, setNoti] = useState({ open: false, status: false, mes: '' })

    const isHex = (v) => /^#[0-9a-f]{6}$/i.test(v)

    /* ─── sync when card opened ─── */
    useEffect(() => {
        if (!selected) return
        setForm({
            name: selected.name,
            color: selected.color || '#000000',
            rooms: selected.rooms || []
        })
        setColorErr('')
    }, [selected])

    /* ─── handlers ─── */
    const addRoom = () => {
        const n = newRoom.trim()
        if (!n || form.rooms.some((r) => r.name === n)) return
        setForm((f) => ({ ...f, rooms: [...f.rooms, { name: n }] }))
        setNewRoom('')
    }

    const delRoom = (name) =>
        setForm((f) => ({ ...f, rooms: f.rooms.filter((r) => r.name !== name) }))

    const save = async () => {
        if (!form.name.trim() || !isHex(form.color)) {
            setNoti({ open: true, status: false, mes: 'Vui lòng kiểm tra dữ liệu.' })
            return
        }
        setLoading(true)
        try {
            const res = await fetch(`/api/area/${selected._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: form.name.trim(),
                    color: form.color,
                    rooms: form.rooms
                })
            }).then((r) => r.json())

            setNoti({ open: true, status: res.status, mes: res.mes })
            if (res.status) router.refresh()
            setSelected(null)
        } catch (e) {
            setNoti({ open: true, status: false, mes: e.message })
        } finally {
            setLoading(false)
        }
    }

    /* ─── popup content ─── */
    const popup = selected && (
        <div style={{ padding: 16 }}>
            {/* name */}
            <div className='flex flex-col gap-1.5 mb-4'>
                <p className='text-sm font-semibold text-[var(--text-primary)]'>Tên khu vực</p>
                <input
                    className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none'
                    name='name'
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
            </div>

            {/* color */}
            <div className='flex flex-col gap-1.5 mb-4'>
                <p className='text-sm font-semibold text-[var(--text-primary)]'>Màu hiển thị</p>
                <div className='flex items-center gap-2 p-[6px_8px] input'>
                    <label
                        htmlFor='color-picker'
                        className='w-7 h-7 border border-[#ccc] rounded cursor-pointer'
                        style={{ backgroundColor: form.color }}
                    />
                    <input
                        id='color-picker'
                        type='color'
                        className='hidden'
                        value={form.color}
                        onChange={(e) => setForm({ ...form, color: e.target.value })}
                    />
                    <input
                        className='flex-1 border-none outline-none bg-transparent text-sm'
                        value={form.color.toUpperCase()}
                        onChange={(e) => {
                            setForm({ ...form, color: e.target.value })
                            setColorErr(isHex(e.target.value) ? '' : 'Mã màu HEX không hợp lệ.')
                        }}
                    />
                </div>
                {colorErr && <p style={{ color: 'var(--red)', fontSize: 12 }}>{colorErr}</p>}
            </div>

            {/* rooms */}
            <div className='flex flex-col gap-1.5 mb-4'>
                <p className='text-sm font-semibold text-[var(--text-primary)]'>Phòng học</p>
                <div className='flex flex-wrap gap-1.5'>
                    {form.rooms.map((r) => (
                        <span key={r._id || r.name} className='bg-[#e0e0e0] rounded p-[2px_6px] inline-flex items-center gap-1 text-xs'>
                            {r.name}
                            <button onClick={() => delRoom(r.name)}>✕</button>
                        </span>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <input
                        className='px-3 py-2.5 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 resize-none'
                        style={{ flex: 1 }}
                        placeholder='Thêm phòng mới...'
                        value={newRoom}
                        onChange={(e) => setNewRoom(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && addRoom()}
                    />
                    <button className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ margin: 0 }} onClick={addRoom}>
                        Thêm
                    </button>
                </div>
            </div>

            <button
                className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5'
                onClick={save}
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', opacity: loading ? 0.6 : 1 }}
            >
                <p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: '#fff' }}>
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                </p>
            </button>
        </div>
    )

    /* ─── render ─── */
    return (
        <>
            {programs.length ? (
                <div className='grid gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]'>
                    {programs.map((a) => (
                        <AreaCard key={a._id} area={a} onClick={setSelected} />
                    ))}
                </div>
            ) : (
                <p>Không có khu vực nào để hiển thị.</p>
            )}

            <FlexiblePopup
                open={!!selected}
                onClose={() => setSelected(null)}
                title={selected ? `Chi tiết khu vực: ${selected.name}` : ''}
                renderItemList={() => popup}
            />

            {loading && (
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 9999 }}>
                    <Loading content={<p className='text-sm font-normal text-[var(--text-primary)]' style={{ color: '#fff' }}>Đang cập nhật...</p>} />
                </div>
            )}

            <Noti
                open={noti.open}
                onClose={() => setNoti((n) => ({ ...n, open: false }))}
                status={noti.status}
                mes={noti.mes}
                button={
                    <button className='px-3 py-2 bg-[var(--main_b)] flex items-center gap-2 w-max rounded text-white text-sm font-medium cursor-pointer border-none transition-all duration-100 mt-2 justify-center whitespace-nowrap hover:bg-[var(--main_d)] hover:-translate-y-0.5' style={{ width: '100%', borderRadius: 5, justifyContent: 'center' }} onClick={() => setNoti((n) => ({ ...n, open: false }))}>
                        Tắt thông báo
                    </button>
                }
            />
        </>
    )
}
