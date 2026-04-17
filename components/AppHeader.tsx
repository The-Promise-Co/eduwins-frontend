'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { TeacherProfile } from '@/types';
import { 
  Bell, 
  ChevronDown, 
  UserCog, 
  Calendar, 
  Wallet, 
  Settings, 
  LogOut 
} from 'lucide-react';

interface AppHeaderProps {
  user: TeacherProfile | null;
  title: string;
  onToggleMobileMenu: () => void;
}

export default function AppHeader({ user, title, onToggleMobileMenu }: AppHeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const initials = (user?.fullName || user?.full_name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <>
      {/* Mobile Header (Hidden on md and up) */}
      <header className="md:hidden h-16 bg-[#001A72] flex items-center justify-between px-6 shrink-0 z-40">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <button 
          onClick={onToggleMobileMenu}
          className="px-4 py-2 bg-white/10 text-white rounded-xl font-bold text-xs hover:bg-white/20 transition"
        >
          Menu
        </button>
      </header>

      {/* Desktop Header (Hidden on mobile) */}
      <header className="hidden md:flex h-14 bg-white border-b border-gray-100 items-center justify-between px-6 shrink-0">
        {/* Page title */}
        <h2 className="text-[15px] font-semibold text-gray-800">{title}</h2>

        {/* Right */}
        <div className="flex items-center gap-3">
          {/* Bell */}
          <button className="relative w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition">
            <Bell size={18} className="text-gray-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white" />
          </button>

          {/* User pill */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition"
            >
              <div className="w-7 h-7 rounded-full bg-[#001A72] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                {initials}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-semibold text-gray-800 leading-tight truncate max-w-[110px]">
                  {user?.fullName || user?.full_name || 'User'}
                </p>
                <p className="text-[10px] text-gray-400 leading-tight truncate max-w-[110px]">
                  {user?.email}
                </p>
              </div>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {dropdownOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-xs font-bold text-gray-800">{user?.fullName || user?.full_name}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5 capitalize">{user?.role} Account</p>
                  </div>
                  <div className="py-1">
                    <Link href="/profile-edit" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition">
                      <UserCog size={14} className="text-gray-400" /> Edit Profile
                    </Link>
                    <Link href="/schedule" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition">
                      <Calendar size={14} className="text-gray-400" /> My Schedule
                    </Link>
                    <Link href="/earnings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition">
                      <Wallet size={14} className="text-gray-400" /> Earnings
                    </Link>
                    <Link href="/dashboard-settings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition">
                      <Settings size={14} className="text-gray-400" /> Settings
                    </Link>
                  </div>
                  <div className="border-t border-gray-100 py-1">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition">
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
