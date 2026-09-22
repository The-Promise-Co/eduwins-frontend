'use client';

import { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';

interface SessionUiContextValue {
  inCall: boolean;
  setInCall: (value: boolean) => void;
  isFullscreen: boolean;
  setIsFullscreen: (value: boolean) => void;
  toggleFullscreen: () => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
}

const SessionUiContext = createContext<SessionUiContextValue | undefined>(undefined);

export function SessionUiProvider({ children }: { children: React.ReactNode }) {
  const [inCall, setInCall] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('eduwins_call_theme');
    if (saved === 'dark' || saved === 'light') {
      setThemeState(saved);
    }
  }, []);

  const setTheme = useCallback((newTheme: 'light' | 'dark') => {
    setThemeState(newTheme);
    localStorage.setItem('eduwins_call_theme', newTheme);
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next = prev === 'light' ? 'dark' : 'light';
      localStorage.setItem('eduwins_call_theme', next);
      return next;
    });
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, []);

  // When call ends, exit fullscreen automatically
  useEffect(() => {
    if (!inCall && isFullscreen) {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  }, [inCall, isFullscreen]);

  const isDarkMode = inCall && theme === 'dark';

  const value = useMemo(
    () => ({
      inCall,
      setInCall,
      isFullscreen,
      setIsFullscreen,
      toggleFullscreen,
      theme,
      setTheme,
      toggleTheme,
      isDarkMode,
    }),
    [inCall, isFullscreen, toggleFullscreen, theme, setTheme, toggleTheme, isDarkMode],
  );

  return <SessionUiContext.Provider value={value}>{children}</SessionUiContext.Provider>;
}

export function useSessionUi() {
  const context = useContext(SessionUiContext);
  if (!context) {
    return {
      inCall: false,
      setInCall: () => {},
      isFullscreen: false,
      setIsFullscreen: () => {},
      toggleFullscreen: () => {},
      theme: 'light' as const,
      setTheme: () => {},
      toggleTheme: () => {},
      isDarkMode: false,
    };
  }
  return context;
}
