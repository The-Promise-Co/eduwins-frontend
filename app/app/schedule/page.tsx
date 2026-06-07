'use client';

import { ReactElement } from 'react';
import { Calendar, Clock, BookOpen, Video, ChevronRight } from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';

const UPCOMING_SESSIONS = [
  {
    id: 1,
    subject: 'Mathematics',
    student: 'John Doe',
    date: 'Tomorrow',
    time: '3:00 PM',
    duration: '1 hour',
    status: 'confirmed',
  },
  {
    id: 2,
    subject: 'English Language',
    student: 'Jane Smith',
    date: 'Wed, May 14',
    time: '10:00 AM',
    duration: '1.5 hours',
    status: 'confirmed',
  },
  {
    id: 3,
    subject: 'Physics',
    student: 'Mike Johnson',
    date: 'Thu, May 15',
    time: '2:00 PM',
    duration: '1 hour',
    status: 'pending',
  },
];

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DATES = [5, 6, 7, 8, 9, 10, 11];
const BOOKED_DATES = [7, 9];
const TODAY = 10;

export default function SchedulePage(): ReactElement {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Schedule"
        subtitle="Manage your lessons and upcoming sessions"
      />

      {/* Week Strip */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-black text-gray-400 uppercase tracking-widest">May 2026</p>
          <div className="flex gap-1">
            <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition text-xs">‹</button>
            <button className="w-7 h-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition text-xs">›</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map((day, i) => {
            const date = DATES[i];
            const isToday = date === TODAY;
            const hasSession = BOOKED_DATES.includes(date);
            return (
              <div
                key={day}
                className={`flex flex-col items-center py-2.5 px-1 rounded-xl cursor-pointer transition ${isToday
                    ? 'bg-[#001A72] text-white'
                    : 'hover:bg-gray-50 text-gray-600'
                  }`}
              >
                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isToday ? 'text-white/60' : 'text-gray-400'}`}>
                  {day}
                </span>
                <span className={`text-sm font-black ${isToday ? 'text-white' : 'text-gray-800'}`}>
                  {date}
                </span>
                {hasSession && (
                  <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isToday ? 'bg-[#FFB81C]' : 'bg-[#001A72]'}`} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Upcoming Sessions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
            Upcoming Sessions
          </h2>
          <span className="text-[10px] font-bold text-[#001A72] bg-[#001A72]/5 px-2 py-1 rounded-full">
            {UPCOMING_SESSIONS.length} sessions
          </span>
        </div>
        <div className="divide-y divide-gray-50">
          {UPCOMING_SESSIONS.map((session) => (
            <div key={session.id} className="px-6 py-4 hover:bg-gray-50/50 transition-colors flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#001A72]/5 flex items-center justify-center shrink-0">
                <BookOpen size={18} className="text-[#001A72]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900">{session.subject}</p>
                <p className="text-xs text-gray-400 mt-0.5">{session.student}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Calendar size={10} /> {session.date}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                    <Clock size={10} /> {session.time}
                  </span>
                  <span className="flex items-center gap-1 text-[10px] text-gray-500">
                    {session.duration}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${session.status === 'confirmed'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                  {session.status}
                </span>
                <button className="flex items-center gap-1.5 bg-[#001A72] text-white text-xs font-bold px-4 py-2 rounded-xl hover:bg-[#001A72]/90 transition">
                  <Video size={12} /> Join
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Calendar placeholder */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4 flex items-center gap-2">
          <Calendar size={14} className="text-[#001A72]" /> Full Calendar
        </h2>
        <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/60 flex flex-col items-center justify-center py-16 text-center">
          <Calendar size={36} className="text-gray-300 mb-3" />
          <p className="text-sm font-bold text-gray-400">Calendar integration coming soon</p>
          <p className="text-xs text-gray-400 mt-1">Your sessions will appear here in a full monthly view</p>
        </div>
      </div>
    </div>
  );
}
