'use client';

import { useState, useEffect, ChangeEvent, FormEvent, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import api from '@/services/api';
import { useUser } from '@/context/UserContext';
import { User, Mail, Phone, Lock, Eye, EyeOff, CheckCircle2, Hash, Users, BookOpen } from 'lucide-react';
import AuthLayout from '@/components/AuthLayout';
import Button from '@/components/Button';

function RegisterContent() {
  const router = useRouter();
  const { login } = useUser();
  const searchParams = useSearchParams();
  const [referralCode, setReferralCode] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'parent',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    const code = searchParams.get('ref') || searchParams.get('referral');
    if (code) setReferralCode(code);

    const roleParam = searchParams.get('role');
    if (roleParam) {
      const normalizedRole = roleParam === 'tutor' ? 'teacher' : roleParam;
      setFormData((prev) => ({ ...prev, role: normalizedRole }));
    }
  }, [searchParams]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/auth/register', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || undefined,
        password: formData.password,
        role: formData.role,
        referralCode: referralCode || undefined,
      });

      if (response.data?.token) {
        login(response.data.user, response.data.token);
        setSuccess('Account created! Redirecting to your dashboard…');
        setTimeout(() => router.push('/app/dashboard'), 1200);
      } else if (response.data?.verificationToken) {
        sessionStorage.setItem('verificationToken', response.data.verificationToken);
        setSuccess('Registration successful! Redirecting to verification...');
        setTimeout(() => router.push('/verify-otp'), 1000);
      } else {
        setSuccess('Account created successfully! Please sign in.');
        setTimeout(() => router.push('/login'), 1500);
      }
    } catch (err: any) {
      const serverError = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(`${serverError}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-2 w-full">Create Account</h1>
      <p className="text-gray-500 text-sm mb-8 w-full">Join EduWins today and get started</p>

      {/* Sign In / Sign Up toggle */}
      <div className="flex w-full bg-gray-100 p-1 rounded-xl mb-6">
        <Link href="/login" className="w-1/2 text-center py-2 text-sm font-medium text-gray-500 hover:text-gray-900 transition">
          Sign In
        </Link>
        <div className="w-1/2 text-center py-2 bg-white rounded-lg shadow-sm text-sm font-semibold text-gray-900">
          Signup
        </div>
      </div>

      {error && (
        <div className="w-full bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm text-center">
          {error}
        </div>
      )}

      {referralCode && (
        <div className="w-full bg-primary/5 border border-primary/20 text-primary px-4 py-3 rounded-xl mb-6 text-sm text-center">
          Referred using code: <strong>{referralCode}</strong>
        </div>
      )}

      {success && (
        <div className="w-full bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-xl mb-6 text-sm text-center">
          {success}
        </div>
      )}

      <form onSubmit={handleRegisterSubmit} className="w-full space-y-3">
        {/* Name */}
        <div className="flex gap-3">
          <div className="relative w-1/2">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              required
              placeholder="First Name"
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-800 placeholder-gray-400 transition"
            />
          </div>
          <div className="relative w-1/2">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              required
              placeholder="Last Name"
              className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-800 placeholder-gray-400 transition"
            />
          </div>
        </div>

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
            className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-800 placeholder-gray-400 transition"
          />
        </div>

        {/* Phone */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Phone className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            placeholder="Phone Number (Optional)"
            className="w-full pl-12 pr-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-800 placeholder-gray-400 transition"
          />
        </div>

        {/* Role picker */}
        <div className="grid grid-cols-2 gap-3">
          <div
            onClick={() => setFormData((prev) => ({ ...prev, role: 'parent' }))}
            className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
              formData.role === 'parent'
                ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50 bg-white'
            }`}
          >
            <Users className={`h-5 w-5 ${formData.role === 'parent' ? 'text-primary' : 'text-gray-400'}`} />
            <span className={`font-semibold text-sm ${formData.role === 'parent' ? 'text-primary' : 'text-gray-600'}`}>
              Parent
            </span>
          </div>

          <div
            onClick={() => setFormData((prev) => ({ ...prev, role: 'teacher' }))}
            className={`flex items-center gap-3 p-3.5 border-2 rounded-xl cursor-pointer transition-all ${
              formData.role === 'teacher'
                ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10'
                : 'border-gray-200 hover:border-primary/30 hover:bg-gray-50 bg-white'
            }`}
          >
            <BookOpen className={`h-5 w-5 ${formData.role === 'teacher' ? 'text-primary' : 'text-gray-400'}`} />
            <span className={`font-semibold text-sm ${formData.role === 'teacher' ? 'text-primary' : 'text-gray-600'}`}>
              Tutor
            </span>
          </div>
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

        {/* Confirm Password */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Lock className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
            placeholder="Confirm Password"
            className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-800 placeholder-gray-400 transition"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
          </button>
        </div>

        {/* Referral Code */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Hash className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={referralCode}
            onChange={(e) => setReferralCode(e.target.value)}
            placeholder="Referral Code (Optional)"
            className="w-full pl-12 pr-12 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-sm text-gray-800 placeholder-gray-400 transition"
          />
          {referralCode && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
          )}
        </div>

        {/* Submit */}
        <Button
          type="submit"
          isLoading={loading}
          loadingText="Creating Account..."
          className="mt-4"
        >
          Create Account
        </Button>
      </form>

      {/* Social Logins */}
      <div className="w-full mt-8">
        <div className="relative flex items-center justify-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200" />
          </div>
          <div className="relative bg-white px-4 text-xs font-medium text-gray-400">
            Or Signup With
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

export default function RegisterPage() {
  return (
    <AuthLayout>
      <Suspense fallback={
        <div className="flex flex-col items-center gap-3 py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
          <p className="text-gray-600 text-sm">Loading registration...</p>
        </div>
      }>
        <RegisterContent />
      </Suspense>
    </AuthLayout>
  );
}
