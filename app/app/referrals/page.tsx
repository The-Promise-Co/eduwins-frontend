'use client';

import { useState, ReactElement } from 'react';
import { useUser } from '@/misc/context/UserContext';
import { Users, Copy, Check, Gift, Banknote, Clock, Loader2 } from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import StatCard from '@/misc/components/StatCard';
import { useMyReferrals } from '@/misc/hooks/api/referrals';
import type { ReferralItem } from '@/misc/types/referrals';

const formatDate = (value?: string | null) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-NG', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value));
};

const getPendingReward = (referral: ReferralItem) => {
  if (referral.rewardAmount) return Number(referral.rewardAmount);
  if (referral.subscription) return referral.subscription.rewardAmount;
  return referral.pendingRewardEstimates?.monthly?.reward || 0;
};

function ReferralTable({ referrals, emptyText }: { referrals: ReferralItem[]; emptyText: string }) {
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
          {referrals.map((ref) => {
            const name = ref.referee?.name || 'Unknown User';
            const reward = getPendingReward(ref);
            return (
            <tr key={ref.id} className="hover:bg-gray-50/50 transition-colors">
              <td className="py-4 px-6">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-[#001A72]/10 text-[#001A72] text-[10px] font-black flex items-center justify-center shrink-0">
                    {name.charAt(0)}
                  </div>
                  <span className="text-xs font-bold text-gray-800">{name}</span>
                </div>
              </td>
              <td className="py-4 px-6 text-xs text-gray-500 capitalize">{ref.referee?.role || '—'}</td>
              <td className="py-4 px-6 text-xs text-gray-500">
                <span>{formatDate(ref.referee?.joinedAt || ref.createdAt)}</span>
                {ref.rewardCredited && ref.rewardedAt && (
                  <p className="text-[10px] text-gray-400 mt-0.5">Credited: {formatDate(ref.rewardedAt)}</p>
                )}
              </td>
              <td className="py-4 px-6 text-center">
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${ref.status === 'subscribed'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-100'
                  }`}>
                  {ref.status === 'subscribed' ? 'Active' : 'Pending'}
                </span>
              </td>
              <td className="py-4 px-6 text-right text-xs font-black text-purple-600">
                ₦{reward.toLocaleString()}
              </td>
            </tr>
          );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function ReferralsPage(): ReactElement {
  const { user } = useUser();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'awaiting' | 'paid'>('awaiting');
  const referralsQuery = useMyReferrals();

  const referralCode =
    (user as any)?.referralCode || 'EDU-' + (user?.id?.slice(0, 6).toUpperCase() ?? 'XXXXXX');
  const referralLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${referralCode}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const referrals = referralsQuery.data?.referrals || [];
  const summary = referralsQuery.data?.summary || {
    total: 0,
    pending: 0,
    subscribed: 0,
    totalRewardCredited: 0,
    pendingRewardEstimate: 0,
  };
  const paid = referrals.filter((r) => r.rewardCredited);
  const unpaid = referrals.filter((r) => !r.rewardCredited);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Referrals"
        subtitle="Invite friends and earn rewards for every successful signup"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Referred" value={String(summary.total)} icon={Users} color="text-[#001A72]" bg="bg-[#001A72]/5" />
        <StatCard label="Awaiting Reward" value={String(unpaid.length)} icon={Clock} color="text-amber-600" bg="bg-amber-50" />
        <StatCard label="Total Credited" value={`₦${summary.totalRewardCredited.toLocaleString()}`} icon={Banknote} color="text-emerald-600" bg="bg-emerald-50" />
        <StatCard label="Potential Earnings" value={`₦${summary.pendingRewardEstimate.toLocaleString()}`} icon={Gift} color="text-purple-600" bg="bg-purple-50" />
      </div>

      {/* Referral Link */}
      <div className="bg-gradient-to-br from-[#001A72] to-[#002aad] rounded-2xl p-6 text-white">
        <p className="text-xs font-black uppercase tracking-widest text-white/50 mb-1">Your Referral Link</p>
        <p className="text-lg font-black mb-4">Share &amp; Earn when referred users subscribe</p>
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
          Rewards are credited when someone signs up with your link and completes their first subscription.
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
            Awaiting Reward
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
            Credited
            {paid.length > 0 && (
              <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[9px] font-black ${activeTab === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'
                }`}>
                {paid.length}
              </span>
            )}
          </button>
        </div>

        {referralsQuery.isLoading || referralsQuery.isPending ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-[#001A72]" />
          </div>
        ) : activeTab === 'awaiting' ? (
          <ReferralTable referrals={unpaid} emptyText="No referrals awaiting rewards" />
        ) : (
          <ReferralTable referrals={paid} emptyText="No credited referrals yet" />
        )}
      </div>
    </div>
  );
}
