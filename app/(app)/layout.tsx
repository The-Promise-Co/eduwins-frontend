'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../services/api';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');

      if (!token || !userJson) {
        router.replace('/login');
        return;
      }

      try {
        const meRes = await api.get('/auth/me');
        localStorage.setItem('user', JSON.stringify(meRes.data));
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Authentication check failed:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.replace('/login');
      }
    };

    checkAuth();
  }, [router]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
