'use client'

import { useState, useEffect, useCallback } from 'react'
import BankQrCard from '@/components/bank-qr-card'
import VIETNAM_BANKS from '@/data/banks'
import CenterPopup from '@/components/(features)/(popup)/popup_center'
import Title from '@/components/(features)/(popup)/title'

const defaultForm = { bankName: '', customName: '', accountNumber: '', accountName: '', isDefault: false }

export default function BankManager() {
    const [banks, setBanks] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState(defaultForm)
    const [editing, setEditing] = useState(null)
    const [showPopup, setShowPopup] = useState(false)
    const [noti, setNoti] = useState(null)

    const fetchBanks = useCallback(async () => {
        try {
            const res = await fetch('/api/bank')
            const json = await res.json()
            if (json.status) setBanks(json.data || [])
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchBanks() }, [fetchBanks])

    const showNoti = (mes, ok) => {
        setNoti({ mes, ok })
        setTimeout(() => setNoti(null), 3000)
    }

    const handleSave = async () => {
        const finalBankName = form.bankName === 'OTHER' ? form.customName.trim() : form.bankName
        if (!finalBankName || !form.accountNumber || !form.accountName) {
            showNoti('Nhập đầy đủ thông tin', false)
            return
        }
        try {
            const url = '/api/bank'
            const method = editing ? 'PUT' : 'POST'
            const body = editing
                ? { ...form, bankName: finalBankName, _id: editing }
                : { ...form, bankName: finalBankName }
            const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
            const json = await res.json()
            if (json.status) {
                showNoti(json.mes, true)
                setForm({ ...defaultForm })
                setEditing(null)
                setShowPopup(false)
                fetchBanks()
            } else {
                showNoti(json.mes, false)
            }
        } catch {
            showNoti('Lỗi kết nối', false)
        }
    }

    const openAddForm = () => {
        setForm({ ...defaultForm })
        setEditing(null)
        setShowPopup(true)
    }

    const openEditForm = (bank) => {
        const isPreset = VIETNAM_BANKS.find(b => b.code === bank.bankName)
        setForm({
            bankName: isPreset ? bank.bankName : 'OTHER',
            customName: isPreset ? '' : bank.bankName,
            accountNumber: bank.accountNumber,
            accountName: bank.accountName,
            isDefault: bank.isDefault,
        })
        setEditing(bank._id)
        setShowPopup(true)
    }

    const handleDelete = async (_id) => {
        if (!confirm('Xóa tài khoản ngân hàng này?')) return
        try {
            const res = await fetch('/api/bank', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _id }) })
            const json = await res.json()
            if (json.status) {
                showNoti(json.mes, true)
                fetchBanks()
            } else {
                showNoti(json.mes, false)
            }
        } catch {
            showNoti('Lỗi kết nối', false)
        }
    }

    const handleToggleDefault = async (bank) => {
        try {
            const res = await fetch('/api/bank', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ _id: bank._id, isDefault: !bank.isDefault, bankName: bank.bankName, accountNumber: bank.accountNumber, accountName: bank.accountName })
            })
            const json = await res.json()
            if (json.status) {
                showNoti(json.mes, true)
                fetchBanks()
            } else {
                showNoti(json.mes, false)
            }
        } catch {
            showNoti('Lỗi kết nối', false)
        }
    }

    if (loading) return <div className="flex items-center justify-center h-full"><p className="text-[var(--text-secondary)]">Đang tải...</p></div>

    return (
        <div className="flex flex-col gap-4 h-full">
            <div className="flex items-center justify-between flex-wrap gap-2">
                <h2 className="text-lg font-semibold text-[var(--text-primary)]">Tài khoản ngân hàng</h2>
                <button
                    className="px-3 py-1.5 text-sm rounded-lg bg-[var(--main_d)] text-white hover:opacity-90 transition-opacity"
                    onClick={openAddForm}
                >
                    + Thêm tài khoản
                </button>
            </div>

            {noti && (
                <div className={`px-4 py-2 rounded text-sm ${noti.ok ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {noti.mes}
                </div>
            )}

            {banks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-sm text-[var(--text-secondary)]">
                    Chưa có tài khoản ngân hàng nào
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4">
                    {banks.map(bank => (
                        <BankQrCard
                            key={bank._id}
                            bankName={`Ngân hàng ${bank.bankName}`}
                            accountNumber={bank.accountNumber}
                            accountName={bank.accountName}
                            isDefault={bank.isDefault}
                            onEdit={() => openEditForm(bank)}
                            onDelete={() => handleDelete(bank._id)}
                            onToggleDefault={() => handleToggleDefault(bank)}
                            className="shadow-sm w-full"
                        />
                    ))}
                </div>
            )}

            <CenterPopup open={showPopup} onClose={() => setShowPopup(false)} size="md">
                <Title content={editing ? 'Sửa tài khoản' : 'Thêm tài khoản mới'} click={() => setShowPopup(false)} />
                <div style={{ padding: '16px 24px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-[var(--text-secondary)]">Ngân hàng</label>
                        <select
                            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none bg-white w-full"
                            value={form.bankName}
                            onChange={e => setForm(p => ({ ...p, bankName: e.target.value }))}
                        >
                            <option value="">-- Chọn ngân hàng --</option>
                            {VIETNAM_BANKS.map(b => (
                                <option key={b.code} value={b.code}>{b.name}</option>
                            ))}
                            <option value="OTHER">Ngân hàng khác...</option>
                        </select>
                        {form.bankName === 'OTHER' && (
                            <input
                                className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none w-full"
                                placeholder="Nhập tên ngân hàng"
                                value={form.customName}
                                onChange={e => setForm(p => ({ ...p, customName: e.target.value }))}
                            />
                        )}
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-[var(--text-secondary)]">Số tài khoản</label>
                        <input
                            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none w-full"
                            placeholder="VD: 0976036313"
                            value={form.accountNumber}
                            onChange={e => setForm(p => ({ ...p, accountNumber: e.target.value }))}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-[var(--text-secondary)]">Tên chủ tài khoản</label>
                        <input
                            className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm outline-none w-full"
                            placeholder="VD: PHAN THI HUONG"
                            value={form.accountName}
                            onChange={e => setForm(p => ({ ...p, accountName: e.target.value }))}
                        />
                    </div>
                    <label className="flex items-center gap-2.5 text-sm cursor-pointer py-1">
                        <input
                            type="checkbox"
                            checked={form.isDefault}
                            onChange={e => setForm(p => ({ ...p, isDefault: e.target.checked }))}
                            className="accent-blue-600"
                        />
                        Đặt làm tài khoản mặc định
                    </label>
                    <div className="flex gap-3 pt-2">
                        <button className="flex-1 px-4 py-2.5 text-sm rounded-lg bg-blue-600 text-white font-medium hover:opacity-90 transition-opacity" onClick={handleSave}>
                            {editing ? 'Cập nhật' : 'Thêm'}
                        </button>
                        <button className="px-4 py-2.5 text-sm rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600" onClick={() => setShowPopup(false)}>
                            Hủy
                        </button>
                    </div>
                </div>
            </CenterPopup>
        </div>
    )
}
