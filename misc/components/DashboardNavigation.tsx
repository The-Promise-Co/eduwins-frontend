'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User } from '@/misc/types';

interface NavItem {
  label: string;
  href: string;
  role?: string;
  premiumOnly?: boolean;
}

interface DashboardNavigationProps {
  user: (User & { is_premium?: boolean }) | null;
}

export default function DashboardNavigation({ user }: DashboardNavigationProps) {
  const pathname = usePathname();

  const navItems: NavItem[] = [
    { label: 'Dashboard', href: '/app/dashboard' },
    { label: 'Edit Profile', href: '/app/profile' },
    { label: 'Premium', href: '/app/premium-subscription', role: 'teacher' },
    { label: 'Welfare Fund', href: '/app/welfare-fund', role: 'teacher' },
    { label: 'View Schedule', href: '/app/schedule' },
    { label: 'Earnings', href: '/app/earnings' },
    { label: 'Settings', href: '/app/profile/security' },
  ];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex gap-0 overflow-x-auto">
          {navItems.map((item) => {
            if (item.role && user?.role !== item.role) return null;
            if (item.premiumOnly && !user?.is_premium) return null;

            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-6 py-4 font-semibold whitespace-nowrap transition border-b-2 ${isActive
                  ? 'border-[#001A72] text-[#001A72]'
                  : 'border-transparent text-gray-600 hover:text-[#001A72]'
                  }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
