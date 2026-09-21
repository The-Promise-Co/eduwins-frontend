'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { useVerifyPaystackPayment } from '@/misc/hooks/api/paystack';

function BookingPaymentConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const verifyPaymentMutation = useVerifyPaystackPayment();
  const hasVerified = useRef(false);
  const [error, setError] = useState('');
  const reference = searchParams.get('reference') || searchParams.get('trxref');

  useEffect(() => {
    if (hasVerified.current) return;
    hasVerified.current = true;

    if (!reference) {
      setError('Payment reference missing. Please contact support if you were charged.');
      return;
    }

    const verify = async () => {
      try {
        const result = await verifyPaymentMutation.mutateAsync(reference);

        if (!result.booking_id && !result.course_id) {
          setError('Payment was not successful. Please try again.');
          return;
        }

        if (result.booking_id) {
          setTimeout(() => router.replace('/app/booking-requests'), 1600);
          return;
        }

        if (result.course_id) {
          setTimeout(() => router.replace(`/app/courses/${result.course_id}/learn`), 1200);
          return;
        }
      } catch (err: any) {
        setError(err.response?.data?.error || 'Unable to confirm payment. Please try again.');
      }
    };

    verify();
  }, [reference, router, verifyPaymentMutation]);

  const bookingSuccess = !!verifyPaymentMutation.data?.booking_id;
  const courseSuccess = !!verifyPaymentMutation.data?.course_id;

  return (
    <div className="min-h-[70vh] flex items-center justify-center bg-gradient-to-b from-white to-[#F8FAFC] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl border border-gray-100 shadow-sm p-8 text-center">
        {!error && !bookingSuccess && !courseSuccess && (
          <>
            <Loader2 size={42} className="text-[#001A72] animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-black text-[#001A72]">Confirming payment</h1>
            <p className="text-sm text-gray-500 mt-2">Please wait while we verify your booking payment.</p>
          </>
        )}

        {bookingSuccess && (
          <>
            <CheckCircle2 size={46} className="text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-black text-[#001A72]">Payment confirmed</h1>
            <p className="text-sm text-gray-500 mt-2">Your session is confirmed. Payment is held in platform escrow until after the session.</p>
            {reference && (
              <p className="mt-3 text-xs font-semibold text-gray-400">Ref: {reference}</p>
            )}
            <p className="mt-3 text-xs text-gray-400">Redirecting to your booking requests...</p>
          </>
        )}

        {courseSuccess && (
          <>
            <CheckCircle2 size={46} className="text-emerald-500 mx-auto mb-4" />
            <h1 className="text-xl font-black text-[#001A72]">Payment confirmed</h1>
            <p className="text-sm text-gray-500 mt-2">You are enrolled. Redirecting you to the course...</p>
          </>
        )}

        {error && (
          <>
            <AlertCircle size={46} className="text-red-500 mx-auto mb-4" />
            <h1 className="text-xl font-black text-[#001A72]">Payment confirmation failed</h1>
            <p className="text-sm text-gray-500 mt-2">{error}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Link href="/app/booking-requests" className="inline-flex bg-[#001A72] text-white px-5 py-3 rounded-xl text-sm font-bold hover:bg-[#001A72]/90 transition">
                Back to bookings
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function BookingPaymentConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[70vh] flex items-center justify-center bg-white">
        <Loader2 size={36} className="text-[#001A72] animate-spin" />
      </div>
    }>
      <BookingPaymentConfirmContent />
    </Suspense>
  );
}
