'use client';

import { useEffect, useState } from 'react';
import { X, Loader2, Landmark, Wallet, ShieldCheck } from 'lucide-react';
import {
  usePayoutAccount,
  useAvailableBalance,
  useBanks,
  useValidateAccount,
  useSavePayoutAccount,
  useRequestPayout,
} from '@/misc/hooks/api/payouts';
import SearchableSelect from '@/misc/components/SearchableSelect';

interface PayoutModalProps {
  onClose: () => void;
  onSuccess?: (message: string) => void;
}

const mask = (n?: string | null) => (n ? `••••${n.slice(-4)}` : '');
const money = (v?: number | null) => `₦${Number(v || 0).toLocaleString()}`;

export default function PayoutModal({ onClose, onSuccess }: PayoutModalProps) {
  const accountQuery = usePayoutAccount();
  const balanceQuery = useAvailableBalance();
  const banksQuery = useBanks();
  const validateMutation = useValidateAccount();
  const saveMutation = useSavePayoutAccount();
  const requestMutation = useRequestPayout();

  const account = accountQuery.data?.account ?? null;
  const banks = banksQuery.data?.banks ?? [];

  const [mode, setMode] = useState<'request' | 'edit'>('request');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [validating, setValidating] = useState(false);
  const [amount, setAmount] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (account) {
      setMode('request');
    } else {
      setMode('edit');
    }
  }, [account]);

  const handleBankChange = (code: string) => {
    setBankCode(code);
    setAccountName('');
  };

  // Auto-validate the account name once a bank is selected and a full
  // 10-digit account number has been entered.
  useEffect(() => {
    if (bankCode && accountNumber.length === 10) {
      let cancelled = false;
      setValidating(true);
      setError('');
      validateMutation
        .mutateAsync({ bankCode, accountNumber })
        .then((result) => {
          if (!cancelled) setAccountName(result.accountName);
        })
        .catch((e: any) => {
          if (!cancelled) {
            setAccountName('');
            setError(e?.response?.data?.error || 'Could not verify account');
          }
        })
        .finally(() => {
          if (!cancelled) setValidating(false);
        });
      return () => {
        cancelled = true;
      };
    }
    setAccountName('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankCode, accountNumber]);

  const handleSave = async () => {
    if (!bankCode || !accountNumber || !accountName) {
      setError('Verify your account before saving');
      return;
    }
    setError('');
    try {
      await saveMutation.mutateAsync({ bankCode, accountNumber, accountName });
      setSuccess('Bank account saved');
      setMode('request');
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Could not save account');
    }
  };

  const handleRequest = async () => {
    const amt = Number(amount);
    if (!amt || isNaN(amt)) {
      setError('Enter a valid amount');
      return;
    }
    setError('');
    try {
      const result = await requestMutation.mutateAsync({ amount: amt });
      onSuccess?.(result.message || 'Payout request submitted');
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Could not submit request');
    }
  };

  const balance = balanceQuery.data;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Wallet size={18} className="text-[#001A72]" />
            <h2 className="font-black text-[#001A72]">Withdraw Earnings</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {error && <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-3 text-sm text-red-700">{error}</div>}
          {success && <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-lg p-3 text-sm text-emerald-700">{success}</div>}

          {account && mode === 'request' ? (
            <>
              <div className="flex items-center justify-between bg-gray-50 rounded-xl p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#001A72]/5 flex items-center justify-center">
                    <Landmark size={18} className="text-[#001A72]" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{account.accountName}</p>
                    <p className="text-xs text-gray-500">{account.bankName || account.bankCode} · {mask(account.accountNumber)}</p>
                  </div>
                </div>
                <button onClick={() => setMode('edit')} className="text-xs font-bold text-[#001A72] hover:underline">
                  Change
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Available balance</label>
                <p className="text-xl font-black text-[#001A72]">{money(balance?.availableBalance)}</p>
                {balance && (
                  <p className="text-xs text-gray-400 mt-1">
                    Min {money(balance.minWithdrawal)} · Max {money(balance.maxWithdrawal)} per request
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Amount (₦)</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="5000"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FFB81C] transition"
                />
              </div>

              <button
                onClick={handleRequest}
                disabled={requestMutation.isPending}
                className="w-full bg-[#001A72] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#001A72]/90 transition disabled:opacity-50"
              >
                {requestMutation.isPending ? 'Submitting…' : 'Request Payout'}
              </button>
            </>
          ) : (
            <>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Bank</label>
                <SearchableSelect
                  options={banks.map((b) => ({ value: b.code, label: b.name }))}
                  value={bankCode}
                  onChange={handleBankChange}
                  placeholder="Search for a bank…"
                  loading={banksQuery.isLoading}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">Account number</label>
                <div className="relative">
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={10}
                    value={accountNumber}
                    onChange={(e) => {
                      const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setAccountNumber(v);
                      setAccountName('');
                    }}
                    placeholder="0000000000"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FFB81C] transition tracking-widest"
                  />
                  {validating && (
                    <Loader2 size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 animate-spin" />
                  )}
                </div>
              </div>

              {validating ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 size={14} className="animate-spin" /> Verifying account name…
                </div>
              ) : accountName ? (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  <ShieldCheck size={16} className="text-emerald-600 shrink-0" />
                  <p className="text-sm font-bold text-emerald-700">{accountName}</p>
                </div>
              ) : null}

              <button
                onClick={handleSave}
                disabled={saveMutation.isPending || validating || !accountName}
                className="w-full bg-[#001A72] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#001A72]/90 transition disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving…' : 'Save Bank Account'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
