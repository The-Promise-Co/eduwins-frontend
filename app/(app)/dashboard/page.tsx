'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/services/api';
import { TeacherProfile, User, Booking } from '@/types';
import { 
  Search, 
  Calendar, 
  Box, 
  BarChart3, 
  Wallet, 
  Handshake, 
  Gem, 
  Award, 
  MessageSquare, 
  Settings,
  Lock,
  ChevronRight,
  LucideIcon
} from 'lucide-react';

interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  color: string;
  role?: string;
}

const FEATURE_CARDS: FeatureCard[] = [
  {
    icon: Search,
    title: 'Find a Teacher',
    description: 'Browse our verified network of expert tutors and book your first session today.',
    href: '/search',
    color: 'bg-blue-50 border-blue-100',
  },
  {
    icon: Calendar,
    title: 'My Schedule',
    description: 'View your upcoming lessons, manage bookings, and confirm completed sessions.',
    href: '/schedule',
    color: 'bg-amber-50 border-amber-100',
  },
  {
    icon: Box,
    title: 'Digital Vault',
    description: 'Buy and sell lesson notes, videos, and study materials from top educators.',
    href: '/vault',
    color: 'bg-purple-50 border-purple-100',
  },
  {
    icon: BarChart3,
    title: 'Progress Reports',
    description: 'Track weekly educational growth, attendance, and skill improvement scores.',
    href: '/progress-reports',
    color: 'bg-green-50 border-green-100',
  },
  {
    icon: Wallet,
    title: 'Earnings',
    description: 'Review your income, track payments, and manage your withdrawal requests.',
    href: '/earnings',
    color: 'bg-emerald-50 border-emerald-100',
    role: 'teacher',
  },
  {
    icon: Handshake,
    title: 'Welfare Fund',
    description: 'Your protected savings account — 10% of every lesson payment secured for you.',
    href: '/welfare-fund',
    color: 'bg-indigo-50 border-indigo-100',
    role: 'teacher',
  },
  {
    icon: Gem,
    title: 'Go Premium',
    description: 'Unlock advanced features, boost your profile visibility, and earn more.',
    href: '/premium-subscription',
    color: 'bg-rose-50 border-rose-100',
    role: 'teacher',
  },
  {
    icon: Award,
    title: 'Ambassador',
    description: 'Join our ambassador programme, refer users, and earn rewards every month.',
    href: '/ambassador',
    color: 'bg-orange-50 border-orange-100',
  },
  {
    icon: MessageSquare,
    title: 'Chat',
    description: 'Communicate directly with your teachers or students in real-time.',
    href: '/chat',
    color: 'bg-teal-50 border-teal-100',
  },
  {
    icon: Settings,
    title: 'Account Settings',
    description: 'Update your personal details, password, and notification preferences.',
    href: '/dashboard-settings',
    color: 'bg-gray-50 border-gray-100',
  },
];

