'use client';

import React, { useState, useEffect, ReactElement } from 'react';
import { AlertCircle, CheckCircle, Clock, XCircle, Plus, Eye, EyeOff, LucideIcon } from 'lucide-react';
import api from '../../src/services/api';
import DashboardNavigation from '../../components/DashboardNavigation';
import { User } from '@/src/types';

interface BalanceData {
  availableBalance: number;
  totalAcquired: number;
  minWithdrawal: number;
  maxWithdrawal: number;
  processingFee: string;
  estimatedProcessingTime: string;
  deductions: {
    welfareFund: number;
    mortgagePayment: number;
    reserved: number;
  };
}

interface Bank {
  code: string;
  name: string;
}

interface Withdrawal {
  withdrawal_id: string;
  amount: number;
  net_amount: number;
  account_number: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  created_at: string;
}

interface HistoryStats {
  total_withdrawn: number;
  pending_count: number;
  failed_count: number;
  total_processing_fees: number;
}

interface WithdrawalForm {
  amount: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
  narration: string;
}

export default function WithdrawalPage(): ReactElement {
  const [activeTab, setActiveTab] = useState<string>('balance'); // balance, withdraw, history
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');
  const [user, setUser] = useState<User | null>(null);

  // Balance section state
  const [balanceData, setBalanceData] = useState<BalanceData | null>(null);
  const [showBalance, setShowBalance] = useState<boolean>(false);

  // Withdrawal form state
  const [withdrawalForm, setWithdrawalForm] = useState<WithdrawalForm>({
    amount: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
    narration: '',
  });
  const [banks, setBanks] = useState<Bank[]>([]);
  const [selectedBank, setSelectedBank] = useState<string>('');

  // History state
  const [withdrawalHistory, setWithdrawalHistory] = useState<Withdrawal[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [historyStats, setHistoryStats] = useState<HistoryStats | null>(null);

  // Fetch available balance on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const userData = localStorage.getItem('user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    }
    fetchAvailableBalance();
    fetchBanks();
  }, []);

  // Fetch balance whenever tab changes to balance
  useEffect(() => {
    if (activeTab === 'balance') {
      fetchAvailableBalance();
    } else if (activeTab === 'history') {
      fetchWithdrawalHistory();
    }
  }, [activeTab]);

  const fetchAvailableBalance = async () => {
    try {
      setLoading(true);
      const response = await api.get('/withdrawals/available-balance');
      setBalanceData(response.data);
      setError('');
    } catch (err) {
      setError('Failed to fetch balance information');
      console.error('Fetch balance error:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await api.get('/withdrawals/banks/list');
      setBanks(response.data.banks || []);
    } catch (err) {
      console.error('Fetch banks error:', err);
    }
  };

  const fetchWithdrawalHistory = async (status: string = '') => {
    try {
      setLoading(true);
      const params = status ? { status } : {};
      const response = await api.get('/withdrawals/history', { params });
      setWithdrawalHistory(response.data.withdrawals || []);
      setHistoryStats(response.data.stats || null);
      setError('');
    } catch (err) {
      setError('Failed to fetch withdrawal history');
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setWithdrawalForm(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleBankSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const code = e.target.value;
    setSelectedBank(code);
    setWithdrawalForm(prev => ({
      ...prev,
      bankCode: code,
    }));
  };

  const submitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!withdrawalForm.amount || !withdrawalForm.bankCode || !withdrawalForm.accountNumber || !withdrawalForm.accountName) {
        setError('Please fill in all required fields');
        return;
      }

      const amount = parseFloat(withdrawalForm.amount);
      if (balanceData) {
        if (amount < balanceData.minWithdrawal) {
          setError(`Minimum withdrawal is ₦${balanceData.minWithdrawal.toLocaleString()}`);
          return;
        }

        if (amount > balanceData.maxWithdrawal) {
          setError(`Maximum withdrawal per request is ₦${balanceData.maxWithdrawal.toLocaleString()}`);
          return;
        }

        if (amount > balanceData.availableBalance) {
          setError(`Insufficient balance. Available: ₦${balanceData.availableBalance.toLocaleString()}`);
          return;
        }
      }

      setLoading(true);
      const response = await api.post('/withdrawals/initiate', {
        amount,
        bankCode: withdrawalForm.bankCode,
        accountNumber: withdrawalForm.accountNumber,
        accountName: withdrawalForm.accountName,
        narration: withdrawalForm.narration,
      });

      setSuccess(response.data.message);
      setWithdrawalForm({
        amount: '',
        bankCode: '',
        accountNumber: '',
        accountName: '',
        narration: '',
      });
      setSelectedBank('');

      // Refresh balance and switch to history
      setTimeout(() => {
        fetchAvailableBalance();
        setActiveTab('history');
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to initiate withdrawal');
      console.error('Withdrawal error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWithdrawal = async (withdrawalId: string) => {
    if (!window.confirm('Are you sure you want to cancel this withdrawal request?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.delete(`/withdrawals/${withdrawalId}/cancel`);
      setSuccess(response.data.message);
      fetchWithdrawalHistory(filterStatus);
      fetchAvailableBalance();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to cancel withdrawal');
      console.error('Cancel withdrawal error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: Withdrawal['status']) => {
    const statusConfig: Record<Withdrawal['status'], { bg: string, text: string, icon: LucideIcon }> = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: Clock },
      processing: { bg: 'bg-blue-100', text: 'text-blue-800', icon: Clock },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: XCircle },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', icon: XCircle },
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <div className={`flex items-center gap-2 px-3 py-1 rounded-full ${config.bg} ${config.text} text-sm font-medium`}>
        <Icon size={16} />
        <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation user={user} />
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#001A72] mb-2">💰 Withdraw Funds</h1>
          <p className="text-gray-600">Manage your accessible funds and cash out your earnings</p>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex gap-3">
            <AlertCircle className="text-red-500 flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold text-red-800">Error</p>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 rounded-lg flex gap-3">
            <CheckCircle className="text-green-500 flex-shrink-0" size={20} />
            <div>
              <p className="font-semibold text-green-800">Success</p>
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 bg-white rounded-lg shadow-sm p-2 border border-gray-100">
          <button
            onClick={() => setActiveTab('balance')}
            className={`px-6 py-3 rounded-lg font-bold transition flex-1 ${
              activeTab === 'balance'
                ? 'bg-[#001A72] text-white'
                : 'bg-transparent text-[#001A72] hover:bg-gray-50'
            }`}
          >
            Available Balance
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`px-6 py-3 rounded-lg font-bold transition flex-1 ${
              activeTab === 'withdraw'
                ? 'bg-[#001A72] text-white'
                : 'bg-transparent text-[#001A72] hover:bg-gray-50'
            }`}
          >
            <Plus size={18} className="inline mr-2" />
            Withdraw
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-lg font-bold transition flex-1 ${
              activeTab === 'history'
                ? 'bg-[#001A72] text-white'
                : 'bg-transparent text-[#001A72] hover:bg-gray-50'
            }`}
          >
            Withdrawal History
          </button>
        </div>

        {/* Balance Tab */}
        {activeTab === 'balance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-8 border-t-8 border-[#001A72]">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-gray-600 text-sm font-bold uppercase tracking-wider">Available Balance</p>
                  <div className="flex items-center gap-3 mt-2">
                    <h2 className="text-4xl font-black text-[#001A72]">
                      {balanceData && showBalance
                        ? `₦${balanceData.availableBalance.toLocaleString()}`
                        : balanceData
                        ? '₦••••••••'
                        : 'Loading...'}
                    </h2>
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                      {showBalance ? <EyeOff size={24} /> : <Eye size={24} />}
                    </button>
                  </div>
                </div>
                <div className="text-[#FFB81C] text-5xl">🏦</div>
              </div>
              <button
                onClick={() => setActiveTab('withdraw')}
                className="w-full bg-[#FFB81C] hover:bg-[#FFB81C]/90 text-[#001A72] font-black py-4 px-6 rounded-xl transition shadow-md hover:shadow-lg text-lg"
              >
                Withdraw Now
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
              <h3 className="text-xl font-black text-[#001A72] mb-6">Balance Breakdown</h3>
              <div className="space-y-4">
                <BreakdownItem label="Total Earnings" value={balanceData?.totalAcquired} icon="💰" color="text-gray-900" />
                <div className="border-t pt-4">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Deductions & Reserves</p>
                  <BreakdownItem 
                    label="Welfare Fund (10%)" 
                    value={balanceData?.deductions.welfareFund} 
                    icon="🏥" 
                    color="text-red-500" 
                    subtitle="Saved for housing program"
                  />
                  <BreakdownItem 
                    label="Mortgage Payment" 
                    value={balanceData?.deductions.mortgagePayment} 
                    icon="🏠" 
                    color="text-red-500" 
                  />
                  <BreakdownItem 
                    label="Reserved (Pending)" 
                    value={balanceData?.deductions.reserved} 
                    icon="⏳" 
                    color="text-orange-500" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-[#001A72] to-[#001A72]/90 rounded-2xl shadow-xl p-8 col-span-1 md:col-span-2 text-white">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <span>⚡</span> Withdrawal Limits & Information
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <LimitItem label="Min. Request" value={balanceData ? `₦${balanceData.minWithdrawal.toLocaleString()}` : ''} />
                <LimitItem label="Max. Request" value={balanceData ? `₦${balanceData.maxWithdrawal.toLocaleString()}` : ''} />
                <LimitItem label="Processing Fee" value={balanceData?.processingFee} />
                <LimitItem label="ETA" value={balanceData?.estimatedProcessingTime} />
              </div>
              <div className="mt-8 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                <p className="text-sm">
                  <strong>Note:</strong> Your welfare fund (₦{balanceData?.deductions.welfareFund.toLocaleString()}) is automatically reserved for the teacher housing program and cannot be withdrawn as cash.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Tab */}
        {activeTab === 'withdraw' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
                <h3 className="text-2xl font-black text-[#001A72] mb-6">Request Withdrawal</h3>
                <form onSubmit={submitWithdrawal} className="space-y-6">
                  <div>
                    <label className="block text-[#001A72] font-bold mb-2">Withdrawal Amount (₦) *</label>
                    <input
                      type="number"
                      name="amount"
                      value={withdrawalForm.amount}
                      onChange={handleWithdrawalFormChange}
                      placeholder="Enter amount"
                      className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FFB81C] transition text-xl font-bold"
                      min={balanceData?.minWithdrawal}
                      max={balanceData?.maxWithdrawal}
                    />
                    {withdrawalForm.amount && (
                      <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Processing Fee (1%):</span>
                          <span className="font-bold text-red-500">-₦{Math.round((parseInt(withdrawalForm.amount) * 1) / 100).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-lg font-black border-t pt-2">
                          <span className="text-[#001A72]">You'll Receive:</span>
                          <span className="text-green-600">₦{(parseInt(withdrawalForm.amount) - Math.round((parseInt(withdrawalForm.amount) * 1) / 100)).toLocaleString()}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-[#001A72] font-bold mb-2">Select Bank *</label>
                      <select
                        name="bankCode"
                        value={selectedBank}
                        onChange={handleBankSelect}
                        className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FFB81C] transition font-bold"
                      >
                        <option value="">Choose a bank...</option>
                        {banks.map(bank => (
                          <option key={bank.code} value={bank.code}>{bank.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[#001A72] font-bold mb-2">Account Number *</label>
                      <input
                        type="text"
                        name="accountNumber"
                        value={withdrawalForm.accountNumber}
                        onChange={handleWithdrawalFormChange}
                        placeholder="0000000000"
                        className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FFB81C] transition font-bold tracking-widest"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[#001A72] font-bold mb-2">Account Name *</label>
                    <input
                      type="text"
                      name="accountName"
                      value={withdrawalForm.accountName}
                      onChange={handleWithdrawalFormChange}
                      placeholder="Account holder's full name"
                      className="w-full px-4 py-4 border-2 border-gray-100 rounded-xl focus:outline-none focus:border-[#FFB81C] transition font-bold"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#001A72] hover:bg-[#001A72]/90 disabled:bg-gray-300 text-white font-black py-5 px-6 rounded-xl transition shadow-lg text-lg"
                  >
                    {loading ? 'Processing Transaction...' : 'Confirm Withdrawal Request'}
                  </button>
                </form>
              </div>
            </div>

            <div className="space-y-6">
              <div className="bg-[#FFB81C]/10 border-2 border-[#FFB81C]/20 rounded-2xl p-6">
                <h4 className="font-black text-[#001A72] mb-4 flex items-center gap-2">
                   <span>🛡️</span> Security Tips
                </h4>
                <ul className="space-y-3 text-sm text-[#001A72]/80">
                  <li className="flex gap-2"><span>•</span> Always verify account name matches your registered name.</li>
                  <li className="flex gap-2"><span>•</span> We never ask for your PIN via phone or email.</li>
                  <li className="flex gap-2"><span>•</span> Transactions are processed only to verified bank accounts.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {historyStats && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <HistoryStat label="Total Withdrawn" value={`₦${historyStats.total_withdrawn.toLocaleString()}`} color="text-green-600" />
                <HistoryStat label="Pending Requests" value={historyStats.pending_count.toString()} color="text-blue-600" />
                <HistoryStat label="Failed Syncs" value={historyStats.failed_count.toString()} color="text-red-600" />
                <HistoryStat label="Total Fees" value={`₦${historyStats.total_processing_fees.toLocaleString()}`} color="text-orange-600" />
              </div>
            )}

            <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
               <div className="p-6 bg-gray-50 border-b flex justify-between items-center">
                  <h3 className="font-black text-[#001A72]">Recent Transactions</h3>
                  <div className="flex gap-2">
                    {['', 'pending', 'completed', 'failed'].map(status => (
                      <button
                        key={status}
                        onClick={() => {
                          setFilterStatus(status);
                          fetchWithdrawalHistory(status);
                        }}
                        className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                          filterStatus === status ? 'bg-[#001A72] text-white' : 'bg-white text-gray-500 border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {status ? status.toUpperCase() : 'ALL'}
                      </button>
                    ))}
                  </div>
               </div>
              
              {loading ? (
                <div className="p-20 text-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto"></div></div>
              ) : withdrawalHistory.length === 0 ? (
                <div className="p-20 text-center">
                   <p className="text-gray-500 font-bold mb-4">No withdrawal history found.</p>
                   <button onClick={() => setActiveTab('withdraw')} className="bg-[#001A72] text-white px-6 py-2 rounded-lg font-bold">Start a withdrawal</button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-[#001A72]/5">
                      <tr className="text-[#001A72] text-left text-xs font-black uppercase tracking-widest">
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Total Amount</th>
                        <th className="px-6 py-4">Net Payout</th>
                        <th className="px-6 py-4">Target Bank</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {withdrawalHistory.map(withdrawal => (
                        <tr key={withdrawal.withdrawal_id} className="hover:bg-gray-50 transition cursor-default">
                          <td className="px-6 py-4 text-sm font-medium text-gray-600">{new Date(withdrawal.created_at).toLocaleDateString()}</td>
                          <td className="px-6 py-4 text-sm font-black text-[#001A72]">₦{withdrawal.amount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm font-bold text-green-600">₦{withdrawal.net_amount.toLocaleString()}</td>
                          <td className="px-6 py-4 text-sm text-gray-600">****{withdrawal.account_number}</td>
                          <td className="px-6 py-4">{getStatusBadge(withdrawal.status)}</td>
                          <td className="px-6 py-4">
                            {withdrawal.status === 'pending' && (
                              <button
                                onClick={() => handleCancelWithdrawal(withdrawal.withdrawal_id)}
                                className="text-red-600 hover:text-red-800 font-black text-xs uppercase tracking-tighter"
                              >
                                Cancel Request
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface BreakdownItemProps {
  label: string;
  value?: number;
  icon: string;
  color: string;
  subtitle?: string;
}

function BreakdownItem({ label, value, icon, color, subtitle }: BreakdownItemProps): ReactElement {
  return (
    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 mb-2">
      <div className="flex items-center gap-3">
        <span className="text-xl">{icon}</span>
        <div>
          <p className="text-sm font-bold text-gray-800 leading-none mb-1">{label}</p>
          {subtitle && <p className="text-[10px] text-gray-500 font-medium leading-none">{subtitle}</p>}
        </div>
      </div>
      <p className={`font-black ${color}`}>₦{value?.toLocaleString() || '0'}</p>
    </div>
  );
}

interface LimitItemProps {
  label: string;
  value?: string;
}

function LimitItem({ label, value }: LimitItemProps): ReactElement {
  return (
    <div className="bg-white/10 rounded-xl p-4 border border-white/10">
      <p className="text-[10px] font-black uppercase tracking-widest text-white/60 mb-1">{label}</p>
      <p className="text-lg font-black">{value || '...'}</p>
    </div>
  );
}

interface HistoryStatProps {
  label: string;
  value: string;
  color: string;
}

function HistoryStat({ label, value, color }: HistoryStatProps): ReactElement {
  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-gray-100">
      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">{label}</p>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}
