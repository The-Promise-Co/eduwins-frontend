'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import api from '@/misc/services/api';

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasStoredAuth, setHasStoredAuth] = useState(false);
  const meQuery = useQuery({
    queryKey: ['auth', 'me', 'protected-route'],
    queryFn: async () => {
      const response = await api.get('/auth/me');
      return response.data;
    },
    enabled: hasStoredAuth,
    retry: false,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userJson = localStorage.getItem('user');

    if (!token || !userJson) {
      router.replace('/login');
      return;
    }

    setHasStoredAuth(true);
  }, [router]);

  useEffect(() => {
    if (meQuery.data) {
      localStorage.setItem('user', JSON.stringify(meQuery.data));
      setIsAuthenticated(true);
    }
  }, [meQuery.data]);

  useEffect(() => {
    if (meQuery.isError) {
      console.error('Authentication check failed:', meQuery.error);
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      router.replace('/login');
    }
  }, [meQuery.error, meQuery.isError, router]);

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
