'use client';

import { useRouter } from 'next/navigation';
import { CheckCircle2 } from 'lucide-react';
import Modal from '@/misc/components/Modal';
import type { Booking } from '@/misc/types';

interface BookingSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
};

export default function BookingSuccessModal({ isOpen, onClose, booking }: BookingSuccessModalProps) {
  const router = useRouter();
  if (!booking) return null;

  const tutorName = booking.teacher
    ? `${booking.teacher.firstName || ''} ${booking.teacher.lastName || ''}`.trim()
    : booking.teacherName || '';

  const handleViewBookings = () => {
    onClose();
    router.push('/app/booking-requests');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-gray-500 hover:bg-gray-50 transition"
          >
            Done
          </button>
          <button
            type="button"
            onClick={handleViewBookings}
            className="rounded-xl bg-[#001A72] px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white hover:bg-[#001A72]/90 transition"
          >
            View Booking Requests
          </button>
        </div>
      }
    >
      <div className="text-center space-y-4 py-2">
        <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mx-auto">
          <CheckCircle2 size={36} className="text-emerald-500" />
        </div>
        <div>
          <h3 className="text-lg font-black text-gray-900">Booking Request Sent!</h3>
          <p className="mt-1 text-sm text-gray-500 leading-relaxed">
            Your booking request{booking.subject ? ` for ${booking.subject}` : ''}{tutorName ? ` with ${tutorName}` : ''} has been sent.
          </p>
        </div>
        {booking.scheduledDate && booking.startTime && booking.endTime && (
          <div className="rounded-2xl border border-[#001A72]/10 bg-[#001A72]/5 px-4 py-3">
            <p className="text-sm font-black text-[#001A72]">
              {formatDate(booking.scheduledDate)} | {booking.startTime} - {booking.endTime}
            </p>
          </div>
        )}
        <p className="text-xs text-gray-400 leading-relaxed">
          The tutor will review your request. You&apos;ll be notified once it&apos;s accepted.
          {booking.paymentWindowHours ? ` A payment window of ${booking.paymentWindowHours}h will open after acceptance.` : ''}
        </p>
      </div>
    </Modal>
  );
}
