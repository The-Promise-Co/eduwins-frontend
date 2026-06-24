'use client';

import { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User } from '@/misc/types';
import { useMyWallets, useWalletTransactions } from '@/misc/hooks/api/wallets';
import type { Wallet as WalletRecord, WalletTransaction } from '@/misc/types/wallets';
import {
  Wallet,
  Gift,
  HeartPulse,
  Calendar,
  TrendingUp,
  Brain,
  Undo2,
  ArrowDownLeft,
  ArrowUpRight
} from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import StatCard from '@/misc/components/StatCard';

interface HistoryEntry {
  date: string;
  lesson: string;
  student?: string;
  tutor?: string;
  amount: number | string;
  status: 'Completed' | 'Pending' | 'Failed';
}

const formatMoney = (value?: string | number | null) => `₦${Number(value || 0).toLocaleString()}`;

const getWalletLabel = (type: string) => {
  if (type === 'main') return 'Main Wallet';
  if (type === 'referrals') return 'Referral Wallet';
  if (type === 'welfare') return 'Welfare Wallet';
  return 'Wallet';
};

const getWalletIcon = (type: string) => {
  if (type === 'referrals') return Gift;
  if (type === 'welfare') return HeartPulse;
  return Wallet;
};

export default function EarningsPage(): ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedWalletId, setSelectedWalletId] = useState<string | null>(null);
  const walletsQuery = useMyWallets();

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
  const wallets = walletsQuery.data?.wallets || [];
  const selectedWallet = wallets.find((wallet) => wallet.id === selectedWalletId) || wallets[0];
  const walletTransactionsQuery = useWalletTransactions(selectedWallet?.id);
  const walletTransactions = walletTransactionsQuery.data?.transactions || [];
  const mainWallet = wallets.find((wallet) => wallet.walletType === 'main');
  const referralWallet = wallets.find((wallet) => wallet.walletType === 'referrals');
  const welfareWallet = wallets.find((wallet) => wallet.walletType === 'welfare');
  const totalWalletBalance = wallets.reduce((total, wallet) => total + Number(wallet.balance || 0), 0);

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
              <p className="text-[10px] font-black uppercase tracking-widest text-[#001A72]/60 leading-none mb-1">Total Wallet Balance</p>
              <p className="text-lg font-black text-[#001A72] leading-none">{formatMoney(totalWalletBalance)}</p>
            </div>
          </div>
        }
      />

      {isTeacher ? (
        <div className="space-y-6">
          {/* Teacher Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Main Wallet" value={formatMoney(mainWallet?.balance)} color="text-[#001A72]" bg="bg-[#001A72]/5" icon={Wallet} />
            <StatCard label="Referral Wallet" value={formatMoney(referralWallet?.balance)} color="text-emerald-600" bg="bg-emerald-50" icon={Gift} />
            <StatCard label="Welfare Wallet" value={formatMoney(welfareWallet?.balance)} color="text-purple-600" bg="bg-purple-50" icon={HeartPulse} />
            <StatCard label="Wallets" value={String(wallets.length)} color="text-[#001A72]" bg="bg-[#FFB81C]/10" icon={Calendar} />
          </div>

          <WalletSection
            wallets={wallets}
            selectedWallet={selectedWallet}
            selectedWalletId={selectedWallet?.id}
            onSelect={setSelectedWalletId}
            transactions={walletTransactions}
            loading={walletsQuery.isLoading || walletsQuery.isPending || walletTransactionsQuery.isLoading || walletTransactionsQuery.isPending}
          />

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
              <WelfareBox label="Accumulated Total" value={formatMoney(welfareWallet?.balance)} sub="Current welfare wallet balance" />
              <WelfareBox label="Available to Withdraw" value={formatMoney(welfareWallet?.balance)} sub="Subject to welfare withdrawal rules" highlight />
              <WelfareBox label="Locked (Current Period)" value="₦0" sub="No locked wallet amount currently tracked" />
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
            <StatCard label="Referral Wallet" value={formatMoney(referralWallet?.balance)} color="text-purple-600" bg="bg-purple-50" icon={Undo2} />
          </div>

          <WalletSection
            wallets={wallets}
            selectedWallet={selectedWallet}
            selectedWalletId={selectedWallet?.id}
            onSelect={setSelectedWalletId}
            transactions={walletTransactions}
            loading={walletsQuery.isLoading || walletsQuery.isPending || walletTransactionsQuery.isLoading || walletTransactionsQuery.isPending}
          />

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

interface WalletSectionProps {
  wallets: WalletRecord[];
  selectedWallet?: WalletRecord;
  selectedWalletId?: string;
  onSelect: (walletId: string) => void;
  transactions: WalletTransaction[];
  loading: boolean;
}

function WalletSection({ wallets, selectedWallet, selectedWalletId, onSelect, transactions, loading }: WalletSectionProps): ReactElement {
  return (
    <div className="grid lg:grid-cols-[320px_1fr] gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="px-1 pb-2">
          <h2 className="text-sm font-black text-[#001A72] uppercase tracking-widest">Wallets</h2>
          <p className="text-xs text-gray-500 mt-1">Referral rewards appear only after the referred user subscribes.</p>
        </div>

        {wallets.length === 0 ? (
          <div className="text-sm text-gray-500 border border-dashed border-gray-200 rounded-xl p-4 text-center">
            No wallets available yet.
          </div>
        ) : wallets.map((wallet) => {
          const Icon = getWalletIcon(wallet.walletType);
          const active = selectedWalletId === wallet.id;
          return (
            <button
              key={wallet.id}
              type="button"
              onClick={() => onSelect(wallet.id)}
              className={`w-full text-left rounded-2xl border p-4 transition ${active
                ? 'border-[#001A72] bg-[#001A72]/5 shadow-sm'
                : 'border-gray-100 hover:border-[#001A72]/30 hover:bg-gray-50'
                }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="h-10 w-10 rounded-xl bg-[#FFB81C]/15 text-[#001A72] flex items-center justify-center shrink-0">
                    <Icon size={18} />
                  </span>
                  <div className="min-w-0">
                    <p className="font-black text-sm text-[#001A72] truncate">{getWalletLabel(wallet.walletType)}</p>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">{wallet.currency}</p>
                  </div>
                </div>
                <p className="font-black text-sm text-gray-900 shrink-0">{formatMoney(wallet.balance)}</p>
              </div>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Wallet Transactions</h2>
            <p className="text-xs text-gray-500 mt-1">{selectedWallet ? getWalletLabel(selectedWallet.walletType) : 'Select a wallet'}</p>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-sm text-gray-500">Loading wallet transactions...</div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-sm text-gray-500">No wallet transactions yet.</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {transactions.map((transaction) => {
              const isCredit = transaction.direction === 'credit';
              return (
                <div key={transaction.id} className="px-6 py-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`h-10 w-10 rounded-2xl flex items-center justify-center ${isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                      {isCredit ? <ArrowDownLeft size={18} /> : <ArrowUpRight size={18} />}
                    </span>
                    <div className="min-w-0">
                      <p className="font-bold text-sm text-gray-900 truncate">{transaction.description || transaction.type.replaceAll('_', ' ')}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {transaction.createdAt ? new Date(transaction.createdAt).toLocaleString() : 'Recently'}
                      </p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className={`font-black ${isCredit ? 'text-emerald-600' : 'text-red-600'}`}>
                      {isCredit ? '+' : '-'}{formatMoney(transaction.amount)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">Bal: {formatMoney(transaction.balanceAfter)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function WelfareBox({ label, value, sub, highlight }: WelfareBoxProps): ReactElement {
  return (
    <div className={`p-6 rounded-xl border ${highlight
      ? 'bg-[#001A72] text-white border-[#001A72] shadow-lg'
      : 'bg-[#001A72]/5 text-[#001A72] border-[#001A72]/10'
      }`}>
      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${highlight ? 'text-white/60' : 'text-[#001A72]/50'
        }`}>{label}</p>
      <p className="text-2xl font-black mb-1">{value}</p>
      <p className={`text-[10px] font-medium ${highlight ? 'text-white/50' : 'text-gray-500'
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
