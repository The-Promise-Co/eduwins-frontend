'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { useUser } from '@/context/UserContext';
import { Mail, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useUser();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(
    searchParams.get('reset') === '1'
      ? 'Password reset successfully. Please sign in with your new password.'
      : ''
  );
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      login(response.data.user, response.data.token);
      router.push('/app/dashboard');
    } catch (err: any) {
      console.log(err);
      if (err.response?.status === 403 && err.response?.data?.requiresVerification) {
        sessionStorage.setItem('verificationToken', err.response.data.verificationToken);
        setSuccess('Account not verified. Redirecting to verification...');
        setTimeout(() => router.push('/verify-otp'), 1000);
      } else {
        setError(err.response?.data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2 w-full">Welcome Back</h1>
      <p className="text-gray-500 text-sm mb-8 w-full">Welcome back, please enter your details</p>

      {/* Sign In / Sign Up toggle */}
      <div className="flex w-full bg-gray-100 p-1 rounded-xl mb-8">
        <div className="w-1/2 text-center py-2 bg-white rounded-lg shadow-sm text-sm font-semibold text-gray-900">
          Sign In
        </div>
        <Link href="/register" className="w-1/2 text-center py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition">
          Signup
        </Link>
      </div>

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

      <form onSubmit={handleSubmit} className="w-full space-y-4">
        {/* Email */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Mail className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            placeholder="Email Address"
            className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-800 placeholder-gray-400 transition"
          />
          {formData.email && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          )}
        </div>

        {/* Password */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            placeholder="Password"
            className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-800 placeholder-gray-400 transition"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {/* Forgot Password */}
        <div className="flex justify-end -mt-1">
          <Link
            href="/forgot-password"
            className="text-xs text-primary hover:text-primary/80 font-medium transition"
          >
            Forgot Password?
          </Link>
        </div>

        {/* Submit */}
        <button
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
              Signing in...
            </>
          ) : (
            'Continue'
          )}
        </button>
      </form>

      {/* Social Logins */}
      <div className="w-full mt-8">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative bg-white px-4 text-xs font-medium text-gray-400">
            Or Continue With
          </div>
        </div>

        <div className="flex justify-center gap-4 mt-6">
          <button className="flex items-center justify-center h-12 w-12 rounded-full border border-gray-200 hover:bg-gray-50 transition">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthLayout>
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-gray-600 text-sm">Loading...</p>
        </div>
      }>
        <LoginContent />
      </Suspense>
    </AuthLayout>
  );
}
