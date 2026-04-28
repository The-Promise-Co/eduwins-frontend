'use client';

import { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import DashboardNavigation from '@/components/DashboardNavigation';
import { User } from '@/types';

interface WelfareFund {
  teacherId: string;
  total_accumulated: number;
  available_balance: number;
  locked_balance: number;
  contributions: Contribution[];
}

interface Contribution {
  date: string;
  lesson: string;
  total: number;
  status: 'Available' | 'Locked';
}

interface Message {
  type: 'success' | 'error' | '';
  text: string;
}

export default function WelfareFundPage(): ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [welfareFund, setWelfareFund] = useState<WelfareFund | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [showWithdrawForm, setShowWithdrawForm] = useState<boolean>(false);
  const [message, setMessage] = useState<Message>({ type: '', text: '' });

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
          if (userData.role !== 'teacher') {
            router.push('/dashboard');
            return;
          }
          setUser(userData);

          // Fetch welfare fund data
          try {
            const response = await api.get(`/payments/welfare-fund/${userData.id}`);
            setWelfareFund(response.data);
          } catch (innerErr: any) {
            if (innerErr.response?.status === 404) {
              // Create local empty welfare record for UI when no db record yet
              setWelfareFund({
                teacherId: userData.id,
                total_accumulated: 0,
                available_balance: 0,
                locked_balance: 0,
                contributions: [],
              });
            } else {
              throw innerErr;
            }
          }
        } catch (err) {
          console.error('Error:', err);
          router.push('/login');
        } finally {
          setLoading(false);
        }
      }
    };

    init();
  }, [router]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const amount = parseFloat(withdrawAmount);
    if (!withdrawAmount || amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    if (amount > (welfareFund?.available_balance || 0)) {
      setMessage({ type: 'error', text: 'Insufficient available balance' });
      return;
    }

    try {
      if (user) {
        await api.post(`/payments/welfare-fund/${user.id}/withdraw`, {
          amount: amount,
        });

        setMessage({
          type: 'success',
          text: `Withdrawal request of ₦${amount.toLocaleString()} submitted successfully!`,
        });
        setWithdrawAmount('');
        setShowWithdrawForm(false);

        // Refresh welfare fund data
        const updatedResponse = await api.get(`/payments/welfare-fund/${user.id}`);
        setWelfareFund(updatedResponse.data);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Withdrawal failed';
      setMessage({ type: 'error', text: errorMsg });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading welfare fund...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation user={user} />
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#001A72] mb-2">💰 Welfare Fund</h1>
            <p className="text-gray-600">
              Your protected savings account - 10% of every lesson payment goes here automatically
            </p>
          </div>

          {message.text && (
            <div className={`mb-6 p-4 rounded-xl border-2 ${message.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-100'
                : 'bg-red-50 text-red-700 border-red-100'
              }`}>
              <p className="font-bold flex items-center gap-2">
                {message.type === 'success' ? '✅' : '❌'} {message.text}
              </p>
            </div>
          )}

          {/* Main Stats */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <StatBox
              label="TOTAL ACCUMULATED"
              value={(welfareFund?.total_accumulated || 0).toLocaleString()}
              color="border-purple-500 text-purple-600"
              sub="Lifetime savings"
            />
            <StatBox
              label="AVAILABLE TO WITHDRAW"
              value={(welfareFund?.available_balance || 0).toLocaleString()}
              color="border-indigo-500 text-indigo-600"
              sub="Ready for use"
            />
            <StatBox
              label="LOCKED (CURRENT MONTH)"
              value={(welfareFund?.locked_balance || 0).toLocaleString()}
              color="border-pink-500 text-pink-600"
              sub="Unlocks on the 5th"
            />
          </div>

          {/* Withdraw Section */}
          <div className="bg-white border-2 border-[#001A72]/10 rounded-2xl shadow-sm p-8 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-black text-[#001A72]">Withdraw from Fund</h2>
                <p className="text-sm text-gray-500">Access your available welfare savings</p>
              </div>
              <button
                onClick={() => setShowWithdrawForm(!showWithdrawForm)}
                className={`px-6 py-3 rounded-xl font-bold transition shadow-sm ${showWithdrawForm
                    ? 'bg-gray-100 text-gray-600'
                    : 'bg-[#001A72] text-white hover:bg-[#001A72]/90'
                  }`}
              >
                {showWithdrawForm ? 'Close Form' : 'Start Withdrawal'}
              </button>
            </div>

            {showWithdrawForm && (
              <form onSubmit={handleWithdraw} className="bg-gray-50 rounded-2xl p-6 border border-gray-100 space-y-6 animate-in fade-in slide-in-from-top-4 duration-300">
                <div>
                  <label className="block text-sm font-black text-[#001A72] uppercase tracking-widest mb-2">
                    Withdrawal Amount (₦)
                  </label>
                  <input
                    type="number"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    placeholder="Enter amount"
                    className="w-full px-4 py-4 border-2 border-white rounded-xl focus:outline-none focus:border-[#FFB81C] transition text-xl font-black shadow-inner"
                    min="1"
                    step="0.01"
                    required
                  />
                  <div className="mt-3 flex justify-between items-center bg-white px-4 py-2 rounded-lg border border-gray-100">
                    <p className="text-xs font-bold text-gray-500">AVAILABLE BALANCE</p>
                    <p className="text-sm font-black text-[#001A72]">₦{(welfareFund?.available_balance || 0).toLocaleString()}</p>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex gap-3">
                  <span className="text-xl">ℹ️</span>
                  <p className="text-xs text-blue-800 leading-relaxed">
                    <strong>Payment Schedule:</strong> Welfare fund withdrawals are processed manually by our finance team within 48-72 hours to ensure security.
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full bg-[#FFB81C] text-[#001A72] py-4 rounded-xl font-black hover:bg-[#FFB81C]/90 transition shadow-lg shadow-[#FFB81C]/20"
                >
                  Confirm Withdrawal Request
                </button>
              </form>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-12">
            {/* Benefits */}
            <div className="bg-[#001A72] rounded-2xl p-8 text-white relative overflow-hidden">
              <h2 className="text-xl font-black mb-6 relative z-10">🛡️ Fund Benefits</h2>
              <ul className="space-y-4 relative z-10">
                <BenefitItem text="Emergency Financial Cushion" />
                <BenefitItem text="Teacher Health Coverage Assistance" />
                <BenefitItem text="Refund Guarantee Protection" />
                <BenefitItem text="Housing Program Downpayment Pool" />
              </ul>
              <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-white/5 rounded-full blur-3xl"></div>
            </div>

            {/* Rules */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200">
              <h2 className="text-xl font-black text-[#001A72] mb-6">📝 Fund Rules</h2>
              <div className="space-y-4">
                <RuleItem number="1" text="10% contribution is mandatory for all sessions." />
                <RuleItem number="2" text="Funds unlock on the 5th of every new month." />
                <RuleItem number="3" text="Withdrawals require manual verification." />
              </div>
            </div>
          </div>

          {/* Recent Contributions */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="p-6 bg-gray-50 border-b border-gray-100">
              <h2 className="text-xl font-black text-[#001A72]">Recent Savings Activity</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#001A72]/5 text-[#001A72] uppercase text-[10px] font-black tracking-widest">
                  <tr>
                    <th className="py-4 px-6 text-left">Date</th>
                    <th className="py-4 px-6 text-left">Source Lesson</th>
                    <th className="py-4 px-6 text-right">Contribution (10%)</th>
                    <th className="py-4 px-6 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {CONTRIBUTIONS.map((contrib, i) => (
                    <tr key={i} className="hover:bg-gray-50 transition">
                      <td className="py-4 px-6 text-gray-500 font-medium">{contrib.date}</td>
                      <td className="py-4 px-6 font-bold text-gray-900">{contrib.lesson}</td>
                      <td className="py-4 px-6 text-right font-black text-purple-600">
                        ₦{(contrib.total * 0.10).toLocaleString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${contrib.status === 'Available'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-orange-100 text-orange-800'
                          }`}>
                          {contrib.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface StatBoxProps {
  label: string;
  value: string;
  color: string;
  sub: string;
}

function StatBox({ label, value, color, sub }: StatBoxProps): ReactElement {
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 border-t-8 ${color}`}>
      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">{label}</p>
      <p className="text-3xl font-black mb-1">₦{value}</p>
      <p className="text-[10px] font-bold text-gray-400 opacity-70">{sub}</p>
    </div>
  );
}

interface BenefitItemProps {
  text: string;
}

function BenefitItem({ text }: BenefitItemProps): ReactElement {
  return (
    <li className="flex items-center gap-3">
      <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[10px]">✓</div>
      <span className="text-sm font-medium text-blue-50 tracking-tight">{text}</span>
    </li>
  );
}

interface RuleItemProps {
  number: string;
  text: string;
}

function RuleItem({ number, text }: RuleItemProps): ReactElement {
  return (
    <div className="flex gap-4">
      <span className="w-6 h-6 rounded-lg bg-gray-100 flex items-center justify-center text-xs font-black text-[#001A72]">{number}</span>
      <p className="text-sm text-gray-600 font-medium leading-tight">{text}</p>
    </div>
  );
}

const CONTRIBUTIONS: Contribution[] = [
  { date: 'Mar 28, 2026', lesson: 'Mathematics', total: 10000, status: 'Available' },
  { date: 'Mar 27, 2026', lesson: 'English', total: 10000, status: 'Available' },
  { date: 'Mar 26, 2026', lesson: 'Physics', total: 12000, status: 'Locked' },
  { date: 'Mar 25, 2026', lesson: 'Chemistry', total: 10000, status: 'Available' },
  { date: 'Mar 24, 2026', lesson: 'Biology', total: 8500, status: 'Available' },
];
