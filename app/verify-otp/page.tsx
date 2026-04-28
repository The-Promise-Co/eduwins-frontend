'use client';

import { useState, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '../../services/api';
import { useUser } from '../../context/UserContext';
import AuthSlider from '../../components/AuthSlider';

function VerifyOtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const { login } = useUser();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleOtpSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/verify-otp', {
        email: email,
        otp: otp,
      });

      const token = response.data.token;
      const user = response.data.user;

      login(user, token);

      setSuccess('OTP verified! Redirecting to dashboard...');
      setTimeout(() => {
        router.push('/app/dashboard');
      }, 1200);
    } catch (err: any) {
      const serverError = err.response?.data?.error || err.response?.data?.message || 'OTP verification failed. Please try again.';
      setError(serverError);
    } finally {
      setLoading(false);
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
          <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Verify OTP</h1>
          <p className="text-gray-500 text-sm mb-8">
            {email ? `We sent an OTP to ${email}` : 'Please enter your OTP'}
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

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-70 flex items-center justify-center shadow-sm"
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <Link
              href="/register"
              className="block w-full text-center text-gray-500 font-medium py-3 text-sm hover:text-gray-800 transition"
            >
              ← Back to Registration
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
