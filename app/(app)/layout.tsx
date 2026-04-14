'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api from '@/services/api';
import AppSidebar from '@/components/AppSidebar';
import AppHeader from '@/components/AppHeader';
import { TeacherProfile } from '@/types';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Home',
  '/profile-edit': 'Edit Profile',
  '/profile-builder': '🎯 Profile Builder',
  '/premium-subscription': '💎 Premium',
  '/premium-content': '📺 My Content',
  '/welfare-fund': '🤝 Welfare Fund',
  '/schedule': 'View Schedule',
  '/earnings': 'Earnings',
  '/progress': 'Progress Report',
  '/dashboard-settings': 'Settings',
  '/search': 'Search Teachers',
  '/vault': 'Digital Vault',
  '/vault/create': 'Create Vault Item',
  '/chat': 'Chat',
  '/ambassador': 'Ambassador Programme',
  '/withdrawals': 'Withdrawals',
  '/progress-reports': 'Progress Reports',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<TeacherProfile | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const pageTitle = PAGE_TITLES[pathname] ?? 'Dashboard';

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');

      if (!token || !userJson) {
        router.replace('/login');
        return;
      }

      // Render immediately from cache
      setUser(JSON.parse(userJson));
      setIsAuthenticated(true);

      try {
        const meRes = await api.get('/auth/me');
        const freshUser = meRes.data;
        localStorage.setItem('user', JSON.stringify(freshUser));
        setUser(freshUser);
      } catch (err) {
        console.error('Auth refresh failed:', err);
      }
    };

    checkAuth();
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#001A72]">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl bg-[#FFB81C] flex items-center justify-center font-black text-[#001A72] text-lg mx-auto mb-4 animate-pulse">
            EW
          </div>
          <p className="text-white/60 text-sm">Verifying access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-primary md:py-2 md:pr-2">
      <AppSidebar
        user={user}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden m-2 rounded-2xl bg-[#F4F5F7] md:rounded-[1.4rem]">
        <AppHeader user={user} title={pageTitle} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
