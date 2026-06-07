'use client';

import { useState, FormEvent, Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useResendOtp, useVerifyOtp } from '@/misc/hooks/api/auth';
import { useUser } from '../../misc/context/UserContext';
import AuthSlider from '@/misc/components/AuthSlider';
import Button from '@/misc/components/Button';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useUser();
  const [otp, setOtp] = useState('');

  const is2FA = searchParams.get('mode') === '2fa' || (typeof window !== 'undefined' && sessionStorage.getItem('is2FA') === 'true');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [countdown, setCountdown] = useState(60);
  const resendOtpMutation = useResendOtp();
  const verifyOtpMutation = useVerifyOtp();

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [countdown]);

  const handleResendOtp = async () => {
    setError('');
    setSuccess('');
    const tokenFromStorage = sessionStorage.getItem('verificationToken');
    if (!tokenFromStorage) {
      setError('Verification session expired. Please log in again to receive a new OTP.');
      return;
    }

    try {
      await resendOtpMutation.mutateAsync({ token: tokenFromStorage });
      setSuccess('A new OTP has been sent to your email.');
      setCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to resend OTP. Please try again.');
    }
  };

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    try {
      const tokenFromStorage = sessionStorage.getItem('verificationToken');

      if (!tokenFromStorage) {
        setError(is2FA ? 'Login session expired. Please try signing in again.' : 'Verification session expired or invalid. Please try registering again.');
        return;
      }

      const response = await verifyOtpMutation.mutateAsync({
        token: tokenFromStorage,
        otp: otp,
        is2FA,
      });

      const token = response.token;
      const user = response.user;

      login(user, token);

      // Clean up session storage
      sessionStorage.removeItem('verificationToken');
      sessionStorage.removeItem('is2FA');

      setSuccess('OTP verified! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/app/dashboard');
      }, 1200);
    } catch (err: any) {
      const serverError = err.response?.data?.error || err.response?.data?.message || 'OTP verification failed. Please try again.';
      setError(serverError);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Column: Form */}
      <div className="w-full md:w-1/2 flex flex-col justify-between py-8 px-6 md:px-16 lg:px-24 h-screen overflow-y-auto">
        {/* Logo Section */}
        <div className="flex items-center justify-center pt-2 pb-8">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="EduWins Logo" className="h-8" />
          </Link>
        </div>

        {/* Main Content Center */}
        <div className="flex flex-col flex-grow items-center justify-center w-full max-w-[400px] mx-auto pb-12">
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">
            {is2FA ? 'Two-Factor Verification' : 'Verify OTP'}
          </h1>
          <p className="text-gray-500 text-sm mb-8">
            {is2FA ? 'Please enter the 2FA verification code sent to your email' : 'Please enter the OTP sent to your email'}
          </p>

          {error && (
            <div className="w-full bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl mb-6 text-sm text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleOtpSubmit} className="w-full space-y-4 pt-4">
            <div className="relative">
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="Enter 6-digit OTP"
                className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-center tracking-widest text-lg font-semibold text-gray-800 placeholder-gray-300 transition"
              />
            </div>

            <Button
              type="submit"
              isLoading={verifyOtpMutation.isPending}
              loadingText="Verifying..."
            >
              Verify OTP
            </Button>

            <Button
              type="button"
              variant="ghost"
              onClick={handleResendOtp}
              isLoading={resendOtpMutation.isPending}
              loadingText="Resending..."
              disabled={verifyOtpMutation.isPending || countdown > 0}
              className="text-primary font-medium py-2 text-sm hover:underline shadow-none"
            >
              {countdown > 0 ? `Resend OTP in ${countdown}s` : 'Resend OTP'}
            </Button>

            <Link
              href={is2FA ? '/login' : '/register'}
              className="block w-full text-center text-gray-500 font-medium py-3 text-sm hover:text-gray-800 transition"
            >
              {is2FA ? '← Back to Sign In' : '← Back to Registration'}
            </Link>
          </form>
        </div>
      </div>

      {/* Right Column: Dynamic Auth Slider */}
      <div className="hidden md:block md:w-1/2 relative bg-primary items-center justify-center overflow-hidden">
        <AuthSlider />
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <VerifyOtpContent />
    </Suspense>
  );
}
