'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowUpDown, BookOpen, Calendar, Check, ChevronDown, Clock, CreditCard, FileText, Info, Loader2, MessageSquare, MessageSquareText, ShieldCheck, User, Users, Video, X } from 'lucide-react';
import Button from '@/misc/components/Button';
import Modal from '@/misc/components/Modal';
import PageHeader from '@/misc/components/PageHeader';
import SessionNotesModal from '@/misc/components/SessionNotesModal';
import { useUser } from '@/misc/context/UserContext';
import { useAcceptBookingRequest, useBookingRequests, useCancelBookingRequest, useDenyBookingRequest, useEscrowBreakdown } from '@/misc/hooks/api/bookings';
import { useSendChatRequest } from '@/misc/hooks/api/chat';
import { useInitializeBookingPayment, useBookingPaymentQuote } from '@/misc/hooks/api/paystack';
import { Booking } from '@/misc/types';
import { computeSessionTiming, formatCountdown } from '@/misc/utils/sessionTiming';
import { getLagosTodayString, parseBookingDateTime, parseBookingDayStart } from '@/misc/utils/bookingTime';
import { formatTimeRange } from '@/misc/utils/time';
import api from '@/misc/services/api';
import { toast } from 'sonner';

const formatMoney = (value?: string | number) => {
  const amount = Number(value || 0);
  return `₦${amount.toLocaleString()}`;
};

const formatDate = (value?: string) => {
  if (!value) return 'Date pending';
  // Booking date is a Lagos calendar day — anchor so the label never shifts
  // with browser timezone.
  const date = parseBookingDayStart(value);
  return !date ? value : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
};

const statusClass = (status: string) => {
  switch (status) {
    case 'accepted':
    case 'completed':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'denied':
    case 'cancelled':
      return 'bg-red-50 text-red-700 border-red-100';
    case 'paid_escrow':
      return 'bg-blue-50 text-blue-700 border-blue-100';
    default:
      return 'bg-amber-50 text-amber-700 border-amber-100';
  }
};

const fullName = (person?: { firstName?: string; lastName?: string } | null) => {
  const name = `${person?.firstName || ''} ${person?.lastName || ''}`.trim();
  return name || 'Not provided';
};

const statusLabel = (status: string, isTeacher: boolean) => {
  if (status === 'paid_escrow') return isTeacher ? 'Paid' : 'PAID';
  return status.replace('_', ' ');
};

/**
 * Returns true if the booking's session window has fully passed:
 * - Scheduled date is before today, OR
 * - Scheduled date is today AND endTime (HH:MM:SS) has already elapsed
 */
const isSessionWindowPast = (booking?: Booking | null): boolean => {
  if (!booking || !booking.scheduledDate) return false;
  // Lagos calendar-day boundaries — independent of browser timezone.
  const now = new Date();
  const todayMidnight = parseBookingDayStart(getLagosTodayString(now));
  const scheduled = parseBookingDayStart(booking.scheduledDate);
  if (!todayMidnight || !scheduled) return false;
  // Date is strictly before today
  if (scheduled.getTime() < todayMidnight.getTime()) return true;
  // Date is today — check whether endTime has elapsed
  if (scheduled.getTime() === todayMidnight.getTime() && booking.endTime) {
    const sessionEnd = parseBookingDateTime(booking.scheduledDate, booking.endTime);
    if (!sessionEnd) return false;
    return now >= sessionEnd;
  }
  return false;
};

// Returns true if the session has already started (or ended): the tutor
// pressed start, or the scheduled start time has passed. Cancellations are
// not allowed once a session is live or in the past.
const isSessionStarted = (booking?: Booking | null): boolean => {
  if (!booking) return false;
  if (booking.sessionStartedAt) return true;
  if (!booking.scheduledDate || !booking.startTime) return false;
  const timing = computeSessionTiming(booking);
  return Date.now() >= timing.scheduledStart.getTime();
};

// Legacy alias — used for "Past" tab filtering (date-level only, Lagos days)
const isDatePast = (booking?: Booking | null): boolean => {
  if (!booking || !booking.scheduledDate) return false;
  const today = parseBookingDayStart(getLagosTodayString());
  const scheduled = parseBookingDayStart(booking.scheduledDate);
  return Boolean(today && scheduled) && (scheduled as Date).getTime() < (today as Date).getTime();
};

const isDatePresent = (booking?: Booking | null): boolean => {
  if (!booking || !booking.scheduledDate) return true;
  const today = parseBookingDayStart(getLagosTodayString());
  const scheduled = parseBookingDayStart(booking.scheduledDate);
  if (!today || !scheduled) return true;
  return scheduled.getTime() >= today.getTime();
};

