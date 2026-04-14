'use client';

import { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import DashboardNavigation from '@/components/DashboardNavigation';
import { User } from '@/types';

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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading earnings dashboard...</p>
        </div>
      </div>
    );
  }

  const isTeacher = user?.role === 'teacher';

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation user={user} />
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-100 pb-6">
              <div>
                <h1 className="text-3xl font-black text-[#001A72] mb-1">Your Earnings</h1>
                <p className="text-gray-500 font-medium tracking-tight">Track your income, splits, and wallet status</p>
              </div>
              <div className="mt-4 md:mt-0 bg-[#FFB81C]/10 px-4 py-2 rounded-lg border border-[#FFB81C]/20">
                <p className="text-xs font-black uppercase tracking-widest text-[#001A72]">Wallet Balance</p>
                <p className="text-2xl font-black text-[#001A72]">₦28,500</p>
              </div>
            </div>

            {isTeacher ? (
              <div className="space-y-10">
                {/* Teacher Stats Grid */}
                <div className="grid md:grid-cols-4 gap-6">
                  <StatCard label="Personal Take (75%)" value="₦45,000" color="bg-green-500" icon="💰" />
                  <StatCard label="Platform Fee (15%)" value="₦9,000" color="bg-blue-500" icon="🏢" />
                  <StatCard label="Welfare Fund (10%)" value="₦6,000" color="bg-purple-500" icon="🏥" />
                  <StatCard label="Total Booked" value="₦60,000" color="bg-[#FFB81C]" icon="📅" />
                </div>

                {/* Educational Split Explanation */}
                <div className="bg-[#001A72] rounded-2xl p-8 text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                      <span>🛡️</span> Secure Split & Welfare Savings
                    </h3>
                    <p className="text-blue-100 mb-6 max-w-2xl leading-relaxed">
                      Payments are automatically split at the source when a session is confirmed. This ensures transparency and builds your long-term welfare security.
                    </p>
                    <div className="grid md:grid-cols-3 gap-6">
                      <SplitItem percentage="75%" label="Teacher Direct" desc="Paid instantly to your accessible wallet" />
                      <SplitItem percentage="15%" label="System Fee" desc="Covers platform support and hosting" />
                      <SplitItem percentage="10%" label="Welfare Fund" desc="Locked for your housing & emergency fund" />
                    </div>
                  </div>
                  <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                </div>

                {/* Welfare Fund Highlight */}
                <div className="bg-white border-2 border-purple-100 rounded-2xl p-8 shadow-sm">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8">
                    <div>
                      <h2 className="text-2xl font-black text-[#001A72] mb-1">🏥 Your Welfare Savings</h2>
                      <p className="text-gray-500 text-sm">Funds accumulated from your teaching sessions</p>
                    </div>
                    <div className="flex gap-3">
                      <Link href="/welfare-fund" className="bg-purple-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-purple-700 transition shadow-md">
                        Manage Fund
                      </Link>
                      <button className="bg-gray-100 text-gray-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-200 transition">
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
                <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                  <div className="p-6 bg-gray-50 border-b border-gray-100">
                    <h2 className="text-xl font-black text-[#001A72]">Payment History</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#001A72]/5 text-[#001A72] uppercase text-[10px] font-black tracking-widest">
                        <tr>
                          <th className="py-4 px-6 text-left">Date</th>
                          <th className="py-4 px-6 text-left">Lesson / Student</th>
                          <th className="py-4 px-6 text-right">Earnings (75%)</th>
                          <th className="py-4 px-6 text-right">Platform</th>
                          <th className="py-4 px-6 text-right">Welfare</th>
                          <th className="py-4 px-6 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {TEACHER_HISTORY.map((entry, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition">
                            <td className="py-4 px-6 text-gray-500">{entry.date}</td>
                            <td className="py-4 px-6">
                              <p className="font-bold text-gray-900">{entry.lesson}</p>
                              <p className="text-xs text-gray-500">{entry.student}</p>
                            </td>
                            <td className="py-4 px-6 text-right font-black text-green-600">₦{(Number(entry.amount) * 0.75).toLocaleString()}</td>
                            <td className="py-4 px-6 text-right font-bold text-blue-600">₦{(Number(entry.amount) * 0.15).toLocaleString()}</td>
                            <td className="py-4 px-6 text-right font-bold text-purple-600">₦{(Number(entry.amount) * 0.10).toLocaleString()}</td>
                            <td className="py-4 px-6 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${entry.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
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
              <div className="space-y-10">
                {/* Parent Summary */}
                <div className="grid md:grid-cols-4 gap-6">
                  <StatCard label="Total Spent" value="₦45,000" color="bg-green-500" icon="📈" />
                  <StatCard label="This Month" value="₦12,500" color="bg-blue-500" icon="📅" />
                  <StatCard label="Active Sessions" value="5" color="bg-[#FFB81C]" icon="🧠" />
                  <StatCard label="Refund Balance" value="₦0" color="bg-purple-500" icon="↩️" />
                </div>

                {/* Parent Table */}
                <div className="overflow-hidden rounded-2xl border border-gray-100 shadow-sm">
                  <div className="p-6 bg-gray-50 border-b border-gray-100">
                    <h2 className="text-xl font-black text-[#001A72]">Transaction History</h2>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-[#001A72]/5 text-[#001A72] uppercase text-[10px] font-black tracking-widest">
                        <tr>
                          <th className="py-4 px-6 text-left">Date</th>
                          <th className="py-4 px-6 text-left">Subject / Tutor</th>
                          <th className="py-4 px-6 text-right">Amount</th>
                          <th className="py-4 px-6 text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {PARENT_HISTORY.map((entry, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition">
                            <td className="py-4 px-6 text-gray-500">{entry.date}</td>
                            <td className="py-4 px-6">
                              <p className="font-bold text-gray-900">{entry.lesson}</p>
                              <p className="text-xs text-gray-500">{entry.tutor}</p>
                            </td>
                            <td className="py-4 px-6 text-right font-black text-[#001A72]">{entry.amount}</td>
                            <td className="py-4 px-6 text-center">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${entry.status === 'Completed' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
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
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  color: string;
  icon: string;
}

function StatCard({ label, value, color, icon }: StatCardProps): ReactElement {
  return (
    <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center text-2xl shadow-lg shadow-${color}/20`}>
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-0.5">{label}</p>
        <p className="text-xl font-black text-[#001A72] leading-none">{value}</p>
      </div>
    </div>
  );
}

interface SplitItemProps {
  percentage: string;
  label: string;
  desc: string;
}

function SplitItem({ percentage, label, desc }: SplitItemProps): ReactElement {
  return (
    <div className="bg-white/10 p-4 rounded-xl border border-white/10">
      <p className="text-2xl font-black mb-1 text-[#FFB81C]">{percentage}</p>
      <p className="text-sm font-bold uppercase tracking-wide mb-1 opacity-90">{label}</p>
      <p className="text-xs opacity-70 leading-relaxed font-medium">{desc}</p>
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
    <div className={`p-6 rounded-xl border ${highlight ? 'bg-purple-600 text-white border-purple-600' : 'bg-purple-50 text-[#001A72] border-purple-100'}`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-white/70' : 'text-purple-400'}`}>{label}</p>
      <p className="text-2xl font-black mb-1">{value}</p>
      <p className={`text-[10px] font-medium ${highlight ? 'text-white/50' : 'text-gray-400'}`}>{sub}</p>
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
