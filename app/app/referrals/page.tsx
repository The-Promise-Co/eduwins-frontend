'use client';

import { useState, ReactElement } from 'react';
import { useUser } from '@/misc/context/UserContext';
import { Users, Copy, Check, Gift, UserCheck, Banknote, Clock } from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import StatCard from '@/misc/components/StatCard';

interface Referral {
  name: string;
  role: string;
  date: string;
  status: 'Active' | 'Pending';
  reward: number;
  paid: boolean;
  paidDate?: string;
}

const MOCK_REFERRALS: Referral[] = [
  // Paid out by admin
  { name: 'Amaka Obi', role: 'Parent', date: 'Mar 12, 2026', status: 'Active', reward: 500, paid: true, paidDate: 'Apr 1, 2026' },
  { name: 'Chidi Nweke', role: 'Teacher', date: 'Mar 20, 2026', status: 'Active', reward: 500, paid: true, paidDate: 'Apr 1, 2026' },
  { name: 'Emeka Eze', role: 'Parent', date: 'Mar 28, 2026', status: 'Active', reward: 500, paid: true, paidDate: 'Apr 1, 2026' },
  // New — awaiting payout
  { name: 'Fatima Aliyu', role: 'Parent', date: 'Apr 30, 2026', status: 'Active', reward: 500, paid: false },
  { name: 'Kemi Adeyemi', role: 'Teacher', date: 'May 3, 2026', status: 'Active', reward: 500, paid: false },
  { name: 'Tunde Bello', role: 'Parent', date: 'May 7, 2026', status: 'Pending', reward: 500, paid: false },
];

function ReferralTable({ referrals, emptyText }: { referrals: Referral[]; emptyText: string }) {
  if (referrals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center opacity-40">
        <Users size={28} className="text-gray-400 mb-2" />
        <p className="text-xs font-bold text-gray-500">{emptyText}</p>
      </div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#001A72]/5 text-[#001A72] text-[10px] font-black uppercase tracking-widest">
            <th className="py-4 px-6 text-left">Name</th>
            <th className="py-4 px-6 text-left">Role</th>
            <th className="py-4 px-6 text-left">Joined</th>
            <th className="py-4 px-6 text-center">Status</th>
            <th className="py-4 px-6 text-right">Reward</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {referrals.map((ref, i) => (
            <tr key={i} className="hover:bg-gray-50/50 transition-colors">
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#001A72]/10 text-[#001A72] text-[10px] font-black flex items-center justify-center shrink-0">
                    {ref.name.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-gray-800">{ref.name}</span>
                </div>
              </td>
              <td className="py-4 px-6 text-xs text-gray-500">{ref.role}</td>
              <td className="py-4 px-6 text-xs text-gray-500">
                <span>{ref.date}</span>
                {ref.paid && ref.paidDate && (
                  <p className="text-[10px] text-gray-400 mt-0.5">Paid out: {ref.paidDate}</p>
                )}
              </td>
              <td className="py-4 px-6 text-center">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${ref.status === 'Active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                  {ref.status}
                </span>
              </td>
              <td className="py-4 px-6 text-right text-xs font-black text-purple-600">
                ₦{ref.reward.toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ReferralsPage(): ReactElement {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'awaiting' | 'paid'>('awaiting');

  const referralCode =
    (user as any)?.referralCode || 'EDU-' + (user?.id?.slice(0, 6).toUpperCase() ?? 'XXXXXX');
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const paid = MOCK_REFERRALS.filter((r) => r.paid);
  const unpaid = MOCK_REFERRALS.filter((r) => !r.paid);

  const totalEarned = paid.reduce((s, r) => s + r.reward, 0);
  const pendingPayout = unpaid
    .filter((r) => r.status === 'Active')
    .reduce((s, r) => s + r.reward, 0);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Referrals"
        subtitle="Invite friends and earn rewards for every successful signup"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Referred" value={String(MOCK_REFERRALS.length)} icon={Users} color="text-[#001A72]" bg="bg-[#001A72]/5" />
        <StatCard label="Awaiting Payout" value={String(unpaid.filter(r => r.status === 'Active').length)} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Total Paid Out" value={`₦${totalEarned.toLocaleString()}`} icon={Banknote} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Pending Earnings" value={`₦${pendingPayout.toLocaleString()}`} icon={Gift} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Referral Link */}
      <div className="bg-gradient-to-br from-[#001A72] to-[#002aad] rounded-2xl p-6 text-white">
        <p className="text-xs font-black uppercase tracking-widest text-white/50 mb-1">Your Referral Link</p>
        <p className="text-lg font-black mb-4">Share &amp; Earn ₦500 per signup</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-sm font-medium truncate">
            {referralLink}
          </div>
          <button
            onClick={handleCopy}
            className="shrink-0 flex items-center gap-2 bg-[#FFB81C] text-[#001A72] font-bold text-xs px-5 py-3 rounded-xl hover:bg-[#FFB81C]/90 transition"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-[10px] text-white/40 mt-3">
          You earn ₦500 for every person who signs up and completes their first session using your link.
        </p>
      </div>

      {/* Tabbed referral tables */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('awaiting')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition border-b-2 ${activeTab === 'awaiting'
              ? 'border-amber-400 text-amber-600 bg-amber-50/40'
              : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Clock size={13} />
            Awaiting Payout
            {unpaid.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeTab === 'awaiting' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                }`}>
                {unpaid.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('paid')}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-widest transition border-b-2 ${activeTab === 'paid'
              ? 'border-emerald-400 text-emerald-600 bg-emerald-50/40'
              : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
          >
            <Banknote size={13} />
            Paid Out
            {paid.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeTab === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                {paid.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'awaiting' ? (
          <ReferralTable referrals={unpaid} emptyText="No unpaid referrals — you're all caught up!" />
        ) : (
          <ReferralTable referrals={paid} emptyText="No paid referrals yet" />
        )}
      </div>
    </div>
  );
}