function EscrowBreakdownCard({ bookingId }: { bookingId: string }) {
  const { data: breakdown, isLoading } = useEscrowBreakdown(bookingId);

  return (
    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-900">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck size={14} className="shrink-0" />
        <p className="font-black text-[10px] uppercase tracking-wider">Payment held in escrow</p>
      </div>
      {isLoading ? (
        <p className="text-blue-600">Loading breakdown...</p>
      ) : breakdown ? (
        <div className="space-y-1.5 mt-2">
          <div className="flex justify-between">
            <span className="text-blue-700">Tutor earnings (est.)</span>
            <span className="font-bold">{formatMoney(breakdown.tutorAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Welfare fund</span>
            <span className="font-bold">{formatMoney(breakdown.welfareAmount)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-blue-700">Platform fee</span>
            <span className="font-bold">{formatMoney(breakdown.platformFee)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TimingCountdown({ booking }: { booking?: Booking | null }) {
  const [timing, setTiming] = useState(() => computeSessionTiming(booking));

  useEffect(() => {
    if (!booking) return;
    const interval = setInterval(() => {
      setTiming(computeSessionTiming(booking));
    }, 1000);
    return () => clearInterval(interval);
  }, [booking]);

  if (!timing || timing.canJoin || timing.isEnded) return null;

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 w-full">
      <p className="text-xs text-amber-700 mb-1">Join window opens in</p>
      <p className="text-2xl font-black text-amber-900 font-mono">
        {formatCountdown(timing.timeUntilStart)}
      </p>
      <p className="text-[10px] text-amber-600 mt-1">
        {timing.joinWindowOpen.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
      </p>
    </div>
  );
}

const paymentDeadlineText = (booking?: Booking | null) => {
  if (!booking) return '';
  if (booking.paymentDueAt) return formatDateTime(booking.paymentDueAt);
  if (booking.acceptedAt && booking.paymentWindowHours) {
    const due = new Date(new Date(booking.acceptedAt).getTime() + Number(booking.paymentWindowHours) * 60 * 60 * 1000);
    return Number.isNaN(due.getTime()) ? '' : due.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });
  }
  return '';
};

type SortOption = 'newest' | 'oldest' | 'session_soonest' | 'session_latest' | 'amount_high' | 'amount_low';

const SORT_LABELS: Record<SortOption, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  session_soonest: 'Session soonest',
  session_latest: 'Session latest',
  amount_high: 'Amount high → low',
  amount_low: 'Amount low → high',
};

const STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'paid_escrow', label: 'Paid' },
  { value: 'denied', label: 'Denied' },
  { value: 'cancelled', label: 'Cancelled' },
];

const sortByOption = (list: Booking[], sort: SortOption): Booking[] => {
  const copy = [...list];
  switch (sort) {
    case 'newest':
      return copy.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
    case 'oldest':
      return copy.sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());
    case 'session_soonest':
      return copy.sort((a, b) => new Date(a.scheduledDate || '9999').getTime() - new Date(b.scheduledDate || '9999').getTime());
    case 'session_latest':
      return copy.sort((a, b) => new Date(b.scheduledDate || '0000').getTime() - new Date(a.scheduledDate || '0000').getTime());
    case 'amount_high':
      return copy.sort((a, b) => Number(b.totalAmount ?? b.totalCost ?? 0) - Number(a.totalAmount ?? a.totalCost ?? 0));
    case 'amount_low':
      return copy.sort((a, b) => Number(a.totalAmount ?? a.totalCost ?? 0) - Number(b.totalAmount ?? b.totalCost ?? 0));
  }
};

export default function SchedulePage() {
  const router = useRouter();
  const { user } = useUser();
  const requestsQuery = useBookingRequests();
  const acceptRequest = useAcceptBookingRequest();
  const denyRequest = useDenyBookingRequest();
  const cancelRequest = useCancelBookingRequest();
  const initPayment = useInitializeBookingPayment();
  const sendChatRequest = useSendChatRequest();
  const bookings = requestsQuery.data?.bookings || [];
  const isTeacher = user?.role === 'teacher';

  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'deny' | 'cancel' | null>(null);
  const [denialReason, setDenialReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');
  const [payingBookingId, setPayingBookingId] = useState<string | null>(null);
  const [paymentConfirmBooking, setPaymentConfirmBooking] = useState<Booking | null>(null);
  const [detailsBooking, setDetailsBooking] = useState<Booking | null>(null);
  const [timePeriod, setTimePeriod] = useState<'present' | 'past'>('present');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statusFilterOpen, setStatusFilterOpen] = useState(false);
  const statusFilterRef = useRef<HTMLDivElement>(null);
  const [joinSessionBooking, setJoinSessionBooking] = useState<Booking | null>(null);
  const [joinSessionError, setJoinSessionError] = useState('');
  const [joiningSessionId, setJoiningSessionId] = useState<string | null>(null);
  const [notesBooking, setNotesBooking] = useState<Booking | null>(null);

  const presentBookings = bookings.filter((b) => Boolean(b && isDatePresent(b)));
  const pastBookings = bookings.filter((b) => Boolean(b && isDatePast(b)));
  const baseBookings = timePeriod === 'present' ? presentBookings : pastBookings;
  const filteredBookings = statusFilter === 'all' ? baseBookings : baseBookings.filter((b) => b && b.status === statusFilter);
  const statusCounts = baseBookings.reduce<Record<string, number>>((acc, b) => { if (b?.status) acc[b.status] = (acc[b.status] || 0) + 1; return acc; }, {});

  const [sortOption, setSortOption] = useState<SortOption>('newest');
  const [sortOpen, setSortOpen] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const sortedBookings = sortByOption(filteredBookings, sortOption);

  const isUpdating = acceptRequest.isPending || denyRequest.isPending || cancelRequest.isPending;
  const modalOpen = confirmAction !== null && selectedBooking !== null;

  const openAccept = (booking: Booking) => {
    setSelectedBooking(booking);
    setDenialReason('');
    setConfirmAction('accept');
  };

  const openDeny = (booking: Booking) => {
    setSelectedBooking(booking);
    setDenialReason('');
    setConfirmAction('deny');
  };

  const openCancel = (booking: Booking) => {
    setSelectedBooking(booking);
    setCancelReason('');
    setConfirmAction('cancel');
  };

  const closeModal = () => {
    if (isUpdating) return;
    setSelectedBooking(null);
    setConfirmAction(null);
    setDenialReason('');
    setCancelReason('');
  };

  const handleConfirm = async () => {
    if (!selectedBooking || !confirmAction) return;
    try {
      if (confirmAction === 'accept') {
        await acceptRequest.mutateAsync(selectedBooking.id);
        toast.success('Booking request accepted. The parent has been asked to complete payment.');
      } else if (confirmAction === 'deny') {
        await denyRequest.mutateAsync({
          bookingId: selectedBooking.id,
          denialReason: denialReason.trim() || undefined,
        });
        toast.success('Booking request denied.');
      } else {
        await cancelRequest.mutateAsync({
          bookingId: selectedBooking.id,
          reason: cancelReason.trim() || undefined,
        });
        toast.success('Booking request cancelled.');
      }
      closeModal();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update booking request.');
    }
  };

  const handlePayNow = (booking: Booking) => {
    setPaymentConfirmBooking(booking);
  };

  const quoteQuery = useBookingPaymentQuote(paymentConfirmBooking?.id);
  const quote = quoteQuery.data;

  const confirmAndPay = async () => {
    const booking = paymentConfirmBooking;
    if (!booking || !user?.email) return;
    // Send bare session total to Paystack — pass-fees adds the fee at
    // checkout. chargeAmount (cost + est. fee) is display-only.
    const amount = quote?.totalAmount;
    if (!amount || amount <= 0) {
      toast.error(quoteQuery.isError ? 'Could not build the payment quote. Please try again.' : 'Preparing your payment quote…');
      return;
    }
    setPaymentConfirmBooking(null);
    setPayingBookingId(booking.id);
    try {
      const result = await initPayment.mutateAsync({
        email: user.email,
        amount,
        booking_id: booking.id,
        callback_url: `${window.location.origin}/bookings/payment/confirm`,
      });
      const url = result.authorizationUrl || result.authorization_url;
      if (!url) {
        toast.error('Payment could not be started. Please try again.');
        return;
      }
      window.location.href = url;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to start payment.');
    } finally {
      setPayingBookingId(null);
    }
  };

  const handleChat = async (booking: Booking) => {
    const email = isTeacher ? booking.parent?.email : booking.teacher?.email;
    if (!email) {
      toast.error('Could not find contact information for this user.');
      return;
    }
    try {
      const conversation = await sendChatRequest.mutateAsync(email);
      router.push(`/app/chat?conversationId=${conversation.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to start conversation.');
    }
  };

  const handleJoinSession = async (booking: Booking) => {
    setJoiningSessionId(booking.id);
    setJoinSessionError('');
    try {
      await api.post('/livekit/token', { booking_id: booking.id });
      router.push(`/app/session/${booking.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to validate session. Please try again.';
      setJoinSessionError(msg);
      setJoinSessionBooking(booking);
    } finally {
      setJoiningSessionId(null);
    }
  };

  const canCreateNotesFor = (b: Booking) => {
    if (!b || b.status === 'pending' || b.status === 'denied' || b.status === 'cancelled') return false;
    const timing = computeSessionTiming(b);
    return Boolean(b.sessionStartedAt) || Date.now() >= timing.joinWindowOpen.getTime();
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Schedule"
        subtitle={isTeacher ? 'Review lesson requests, upcoming sessions and past history.' : 'Track your booking requests, upcoming lessons and past sessions.'}
      />

      {bookings.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex gap-1 bg-gray-100 p-1 rounded-xl">
              {([
                { key: 'present' as const, label: 'Upcoming', count: presentBookings.length },
                { key: 'past' as const, label: 'Past', count: pastBookings.length },
              ]).map((tab) => (
                <button key={tab.key} onClick={() => { setTimePeriod(tab.key); setStatusFilter('all'); }} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition ${timePeriod === tab.key ? 'bg-white text-[#001A72] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
                  {tab.label}
                  {tab.count > 0 && <span className={`ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1 text-[10px] rounded-full ${timePeriod === tab.key ? 'bg-[#001A72]/10 text-[#001A72]' : 'bg-gray-200 text-gray-600'}`}>{tab.count}</span>}
                </button>
              ))}
            </div>

            <div className="relative" ref={statusFilterRef}>
              <button onClick={() => setStatusFilterOpen(!statusFilterOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-sm text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
                {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label || 'All'} <ChevronDown size={14} className={`transition ${statusFilterOpen ? 'rotate-180' : ''}`} />
              </button>
              {statusFilterOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setStatusFilterOpen(false)} />
                  <div className="absolute left-0 top-full mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden py-1">
                    {STATUS_OPTIONS.map((option) => {
                      const count = option.value === 'all' ? baseBookings.length : (statusCounts[option.value] || 0);
                      return (
                        <button key={option.value} onClick={() => { setStatusFilter(option.value); setStatusFilterOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition ${statusFilter === option.value ? 'text-[#001A72] bg-[#001A72]/5' : 'text-gray-600 hover:bg-gray-50'}`}>
                          {option.label}
                          <span className="flex items-center gap-2">
                            {count > 0 && <span className="text-[10px] text-gray-400">{count}</span>}
                            {statusFilter === option.value && <Check size={14} className="text-[#001A72]" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="relative" ref={sortRef}>
            <button onClick={() => setSortOpen(!sortOpen)} className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-gray-200 shadow-sm text-xs font-bold text-gray-600 hover:bg-gray-50 transition">
              <ArrowUpDown size={14} /> {SORT_LABELS[sortOption]} <ChevronDown size={14} className={`transition ${sortOpen ? 'rotate-180' : ''}`} />
            </button>
            {sortOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 z-20 overflow-hidden py-1">
                  {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([key, label]) => (
                    <button key={key} onClick={() => { setSortOption(key); setSortOpen(false); }} className={`w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold transition ${sortOption === key ? 'text-[#001A72] bg-[#001A72]/5' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {label}
                      {sortOption === key && <Check size={14} className="text-[#001A72]" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {requestsQuery.isLoading ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 flex items-center justify-center text-gray-400">
          <Loader2 size={22} className="animate-spin mr-2" /> Loading schedule...
        </div>
      ) : requestsQuery.isError ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-sm font-bold text-red-600">Could not load schedule.</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4">
            <Calendar size={24} />
          </div>
          <h2 className="text-lg font-black text-gray-900">No sessions yet</h2>
          <p className="text-sm text-gray-500 mt-2">New sessions will appear here as soon as they are created.</p>
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <h2 className="text-lg font-black text-gray-900">No {STATUS_OPTIONS.find((o) => o.value === statusFilter)?.label.toLowerCase() || 'matching'} sessions</h2>
          <p className="text-sm text-gray-500 mt-2">Try selecting a different status filter.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedBookings.map((booking) => {
            const isPending = booking.status === 'pending';
            const isAccepted = booking.status === 'accepted';
            const isPaid = booking.status === 'paid_escrow';
            const isDenied = booking.status === 'denied';
            const isCancelled = booking.status === 'cancelled';
            const isCompleted = booking.status === 'completed';
            const hasChildren = booking.bookingFor === 'children';
            const deadline = isAccepted ? paymentDeadlineText(booking) : '';
            const learnerNames = booking.children?.map((child) => fullName(child)).join(', ');
            const sessionWindowPast = isSessionWindowPast(booking);
            const sessionEndedToday = sessionWindowPast && !isDatePast(booking);
            const sessionStarted = isSessionStarted(booking);
            const cancellable = !sessionWindowPast && !sessionStarted;
            return (
              <div key={booking.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${statusClass(booking.status)}`}>
                      {statusLabel(booking.status, isTeacher)}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{booking.bookingFor === 'children' ? 'For children' : 'For me'}</span>
                    <div className="ml-auto flex items-center gap-2">
                      {(isPaid || isCompleted) && (
                        <button onClick={() => setDetailsBooking(booking)} className="inline-flex items-center gap-1.5 rounded-lg bg-gray-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-500 hover:bg-gray-100 transition">
                          <Info size={12} /> Details
                        </button>
                      )}
                      {(isAccepted || isPaid) && (
                        <button onClick={() => handleChat(booking)} disabled={sendChatRequest.isPending} className="inline-flex items-center gap-1.5 rounded-lg bg-[#001A72]/5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#001A72] hover:bg-[#001A72]/10 transition disabled:opacity-60">
                          <MessageSquare size={12} /> Chat
                        </button>
                      )}
                    </div>
                  </div>
                  <div>
                    <h2 className="text-base font-black text-gray-900">{booking.subject || 'Tutoring session'}</h2>
                    <p className="text-xs text-gray-500 mt-1">
                      {isTeacher ? `Requested by ${fullName(booking.parent)}` : `Tutor: ${fullName(booking.teacher)}`}
                    </p>
                  </div>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-3 text-xs text-gray-600">
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <User size={14} className="text-[#001A72]" /> {isTeacher ? fullName(booking.parent) : fullName(booking.teacher)}
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <Calendar size={14} className="text-[#001A72]" /> {formatDate(booking.scheduledDate)}
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <Clock size={14} className="text-[#001A72]" /> {formatTimeRange(booking.startTime, booking.endTime)}
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <BookOpen size={14} className="text-[#001A72]" /> {Number(booking.durationHours || 0).toLocaleString()} hour{Number(booking.durationHours || 0) === 1 ? '' : 's'}
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <Users size={14} className="text-[#001A72]" /> {booking.bookingFor === 'children' ? learnerNames || 'Children selected' : 'Parent learner'}
                    </div>
                    <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
                      <User size={14} className="text-[#001A72]" /> {formatMoney(booking.totalAmount ?? booking.totalCost)}
                    </div>
                  </div>
                  {booking.note && (
                    <div className="rounded-2xl border border-[#001A72]/10 bg-[#001A72]/5 px-4 py-3 text-xs text-gray-700">
                      <p className="mb-1 flex items-center gap-2 text-[10px] font-black uppercase tracking-wider text-[#001A72]"><MessageSquareText size={13} /> Parent Note</p>
                      <p className="leading-relaxed">{booking.note}</p>
                    </div>
                  )}
                  {!isTeacher && isAccepted && (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
                      <p className="font-black uppercase tracking-wider text-[10px]">Payment required{deadline ? ` by ${deadline}` : ''}</p>
                      <p className="mt-1 leading-relaxed">Complete payment to confirm this session. Payment is held in platform escrow until after the session.</p>
                    </div>
                  )}
                  {isTeacher && isAccepted && (
                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-xs text-emerald-900">
                      <p className="font-black uppercase tracking-wider text-[10px]">Awaiting parent payment{deadline ? ` by ${deadline}` : ''}</p>
                      <p className="mt-1 leading-relaxed">Payment is held in platform escrow until after the session.</p>
                    </div>
                  )}
                  {isPaid && isTeacher && (
                    <EscrowBreakdownCard bookingId={booking.id} />
                  )}
                  {isPaid && !isTeacher && (
                    <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-900 flex items-start gap-2">
                      <ShieldCheck size={14} className="mt-0.5 shrink-0" />
                      <div>
                        <p className="leading-relaxed">Payment confirmed. Your session is secured.</p>
                        {booking.paymentReference && (
                          <p className="mt-1 text-[10px] font-semibold text-blue-600">Ref: {booking.paymentReference}</p>
                        )}
                      </div>
                    </div>
                  )}
                  {isDenied && (
                    <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs text-red-800">
                      <p className="font-black uppercase tracking-wider text-[10px]">Denied{booking.deniedAt ? ` on ${formatDateTime(booking.deniedAt)}` : ''}</p>
                      {booking.denialReason && <p className="mt-1 leading-relaxed">{booking.denialReason}</p>}
                    </div>
                  )}
                  {isCancelled && (
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-700">
                      <p className="font-black uppercase tracking-wider text-[10px]">
                        Cancelled{booking.cancelledAt ? ` on ${formatDateTime(booking.cancelledAt)}` : ''}{booking.cancelledBy ? ` by ${booking.cancelledBy}` : ''}
                      </p>
                      {booking.cancelReason && <p className="mt-1 leading-relaxed">{booking.cancelReason}</p>}
                    </div>
                  )}
                </div>

                {sessionWindowPast ? (
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-50">
                    <div className="rounded-2xl border border-gray-200 bg-gray-50 px-3.5 py-2 text-xs text-gray-500 flex items-center gap-2">
                      <Clock size={14} className="text-gray-400 shrink-0" />
                      <p className="font-bold">{sessionEndedToday ? 'Session has ended.' : 'Session date has passed.'}</p>
                    </div>
                    {(isPaid || isCompleted) && (
                      <Button
                        fullWidth={false}
                        variant="outline"
                        onClick={() => router.push(`/app/schedule/${booking.id}`)}
                        className="px-4 py-2 text-xs font-black border-[#001A72] text-[#001A72] hover:bg-[#001A72]/5"
                      >
                        <BookOpen size={14} /> View Details
                      </Button>
                    )}
                  </div>
                ) : (
                <div className="flex flex-wrap justify-end gap-2 pt-3 border-t border-gray-50">
                  {(isPaid || isCompleted) && (
                    <Button
                      fullWidth={false}
                      variant="outline"
                      onClick={() => router.push(`/app/schedule/${booking.id}`)}
                      className="px-3.5 py-2 text-xs font-black border-gray-200 text-gray-700 hover:bg-gray-50"
                    >
                      <BookOpen size={14} /> Details
                    </Button>
                  )}
                  {isTeacher && isPending && (
                    <>
                      {cancellable && (
                        <Button fullWidth={false} variant="outline" onClick={() => openCancel(booking)} disabled={isUpdating} className="px-4 py-2 text-xs font-black border-gray-200 text-gray-500 hover:bg-gray-50">
                          Cancel
                        </Button>
                      )}
                      <Button fullWidth={false} variant="outline" onClick={() => openDeny(booking)} disabled={isUpdating} className="px-4 py-2 text-xs font-black border-red-100 text-red-600 hover:bg-red-50">
                        <X size={14} /> Deny
                      </Button>
                      <Button fullWidth={false} onClick={() => openAccept(booking)} disabled={isUpdating} className="px-4 py-2 text-xs font-black">
                        <Check size={14} /> Accept
                      </Button>
                    </>
                  )}
                  {isTeacher && (isAccepted || isPaid) && (
                    <>
                      {isPaid && (
                        <Button fullWidth={false} onClick={() => handleJoinSession(booking)} disabled={joiningSessionId === booking.id} isLoading={joiningSessionId === booking.id} loadingText="Checking..." className="px-4 py-2 text-xs font-black">
                          <Video size={14} /> Join Session
                        </Button>
                      )}
                      {cancellable && (
                        <Button fullWidth={false} variant="outline" onClick={() => openCancel(booking)} disabled={isUpdating} className="px-4 py-2 text-xs font-black border-gray-200 text-gray-500 hover:bg-gray-50">
                          Cancel
                        </Button>
                      )}
                    </>
                  )}
                  {!isTeacher && isPending && cancellable && (
                    <Button fullWidth={false} variant="outline" onClick={() => openCancel(booking)} disabled={isUpdating} className="px-4 py-2 text-xs font-black border-gray-200 text-gray-500 hover:bg-gray-50">
                      Cancel
                    </Button>
                  )}
                  {!isTeacher && (isAccepted || isPaid) && (
                    <>
                      {isPaid && (
                        <Button fullWidth={false} onClick={() => handleJoinSession(booking)} disabled={joiningSessionId === booking.id} isLoading={joiningSessionId === booking.id} loadingText="Checking..." className="px-4 py-2 text-xs font-black">
                          <Video size={14} /> Join Session
                        </Button>
                      )}
                      {cancellable && (
                        <Button fullWidth={false} variant="outline" onClick={() => openCancel(booking)} disabled={isUpdating} className="px-4 py-2 text-xs font-black border-gray-200 text-gray-500 hover:bg-gray-50">
                          Cancel
                        </Button>
                      )}
                      {isAccepted && (
                        <Button fullWidth={false} onClick={() => handlePayNow(booking)} disabled={payingBookingId === booking.id} isLoading={payingBookingId === booking.id} loadingText="Starting payment..." className="px-5 py-2 text-xs font-black">
                          Pay {formatMoney(booking.totalAmount ?? booking.totalCost)} now
                        </Button>
                      )}
                    </>
                  )}
                </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={confirmAction === 'accept' ? 'Accept booking request?' : confirmAction === 'deny' ? 'Deny booking request?' : 'Cancel booking request?'}
        subtitle={confirmAction === 'accept' ? 'Confirm before notifying the parent.' : confirmAction === 'deny' ? 'The parent will be notified of your decision.' : 'This action will cancel the booking request.'}
        size="sm"
        footer={(
          <>
            <button type="button" onClick={closeModal} disabled={isUpdating} className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-gray-500 disabled:opacity-60">Cancel</button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isUpdating || (confirmAction === 'cancel' && selectedBooking?.status === 'accepted' && !cancelReason.trim())}
              className={`rounded-xl px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white disabled:opacity-60 ${confirmAction === 'accept' ? 'bg-[#001A72]' : 'bg-red-600 hover:bg-red-700'}`}
            >
              {isUpdating ? 'Please wait...' : confirmAction === 'accept' ? 'Accept Request' : confirmAction === 'deny' ? 'Deny Request' : 'Cancel Request'}
            </button>
          </>
        )}
      >
        {confirmAction === 'accept' ? (
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              The parent will be asked to complete payment
              {selectedBooking?.paymentWindowHours ? ` within ${selectedBooking.paymentWindowHours} hour${Number(selectedBooking.paymentWindowHours) === 1 ? '' : 's'}` : ' within the payment window'}.
            </p>
            <p>Payment is held in platform escrow until after the session.</p>
          </div>
        ) : confirmAction === 'deny' ? (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">You can add an optional reason for denying this request.</p>
            <label htmlFor="denial-reason" className="block text-[10px] font-black uppercase tracking-wider text-gray-500">Reason for denying this request (optional)</label>
            <textarea
              id="denial-reason"
              value={denialReason}
              onChange={(event) => setDenialReason(event.target.value.slice(0, 1000))}
              rows={4}
              className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
              placeholder="Share why this time does not work, or suggest an alternative."
            />
            <p className="text-right text-[10px] font-semibold text-gray-400">{denialReason.length}/1000</p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedBooking?.status === 'accepted' ? (
              <>
                <p className="text-sm text-gray-600">This booking has been accepted and the payment countdown is active. A reason is required to cancel.</p>
                <label htmlFor="cancel-reason" className="block text-[10px] font-black uppercase tracking-wider text-gray-500">Reason for cancelling this request (required)</label>
                <textarea
                  id="cancel-reason"
                  value={cancelReason}
                  onChange={(event) => setCancelReason(event.target.value.slice(0, 1000))}
                  rows={4}
                  className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-100"
                  placeholder="Explain why this booking needs to be cancelled."
                />
                <p className="text-right text-[10px] font-semibold text-gray-400">{cancelReason.length}/1000</p>
              </>
            ) : (
              <p className="text-sm text-gray-600">This booking has not been accepted yet. You can cancel it freely.</p>
            )}
          </div>
        )}
      </Modal>

      {/* Payment Confirm Modal */}
      <Modal
        isOpen={!!paymentConfirmBooking}
        onClose={() => setPaymentConfirmBooking(null)}
        title="Confirm Payment"
        subtitle="Review your booking details before proceeding to payment."
        size="sm"
        footer={
          <>
            <button type="button" onClick={() => setPaymentConfirmBooking(null)} className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-gray-500">Cancel</button>
            <button
              type="button"
              onClick={confirmAndPay}
              disabled={!quote?.totalAmount || quoteQuery.isPending}
              className="rounded-xl bg-[#001A72] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#001A72]/90 transition disabled:opacity-50"
            >
              Pay {quote?.chargeAmount ? formatMoney(quote.chargeAmount) : '…'}
            </button>
          </>
        }
      >
        {paymentConfirmBooking && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-2xl bg-[#001A72]/5 p-4">
              <div className="w-10 h-10 rounded-xl bg-[#001A72] flex items-center justify-center text-white">
                <CreditCard size={18} />
              </div>
              <div>
                <p className="text-sm font-black text-gray-900">{paymentConfirmBooking.subject || 'Tutoring session'}</p>
                <p className="text-xs text-gray-500">with {isTeacher ? fullName(paymentConfirmBooking.parent) : fullName(paymentConfirmBooking.teacher)}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-500">Date</span>
                <span className="font-bold text-gray-800">{formatDate(paymentConfirmBooking.scheduledDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Time</span>
                <span className="font-bold text-gray-800">{formatTimeRange(paymentConfirmBooking.startTime, paymentConfirmBooking.endTime)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Duration</span>
                <span className="font-bold text-gray-800">{Number(paymentConfirmBooking.durationHours || 0)} hour{Number(paymentConfirmBooking.durationHours || 0) === 1 ? '' : 's'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Session total</span>
                <span className="font-bold text-gray-800">{formatMoney(quote?.totalAmount ?? paymentConfirmBooking.totalAmount ?? paymentConfirmBooking.totalCost)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Processing fee</span>
                <span className="font-bold text-gray-800">{quoteQuery.isPending ? '…' : formatMoney(quote?.processingFee ?? 0)}</span>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2">
                <span className="font-black text-gray-800">Total charged</span>
                <span className="font-black text-[#001A72] text-base">{quote?.chargeAmount ? formatMoney(quote.chargeAmount) : '…'}</span>
              </div>
            </div>
            {quoteQuery.isError && (
              <p className="text-[11px] font-semibold text-red-600">Could not load the payment quote. Please close and try again.</p>
            )}
            <p className="text-[10px] text-gray-400 leading-relaxed">Payment is held in platform escrow until after the session. You will be redirected to Paystack to complete payment.</p>
          </div>
        )}
      </Modal>

      {/* Booking Details Modal */}
      <Modal
        isOpen={!!detailsBooking}
        onClose={() => setDetailsBooking(null)}
        title="Booking Details"
        subtitle={detailsBooking?.subject || 'Tutoring session'}
        size="md"
        footer={
          <div className="w-full flex items-center justify-between gap-2">
            <div>
              {Boolean(detailsBooking && (detailsBooking.status === 'paid_escrow' || detailsBooking.status === 'accepted' || isDatePast(detailsBooking))) && (
                <Button
                  fullWidth={false}
                  variant="outline"
                  onClick={() => {
                    const b = detailsBooking;
                    setDetailsBooking(null);
                    setNotesBooking(b);
                  }}
                  className="px-3.5 py-2 text-xs font-black border-gray-200 text-[#001A72] hover:bg-[#001A72]/5"
                >
                  <FileText size={14} /> View Notes
                </Button>
              )}
            </div>
            <button type="button" onClick={() => setDetailsBooking(null)} className="rounded-xl bg-[#001A72] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#001A72]/90 transition">
              Close
            </button>
          </div>
        }
      >
        {detailsBooking && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Session Info</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-400">Date</p>
                  <p className="font-bold text-gray-800">{formatDate(detailsBooking.scheduledDate)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Time</p>
                  <p className="font-bold text-gray-800">{formatTimeRange(detailsBooking.startTime, detailsBooking.endTime)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Duration</p>
                  <p className="font-bold text-gray-800">{Number(detailsBooking.durationHours || 0)} hour{Number(detailsBooking.durationHours || 0) === 1 ? '' : 's'}</p>
                </div>
                <div>
                  <p className="text-gray-400">Learners</p>
                  <p className="font-bold text-gray-800">{detailsBooking.bookingFor === 'children' ? (detailsBooking.children?.map((c) => fullName(c)).join(', ') || 'Children') : 'Parent learner'}</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Participants</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-400">Parent</p>
                  <p className="font-bold text-gray-800">{fullName(detailsBooking.parent)}</p>
                  {detailsBooking.parent?.email && <p className="text-gray-400 mt-0.5">{detailsBooking.parent.email}</p>}
                </div>
                <div>
                  <p className="text-gray-400">Tutor</p>
                  <p className="font-bold text-gray-800">{fullName(detailsBooking.teacher)}</p>
                  {detailsBooking.teacher?.email && <p className="text-gray-400 mt-0.5">{detailsBooking.teacher.email}</p>}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 space-y-3">
              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Payment</p>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-400">Status</p>
                  <p className="font-bold text-gray-800">{statusLabel(detailsBooking.status, isTeacher)}</p>
                </div>
                <div>
                  <p className="text-gray-400">Total</p>
                  <p className="font-bold text-[#001A72]">{formatMoney(detailsBooking.totalAmount ?? detailsBooking.totalCost)}</p>
                </div>
                {detailsBooking.paymentReference && (
                  <div>
                    <p className="text-gray-400">Reference</p>
                    <p className="font-bold text-gray-800">{detailsBooking.paymentReference}</p>
                  </div>
                )}
                {detailsBooking.paidAt && (
                  <div>
                    <p className="text-gray-400">Paid on</p>
                    <p className="font-bold text-gray-800">{formatDateTime(detailsBooking.paidAt)}</p>
                  </div>
                )}
                {detailsBooking.acceptedAt && (
                  <div>
                    <p className="text-gray-400">Accepted on</p>
                    <p className="font-bold text-gray-800">{formatDateTime(detailsBooking.acceptedAt)}</p>
                  </div>
                )}
              </div>
            </div>

            {detailsBooking.note && (
              <div className="rounded-2xl border border-[#001A72]/10 bg-[#001A72]/5 px-4 py-3 text-xs">
                <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-[#001A72]">Parent Note</p>
                <p className="text-gray-700 leading-relaxed">{detailsBooking.note}</p>
              </div>
            )}

            {detailsBooking.denialReason && (
              <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-xs">
                <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-red-600">Denial Reason</p>
                <p className="text-red-800 leading-relaxed">{detailsBooking.denialReason}</p>
              </div>
            )}

            {detailsBooking.cancelReason && (
              <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-xs">
                <p className="mb-1 text-[10px] font-black uppercase tracking-wider text-gray-500">Cancel Reason</p>
                <p className="text-gray-700 leading-relaxed">{detailsBooking.cancelReason}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Join Session Validation Modal */}
      <Modal
        isOpen={!!joinSessionError}
        onClose={() => { setJoinSessionError(''); setJoinSessionBooking(null); }}
        title="Cannot join session"
        size="sm"
        dismissable={false}
        footer={
          <button
            type="button"
            onClick={() => { setJoinSessionError(''); setJoinSessionBooking(null); }}
            className="rounded-xl bg-[#001A72] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#001A72]/90 transition"
          >
            Got it
          </button>
        }
      >
        <div className="flex flex-col items-center text-center gap-4 py-2">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center">
            {joinSessionError.includes('not available yet') ? (
              <Clock size={24} className="text-amber-600" />
            ) : (
              <AlertCircle size={24} className="text-red-500" />
            )}
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">{joinSessionError}</p>
          {joinSessionError.includes('not available yet') && joinSessionBooking && (
            <TimingCountdown booking={joinSessionBooking} />
          )}
        </div>
      </Modal>

      {/* Full-page loading overlay */}
      {payingBookingId && (
        <div className="fixed inset-0 m-0 z-[9999] flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 rounded-3xl border border-gray-100 bg-white p-8 shadow-xl">
            <Loader2 size={32} className="animate-spin text-[#001A72]" />
            <p className="text-sm font-black text-[#001A72]">Starting payment...</p>
            <p className="text-xs text-gray-400">Redirecting to Paystack</p>
          </div>
        </div>
      )}

      {/* Session Notes Modal */}
      {notesBooking && (
        <SessionNotesModal
          isOpen={!!notesBooking}
          onClose={() => setNotesBooking(null)}
          bookingId={notesBooking.id}
          bookingSubject={notesBooking.subject}
          partnerName={isTeacher ? fullName(notesBooking.parent) : fullName(notesBooking.teacher)}
          scheduledDate={formatDate(notesBooking.scheduledDate)}
          participantRole={isTeacher ? 'teacher' : 'parent'}
          readOnly={!canCreateNotesFor(notesBooking)}
        />
      )}
    </div>
  );
}
