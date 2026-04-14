'use client';

import { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import DashboardNavigation from '../../components/DashboardNavigation';
import { User } from '@/types';

interface UpcomingSession {
  id: number;
  title: string;
  subject: string;
  time: string;
  duration: string;
  student: string;
}

export default function ViewSchedulePage(): ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const init = async () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('user');

        if (!token || !userJson) {
          router.push('/login');
          return;
        }

        try {
          const userData = JSON.parse(userJson);
          setUser(userData);
        } catch (err) {
          console.error('Error parsing user data:', err);
          router.push('/login');
        } finally {
          setLoading(false);
        }
      }
    };

    init();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600 font-black">Organizing your timetable...</p>
        </div>
      </div>
    );
  }

  const upcomingSessions: UpcomingSession[] = [
    { id: 1, title: 'Session 1', subject: 'Advanced Calculus', time: 'Tomorrow at 3:00 PM', duration: '1 hour', student: 'Sarah Adams' },
    { id: 2, title: 'Session 2', subject: 'English Literature', time: 'Thursday at 10:00 AM', duration: '1.5 hours', student: 'Mike Ross' },
    { id: 3, title: 'Session 3', subject: 'Organic Chemistry', time: 'Friday at 4:30 PM', duration: '1 hour', student: 'Jessica Pearson' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation user={user} />
      <div className="py-12 px-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-black text-[#001A72] mb-1 flex items-center gap-3">
              <span>📅</span> Lesson Schedule
            </h1>
            <p className="text-gray-500 font-medium">Manage your teaching block and upcoming sessions</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Sessions List */}
            <div className="lg:col-span-2 space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-black text-[#001A72]">Upcoming Sessions</h2>
                <span className="bg-[#001A72]/5 text-[#001A72] text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Next 7 Days</span>
              </div>

              {upcomingSessions.map((session) => (
                <div key={session.id} className="group bg-white rounded-3xl shadow-xl p-6 border border-gray-50 hover:border-[#FFB81C] transition duration-300 flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-2xl flex flex-col items-center justify-center text-[#001A72] group-hover:bg-[#FFB81C]/5 transition">
                    <span className="text-[10px] font-black uppercase mb-0.5">Mar</span>
                    <span className="text-2xl font-black">2{session.id + 5}</span>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <p className="text-[10px] font-black text-[#FFB81C] uppercase tracking-widest">{session.subject}</p>
                    <h3 className="text-xl font-black text-[#001A72] mt-0.5">{session.title}</h3>
                    <p className="text-sm font-bold text-gray-400 mt-1 flex items-center justify-center md:justify-start gap-2">
                      <span>🕒</span> {session.time} • {session.duration}
                    </p>
                    <p className="text-xs font-black text-blue-600 mt-2">Student: {session.student}</p>
                  </div>

                  <div className="flex gap-2">
                    <button className="px-6 py-3 bg-[#001A72] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:shadow-lg transition">Join Class</button>
                    <button className="p-3 bg-gray-50 text-gray-400 rounded-xl hover:text-[#001A72] transition">⚙️</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Sidebar Calendar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-[2.5rem] shadow-2xl p-8 border border-gray-100">
                <h3 className="text-xl font-black text-[#001A72] mb-6 flex items-center gap-2">
                  <span>✨</span> Smart Calendar
                </h3>
                <div className="bg-gray-50 rounded-2xl p-10 flex flex-col items-center justify-center border-2 border-dashed border-gray-100 italic text-gray-400 text-center">
                  <div className="text-5xl mb-4 opacity-20">🗓️</div>
                  <p className="text-sm font-bold">Interactive calendar integration is currently under development.</p>
                  <p className="text-[10px] mt-2 font-medium opacity-50">Syncing with Google & Outlook Calendar coming soon.</p>
                </div>

                <div className="mt-10 space-y-4">
                  <h4 className="text-[10px] font-black text-[#001A72] uppercase tracking-widest opacity-40">Teacher Availability</h4>
                  <div className="flex flex-wrap gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                      <div key={day} className="px-3 py-1 bg-green-50 text-green-600 rounded-lg text-xs font-black uppercase">{day}</div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
