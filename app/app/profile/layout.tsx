'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useUser } from '@/misc/context/UserContext';
import { User, Shield, Bell, BookOpen, Award, GraduationCap, CheckCircle2, Clock, Video } from 'lucide-react';
import { useProfileCompletion } from '@/misc/hooks/api/uploads';
import { PROFILE_COMPLETION_STEPS, getNextProfileStep } from '@/misc/utils/profileCompletion';

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const completionQuery = useProfileCompletion();
  const completion = completionQuery.data || null;
  const nextStep = getNextProfileStep(completion);

  const tabs = [
    { label: 'Profile Details', href: '/app/profile', icon: User },
    ...(user?.role === 'teacher' ? [{ label: 'Teaching', href: '/app/profile/teaching', icon: BookOpen }] : []),
    ...(user?.role === 'teacher' ? [{ label: 'Video', href: '/app/profile/video', icon: Video }] : []),
    ...(user?.role === 'teacher' ? [{ label: 'Certifications', href: '/app/profile/certifications', icon: Award }] : []),
    ...(user?.role === 'teacher' ? [{ label: 'Education', href: '/app/profile/education', icon: GraduationCap }] : []),
    { label: 'Notifications', href: '/app/profile/notifications', icon: Bell },
    { label: 'Security & Account', href: '/app/profile/security', icon: Shield },
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
          {user?.role === 'teacher' && completion && (
            <div className="mt-4 rounded-2xl border border-[#001A72]/10 bg-[#001A72]/5 p-4">
              <div className="flex items-center justify-between text-xs font-black text-[#001A72]">
                <span>Profile completion</span>
                <span>{Math.round(completion.completionPercentage)}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-[#FFB81C]" style={{ width: `${completion.completionPercentage}%` }} />
              </div>
              <div className="mt-3 space-y-1.5">
                {PROFILE_COMPLETION_STEPS.map((step) => {
                  const done = Boolean((completion.completion as any)?.[step.key]);
                  return (
                    <div key={step.key} className="flex items-center gap-2 text-[10px] font-bold text-[#001A72]/70">
                      {done ? <CheckCircle2 size={11} className="text-emerald-500" /> : <Clock size={11} className="text-amber-500" />}
                      <span>{step.label}</span>
                    </div>
                  );
                })}
              </div>
              {nextStep && (
                <Link href={nextStep.href} className="mt-3 block rounded-xl bg-[#001A72] px-3 py-2 text-center text-[10px] font-black uppercase tracking-wider text-white">
                  Update {nextStep.label}
                </Link>
              )}
            </div>
          )}
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