export default function DashboardPage() {
  const [user, setUser] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [children, setChildren] = useState<User[]>([]);
  const [pendingLessons, setPendingLessons] = useState<Booking[]>([]);
  const [otpInput, setOtpInput] = useState<Record<string, string>>({});
  const [confirmMessage, setConfirmMessage] = useState('');
  const [confirmError, setConfirmError] = useState('');

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      setUser(JSON.parse(userJson));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading && user?.role === 'parent') {
      const fetchParentData = async () => {
        try {
          const [childrenRes, pendingRes] = await Promise.all([
            api.get('/lessons/parent/children'),
            api.get('/lessons/parent/pending'),
          ]);
          setChildren(childrenRes.data.children || []);
          setPendingLessons(pendingRes.data.lessons || []);
        } catch (err) {
          console.error('Unable to load parent dashboard data:', err);
        }
      };
      fetchParentData();
    }
  }, [loading, user]);

  const handleApproveLesson = async (lessonId: any) => {
    setConfirmMessage('');
    setConfirmError('');
    const otp = otpInput[lessonId];
    if (!otp) {
      setConfirmError('OTP is required to confirm this lesson.');
      return;
    }
    try {
      await api.post(`/lessons/${lessonId}/confirm`, { otp });
      setConfirmMessage('Lesson confirmed successfully!');
      setPendingLessons(prev => prev.filter(item => (item.id as any) !== lessonId && item.lesson_id !== lessonId));
      setOtpInput(prev => ({ ...prev, [lessonId]: '' }));
    } catch (err: any) {
      setConfirmError(err.response?.data?.error || 'Unable to confirm lesson.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#001A72]" />
      </div>
    );
  }

  const visibleCards = FEATURE_CARDS.filter(c => !c.role || c.role === user?.role);
  const firstName = (user?.fullName || user?.full_name || 'there').split(' ')[0];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">

      {/* Welcome */}
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Welcome, <span className="text-[#001A72]">{firstName}</span>
        </h2>
      </div>

      {/* Promo Banner */}
      <div className="relative rounded-2xl bg-gradient-to-r from-[#001A72] to-[#0028a5] overflow-hidden px-8 py-6 flex items-center justify-between">
        <div className="relative z-10">
          <p className="text-[#FFB81C] font-bold text-xs tracking-widest uppercase mb-1">Platform Overview</p>
          <h3 className="text-white font-black text-lg leading-snug max-w-xs">
            Discover EduWins' powerful learning possibilities
          </h3>
          <p className="text-white/60 text-xs mt-2 max-w-sm">
            Connect with expert tutors, track progress, manage earnings, and grow your educational journey — all in one place.
          </p>
        </div>
        <div className="hidden md:flex gap-2 absolute right-8 top-1/2 -translate-y-1/2">
          <div className="w-20 h-20 rounded-2xl bg-[#FFB81C]/20 backdrop-blur-sm flex items-center justify-center text-4xl">🎓</div>
          <div className="w-14 h-14 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center text-3xl self-end">📚</div>
          <div className="w-12 h-12 rounded-lg bg-[#FFB81C]/30 backdrop-blur-sm flex items-center justify-center text-2xl">⭐</div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {user?.role === 'teacher' ? (
          <>
            <StatBox label="Referral Code" value={user?.referralCode || 'N/A'} sub="Share with friends" accent="text-[#001A72]" />
            <StatBox label="Referred Users" value={String(user?.referralCount || 0)} sub="Total referrals" accent="text-[#FFB81C]" />
            <StatBox label="Referral Rewards" value={`₦${((user?.referralCount || 0) * 500).toLocaleString()}`} sub="Earned" accent="text-green-600" />
            <StatBox label="Welfare Boost" value={`₦${(user?.welfareBoost || 0).toLocaleString()}`} sub="Your savings" accent="text-indigo-600" />
          </>
        ) : (
          <>
            <StatBox label="Referral Code" value={user?.referralCode || 'N/A'} sub="Share with friends" accent="text-[#001A72]" />
            <StatBox label="Referred Users" value={String(user?.referralCount || 0)} sub="Total referrals" accent="text-[#FFB81C]" />
            <StatBox label="Referral Income" value={`₦${((user?.referralCount || 0) * 1000).toLocaleString()}`} sub="Earned" accent="text-green-600" />
            <StatBox label="Children Linked" value={String(children.length)} sub="Active students" accent="text-indigo-600" />
          </>
        )}
      </div>

      {/* Feature Cards Grid */}
      <div>
        <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Quick Access</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {visibleCards.map((card) => (
            <FeatureCardItem key={card.href} card={card} />
          ))}
        </div>
      </div>

      {/* Parent: Lesson Confirmation */}
      {user?.role === 'parent' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="text-base font-bold text-[#001A72] mb-1 flex items-center gap-2">
            <Lock size={18} /> Lesson Confirmation
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            After a teacher marks a lesson complete, you receive an OTP via SMS. Enter it below to release payment.
          </p>

          {confirmMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">{confirmMessage}</div>
          )}
          {confirmError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{confirmError}</div>
          )}

          {pendingLessons.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No lessons pending confirmation.</p>
          ) : (
            <div className="space-y-3">
              {pendingLessons.map((lesson) => (
                <div key={lesson.lesson_id || lesson.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-semibold text-sm text-gray-800">{lesson.subject || 'Lesson'}</p>
                      <p className="text-xs text-gray-500 mt-0.5">Teacher: {lesson.teacher_name || lesson.teacherName}</p>
                      <p className="text-xs text-gray-500">
                        When: {lesson.scheduled_time ? new Date(lesson.scheduled_time).toLocaleString() : 'TBD'}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      {lesson.status || 'Pending'}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <input
                      value={otpInput[lesson.lesson_id || lesson.id || ''] || ''}
                      onChange={(e) =>
                        setOtpInput((prev) => ({
                          ...prev,
                          [lesson.lesson_id || lesson.id || '']: e.target.value,
                        }))
                      }
                      placeholder="Enter OTP"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20"
                    />
                    <button
                      onClick={() => handleApproveLesson(lesson.lesson_id || lesson.id)}
                      className="bg-[#001A72] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#001A72]/90 transition"
                    >
                      Confirm
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Teacher: Welfare Fund Summary */}
      {user?.role === 'teacher' && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[#001A72] flex items-center gap-2">
              <Wallet size={18} /> Your Welfare Fund
            </h3>
            <span className="text-xs bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full font-semibold">10% of earnings</span>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Accumulated</p>
              <p className="text-xl font-black text-purple-600">₦156,000</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Available</p>
              <p className="text-xl font-black text-indigo-600">₦140,000</p>
            </div>
            <div className="bg-white rounded-xl p-4 shadow-sm">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Locked This Month</p>
              <p className="text-xl font-black text-pink-600">₦16,000</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-4 p-3 bg-white rounded-lg border-l-4 border-indigo-400 leading-relaxed">
            ℹ️ <strong>Welfare Fund:</strong> 10% of every lesson payment goes into your protected savings. Funds are released on the 5th of each month.
          </p>
          <Link href="/welfare-fund" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline">
            View full details →
          </Link>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-black ${accent} leading-tight`}>{value}</p>
      <p className="text-[10px] text-gray-400 mt-1">{sub}</p>
    </div>
  );
}

function FeatureCardItem({ card }: { card: FeatureCard }) {
  const Icon = card.icon;
  return (
    <Link
      href={card.href}
      className={`group block rounded-2xl border p-5 hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 ${card.color}`}
    >
      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center mb-3">
        <Icon size={20} className="text-[#001A72]" />
      </div>
      <h4 className="font-bold text-[#001A72] text-sm mb-1">{card.title}</h4>
      <p className="text-xs text-gray-500 leading-relaxed mb-3">{card.description}</p>
      <span className="text-xs font-bold text-[#001A72] flex items-center gap-1 group-hover:gap-2 transition-all">
        Get started <ChevronRight size={14} />
      </span>
    </Link>
  );
}
