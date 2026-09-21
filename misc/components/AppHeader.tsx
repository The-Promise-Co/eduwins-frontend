'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useUser } from '@/misc/context/UserContext';
import {
  Bell,
  Check,
  ChevronDown,
  UserCog,
  Calendar,
  Wallet,
  Settings,
  LogOut,
  ClipboardList,
  Loader2
} from 'lucide-react';
import { useNotifications, useMarkAllNotificationsRead } from '@/misc/hooks/api/notifications';

interface AppHeaderProps {
  title: string;
  onToggleMobileMenu: () => void;
}

export default function AppHeader({ title, onToggleMobileMenu }: AppHeaderProps) {
  const { user, logout } = useUser();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notificationsQuery = useNotifications();
  const markAllRead = useMarkAllNotificationsRead();
  const unreadCount = notificationsQuery.data?.unreadCount || 0;
  const recentNotifications = (notificationsQuery.data?.notifications || []).slice(0, 5);

  const handleLogout = () => {
    logout();
  };

  const initials = (user?.fullName || user?.full_name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
  const avatarUrl = (user as any)?.photo || (user as any)?.photoUrl || user?.avatarUrl || '';

  const formatDate = (value?: string) => {
    if (!value) return '';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

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
          <div className="relative">
            <button
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition"
            >
              <Bell size={18} className="text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 border-2 border-white text-[10px] font-black text-white flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-100 z-20 overflow-hidden">
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <p className="text-xs font-black text-gray-900">Notifications</p>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllRead.mutate()}
                        disabled={markAllRead.isPending}
                        className="text-[10px] font-bold text-[#001A72] hover:underline disabled:opacity-60"
                      >
                        {markAllRead.isPending ? 'Marking...' : 'Mark all read'}
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notificationsQuery.isLoading ? (
                      <div className="py-8 flex items-center justify-center text-gray-400">
                        <Loader2 size={16} className="animate-spin mr-2" /> Loading...
                      </div>
                    ) : recentNotifications.length === 0 ? (
                      <div className="py-8 text-center">
                        <p className="text-xs font-bold text-gray-500">No notifications yet</p>
                      </div>
                    ) : (
                      recentNotifications.map((n) => (
                        <div key={n.id} className="px-4 py-3 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition">
                          <div className="flex items-start gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${n.read ? 'bg-gray-50 text-gray-400' : 'bg-amber-50 text-[#FFB81C]'}`}>
                              {n.read ? <Check size={14} /> : <Bell size={14} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-gray-900">{n.title || 'Notification'}</p>
                              <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                              {n.createdAt && (
                                <p className="text-[10px] text-gray-400 mt-1">{formatDate(n.createdAt)}</p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Link
                    href="/app/profile/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="block px-4 py-3 text-center text-xs font-black text-[#001A72] hover:bg-gray-50 transition border-t border-gray-100"
                  >
                    See all notifications
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* User pill */}
          <div className="relative">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Profile" className="w-7 h-7 rounded-full object-cover shrink-0 border border-gray-100" />
              ) : (
                <div className="w-7 h-7 rounded-full bg-[#001A72] flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                  {initials}
                </div>
              )}
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
                    <Link href="/app/profile" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition">
                      <UserCog size={14} className="text-gray-400" /> Edit Profile
                    </Link>
                    <Link href="/app/schedule" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition">
                      <Calendar size={14} className="text-gray-400" /> My Schedule
                    </Link>
                    <Link href="/app/booking-requests" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition">
                      <ClipboardList size={14} className="text-gray-400" /> Booking Requests
                    </Link>
                    <Link href="/app/earnings" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition">
                      <Wallet size={14} className="text-gray-400" /> Earnings
                    </Link>
                    <Link href="/app/profile/security" onClick={() => setDropdownOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-xs text-gray-700 hover:bg-gray-50 transition">
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
