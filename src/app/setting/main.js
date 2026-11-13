'use client'
import { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Noti from '@/components/(features)/(noti)/noti'

function ZaloTab({ zaloAccounts, users }) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [editing, setEditing] = useState(null)
  const [proxyVal, setProxyVal] = useState('')
  const [saving, setSaving] = useState(false)
  const [noti, setNoti] = useState({ open: false, status: false, message: '' })

  const filtered = useMemo(() => {
    if (!search.trim()) return zaloAccounts
    const q = search.toLowerCase()
    return zaloAccounts.filter(a =>
      a.name?.toLowerCase().includes(q) || a.phone?.includes(q) || a.uid?.toLowerCase().includes(q)
    )
  }, [zaloAccounts, search])

  const getUserName = (userId) => {
    const u = users.find(u => u._id === userId)
    return u?.name || userId
  }

  const startEdit = (account) => {
    setEditing(account._id)
    setProxyVal(account.proxy || '')
  }

  const cancelEdit = () => {
    setEditing(null)
    setProxyVal('')
  }

  const saveProxy = async (id) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/zalo/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxy: proxyVal }),
      })
      const json = await res.json()
      if (json.success) {
        setNoti({ open: true, status: true, message: 'Đã lưu proxy' })
        setEditing(null)
        router.refresh()
      } else {
        setNoti({ open: true, status: false, message: json.error || 'Lỗi' })
      }
    } catch (e) {
      setNoti({ open: true, status: false, message: 'Lỗi kết nối' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3 mb-4">
        <input
          type="text"
          placeholder="Tìm kiếm tài khoản Zalo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700 w-72"
        />
        <span className="text-xs text-[var(--text-secondary)]">{filtered.length}/{zaloAccounts.length} tài khoản</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.length === 0 ? (
          <p className="text-center text-[var(--text-secondary)] mt-12">Không có tài khoản Zalo</p>
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map(account => (
              <div key={account._id} className="bg-[var(--bg-primary)] border border-[var(--border-color)] rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={account.avt || 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG'}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                      onError={e => { e.target.onerror = null; e.target.src = 'https://lh3.googleusercontent.com/d/1iq7y8VE0OyFIiHmpnV_ueunNsTeHK1bG' }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{account.name}</p>
                      <p className="text-xs text-[var(--text-secondary)]">{account.phone} · {account.uid}</p>
                      {account.roles?.length > 0 && (
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          Người dùng: {account.roles.map(r => getUserName(r)).join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 max-w-md">
                    {editing === account._id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={proxyVal}
                          onChange={e => setProxyVal(e.target.value)}
                          placeholder="http://user:pass@host:port"
                          className="flex-1 px-2 py-1.5 text-xs border border-gray-200 rounded bg-white outline-none text-gray-700 font-mono"
                        />
                        <button onClick={() => saveProxy(account._id)} disabled={saving}
                          className="px-2 py-1.5 text-xs font-medium text-white bg-[var(--main_d)] rounded hover:opacity-90 disabled:opacity-40">
                          {saving ? '...' : 'Lưu'}
                        </button>
                        <button onClick={cancelEdit}
                          className="px-2 py-1.5 text-xs font-medium text-[var(--text-secondary)] bg-gray-100 rounded hover:bg-gray-200">
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <code className="flex-1 px-2 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded text-gray-600 truncate font-mono">
                          {account.proxy || <span className="text-gray-400 italic">Chưa cấu hình proxy</span>}
                        </code>
                        <button onClick={() => startEdit(account)}
                          className="px-2 py-1.5 text-xs font-medium text-[var(--main_d)] hover:bg-[var(--main_l)] rounded shrink-0">
                          {account.proxy ? 'Sửa' : 'Thêm'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.message}
        button={<button onClick={() => setNoti(p => ({ ...p, open: false }))}
          className="px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm font-medium cursor-pointer border-none mt-2">Đóng</button>} />
    </>
  )
}

function SlaTab() {
  const [settings, setSettings] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noti, setNoti] = useState({ open: false, status: false, message: '' })

  const LABELS = {
    sla_reminder_minutes: 'Nhắc nhở điểm danh (phút)',
    sla_warning_minutes: 'Cảnh báo nhật ký (phút)',
    sla_resource_warning_minutes: 'Cảnh báo minh chứng (phút)',
    sla_incident_minutes: 'Vi phạm SLA (phút)',
    student_absent_threshold: 'Ngưỡng vắng học sinh',
  }

  const DESCRIPTIONS = {
    sla_reminder_minutes: 'Sau bao nhiêu phút kết thúc buổi học thì nhắc giáo viên điểm danh',
    sla_warning_minutes: 'Sau bao nhiêu phút thì cảnh báo thiếu nhật ký buổi học',
    sla_resource_warning_minutes: 'Sau bao nhiêu phút thì cảnh báo thiếu minh chứng (ảnh/video)',
    sla_incident_minutes: 'Sau bao nhiêu phút thì ghi nhận vi phạm SLA',
    student_absent_threshold: 'Số buổi vắng tối đa trước khi cảnh báo',
  }

  useEffect(() => {
    fetch('/api/notifications/settings')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          const map = {}
          json.data.forEach(s => { map[s.key] = s.value })
          setSettings(map)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (key, val) => {
    setSettings(p => ({ ...p, [key]: Number(val) }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const entries = Object.entries(settings).filter(([k]) => LABELS[k])
      const res = await fetch('/api/notifications/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: entries.map(([key, value]) => ({ key, value })) }),
      })
      const json = await res.json()
      setNoti({ open: true, status: json.success, message: json.success ? 'Đã lưu cấu hình SLA' : json.error })
    } catch (e) {
      setNoti({ open: true, status: false, message: 'Lỗi kết nối' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-32 text-sm text-[var(--text-secondary)]">Đang tải...</div>

  return (
    <div className="max-w-xl">
      <p className="text-sm text-[var(--text-secondary)] mb-4">Cấu hình thời gian cảnh báo SLA cho từng giai đoạn sau khi buổi học kết thúc.</p>
      <div className="flex flex-col gap-4">
        {Object.keys(LABELS).map(key => (
          <div key={key}>
            <label className="block text-sm font-semibold text-[var(--text-primary)] mb-1">{LABELS[key]}</label>
            <p className="text-xs text-[var(--text-secondary)] mb-1">{DESCRIPTIONS[key]}</p>
            <input type="number" min={0} value={settings[key] ?? ''}
              onChange={e => handleChange(key, e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded bg-white text-sm outline-none text-gray-700" />
          </div>
        ))}
      </div>
      <button onClick={handleSave} disabled={saving}
        className="mt-6 px-4 py-2 bg-[var(--main_d)] text-white text-sm font-medium rounded hover:opacity-90 disabled:opacity-40 cursor-pointer border-none">
        {saving ? 'Đang lưu...' : 'Lưu cấu hình'}
      </button>
      <Noti open={noti.open} onClose={() => setNoti(p => ({ ...p, open: false }))} status={noti.status} mes={noti.message}
        button={<button onClick={() => setNoti(p => ({ ...p, open: false }))}
          className="px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm font-medium cursor-pointer border-none mt-2">Đóng</button>} />
    </div>
  )
}

function NotificationTab() {
  const [settings, setSettings] = useState({
    channel_zalo_enabled: true,
    channel_email_enabled: true,
    channel_inapp_enabled: true,
    auto_tuition_receipt: true,
    auto_test_score_notify: true
  })
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [noti, setNoti] = useState({ open: false, status: false, message: '' })

  useEffect(() => {
    fetch('/api/notifications/settings')
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          if (json.settings) {
            setSettings(prev => ({ ...prev, ...json.settings }))
          }
          if (json.templates) {
            setTemplates(json.templates)
          }
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const json = await res.json()
      setNoti({ open: true, status: json.success, message: json.success ? 'Đã lưu cấu hình kênh thông báo thành công' : json.error })
    } catch (e) {
      setNoti({ open: true, status: false, message: 'Lỗi kết nối máy chủ' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-32 text-sm text-[var(--text-secondary)]">Đang tải cấu hình thông báo...</div>

  const CHANNELS = [
    {
      key: 'channel_zalo_enabled',
      title: 'Kênh Zalo OA / ZNS',
      desc: 'Tự động gửi tin nhắn báo lịch học, điểm thi và học phí trực tiếp qua Zalo đến phụ huynh.',
      icon: '💬',
      badge: 'Zalo'
    },
    {
      key: 'channel_email_enabled',
      title: 'Kênh Email tự động',
      desc: 'Gửi biên lai học phí điện tử và báo cáo học tập định kỳ qua hộp thư điện tử của gia đình.',
      icon: '✉️',
      badge: 'Email'
    },
    {
      key: 'channel_inapp_enabled',
      title: 'Thông báo Nội bộ (In-App)',
      desc: 'Hiển thị huy hiệu thông báo thời gian thực trên thanh công cụ và chuông thông báo của phần mềm.',
      icon: '🔔',
      badge: 'In-App'
    }
  ]

  const AUTOMATIONS = [
    {
      key: 'auto_tuition_receipt',
      title: 'Tự động gửi biên lai học phí',
      desc: 'Kích hoạt thông báo xác nhận thu tiền ngay khi kế toán xác nhận biên lai nộp học phí.',
      icon: '💰'
    },
    {
      key: 'auto_test_score_notify',
      title: 'Tự động gửi kết quả kiểm tra',
      desc: 'Gửi bảng điểm và nhận xét của giáo viên cho phụ huynh ngay khi bài test được chấm điểm.',
      icon: '📊'
    }
  ]

  return (
    <div className="max-w-4xl space-y-8 pb-12">
      {/* Kênh phát thông báo */}
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Kênh phát thông báo hệ thống</h2>
        <p className="text-xs text-[var(--text-secondary)] mb-4">Quản lý việc kích hoạt hoặc tạm dừng các phương thức gửi tin tức thời đến phụ huynh và học viên.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {CHANNELS.map(ch => {
            const isEnabled = !!settings[ch.key]
            return (
              <div
                key={ch.key}
                onClick={() => handleToggle(ch.key)}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                  isEnabled 
                    ? 'border-indigo-300 bg-indigo-50/40 shadow-sm' 
                    : 'border-gray-200 bg-gray-50/50 opacity-70 hover:opacity-90'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{ch.icon}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      isEnabled ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {isEnabled ? 'Đang bật' : 'Tắt'}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-1">{ch.title}</h3>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{ch.desc}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Trạng thái</span>
                  <div className={`w-10 h-5 flex items-center rounded-full p-0.5 duration-300 ease-in-out ${
                    isEnabled ? 'bg-indigo-600 justify-end' : 'bg-gray-300 justify-start'
                  }`}>
                    <div className="bg-white w-4 h-4 rounded-full shadow-md transform"></div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Tự động hóa sự kiện */}
      <div>
        <h2 className="text-base font-semibold text-[var(--text-primary)] mb-1">Quy tắc thông báo tự động (Automation Triggers)</h2>
        <p className="text-xs text-[var(--text-secondary)] mb-4">Thiết lập các sự kiện vận hành tự động kích hoạt tiến trình gửi tin thông báo.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {AUTOMATIONS.map(auto => {
            const isEnabled = !!settings[auto.key]
            return (
              <div
                key={auto.key}
                onClick={() => handleToggle(auto.key)}
                className={`p-4 rounded-xl border transition-all cursor-pointer select-none flex items-start gap-4 ${
                  isEnabled ? 'border-emerald-300 bg-emerald-50/30 shadow-sm' : 'border-gray-200 bg-gray-50/50 opacity-70'
                }`}
              >
                <div className="text-2xl mt-0.5">{auto.icon}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-[var(--text-primary)]">{auto.title}</h3>
                    <div className={`w-9 h-5 flex items-center rounded-full p-0.5 duration-300 ease-in-out shrink-0 ml-2 ${
                      isEnabled ? 'bg-emerald-600 justify-end' : 'bg-gray-300 justify-start'
                    }`}>
                      <div className="bg-white w-4 h-4 rounded-full shadow-md"></div>
                    </div>
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-relaxed">{auto.desc}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Mẫu thông báo động từ collection notificationTemplate */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-base font-semibold text-[var(--text-primary)]">Mẫu thông báo động (Dynamic Templates)</h2>
            <p className="text-xs text-[var(--text-secondary)]">Các mẫu nội dung tin nhắn được trích xuất từ collection NotificationTemplate với các biến thay thế tự động.</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 rounded-md text-gray-700">
            {templates.length} mẫu tin khả dụng
          </span>
        </div>

        <div className="space-y-3 mt-3">
          {templates.map(tpl => (
            <div key={tpl._id || tpl.type} className="border border-gray-200 rounded-xl p-4 bg-white hover:border-indigo-200 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 font-mono text-[11px] font-bold rounded">
                    {tpl.type}
                  </span>
                  <span className="text-xs font-bold text-gray-800">{tpl.title_template}</span>
                </div>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                  {tpl.default_level || 'REMINDER'}
                </span>
              </div>

              <div className="bg-gray-50 p-2.5 rounded-lg border border-gray-100 mb-2">
                <p className="text-xs text-gray-700 font-mono whitespace-pre-wrap leading-relaxed">
                  {tpl.content_template}
                </p>
              </div>

              {tpl.variables && tpl.variables.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[11px] text-gray-500 font-medium">Biến thay thế:</span>
                  {tpl.variables.map(v => (
                    <span key={v} className="px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[11px] font-mono border border-gray-200">
                      {`{{${v}}}`}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Nút lưu */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 bg-[var(--main_d)] text-white text-sm font-semibold rounded-lg hover:opacity-90 disabled:opacity-40 transition-opacity cursor-pointer shadow-sm"
        >
          {saving ? 'Đang lưu cài đặt...' : 'Lưu tùy chọn thông báo'}
        </button>
      </div>

      <Noti
        open={noti.open}
        onClose={() => setNoti(p => ({ ...p, open: false }))}
        status={noti.status}
        mes={noti.message}
        button={
          <button
            onClick={() => setNoti(p => ({ ...p, open: false }))}
            className="px-3 py-2 bg-[var(--main_b)] rounded text-white text-sm font-medium cursor-pointer border-none mt-2"
          >
            Đóng
          </button>
        }
      />
    </div>
  )
}

const TABS = [
  { key: 'zalo', label: 'Zalo Proxy' },
  { key: 'sla', label: 'Cấu hình SLA' },
  { key: 'notifications', label: 'Tùy chọn Thông báo' },
]

export default function SettingClient({ zaloAccounts, users }) {
  const [tab, setTab] = useState('zalo')

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-4">Cài đặt</h1>
      <div className="flex gap-0 border-b border-[var(--border-color)] mb-4">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer border-none ${tab === t.key ? 'text-[var(--main_d)] border-b-2 border-[var(--main_d)]' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === 'zalo' && <ZaloTab zaloAccounts={zaloAccounts} users={users} />}
        {tab === 'sla' && <SlaTab />}
        {tab === 'notifications' && <NotificationTab />}
      </div>
    </div>
  )
}
