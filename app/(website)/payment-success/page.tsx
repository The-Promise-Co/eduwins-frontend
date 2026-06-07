'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, XCircle, Loader2, ArrowRight } from 'lucide-react';
import api from '@/misc/services/api';

type Status = 'verifying' | 'success' | 'error';

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const reference = searchParams.get('reference') || searchParams.get('trxref');
  const [status, setStatus] = useState<Status>('verifying');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!reference) {
      setStatus('error');
      setErrorMsg('No payment reference found.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.get(`/paystack/verify/${reference}`);
        if (res.data.status === 'success') {
          setStatus('success');
        } else {
          setStatus('error');
          setErrorMsg(res.data.gateway_response || 'Payment was not successful.');
        }
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.response?.data?.error || 'Could not verify payment.');
      }
    };
    verify();
  }, [reference]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-[#F8FAFC] to-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {status === 'verifying' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
            <Loader2 size={40} className="text-[#001A72] animate-spin mx-auto mb-4" />
            <h1 className="text-xl font-black text-[#001A72] mb-2">Verifying Payment</h1>
            <p className="text-sm text-gray-500">Please wait while we confirm your transaction...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} className="text-emerald-500" />
            </div>
            <h1 className="text-xl font-black text-[#001A72] mb-2">Payment Successful!</h1>
            <p className="text-sm text-gray-500 mb-6">
              Your payment has been confirmed. You are now enrolled in the course.
            </p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-[#001A72] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#001A72]/90 transition"
            >
              Browse Courses <ArrowRight size={16} />
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10">
            <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-4">
              <XCircle size={36} className="text-red-500" />
            </div>
            <h1 className="text-xl font-black text-[#001A72] mb-2">Payment Issue</h1>
            <p className="text-sm text-gray-500 mb-2">{errorMsg}</p>
            <p className="text-xs text-gray-400 mb-6">Reference: {reference}</p>
            <Link
              href="/courses"
              className="inline-flex items-center gap-2 bg-[#001A72] text-white font-bold px-6 py-3 rounded-xl hover:bg-[#001A72]/90 transition"
            >
              Back to Courses <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 size={36} className="text-[#001A72] animate-spin" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}
