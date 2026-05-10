'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { Lock, Eye, EyeOff, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';

type TokenState = 'loading' | 'valid' | 'invalid';

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [tokenState, setTokenState] = useState<TokenState>('loading');
  const [tokenError, setTokenError] = useState('');

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState(false);

  /* ── Token validation on mount ── */
  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }

    const validate = async () => {
      try {
        await api.get(`/auth/validate-reset-token?token=${encodeURIComponent(token)}`);
        setTokenState('valid');
      } catch (err: any) {
        setTokenError(
          err.response?.data?.error || 'Invalid or expired reset link.'
        );
        setTokenState('invalid');
      }
    };

    validate();
  }, [token, router]);

  /* ── Submit new password ── */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError('');

    if (newPassword.length < 6) {
      setFormError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await api.post('/auth/reset-password', { token, newPassword });
      setSuccess(true);
      setTimeout(() => router.push('/login?reset=1'), 2500);
    } catch (err: any) {
      setFormError(
        err.response?.data?.error || 'Something went wrong. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  /* ─────────────── Loading ─────────────── */
  if (tokenState === 'loading') {
    return (
      <div className="flex flex-col items-center gap-3 py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        <p className="text-gray-500 text-sm">Validating your reset link…</p>
      </div>
    );
  }

  /* ─────────────── Invalid token ─────────────── */
  if (tokenState === 'invalid') {
    return (
      <div className="text-center w-full">
        <div className="flex items-center justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Link Invalid or Expired</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          {tokenError || 'This password reset link is no longer valid. Please request a new one.'}
        </p>

        <Link
          href="/forgot-password"
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-xl transition flex items-center justify-center shadow-sm text-sm mb-4"
        >
          Request a New Link
        </Link>

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

  /* ─────────────── Success ─────────────── */
  if (success) {
    return (
      <div className="text-center w-full">
        <div className="flex items-center justify-center mb-6">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
          </div>
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Password Reset!</h1>
        <p className="text-gray-500 text-sm mb-8 leading-relaxed">
          Your password has been updated. Redirecting you to login…
        </p>

        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      </div>
    );
  }

  /* ─────────────── Form (valid token) ─────────────── */
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

      <h1 className="text-3xl font-extrabold text-gray-900 mb-2 w-full">Reset Password</h1>
      <p className="text-gray-500 text-sm mb-8 w-full">
        Choose a strong new password for your EduWins account.
      </p>

      {formError && (
        <div className="w-full bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm text-center">
          {formError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {/* New Password */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="new-password"
            type={showNew ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="New Password"
            className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-800 placeholder-gray-400 transition"
          />
          <button
            type="button"
            onClick={() => setShowNew(!showNew)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showNew ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {/* Confirm Password */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="confirm-password"
            type={showConfirm ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            placeholder="Confirm New Password"
            className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-800 placeholder-gray-400 transition"
          />
          <button
            type="button"
            onClick={() => setShowConfirm(!showConfirm)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showConfirm ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
          {confirmPassword && confirmPassword === newPassword && (
            <div className="absolute inset-y-0 right-10 pr-2 flex items-center pointer-events-none">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </div>
          )}
        </div>

        {/* Password hint */}
        {newPassword.length > 0 && newPassword.length < 6 && (
          <p className="text-xs text-amber-600">Password must be at least 6 characters</p>
        )}

        {/* Submit */}
        <button
          id="reset-password-submit"
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3.5 rounded-xl transition disabled:opacity-70 flex items-center justify-center gap-2 mt-2 shadow-sm"
        >
          {loading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
              </svg>
              Resetting Password...
            </>
          ) : (
            'Reset Password'
          )}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-gray-500 text-sm">Loading...</p>
        </div>
      }>
        <ResetPasswordContent />
      </Suspense>
    </AuthLayout>
  );
}
