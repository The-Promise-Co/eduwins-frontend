'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/misc/context/UserContext';
import AppSidebar from '@/misc/components/AppSidebar';
import AppHeader from '@/misc/components/AppHeader';

const PAGE_TITLES: Record<string, string> = {
  '/app/dashboard': 'Home',
  '/app/profile': 'Profile',
  '/app/profile/teaching': 'Teaching',
  '/app/profile/certifications': 'Certifications',
  '/app/profile/education': 'Education',
  '/app/premium-subscription': 'Premium',
  '/app/premium-content': 'My Content',
  '/app/welfare-fund': 'Welfare Fund',
  '/app/schedule': 'Schedule',
  '/app/booking-requests': 'Booking Requests',
  '/app/earnings': 'Earnings',
  '/app/progress': 'Progress Report',
  '/app/profile/notifications': 'Notifications',
  '/app/profile/security': 'Security & Settings',
  '/app/search': 'Search Teachers',
  '/app/vault': 'Digital Vault',
  '/app/vault/create': 'Create Vault Item',
  '/app/chat': 'Chat',
  '/app/ambassador': 'Ambassador Programme',
  '/app/withdrawals': 'Withdrawals',
  '/app/progress-reports': 'Progress Reports',
  '/app/courses': 'Courses',
  '/app/courses/create': 'Create Course',
  '/app/referrals': 'Referrals',
  '/app/assessments': 'Assessments',
  '/app/children': 'My Children',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, loading } = useUser();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getPageTitle = (path: string): string => {
    if (PAGE_TITLES[path]) return PAGE_TITLES[path];
    if (path.startsWith('/app/courses/create')) return 'Create Course';
    if (path.match(/^\/app\/courses\/[^/]+\/edit/)) return 'Edit Course';
    if (path.match(/^\/app\/courses\/[^/]+\/learn/)) return 'Course Player';
    if (path.match(/^\/app\/courses\/[^/]+/)) return 'Course Details';
    if (path.match(/^\/app\/vault\/[^/]+/)) return 'Vault Item';
    if (path.match(/^\/app\/children\/[^/]+/)) return 'Child Profile';
    return 'Dashboard';
  };

  const pageTitle = getPageTitle(pathname);


  // Close mobile menu on path change for responsive view
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  if (loading || !isAuthenticated) {
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
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        isMobileOpen={isMobileMenuOpen}
        onCloseMobile={() => setIsMobileMenuOpen(false)}
      />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden m-0 md:m-2 rounded-none md:rounded-[1.4rem] bg-[#F4F5F7]">
        <AppHeader
          title={pageTitle}
          onToggleMobileMenu={() => setIsMobileMenuOpen(true)}
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
