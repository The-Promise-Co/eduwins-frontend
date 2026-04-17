'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { TeacherProfile } from '@/types';
import {
  Home,
  UserCog,
  Target,
  Gem,
  Tv,
  Handshake,
  Calendar,
  Wallet,
  BarChart3,
  Settings,
  Search,
  Box,
  MessageSquare,
  Award,
  ChevronLeft,
  ChevronRight,
  ChevronRightCircle,
  LucideIcon,
  X
} from 'lucide-react';

interface AppSidebarProps {
  user: TeacherProfile | null;
  collapsed: boolean;
  onToggle: () => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export default function AppSidebar({ user, collapsed, onToggle, isMobileOpen, onCloseMobile }: AppSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Edit Profile', href: '/profile-edit', icon: UserCog },
    ...(user?.role === 'teacher'
      ? [
          { label: '🎯 Profile Builder', href: '/profile-builder', icon: Target },
          { label: '💎 Premium', href: '/premium-subscription', icon: Gem },
          ...(user?.is_premium ? [{ label: '📺 My Content', href: '/premium-content', icon: Tv }] : []),
          { label: '🤝 Welfare Fund', href: '/welfare-fund', icon: Handshake },
        ]
      : []),
    { label: 'View Schedule', href: '/schedule', icon: Calendar },
    { label: 'Earnings', href: '/earnings', icon: Wallet },
    { label: 'Report', href: '/progress', icon: BarChart3 },
    { label: 'Settings', href: '/dashboard-settings', icon: Settings },
  ];

  const otherItems = [
    { label: 'Search Teachers', href: '/search', icon: Search },
    { label: 'Digital Vault', href: '/vault', icon: Box },
    { label: 'Chat', href: '/chat', icon: MessageSquare },
    { label: 'Ambassador', href: '/ambassador', icon: Award },
  ];

  const SidebarContent = ({ isMobile = false }) => (
    <div className={`flex flex-col h-full ${isMobile ? 'bg-[#000820]' : 'bg-[#001A72]'} text-white relative`}>
      {/* Mobile Header */}
      {isMobile ? (
        <div className="flex items-center justify-between px-6 py-6 border-b border-white/5">
          <h2 className="text-2xl font-bold">Menu</h2>
          <button 
            onClick={onCloseMobile}
            className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-xs hover:bg-white/20 transition"
          >
            Close
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10 overflow-hidden">
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <img src="/logo-white.png" alt="EduWins" className={collapsed ? "h-6 w-auto mx-auto" : "h-7 w-auto"} />
          </Link>
        </div>
      )}

      {/* Desktop Collapse toggle */}
      {!isMobile && (
        <button
          onClick={onToggle}
          className="absolute top-16 -right-3 w-6 h-6 bg-[#001A72] border-2 border-white/20 rounded-full flex items-center justify-center text-white text-xs hover:bg-[#FFB81C] hover:text-[#001A72] transition z-50"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      )}

      {/* Nav */}
      <nav className={`flex-1 overflow-y-auto ${isMobile ? 'py-6 px-4' : 'py-3'} space-y-1`}>
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon as LucideIcon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={(!isMobile && collapsed) ? item.label : undefined}
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition-all ${
                active
                  ? (isMobile ? 'bg-white/10 text-white shadow-xl' : 'bg-white/15 text-white border-r-2 border-[#FFB81C]')
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="shrink-0 w-6 flex justify-center">
                  <Icon size={20} className={active ? 'text-[#FFB81C]' : 'text-white/70'} />
                </span>
                {(!collapsed || isMobile) && <span className="font-medium">{item.label}</span>}
              </div>
              {isMobile && <ChevronRight size={16} className="text-white/30" />}
            </Link>
          );
        })}

        {/* Others section */}
        {(!collapsed || isMobile) && (
          <p className="px-4 pt-6 pb-2 text-[10px] font-black tracking-[0.2em] text-white/30 uppercase">
            Others
          </p>
        )}
        {otherItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon as LucideIcon;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={(!isMobile && collapsed) ? item.label : undefined}
              className={`flex items-center justify-between gap-3 px-4 py-3 rounded-2xl transition-all ${
                active
                  ? (isMobile ? 'bg-white/10 text-white shadow-xl' : 'bg-white/15 text-white border-r-2 border-[#FFB81C]')
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="shrink-0 w-6 flex justify-center">
                  <Icon size={20} className={active ? 'text-[#FFB81C]' : 'text-white/70'} />
                </span>
                {(!collapsed || isMobile) && <span className="font-medium">{item.label}</span>}
              </div>
              {isMobile && <ChevronRight size={16} className="text-white/30" />}
            </Link>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Overlay Sidebar */}
      <div 
        className={`fixed inset-0 z-[100] md:hidden transition-all duration-300 ${
          isMobileOpen ? 'visible' : 'invisible'
        }`}
      >
        {/* Backdrop */}
        <div 
          className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
            isMobileOpen ? 'opacity-100' : 'opacity-0'
          }`}
          onClick={onCloseMobile}
        />
        
        {/* Menu Panel */}
        <div 
          className={`absolute inset-x-0 bottom-0 top-12 bg-[#000820] rounded-t-[2.5rem] shadow-2xl transition-transform duration-500 transform ${
            isMobileOpen ? 'translate-y-0' : 'translate-y-full'
          } overflow-hidden`}
        >
          <SidebarContent isMobile={true} />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <aside
        className="hidden md:flex flex-col h-screen shrink-0 transition-all duration-300 z-30"
        style={{ width: collapsed ? '72px' : '240px' }}
      >
        <SidebarContent />
      </aside>
    </>
  );
}
