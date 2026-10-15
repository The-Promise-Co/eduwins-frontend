'use client';

import { ReactElement, useState } from 'react';
import { toast } from 'sonner';
import { useUser } from '@/misc/context/UserContext';
import { usePayoutHistory, useCancelPayout } from '@/misc/hooks/api/payouts';
import type { PayoutRequest } from '@/misc/types/payouts';
import {
  Wallet,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Landmark,
} from 'lucide-react';
import PageHeader from '@/misc/components/PageHeader';
import Modal from '@/misc/components/Modal';
import PayoutModal from '@/misc/components/PayoutModal';

const formatMoney = (value?: string | number | null) => `₦${Number(value || 0).toLocaleString()}`;

const mask = (n?: string | null) => (n ? `••••${n.slice(-4)}` : '—');

const formatDateTime = (value?: string | null) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

type StatusMeta = { label: string; badge: string; icon: ReactElement };

const STATUS_META: Record<string, StatusMeta> = {
  pending: {
    label: 'Pending',
    badge: 'bg-amber-50 text-amber-700 border-amber-100',
    icon: <Clock size={18} />,
  },
  processing: {
    label: 'Processing',
    badge: 'bg-blue-50 text-blue-700 border-blue-100',
    icon: <Loader2 size={18} className="animate-spin" />,
  },
  completed: {
    label: 'Completed',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    icon: <CheckCircle2 size={18} />,
  },
  declined: {
    label: 'Declined',
    badge: 'bg-red-50 text-red-700 border-red-100',
    icon: <XCircle size={18} />,
  },
  failed: {
    label: 'Failed',
    badge: 'bg-red-50 text-red-700 border-red-100',
    icon: <XCircle size={18} />,
  },
};

const getStatusMeta = (status: string) =>
  STATUS_META[status] || { label: status, badge: 'bg-gray-100 text-gray-600 border-gray-200', icon: <Clock size={18} /> };

export default function PayoutsPage(): ReactElement {
  const { user } = useUser();
  const historyQuery = usePayoutHistory();
  const cancelMutation = useCancelPayout();

  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<PayoutRequest | null>(null);

  const payouts = historyQuery.data?.payouts || [];
  const isTeacher = user?.role === 'teacher';

  const handleCancel = async () => {
    if (!cancelTarget) return;
    try {
      await cancelMutation.mutateAsync(cancelTarget.id);
      toast.success('Payout request cancelled and funds returned to your wallet');
      setCancelTarget(null);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Could not cancel payout request');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Payout History"
        subtitle="Track the status of your payout requests"
        backHref="/app/earnings"
        rightElement={
          isTeacher ? (
            <button
              onClick={() => setShowPayoutModal(true)}
              className="bg-[#FFB81C] text-[#001A72] font-black px-5 py-2.5 rounded-xl hover:bg-[#ffd06f] transition"
            >
              Withdraw
            </button>
          ) : undefined
        }
      />

      {!isTeacher ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-sm text-gray-500">
          Payouts are available to tutors only.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest">Payout Requests</h2>
            <span className="text-xs text-gray-400 font-medium">{payouts.length} total</span>
          </div>

          {historyQuery.isLoading ? (
            <div className="p-8 text-center text-sm text-gray-500">Loading payout requests...</div>
          ) : payouts.length === 0 ? (
            <div className="p-10 text-center">
              <div className="w-12 h-12 rounded-2xl bg-[#001A72]/5 flex items-center justify-center mx-auto mb-3">
                <Wallet size={22} className="text-[#001A72]" />
              </div>
              <p className="text-sm font-bold text-gray-800">No payout requests yet</p>
              <p className="text-xs text-gray-500 mt-1">Request a withdrawal and track its status here.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {payouts.map((payout) => {
                const meta = getStatusMeta(payout.status);
                const reason = payout.declineReason || payout.failureReason;
                return (
                  <div key={payout.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0">
                        <span className={`h-10 w-10 rounded-2xl flex items-center justify-center border shrink-0 ${meta.badge}`}>
                          {meta.icon}
                        </span>
                        <div className="min-w-0">
                          <p className="font-black text-gray-900">{formatMoney(payout.netAmount || payout.amount)}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${meta.badge}`}>
                              {meta.label}
                            </span>
                            <span className="text-xs text-gray-400">{formatDateTime(payout.createdAt)}</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1 flex items-center gap-1.5">
                            <Landmark size={12} className="text-gray-400" />
                            {payout.accountName || 'Account'} · {payout.bankName || payout.bankCode || 'Bank'} · {mask(payout.accountNumber)}
                          </p>
                          {payout.processedAt && (
                            <p className="text-xs text-gray-400 mt-0.5">Processed {formatDateTime(payout.processedAt)}</p>
                          )}
                          {reason && (
                            <p className="text-xs text-red-600 mt-1">
                              {payout.status === 'declined' ? 'Decline reason' : 'Failure reason'}: {reason}
                            </p>
                          )}
                        </div>
                      </div>

                      {payout.status === 'pending' && (
                        <button
                          onClick={() => setCancelTarget(payout)}
                          className="shrink-0 border border-red-200 text-red-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-red-50 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {showPayoutModal && (
        <PayoutModal
          onClose={() => setShowPayoutModal(false)}
          onSuccess={(message) => setPayoutSuccess(message)}
        />
      )}

      <Modal isOpen={!!payoutSuccess} onClose={() => setPayoutSuccess(null)} size="sm">
        <div className="flex flex-col items-center text-center py-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 flex items-center justify-center mb-4">
            <CheckCircle2 size={30} className="text-emerald-600" />
          </div>
          <h3 className="text-lg font-black text-gray-900">Payout Request Submitted</h3>
          <p className="text-sm text-gray-500 mt-2">{payoutSuccess}</p>
          <p className="text-xs text-gray-400 mt-4">
            Your request is now pending admin approval. You'll be notified once it's processed.
          </p>
          <button
            onClick={() => setPayoutSuccess(null)}
            className="mt-6 w-full bg-[#001A72] text-white py-3 rounded-xl text-sm font-bold hover:bg-[#001A72]/90 transition"
          >
            Done
          </button>
        </div>
      </Modal>

      <Modal isOpen={!!cancelTarget} onClose={() => setCancelTarget(null)} size="sm">
        <div className="flex flex-col items-center text-center py-2">
          <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <AlertTriangle size={28} className="text-red-600" />
          </div>
          <h3 className="text-lg font-black text-gray-900">Cancel payout request?</h3>
          <p className="text-sm text-gray-500 mt-2">
            This cancels your pending request of {formatMoney(cancelTarget?.netAmount || cancelTarget?.amount)} and
            returns the reserved funds to your main wallet.
          </p>
          <div className="flex gap-3 w-full mt-6">
            <button
              onClick={() => setCancelTarget(null)}
              className="flex-1 border border-gray-200 text-gray-700 py-3 rounded-xl text-sm font-bold hover:bg-gray-50 transition"
            >
              Keep request
            </button>
            <button
              onClick={handleCancel}
              disabled={cancelMutation.isPending}
              className="flex-1 bg-red-600 text-white py-3 rounded-xl text-sm font-bold hover:bg-red-700 transition disabled:opacity-50"
            >
              {cancelMutation.isPending ? 'Cancelling…' : 'Cancel request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
