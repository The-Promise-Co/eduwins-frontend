'use client';

import { useState, Suspense } from 'react';
import Link from 'next/link';
import { useApiMutation } from '@/hooks/useApi';
import { Mail, CheckCircle2, ArrowLeft } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/Button';

function ForgotPasswordContent() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const forgotPasswordMutation = useApiMutation<unknown, { email: string }>({
    method: 'post',
    url: '/auth/forgot-password',
    data: (data) => data,
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    try {
      await forgotPasswordMutation.mutateAsync({ email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    }
  };

  if (submitted) {
    return (
      <div className="text-center w-full">
        <div className="flex items-center justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Check your inbox</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          If <strong>{email}</strong> is registered with EduWins, you&apos;ll receive a
          password reset link shortly. The link expires in <strong>1 hour</strong>.
        </p>

        <p className="text-xs text-gray-400 mb-8">
          Didn&apos;t receive it? Check your spam folder or{' '}
          <button
            onClick={() => { setSubmitted(false); setEmail(''); }}
            className="text-primary hover:underline font-medium"
          >
            try again
          </button>
          .
        </p>

        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 font-medium transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>
    );
  }

  return (
    <>
      {/* Back link */}
      <div className="w-full mb-8">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Login
        </Link>
      </div>

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2 w-full">Forgot Password?</h1>
      <p className="text-gray-500 text-sm mb-8 w-full">
        Enter the email address for your account and we&apos;ll send you a reset link.
      </p>

      {error && (
        <div className="w-full bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {/* Email */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="forgot-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Email Address"
            className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-800 placeholder-gray-400 transition"
          />
          {email && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          id="forgot-password-submit"
          type="submit"
          isLoading={forgotPasswordMutation.isPending}
          loadingText="Sending Reset Link..."
        >
          Send Reset Link
        </Button>
      </form>
    </>
  );
}

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      }>
        <ForgotPasswordContent />
      </Suspense>
    </AuthLayout>
  );
}
