'use client';

import { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { useWelfareFund, useWithdrawWelfare } from '@/misc/hooks/api/welfare';
import { useUser } from '@/misc/context/UserContext';
import { User } from '@/misc/types';
import {
  HeartPulse,
  Wallet,
  Lock,
  TrendingUp,
  CheckCircle2,
  ShieldCheck,
  Info,
} from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import StatCard from '@/misc/components/StatCard';

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
}

const MOCK_CONTRIBUTIONS: Contribution[] = [
  { date: 'Mar 28, 2026', lesson: 'Mathematics', total: 10000 },
  { date: 'Mar 27, 2026', lesson: 'English', total: 10000 },
  { date: 'Mar 26, 2026', lesson: 'Physics', total: 12000 },
  { date: 'Mar 25, 2026', lesson: 'Chemistry', total: 10000 },
  { date: 'Mar 24, 2026', lesson: 'Biology', total: 8500 },
];

export default function WelfareFundPage(): ReactElement {
  const router = useRouter();
  const { user } = useUser();
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({
    type: '',
    text: '',
  });
  const [showInfo, setShowInfo] = useState(false);
  const welfareQuery = useWelfareFund(user?.id);
  const withdrawMutation = useWithdrawWelfare(user!.id);

  useEffect(() => {
    if (!user) return;

    if (user.role !== 'teacher') {
      router.replace('/app/dashboard');
      return;
    }
  }, [user, router]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    const amount = parseFloat(withdrawAmount);

    if (!amount || amount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' });
      return;
    }

    if (amount > (welfareFund?.available_balance || 0)) {
      setMessage({ type: 'error', text: 'Insufficient available balance' });
      return;
    }

    try {
      await withdrawMutation.mutateAsync({ amount });
      setMessage({
        type: 'success',
        text: `Withdrawal request of ₦${amount.toLocaleString()} submitted successfully!`,
      });
      setWithdrawAmount('');
      setShowWithdrawForm(false);
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.response?.data?.error || 'Withdrawal failed',
      });
    }
  };

  const emptyWelfareFund: WelfareFund | null = user?.id ? {
    teacherId: user.id,
    total_accumulated: 0,
    available_balance: 0,
    locked_balance: 0,
    contributions: [],
  } : null;
  const welfareFund = welfareQuery.error && (welfareQuery.error as any).response?.status === 404
    ? emptyWelfareFund
    : welfareQuery.data || null;
  const contributions =
    welfareFund?.contributions?.length ? welfareFund.contributions : MOCK_CONTRIBUTIONS;
  const loading = welfareQuery.isLoading || welfareQuery.isPending;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#001A72]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Welfare Fund"
        subtitle="Your protected savings — 10% of every lesson payment goes here automatically"
        rightElement={
          <button
            onClick={() => setShowInfo((v) => !v)}
            className="text-xs font-bold text-[#001A72] border border-[#001A72]/20 bg-white px-4 py-2 rounded-xl hover:bg-[#001A72]/5 transition"
          >
            {showInfo ? 'Hide Info' : 'Show Info'}
          </button>
        }
      />

      {/* Alert message */}
      {message.text && (
        <div
          className={`p-4 rounded-xl text-sm font-medium border ${message.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-red-50 text-red-700 border-red-100'
            }`}
        >
          {message.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          label="Total Accumulated"
          value={`₦${(welfareFund?.total_accumulated || 0).toLocaleString()}`}
          icon={TrendingUp}
          color="text-purple-600"
          bg="bg-purple-50"
        />
        <StatCard
          label="Available to Withdraw"
          value={`₦${(welfareFund?.available_balance || 0).toLocaleString()}`}
          icon={Wallet}
          color="text-[#001A72]"
          bg="bg-[#001A72]/5"
        />
        <StatCard
          label="Locked (Current Period)"
          value={`₦${(welfareFund?.locked_balance || 0).toLocaleString()}`}
          icon={Lock}
          color="text-amber-600"
          bg="bg-amber-50"
        />
      </div>

      {/* Info cards */}
      {showInfo && <div className="grid md:grid-cols-2 gap-6">
        {/* How it works */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
            <Info size={14} className="text-[#001A72]" /> How It Works
          </h2>
          <ol className="space-y-4">
            {[
              {
                title: 'Automatic Contribution',
                desc: '10% of every lesson payment automatically goes into your welfare fund',
              },
              {
                title: 'Financial Protection',
                desc: 'Creates a safety net for unexpected emergencies',
              },
              {
                title: 'Monthly Unlocking',
                desc: 'Current month funds lock until the 5th of the following month',
              },
              {
                title: 'Student Protection',
                desc: 'Your welfare fund helps cover refund guarantees for students',
              },
            ].map((step, i) => (
              <li key={i} className="flex gap-4">
                <div className="w-6 h-6 rounded-full bg-[#001A72]/10 text-[#001A72] text-[10px] font-black flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-800">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Benefits */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-5 flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#001A72]" /> Benefits
          </h2>
          <ul className="space-y-3">
            {[
              'Emergency Financial Cushion',
              'Secure Account Management',
              'Refund Coverage Protection',
              'Transparent Tracking',
              'Anytime Withdrawal Access*',
              'No Hidden Fees',
            ].map((benefit) => (
              <li key={benefit} className="flex items-center gap-3">
                <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                <span className="text-xs text-gray-700">{benefit}</span>
              </li>
            ))}
          </ul>
          <p className="text-[10px] text-gray-400 mt-5">*Subject to monthly lock period</p>
        </div>
      </div>}

      {/* Withdraw section */}
      <div className="bg-white rounded-2xl border-2 border-purple-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
              Withdraw Funds
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Available: ₦{(welfareFund?.available_balance || 0).toLocaleString()}
            </p>
          </div>
          <button
            onClick={() => {
              setShowWithdrawForm((v) => !v);
              setMessage({ type: '', text: '' });
            }}
            className="bg-[#001A72] text-white text-xs font-bold px-5 py-2.5 rounded-xl hover:bg-[#001A72]/90 transition"
          >
            {showWithdrawForm ? 'Cancel' : 'Withdraw Now'}
          </button>
        </div>

        {showWithdrawForm && (
          <form onSubmit={handleWithdraw} className="space-y-4 mt-2">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Withdrawal Amount (₦)
              </label>
              <input
                type="number"
                value={withdrawAmount}
                onChange={(e) => setWithdrawAmount(e.target.value)}
                placeholder="Enter amount to withdraw"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#001A72] focus:ring-1 focus:ring-[#001A72]/20 transition"
                min="1"
                step="0.01"
                required
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
              <p className="text-xs text-gray-600">
                <strong>Processing:</strong> Withdrawals are processed within 2–3 business days to
                your registered account.
              </p>
            </div>

            <button
              type="submit"
              disabled={withdrawMutation.isPending}
              className="w-full bg-[#001A72] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#001A72]/90 transition disabled:opacity-60"
            >
              {withdrawMutation.isPending ? 'Submitting…' : 'Submit Withdrawal Request'}
            </button>
          </form>
        )}
      </div>

      {/* Recent contributions table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">
            Recent Contributions
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#001A72]/5 text-[#001A72] text-[10px] font-black uppercase tracking-widest">
                <th className="py-4 px-6 text-left">Date</th>
                <th className="py-4 px-6 text-left">Lesson</th>
                <th className="py-4 px-6 text-right">Total Amount</th>
                <th className="py-4 px-6 text-right">Your Welfare (10%)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {contributions.map((contrib, i) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-4 px-6 text-xs text-gray-500">{contrib.date}</td>
                  <td className="py-4 px-6 text-xs font-bold text-[#001A72]">{contrib.lesson}</td>
                  <td className="py-4 px-6 text-right text-xs font-black text-gray-800">
                    ₦{contrib.total.toLocaleString()}
                  </td>
                  <td className="py-4 px-6 text-right text-xs font-black text-purple-600">
                    ₦{(contrib.total * 0.1).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
