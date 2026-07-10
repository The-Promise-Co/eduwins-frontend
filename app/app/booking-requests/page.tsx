'use client';

import { BookOpen, Calendar, Check, Clock, Loader2, MessageSquareText, User, Users, X } from 'lucide-react';
import Button from '@/misc/components/Button';
import PageHeader from '@/misc/components/PageHeader';
import { useUser } from '@/misc/context/UserContext';
import { useAcceptBookingRequest, useBookingRequests, useDenyBookingRequest } from '@/misc/hooks/api/bookings';
import { Booking } from '@/misc/types';

const formatMoney = (value?: string | number) => {
  const amount = Number(value || 0);
  return `₦${amount.toLocaleString()}`;
};

const formatDate = (value?: string) => {
  if (!value) return 'Date pending';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
};

const statusClass = (status: string) => {
  switch (status) {
    case 'accepted':
      return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'denied':
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

export default function BookingRequestsPage() {
  const { user } = useUser();
  const requestsQuery = useBookingRequests();
  const acceptRequest = useAcceptBookingRequest();
  const denyRequest = useDenyBookingRequest();
  const bookings = requestsQuery.data?.bookings || [];
  const isTeacher = user?.role === 'teacher';

  const handleAccept = (booking: Booking) => acceptRequest.mutate(booking.id);
  const handleDeny = (booking: Booking) => denyRequest.mutate(booking.id);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Booking Requests"
        subtitle={isTeacher ? 'Review pending lesson requests from parents and manage your schedule.' : 'Track your tutor booking requests and their current status.'}
      />

      {requestsQuery.isLoading ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 flex items-center justify-center text-gray-400">
          <Loader2 size={22} className="animate-spin mr-2" /> Loading requests...
        </div>
      ) : requestsQuery.isError ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-sm font-bold text-red-600">Could not load booking requests.</div>
      ) : bookings.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-4">
            <Calendar size={24} />
          </div>
          <h2 className="text-lg font-black text-gray-900">No booking requests yet</h2>
          <p className="text-sm text-gray-500 mt-2">New requests will appear here as soon as they are created.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {bookings.map((booking) => {
            const isPending = booking.status === 'pending';
            const isUpdating = acceptRequest.isPending || denyRequest.isPending;
            const learnerNames = booking.children?.map((child) => fullName(child)).join(', ');
            return (
              <div key={booking.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm flex flex-col lg:flex-row lg:items-center gap-5">
                <div className="flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-wider ${statusClass(booking.status)}`}>
                      {booking.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{booking.bookingFor === 'children' ? 'For children' : 'For me'}</span>
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
                      <Clock size={14} className="text-[#001A72]" /> {booking.startTime || '--:--'} - {booking.endTime || '--:--'}
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
                </div>

                {isTeacher && isPending && (
                  <div className="flex gap-2 lg:self-end">
                    <Button fullWidth={false} variant="outline" onClick={() => handleDeny(booking)} disabled={isUpdating} className="px-4 py-2 text-xs font-black border-red-100 text-red-600 hover:bg-red-50">
                      <X size={14} /> Deny
                    </Button>
                    <Button fullWidth={false} onClick={() => handleAccept(booking)} disabled={isUpdating} className="px-4 py-2 text-xs font-black">
                      <Check size={14} /> Accept
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
