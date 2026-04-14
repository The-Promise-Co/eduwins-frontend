'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { TeacherProfile } from '@/types';

interface AppSidebarProps {
  user: TeacherProfile | null;
  collapsed: boolean;
  onToggle: () => void;
}

export default function AppSidebar({ user, collapsed, onToggle }: AppSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: '🏠' },
    { label: 'Edit Profile', href: '/profile-edit', icon: '✏️' },
    ...(user?.role === 'teacher'
      ? [
          { label: '🎯 Profile Builder', href: '/profile-builder', icon: '' },
          { label: '💎 Premium', href: '/premium-subscription', icon: '' },
          ...(user?.is_premium ? [{ label: '📺 My Content', href: '/premium-content', icon: '' }] : []),
          { label: '🤝 Welfare Fund', href: '/welfare-fund', icon: '' },
        ]
      : []),
    { label: 'View Schedule', href: '/schedule', icon: '📅' },
    { label: 'Earnings', href: '/earnings', icon: '💰' },
    { label: 'Report', href: '/progress', icon: '📊' },
    { label: 'Settings', href: '/dashboard-settings', icon: '⚙️' },
  ];

  const otherItems = [
    { label: 'Search Teachers', href: '/search', icon: '🔍' },
    { label: 'Digital Vault', href: '/vault', icon: '📦' },
    { label: 'Chat', href: '/chat', icon: '💬' },
    { label: 'Ambassador', href: '/ambassador', icon: '🎖️' },
  ];

  return (
    <aside
      className="flex flex-col h-screen bg-[#001A72] text-white shrink-0 transition-all duration-300 relative"
      style={{ width: collapsed ? '72px' : '240px' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <div className="w-9 h-9 rounded-lg bg-[#FFB81C] flex items-center justify-center font-black text-[#001A72] text-sm shrink-0">
          EW
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-black text-sm text-white leading-tight">EduWins</p>
            <p className="text-[10px] text-white/50 leading-tight">by Promise Co.</p>
          </div>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute top-16 -right-3 w-6 h-6 bg-[#001A72] border-2 border-white/20 rounded-full flex items-center justify-center text-white text-xs hover:bg-[#FFB81C] hover:text-[#001A72] transition z-50"
      >
        {collapsed ? '›' : '‹'}
      </button>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const icon = item.icon || item.label.split(' ')[0];
          const label = item.icon ? item.label : item.label;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-white/15 text-white border-r-2 border-[#FFB81C]'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-base shrink-0 w-5 text-center">{item.icon || '•'}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}

        {/* Others section */}
        {!collapsed && (
          <p className="px-4 pt-4 pb-1 text-[9px] font-black tracking-widest text-white/30 uppercase">
            Others
          </p>
        )}
        {otherItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-all ${
                active
                  ? 'bg-white/15 text-white border-r-2 border-[#FFB81C]'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`}
            >
              <span className="text-base shrink-0 w-5 text-center">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User footer */}
      {!collapsed && user && (
        <div className="border-t border-white/10 px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FFB81C] flex items-center justify-center font-bold text-[#001A72] text-xs shrink-0">
            {(user.fullName || user.full_name || 'U').charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-xs font-bold text-white truncate">{user.fullName || user.full_name}</p>
            <p className="text-[10px] text-white/40 truncate capitalize">{user.role}</p>
          </div>
        </div>
      )}
    </aside>
  );
}
