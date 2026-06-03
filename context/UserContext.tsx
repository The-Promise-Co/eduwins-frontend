'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useApiQuery } from '@/hooks/useApi';
import { TeacherProfile } from '@/types';

interface UserContextType {
  user: TeacherProfile | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (userData: TeacherProfile, token: string) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [shouldFetchMe, setShouldFetchMe] = useState(false);
  const router = useRouter();
  const meQuery = useApiQuery<TeacherProfile>(
    ['auth', 'me'],
    shouldFetchMe ? '/auth/me' : null,
    { enabled: shouldFetchMe, retry: false }
  );

  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');

      if (token && userJson) {
        try {
          const parsedUser = JSON.parse(userJson);
          setUser(parsedUser);
          setIsAuthenticated(true);
          setShouldFetchMe(true);
        } catch (error) {
          console.error('Failed to initialize auth:', error);
          // If it's a 401, the api interceptor will handle redirect
          // But we should probably clear local state if we can't get 'me'
          if ((error as any).response?.status === 401) {
            logout();
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  useEffect(() => {
    if (meQuery.data) {
      setUser(meQuery.data);
      localStorage.setItem('user', JSON.stringify(meQuery.data));
    }
  }, [meQuery.data]);

  useEffect(() => {
    if ((meQuery.error as any)?.response?.status === 401) {
      logout();
    }
  }, [meQuery.error]);

  const login = (userData: TeacherProfile, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
    setShouldFetchMe(true);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setIsAuthenticated(false);
    setShouldFetchMe(false);
    router.push('/login');
  };

  const refreshUser = async () => {
    try {
      const result = await meQuery.refetch();
      if (result.data) {
        setUser(result.data);
        localStorage.setItem('user', JSON.stringify(result.data));
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        loading,
        isAuthenticated,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
