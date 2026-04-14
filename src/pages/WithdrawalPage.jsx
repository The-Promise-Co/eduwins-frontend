import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Clock, XCircle, Plus, Eye, EyeOff } from 'lucide-react';
import api from '../services/api';

const WithdrawalPage = () => {
  const [activeTab, setActiveTab] = useState('balance'); // balance, withdraw, history
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Balance section state
  const [balanceData, setBalanceData] = useState(null);
  const [showBalance, setShowBalance] = useState(false);

  // Withdrawal form state
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    bankCode: '',
    accountNumber: '',
    accountName: '',
    narration: '',
  });
  const [banks, setBanks] = useState([]);
  const [selectedBank, setSelectedBank] = useState('');

  // History state
  const [withdrawalHistory, setWithdrawalHistory] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [historyStats, setHistoryStats] = useState(null);

  // Fetch available balance on mount
  useEffect(() => {
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

  const fetchWithdrawalHistory = async (status = '') => {
    try {
      setLoading(true);
      const params = status ? { status } : {};
      const response = await api.get('/withdrawals/history', { params });
      setWithdrawalHistory(response.data.withdrawals || []);
      setHistoryStats(response.data.stats || {});
      setError('');
    } catch (err) {
      setError('Failed to fetch withdrawal history');
      console.error('Fetch history error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalFormChange = (e) => {
    const { name, value } = e.target;
    setWithdrawalForm(prev => ({
      ...prev,
      [name]: value,
    }));
    setError('');
  };

  const handleBankSelect = (e) => {
    const code = e.target.value;
    setSelectedBank(code);
    setWithdrawalForm(prev => ({
      ...prev,
      bankCode: code,
    }));
  };

  const submitWithdrawal = async (e) => {
    e.preventDefault();
    try {
      if (!withdrawalForm.amount || !withdrawalForm.bankCode || !withdrawalForm.accountNumber || !withdrawalForm.accountName) {
        setError('Please fill in all required fields');
        return;
      }

      const amount = parseFloat(withdrawalForm.amount);
      if (amount < balanceData?.minWithdrawal) {
        setError(`Minimum withdrawal is ₦${balanceData?.minWithdrawal.toLocaleString()}`);
        return;
      }

      if (amount > balanceData?.maxWithdrawal) {
        setError(`Maximum withdrawal per request is ₦${balanceData?.maxWithdrawal.toLocaleString()}`);
        return;
      }

      if (amount > balanceData?.availableBalance) {
        setError(`Insufficient balance. Available: ₦${balanceData?.availableBalance.toLocaleString()}`);
        return;
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

      // Refresh balance
      setTimeout(() => {
        fetchAvailableBalance();
        setActiveTab('history');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to initiate withdrawal');
      console.error('Withdrawal error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelWithdrawal = async (withdrawalId) => {
    if (!window.confirm('Are you sure you want to cancel this withdrawal request?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await api.delete(`/withdrawals/${withdrawalId}/cancel`);
      setSuccess(response.data.message);
      fetchWithdrawalHistory(filterStatus);
      fetchAvailableBalance();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to cancel withdrawal');
      console.error('Cancel withdrawal error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">💰 Withdraw Funds</h1>
          <p className="text-slate-600">Manage your accessible funds and cash out your earnings</p>
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
        <div className="flex gap-2 mb-8 bg-white rounded-lg shadow-sm p-2">
          <button
            onClick={() => setActiveTab('balance')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'balance'
                ? 'bg-blue-600 text-white'
                : 'bg-transparent text-slate-700 hover:bg-slate-100'
            }`}
          >
            📊 Available Balance
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'withdraw'
                ? 'bg-blue-600 text-white'
                : 'bg-transparent text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Plus size={18} className="inline mr-2" />
            Withdraw
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 rounded-lg font-medium transition ${
              activeTab === 'history'
                ? 'bg-blue-600 text-white'
                : 'bg-transparent text-slate-700 hover:bg-slate-100'
            }`}
          >
            📝 Withdrawal History
          </button>
        </div>

        {/* Balance Tab */}
        {activeTab === 'balance' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Available Balance Card */}
            <div className="bg-white rounded-lg shadow-lg p-8 border-t-4 border-blue-600">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Available Balance</p>
                  <div className="flex items-center gap-3 mt-2">
                    <h2 className="text-4xl font-bold text-blue-600">
                      {balanceData && showBalance
                        ? `₦${balanceData.availableBalance.toLocaleString()}`
                        : balanceData
                        ? '₦••••••••'
                        : 'Loading...'}
                    </h2>
                    <button
                      onClick={() => setShowBalance(!showBalance)}
                      className="p-2 hover:bg-slate-100 rounded-lg transition"
                    >
                      {showBalance ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>
                <div className="text-green-500 text-3xl">✓</div>
              </div>
              <button
                onClick={() => setActiveTab('withdraw')}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition"
              >
                Withdraw Now
              </button>
            </div>

            {/* Breakdown Card */}
            <div className="bg-white rounded-lg shadow-lg p-8">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Balance Breakdown</h3>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-slate-50 rounded-lg">
                  <div>
                    <p className="text-slate-600 text-sm">Total Earnings</p>
                    <p className="text-slate-900 font-semibold">
                      ₦{balanceData?.totalAcquired.toLocaleString() || '0'}
                    </p>
                  </div>
                  <div className="text-2xl">💵</div>
                </div>

                <div className="space-y-2 border-t pt-4">
                  <div className="text-sm text-slate-600">Deductions:</div>

                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-slate-700 text-sm">Welfare Fund (10%)</p>
                      <p className="text-sm text-slate-600">Saved for later</p>
                    </div>
                    <p className="font-semibold text-red-600">
                      -₦{balanceData?.deductions.welfareFund.toLocaleString() || '0'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="text-slate-700 text-sm">Mortgage Payment</p>
                      <p className="text-sm text-slate-600">Monthly commitment</p>
                    </div>
                    <p className="font-semibold text-red-600">
                      -₦{balanceData?.deductions.mortgagePayment.toLocaleString() || '0'}
                    </p>
                  </div>

                  <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="text-slate-700 text-sm">Reserved (Pending)</p>
                      <p className="text-sm text-slate-600">Under processing</p>
                    </div>
                    <p className="font-semibold text-orange-600">
                      -₦{balanceData?.deductions.reserved.toLocaleString() || '0'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Limits & Info Card */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-lg p-8 col-span-1 md:col-span-2 border-l-4 border-blue-600">
              <h3 className="text-lg font-bold text-slate-900 mb-6">Withdrawal Limits & Info</h3>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg p-4">
                  <p className="text-slate-600 text-xs font-medium">Min. Per Request</p>
                  <p className="text-lg font-bold text-slate-900">
                    ₦{balanceData?.minWithdrawal.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-slate-600 text-xs font-medium">Max. Per Request</p>
                  <p className="text-lg font-bold text-slate-900">
                    ₦{balanceData?.maxWithdrawal.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-slate-600 text-xs font-medium">Processing Fee</p>
                  <p className="text-lg font-bold text-slate-900">{balanceData?.processingFee}</p>
                </div>

                <div className="bg-white rounded-lg p-4">
                  <p className="text-slate-600 text-xs font-medium">Est. Processing Time</p>
                  <p className="text-lg font-bold text-slate-900">
                    {balanceData?.estimatedProcessingTime}
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-blue-500 bg-opacity-10 border border-blue-300 rounded-lg">
                <p className="text-blue-900 text-sm">
                  <strong>ℹ️ Note:</strong> Your welfare fund (₦{balanceData?.deductions.welfareFund.toLocaleString()}) is reserved for housing and cannot be withdrawn. It will be used as your down payment if you pursue the housing program.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Withdraw Tab */}
        {activeTab === 'withdraw' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-lg p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6">Request Withdrawal</h3>

                <form onSubmit={submitWithdrawal} className="space-y-6">
                  {/* Amount */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-2">
                      Withdrawal Amount *
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-3 text-slate-500 font-semibold">₦</span>
                      <input
                        type="number"
                        name="amount"
                        value={withdrawalForm.amount}
                        onChange={handleWithdrawalFormChange}
                        placeholder="Enter amount"
                        className="w-full pl-8 pr-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        step="1000"
                        min={balanceData?.minWithdrawal}
                        max={balanceData?.maxWithdrawal}
                      />
                    </div>
                    <p className="text-xs text-slate-600 mt-2">
                      Min: ₦{balanceData?.minWithdrawal.toLocaleString()}, Max: ₦{balanceData?.maxWithdrawal.toLocaleString()}
                    </p>

                    {withdrawalForm.amount && (
                      <div className="mt-3 p-3 bg-slate-50 rounded-lg">
                        <div className="flex justify-between text-sm mb-2">
                          <span>Gross Amount:</span>
                          <span className="font-semibold">₦{parseInt(withdrawalForm.amount).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-sm text-red-600 mb-2">
                          <span>Processing Fee ({balanceData?.processingFee}):</span>
                          <span className="font-semibold">
                            -₦{Math.round((parseInt(withdrawalForm.amount) * 1) / 100).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm font-bold border-t pt-2">
                          <span>Net Amount (You'll receive):</span>
                          <span className="text-green-600">
                            ₦{(parseInt(withdrawalForm.amount) - Math.round((parseInt(withdrawalForm.amount) * 1) / 100)).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Bank Selection */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-2">
                      Select Bank *
                    </label>
                    <select
                      name="bankCode"
                      value={selectedBank}
                      onChange={handleBankSelect}
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Choose a bank...</option>
                      {banks.map(bank => (
                        <option key={bank.code} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account Number */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-2">
                      Account Number *
                    </label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={withdrawalForm.accountNumber}
                      onChange={handleWithdrawalFormChange}
                      placeholder="Enter your account number"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Account Name */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-2">
                      Account Name *
                    </label>
                    <input
                      type="text"
                      name="accountName"
                      value={withdrawalForm.accountName}
                      onChange={handleWithdrawalFormChange}
                      placeholder="Enter account holder's name"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Narration */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-2">
                      Description (Optional)
                    </label>
                    <input
                      type="text"
                      name="narration"
                      value={withdrawalForm.narration}
                      onChange={handleWithdrawalFormChange}
                      placeholder="e.g., Salary withdrawal"
                      className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-bold py-3 px-6 rounded-lg transition"
                  >
                    {loading ? 'Processing...' : 'Request Withdrawal'}
                  </button>
                </form>
              </div>
            </div>

            {/* Info Sidebar */}
            <div>
              <div className="bg-blue-50 rounded-lg shadow-lg p-6 border-l-4 border-blue-600 sticky top-6">
                <h4 className="font-bold text-slate-900 mb-4">ℹ️ Important Info</h4>

                <div className="space-y-4 text-sm text-slate-700">
                  <div>
                    <p className="font-semibold text-slate-900 mb-1">🏦 Bank Details</p>
                    <p className="text-xs">Your account details are secured and used only for this transfer.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900 mb-1">⏱️ Processing Time</p>
                    <p className="text-xs">Withdrawals are typically processed within 24 hours.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900 mb-1">💳 Processing Fee</p>
                    <p className="text-xs">A 1% processing fee is deducted from your withdrawal.</p>
                  </div>

                  <div>
                    <p className="font-semibold text-slate-900 mb-1">🔒 Security</p>
                    <p className="text-xs">Your withdrawal is processed through Paystack, a secure payment platform.</p>
                  </div>

                  <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="font-semibold text-yellow-900 text-xs">⚠️ No partial withdrawals</p>
                    <p className="text-xs text-yellow-800 mt-1">Withdrawal requests cannot be split or edited once submitted.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            {historyStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                  <p className="text-slate-600 text-sm font-medium">Total Withdrawn</p>
                  <p className="text-3xl font-bold text-green-600">
                    ₦{historyStats.total_withdrawn.toLocaleString()}
                  </p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                  <p className="text-slate-600 text-sm font-medium">Pending</p>
                  <p className="text-3xl font-bold text-blue-600">{historyStats.pending_count}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                  <p className="text-slate-600 text-sm font-medium">Failed</p>
                  <p className="text-3xl font-bold text-red-600">{historyStats.failed_count}</p>
                </div>

                <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                  <p className="text-slate-600 text-sm font-medium">Total Fees Paid</p>
                  <p className="text-3xl font-bold text-orange-600">
                    ₦{historyStats.total_processing_fees.toLocaleString()}
                  </p>
                </div>
              </div>
            )}

            {/* Filter */}
            <div className="flex gap-2">
              {['', 'pending', 'processing', 'completed', 'failed'].map(status => (
                <button
                  key={status}
                  onClick={() => {
                    setFilterStatus(status);
                    fetchWithdrawalHistory(status);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filterStatus === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
                </button>
              ))}
            </div>

            {/* Withdrawal List */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {loading ? (
                <div className="p-8 text-center text-slate-600">Loading...</div>
              ) : withdrawalHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-slate-600 mb-4">No withdrawals found</p>
                  <button
                    onClick={() => setActiveTab('withdraw')}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg"
                  >
                    Make Your First Withdrawal
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Amount</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Fee</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Net</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Bank</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {withdrawalHistory.map(withdrawal => (
                        <tr key={withdrawal.withdrawal_id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 text-sm text-slate-900">
                            {new Date(withdrawal.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-slate-900">
                            ₦{withdrawal.amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-red-600">
                            ₦{withdrawal.processing_fee.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-600">
                            ₦{withdrawal.net_amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-600">
                            ****{withdrawal.account_number}
                          </td>
                          <td className="px-6 py-4">{getStatusBadge(withdrawal.status)}</td>
                          <td className="px-6 py-4">
                            {withdrawal.status === 'pending' && (
                              <button
                                onClick={() => handleCancelWithdrawal(withdrawal.withdrawal_id)}
                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                              >
                                Cancel
                              </button>
                            )}
                            {withdrawal.status === 'completed' && (
                              <span className="text-green-600 text-sm font-medium">✓ Complete</span>
                            )}
                            {withdrawal.status === 'failed' && (
                              <span className="text-red-600 text-sm">Retry</span>
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
};

export default WithdrawalPage;
