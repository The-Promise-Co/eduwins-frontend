'use client';

import { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import DashboardNavigation from '@/components/DashboardNavigation';
import { User } from '@/types';
import {
  Wallet,
  Building2,
  HeartPulse,
  Calendar,
  ShieldCheck,
  TrendingUp,
  Brain,
  Undo2
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';

interface HistoryEntry {
  date: string;
  lesson: string;
  student?: string;
  tutor?: string;
  amount: number | string;
  status: 'Completed' | 'Pending' | 'Failed';
}

export default function EarningsPage(): ReactElement {
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#001A72]" />
      </div>
    );
  }

  const isTeacher = user?.role === 'teacher';
  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title="Earnings"
        subtitle={isTeacher ? 'Track your income, splits, and wallet status' : 'Track your spending and transaction history'}
        rightElement={
          <div className="bg-[#FFB81C]/10 border border-[#FFB81C]/30 px-4 py-2.5 rounded-xl flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#FFB81C]/20 flex items-center justify-center">
              <Wallet size={16} className="text-[#001A72]" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#001A72]/60 leading-none mb-1">Wallet Balance</p>
              <p className="text-lg font-black text-[#001A72] leading-none">₦28,500</p>
            </div>
          </div>
        }
      />

      {isTeacher ? (
        <div className="space-y-6">
          {/* Teacher Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Personal Take (75%)" value="₦45,000" color="text-[#001A72]" bg="bg-[#001A72]/5" icon={Wallet} />
            <StatCard label="Welfare Fund (10%)" value="₦6,000" color="text-purple-600" bg="bg-purple-50" icon={HeartPulse} />
            <StatCard label="Total Booked" value="₦60,000" color="text-[#001A72]" bg="bg-[#FFB81C]/10" icon={Calendar} />
            <StatCard label="Platform Growth" value="15%" color="text-emerald-600" bg="bg-emerald-50" icon={TrendingUp} />
          </div>

          {/* Welfare Fund Highlight */}
          <div className="bg-white border-2 border-[#001A72]/10 rounded-2xl p-8 shadow-sm">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
              <div>
                <h2 className="text-2xl font-black text-[#001A72] mb-1 flex items-center gap-2">
                  <HeartPulse className="text-purple-600" /> Your Welfare Savings
                </h2>
                <p className="text-gray-500 text-sm">Funds accumulated from your teaching sessions to secure your future.</p>
              </div>
              <div className="flex gap-3 shrink-0">
                <Link href="/app/welfare-fund" className="bg-[#001A72] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-[#001A72]/90 transition shadow-md">
                  Manage Fund
                </Link>
                <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold text-sm hover:bg-gray-200 transition">
                  Withdrawals
                </button>
              </div>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <WelfareBox label="Accumulated Total" value="₦156,000" sub="Total lifetime savings" />
              <WelfareBox label="Available to Withdraw" value="₦140,000" sub="Ready for withdrawal" highlight />
              <WelfareBox label="Locked (Current Period)" value="₦16,000" sub="Unlocks on the 5th" />
            </div>
          </div>

          {/* Teacher Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Payment History</h2>
              <button className="text-xs font-bold text-[#001A72] hover:underline">Export CSV</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#001A72]/5 text-[#001A72] text-[10px] font-black uppercase tracking-widest">
                    <th className="py-4 px-6 text-left font-black">Date</th>
                    <th className="py-4 px-6 text-left font-black">Lesson / Student</th>
                    <th className="py-4 px-6 text-right font-black">Earnings (75%)</th>
                    <th className="py-4 px-6 text-right font-black">Platform</th>
                    <th className="py-4 px-6 text-right font-black">Welfare</th>
                    <th className="py-4 px-6 text-center font-black">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {TEACHER_HISTORY.map((entry, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 text-gray-500 text-xs">{entry.date}</td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-[#001A72] text-xs">{entry.lesson}</p>
                        <p className="text-[10px] text-gray-400">{entry.student}</p>
                      </td>
                      <td className="py-4 px-6 text-right font-black text-emerald-600">₦{(Number(entry.amount) * 0.75).toLocaleString()}</td>
                      <td className="py-4 px-6 text-right font-bold text-blue-600 text-xs">₦{(Number(entry.amount) * 0.15).toLocaleString()}</td>
                      <td className="py-4 px-6 text-right font-bold text-purple-600 text-xs">₦{(Number(entry.amount) * 0.10).toLocaleString()}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${entry.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Parent Summary */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Total Spent" value="₦45,000" color="text-[#001A72]" bg="bg-[#001A72]/5" icon={TrendingUp} />
            <StatCard label="This Month" value="₦12,500" color="text-[#001A72]" bg="bg-[#FFB81C]/10" icon={Calendar} />
            <StatCard label="Active Sessions" value="5" color="text-emerald-600" bg="bg-emerald-50" icon={Brain} />
            <StatCard label="Refund Balance" value="₦0" color="text-purple-600" bg="bg-purple-50" icon={Undo2} />
          </div>

          {/* Parent Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Transaction History</h2>
              <button className="text-xs font-bold text-[#001A72] hover:underline">Download Invoices</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#001A72]/5 text-[#001A72] text-[10px] font-black uppercase tracking-widest">
                    <th className="py-4 px-6 text-left font-black">Date</th>
                    <th className="py-4 px-6 text-left font-black">Subject / Tutor</th>
                    <th className="py-4 px-6 text-right font-black">Amount</th>
                    <th className="py-4 px-6 text-center font-black">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {PARENT_HISTORY.map((entry, i) => (
                    <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 text-gray-500 text-xs">{entry.date}</td>
                      <td className="py-4 px-6">
                        <p className="font-bold text-[#001A72] text-xs">{entry.lesson}</p>
                        <p className="text-[10px] text-gray-400">{entry.tutor}</p>
                      </td>
                      <td className="py-4 px-6 text-right font-black text-[#001A72] text-xs">{entry.amount}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${entry.status === 'Completed'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                            : 'bg-amber-50 text-amber-700 border-amber-100'
                          }`}>
                          {entry.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface WelfareBoxProps {
  label: string;
  value: string;
  sub: string;
  highlight?: boolean;
}

function WelfareBox({ label, value, sub, highlight }: WelfareBoxProps): ReactElement {
  return (
    <div className={`p-6 rounded-xl border ${
      highlight
        ? 'bg-[#001A72] text-white border-[#001A72] shadow-lg'
        : 'bg-[#001A72]/5 text-[#001A72] border-[#001A72]/10'
    }`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
        highlight ? 'text-white/60' : 'text-[#001A72]/50'
      }`}>{label}</p>
      <p className="text-2xl font-black mb-1">{value}</p>
      <p className={`text-[10px] font-medium ${
        highlight ? 'text-white/50' : 'text-gray-500'
      }`}>{sub}</p>
    </div>
  );
}

const TEACHER_HISTORY: HistoryEntry[] = [
  { date: 'Mar 28, 2026', lesson: 'Mathematics', student: 'John Doe', amount: 10000, status: 'Completed' },
  { date: 'Mar 27, 2026', lesson: 'English', student: 'Jane Smith', amount: 10000, status: 'Completed' },
  { date: 'Mar 26, 2026', lesson: 'Physics', student: 'Mike Johnson', amount: 12000, status: 'Pending' },
  { date: 'Mar 25, 2026', lesson: 'Chemistry', student: 'Sarah Williams', amount: 10000, status: 'Completed' },
];

const PARENT_HISTORY: HistoryEntry[] = [
  { date: 'Mar 28, 2026', lesson: 'Mathematics', tutor: 'John Doe', amount: '₦2,500', status: 'Completed' },
  { date: 'Mar 27, 2026', lesson: 'English', tutor: 'Jane Smith', amount: '₦2,500', status: 'Completed' },
  { date: 'Mar 26, 2026', lesson: 'Physics', tutor: 'Mike Johnson', amount: '₦3,000', status: 'Pending' },
  { date: 'Mar 25, 2026', lesson: 'Chemistry', tutor: 'Sarah Williams', amount: '₦2,500', status: 'Completed' },
];
