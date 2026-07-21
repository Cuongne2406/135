'use client';
import { useState, useEffect, useMemo, startTransition, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Svg_Dark, Svg_Left, Svg_Logout, Svg_Menu, Svg_Mode, Svg_Student, Svg_Course, Svg_Canlendar, Svg_Setting, Svg_History, Svg_Chart, Svg_Bell } from '../../(icon)/svg';
import Menu from '../../(ui)/(button)/menu';
import Switch from "@/components/(ui)/(button)/swith";
import WrapIcon from '../../(ui)/(button)/hoveIcon';
import Loading from '@/components/(ui)/(loading)/loading';
import NotificationBell from '@/components/(features)/(noti)/notificationBell';
import Link from 'next/link';

const Svg_More = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" {...props}>
    <path d="M8 256a56 56 0 1 1 112 0A56 56 0 1 1 8 256zm160 0a56 56 0 1 1 112 0 56 56 0 1 1 -112 0zm216-56a56 56 0 1 1 0 112 56 56 0 1 1 0-112z" />
  </svg>
);
const Svg_Search = (props) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" {...props}>
    <path d="M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376C296.3 401.1 253.9 416 208 416C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z" />
  </svg>
);

const Svg_Collapse = ({ collapsed, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512" {...props} style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .3s' }}>
    <path d="M137.4 406.6l-128-128c-12.5-12.5-12.5-32.8 0-45.3l128-128c9.2-9.2 22.9-11.9 34.9-6.9s19.8 16.6 19.8 29.6l0 256c0 12.9-7.8 24.6-19.8 29.6s-25.7 2.2-34.9-6.9z" />
  </svg>
);

const COLLAPSED_W = '60px';
const EXPANDED_W = '240px';

const academicChildren = [
  { href: '/academic/makeup', content: 'Học bù' },
  { href: '/academic/rooms', content: 'Phòng học' },
  { href: '/academic/debt', content: 'Quản lý học phí' },
  { href: '/academic/report', content: 'Báo cáo chuyên cần' },
]

const initialNavItems = [
  { href: '/student/list', icon: <Svg_Student w={22} h={22} c={'var(--text-secondary)'} />, content: 'Học sinh' },
  {
    href: '/teacher', icon: <div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" height={22} width={22} fill={'var(--text-secondary)'}>
        <path d="M160 64c0-35.3 28.7-64 64-64L576 0c35.3 0 64 28.7 64 64l0 288c0 35.3-28.7 64-64 64l-239.2 0c-11.8-25.5-29.9-47.5-52.4-64l99.6 0 0-32c0-17.7 14.3-32 32-32l64 0c17.7 0 32 14.3 32 32l0 32 64 0 0-288L224 64l0 49.1C205.2 102.2 183.3 96 160 96l0-32zm0 64a96 96 0 1 1 0 192 96 96 0 1 1 0-192zM133.3 352l53.3 0C260.3 352 320 411.7 320 485.3c0 14.7-11.9 26.7-26.7 26.7L26.7 512C11.9 512 0 500.1 0 485.3C0 411.7 59.7 352 133.3 352z" />
      </svg>
    </div>, content: 'Người dùng'
  },
  {
    href: '/academic', icon: <div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" height={22} width={22} fill={'var(--text-secondary)'}>
        <path d="M96 128a128 128 0 1 1 256 0A128 128 0 1 1 96 128zM0 482.3C0 383.8 79.8 304 178.3 304l91.4 0C368.2 304 448 383.8 448 482.3c0 16.4-13.3 29.7-29.7 29.7L29.7 512C13.3 512 0 498.7 0 482.3zM504 312l0-64.9c0-7.9 6.4-17.1 17.1-17.1c4.7 0 9.2 1.8 12.5 5.1l49 49c6.9 6.9 6.9 18.2 0 25.2l-12.5 12.5c-6.9 6.9-18.2 6.9-25.2 0L504 312zm-79.4 71.7L384 424l0 19.5c0 4.7 3.8 8.5 8.5 8.5l19.5 0 40.3-40.3c3.1-3.1 3.1-8.2 0-11.3l-11.3-11.3c-3.1-3.1-8.2-3.1-11.3 0z" />
      </svg>
    </div>, content: 'Học vụ', children: academicChildren
  },
  { href: '/course', icon: <Svg_Course w={22} h={22} c={'var(--text-secondary)'} />, content: 'Khóa học' },
  { href: '/calendar', icon: <Svg_Canlendar w={22} h={22} c={'var(--text-secondary)'} />, content: 'Lịch dạy' },
  {
    href: '/client', icon: <div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512" height={22} width={22} fill={'var(--text-secondary)'}>
        <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c10 0 18.8-4.9 24.2-12.5l-99.2-99.2c-14.9-14.9-23.3-35.1-23.3-56.1l0-33c-15.9-4.7-32.8-7.2-50.3-7.2l-91.4 0zM384 224c-17.7 0-32 14.3-32 32l0 82.7c0 17 6.7 33.3 18.7 45.3L478.1 491.3c18.7 18.7 49.1 18.7 67.9 0l73.4-73.4c18.7-18.7 18.7-49.1 0-67.9L512 242.7c-12-12-28.3-18.7-45.3-18.7L384 224zm24 80a24 24 0 1 1 48 0 24 24 0 1 1 -48 0z" />
      </svg>
    </div>, content: 'Chăm sóc'
  },
  { href: '/search', icon: <Svg_Search height={22} width={22} fill={'var(--text-secondary)'} />, content: 'Tìm kiếm' },
  {
    href: '/guide', icon: <div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" height={22} width={22} fill={'var(--text-secondary)'}>
        <path d="M96 0C43 0 0 43 0 96L0 416c0 53 43 96 96 96l288 0 32 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l0-64c17.7 0 32-14.3 32-32l0-320c0-17.7-14.3-32-32-32L384 0 96 0zm0 384l256 0 0 64L96 448c-17.7 0-32-14.3-32-32s14.3-32 32-32zm32-240c0-8.8 7.2-16 16-16l192 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-192 0c-8.8 0-16-7.2-16-16zm16 48l192 0c8.8 0 16 7.2 16 16s-7.2 16-16 16l-192 0c-8.8 0-16-7.2-16-16s7.2-16 16-16z"/>
      </svg>
    </div>, content: 'Hướng dẫn'
  },
  { href: '/', icon: <Svg_Chart h={22} w={22} c={'var(--text-secondary)'} />, content: 'Thống kê' }
];

export default function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [orderedItems, setOrderedItems] = useState(initialNavItems);
  const navContainerRef = useRef(null);
  const [hasBackup, setHasBackup] = useState(false);
  const [backupUser, setBackupUser] = useState({});

  useEffect(() => {
    setHasBackup(!!localStorage.getItem('backupToken'))
    try {
      const u = JSON.parse(localStorage.getItem('backupUser') || '{}')
      setBackupUser(u)
    } catch {}
  }, [])

  const handleSwitchBack = async () => {
    const token = localStorage.getItem('backupToken')
    if (!token) return
    try {
      const res = await fetch('/api/switch-back', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ backupToken: token }),
      })
      const json = await res.json()
      if (res.ok) {
        localStorage.removeItem('backupToken')
        localStorage.removeItem('backupUser')
        window.location.reload()
      } else {
        localStorage.removeItem('backupToken')
        localStorage.removeItem('backupUser')
        setHasBackup(false)
      }
    } catch (e) {
      console.error(e)
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem('sidebarCollapsed');
    const isCollapsed = saved === 'true';
    setCollapsed(isCollapsed);
    document.documentElement.style.setProperty('--sidebar-w', isCollapsed ? COLLAPSED_W : EXPANDED_W);
  }, []);

  const toggleCollapse = () => {
    setCollapsed(prev => {
      const next = !prev;
      const w = next ? COLLAPSED_W : EXPANDED_W;
      document.documentElement.style.setProperty('--sidebar-w', w);
      localStorage.setItem('sidebarCollapsed', String(next));
      return next;
    });
  };

  useEffect(() => {
    const savedOrder = localStorage.getItem('navItemOrder');
    if (savedOrder) {
      try {
        const orderedHrefs = JSON.parse(savedOrder);
        const newOrderedItems = orderedHrefs
          .map(href => initialNavItems.find(item => item.href === href))
          .filter(Boolean);
        initialNavItems.forEach(item => {
          if (!newOrderedItems.find(i => i.href === item.href)) {
            newOrderedItems.push(item);
          }
        });
        setOrderedItems(newOrderedItems);
      } catch (e) {
        console.error("Failed to parse nav item order from localStorage", e);
        setOrderedItems(initialNavItems);
      }
    } else {
      setOrderedItems(initialNavItems);
    }
  }, []);

  const [activeMenu, setActiveMenu] = useState(1);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [expandedParents, setExpandedParents] = useState({ '/academic': true });

  const toggleParent = (href) => {
    setExpandedParents(prev => ({ ...prev, [href]: !prev[href] }));
  };

  useEffect(() => {
    const theme = localStorage.getItem('theme');
    if (theme === 'dark') {
      setIsDark(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const newTheme = !prev;
      if (newTheme) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('theme', 'light');
      }
      return newTheme;
    });
  };

  const [load, setload] = useState(false);
  const logout = async () => {
    setload(true);
    try {
      await fetch('/api/logout', { method: 'POST', headers: { 'Content-Type': 'application/json' } });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setload(false);
      window.location.reload();
    }
  };

  const handleNavItemClick = (href) => {
    startTransition(() => router.push(href));
  };

  const activeIndex = useMemo(() => {
    const activeItem = orderedItems.find(item => pathname.startsWith(item.href) && item.href !== '/' && item.href !== '/search') ||
      (pathname === '/' && orderedItems.find(item => item.href === '/'));
    return activeItem ? orderedItems.findIndex(i => i.href === activeItem.href) : -1;
  }, [pathname, orderedItems]);

  const menuItems = (
    <div className="list-none m-0 w-[180px] rounded-xl bg-[var(--bg-secondary)] shadow-[var(--boxshaw2)] mb-2">
      <div className="p-2 gap-0.5 flex flex-col">
        <Link href={'/setting'} className="rounded-lg transition-all duration-300 cursor-pointer px-3 py-3 flex gap-2 items-center text-xs font-normal hover:bg-[var(--hover)] text-[var(--text-primary)]">
          <Svg_Setting w={16} h={16} c={'var(--text-secondary)'} />Cài đặt
        </Link>
        <p className="rounded-lg transition-all duration-300 cursor-pointer px-3 py-3 flex gap-2 items-center text-xs font-normal hover:bg-[var(--hover)] text-[var(--text-primary)]" onClick={() => setActiveMenu(2)}>
          <Svg_Mode w={16} h={16} c={'var(--text-secondary)'} />Giao diện
        </p>
      </div>
      <div className="p-2 border-t border-[var(--border-color)]" onClick={logout}>
        <p className="rounded-lg transition-all duration-300 cursor-pointer px-3 py-3 flex gap-2 items-center text-xs font-normal bg-[rgb(230,130,130)] text-white hover:bg-[rgb(233,146,146)]">
          <Svg_Logout w={16} h={16} c={'white'} />Đăng xuất
        </p>
      </div>
    </div>
  );

  const menuMode = (
    <div className="list-none m-0 w-[210px] rounded-xl bg-[var(--bg-secondary)] shadow-[var(--boxshaw2)] mb-2">
      <div className="p-2 border-b border-[var(--border-color)] flex items-center justify-start gap-2">
        <div onClick={() => setActiveMenu(1)}>
          <WrapIcon icon={<Svg_Left w={12} h={12} c={'var(--text-secondary)'} />} w={'32px'} />
        </div>
        <h5>Chế độ giao diện</h5>
        <Svg_Mode w={16} h={16} c={'var(--text-secondary)'} />
      </div>
      <div className="p-2">
        <div className="rounded-lg transition-all duration-300 cursor-pointer px-3 py-3 flex gap-2 items-center text-xs font-normal hover:bg-[var(--hover)] text-[var(--text-primary)] flex items-center justify-between" onClick={toggleTheme}>
          <div className="flex items-center">
            <Svg_Dark w={18} h={18} c={'var(--text-secondary)'} />
            <h6 className="flex-1 ml-2">Giao diện Tối</h6>
          </div>
          <Switch checked={isDark} size="small" activeColor="#ffffff" inactiveColor="#ddd" />
        </div>
      </div>
    </div>
  );

  const isActive = (href) => {
    if (href === '/') return pathname === '/';
    if (href === '/search') return false;
    return pathname.startsWith(href);
  };

  return (
    <>
      <div className={`flex flex-col h-full ${collapsed ? 'items-center' : ''}`} style={{ justifyContent: 'space-between' }}>
        <div className="w-full">
          <div className={`flex items-center ${collapsed ? 'flex-col justify-center h-auto py-2' : 'justify-between h-16 border-b border-[var(--border-color)] px-3'}`}>
            {collapsed ? (
              <div className="flex flex-col items-center gap-2">
                <span className="text-lg font-bold text-[var(--main_d)]">AI</span>
                <NotificationBell collapsed={true} />
              </div>
            ) : (
              <>
                <p className="text-xl font-semibold text-[var(--text-primary)]">
                  <span style={{ color: 'var(--main_d)' }}> AI</span><span>R</span>
                </p>
                <NotificationBell collapsed={false} />
              </>
            )}
          </div>

          <div className={`flex flex-col ${collapsed ? 'items-center gap-1 px-1.5 mt-3' : 'gap-0.5 px-2 mt-2'}`} ref={navContainerRef}>
            {hasBackup && !collapsed && (
              <div className="flex items-center justify-between px-2 py-1.5 mb-1 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium text-blue-700 truncate">🔀 {backupUser.name || 'User'}</p>
                  <p className="text-[9px] text-blue-500">{backupUser.role?.join(', ')}</p>
                </div>
                <button
                  onClick={handleSwitchBack}
                  className="shrink-0 ml-1 px-2 py-0.5 text-[10px] font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors"
                >
                  ←
                </button>
              </div>
            )}
            {hasBackup && collapsed && (
              <div className="relative group w-full flex justify-center">
                <button
                  onClick={handleSwitchBack}
                  className="h-11 w-11 flex items-center justify-center rounded-lg bg-blue-50 border border-blue-200 text-blue-600 hover:bg-blue-100 transition-colors"
                  title={`Quay lại (${backupUser.name || ''})`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" height={18} width={18} fill="currentColor">
                    <path d="M48.5 224L40 224c-13.3 0-24-10.7-24-24L16 72c0-9.7 5.8-18.5 14.8-22.2s19.3-1.7 26.2 5.2L98.6 96.6c87.6-86.5 228.7-86.2 315.8 1c87.5 87.5 87.5 229.3 0 316.8s-229.3 87.5-316.8 0c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0c62.5 62.5 163.8 62.5 226.3 0s62.5-163.8 0-226.3c-62.2-62.2-162.7-62.5-225.3-1L185 183c6.9 6.9 8.9 17.2 5.2 26.2s-12.5 14.8-22.2 14.8L48.5 224z" />
                  </svg>
                </button>
                <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg pointer-events-none">
                  Quay lại ({backupUser.name || ''})
                </div>
              </div>
            )}
            {orderedItems.map(({ href, icon, content, children }) => {
              const hasChildren = children && children.length > 0
              const anyActive = hasChildren ? children.some(c => pathname === c.href) : isActive(href)
              const isExpanded = expandedParents[href]
              return (
                <div key={href} className="relative group w-full">
                  <div
                    className={`flex items-center rounded-lg cursor-pointer transition-all duration-200 hover:bg-[var(--hover)]
                      ${collapsed ? 'h-11 justify-center' : 'h-10 gap-3 px-3'}
                      ${anyActive ? 'bg-[var(--border-color)]' : ''}`}
                    onClick={() => handleNavItemClick(href)}
                  >
                    <div className="shrink-0">{icon}</div>
                    {!collapsed && (
                      <span className="text-sm font-medium text-[var(--text-primary)] truncate flex-1">{content}</span>
                    )}
                    {hasChildren && !collapsed && (
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleParent(href); }}
                        className="shrink-0 p-1 rounded hover:bg-[var(--hover)] transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512" height={10} width={10} fill={'var(--text-secondary)'} style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform .2s' }}>
                          <path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/>
                        </svg>
                      </button>
                    )}
                  </div>
                  {hasChildren && !collapsed && isExpanded && (
                    <div className="flex flex-col gap-1 mt-1 mb-1 px-3">
                      {children.map(child => {
                        const active = pathname === child.href
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={`block px-3 py-2 text-sm rounded-lg transition-colors ${active ? 'bg-[var(--border-color)] font-medium' : 'text-[var(--text-primary)] hover:bg-[var(--hover)]'}`}
                          >
                            {child.content}
                          </Link>
                        )
                      })}
                    </div>
                  )}
                  {collapsed && !hasChildren && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg pointer-events-none">
                      {content}
                    </div>
                  )}
                  {collapsed && hasChildren && (
                    <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md bg-gray-900 text-white text-xs opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg pointer-events-auto">
                      <p className="text-xs font-medium text-gray-300 mb-1 px-1">{content}</p>
                      <div className="flex flex-col">
                        {children.map(c => (
                          <Link key={c.href} href={c.href} className="px-2.5 py-1.5 rounded text-xs text-white hover:bg-white/10 whitespace-nowrap">
                            {c.content}
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <div className={`flex flex-col w-full ${collapsed ? 'items-center gap-1 px-1.5 pb-3' : 'gap-0.5 px-2 pb-3'}`}>
          <div className="relative group w-full">
            <div
              className={`flex items-center rounded-lg cursor-pointer transition-all duration-200 hover:bg-[var(--hover)]
                ${collapsed ? 'h-11 justify-center' : 'h-10 gap-3 px-3'}`}
              onClick={toggleCollapse}
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 512" height={16} width={16} fill={'var(--text-secondary)'} style={{ transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .3s' }}>
                <path d="M137.4 406.6l-128-128c-12.5-12.5-12.5-32.8 0-45.3l128-128c9.2-9.2 22.9-11.9 34.9-6.9s19.8 16.6 19.8 29.6l0 256c0 12.9-7.8 24.6-19.8 29.6s-25.7 2.2-34.9-6.9z" />
              </svg>
              {!collapsed && <span className="text-sm font-medium text-[var(--text-secondary)]">Thu gọn</span>}
            </div>
            {collapsed && (
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg pointer-events-none">
                Mở rộng
              </div>
            )}
          </div>

          <div className="relative group w-full">
            <Menu
              isOpen={isMenuOpen}
              menuItems={activeMenu === 1 ? menuItems : menuMode}
              menuPosition={collapsed ? 'right' : 'top'}
              customButton={
                <div className={`flex items-center rounded-lg cursor-pointer transition-all duration-200 hover:bg-[var(--hover)] w-full
                  ${collapsed ? 'h-11 justify-center' : 'h-10 gap-3 px-3'}`}
                >
                  <Svg_Menu w={20} h={20} c={'var(--text-primary)'} />
                  {!collapsed && <span className="text-sm font-medium text-[var(--text-primary)]">Menu</span>}
                </div>
              }
              style="display: flex"
              onOpenChange={(isOpen) => {
                setIsMenuOpen(isOpen);
                if (!isOpen) setActiveMenu(1);
              }}
            />
            {collapsed && (
              <div className="absolute left-full ml-2 top-1/2 -translate-y-1/2 px-2.5 py-1.5 rounded-md bg-gray-900 text-white text-xs whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 shadow-lg pointer-events-none pointer-events-none">
                Menu
              </div>
            )}
          </div>
        </div>
      </div>
      {load && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90">
          <Loading content={<p className="text-sm font-normal text-white">Đang đăng xuất...</p>} />
        </div>
      )}
    </>
  );
}
