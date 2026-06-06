'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { User, Shield, Bell } from 'lucide-react';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();

  const tabs = [
    { label: 'Profile Details', href: '/app/profile', icon: User },
    { label: 'Notifications', href: '/app/profile/notifications', icon: Bell },
    { label: 'Security & Account', href: '/app/profile/security', icon: Shield },
    // { label: 'Security & Account', href: '/app/profile/settings', icon: Shield },
    //this is a test
  ];


  return (
    <div className="flex flex-col md:flex-row gap-6 max-w-6xl mx-auto pb-12">
      {/* Sidebar / Top Nav Container */}
      <aside className="shrink-0 md:w-64">
        {/* Desktop Sidebar: Vertical Nav */}
        <div className="hidden md:flex flex-col gap-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm sticky top-6">
          <div className="px-3 py-2 mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Account settings</p>
          </div>
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const isActive = pathname === tab.href;
              const Icon = tab.icon;
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-200 select-none ${isActive
                    ? 'bg-[#001A72] text-white shadow-md shadow-[#001A72]/10 translate-x-1'
                    : 'text-gray-500 hover:text-[#001A72] hover:bg-gray-50'
                    }`}
                >
                  <Icon size={16} className={isActive ? 'text-[#FFB81C]' : 'text-gray-400'} />
                  {tab.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Mobile View: Horizontal Scrollable Tabs */}
        <div className="flex md:hidden gap-1.5 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm overflow-x-auto no-scrollbar scroll-smooth">
          {tabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 shrink-0 select-none ${isActive
                  ? 'bg-[#001A72] text-white shadow-md shadow-[#001A72]/10 scale-[1.02]'
                  : 'text-gray-400 hover:text-[#001A72] hover:bg-gray-50'
                  }`}
              >
                <Icon size={14} className={isActive ? 'text-[#FFB81C]' : 'text-gray-400'} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 min-w-0">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
