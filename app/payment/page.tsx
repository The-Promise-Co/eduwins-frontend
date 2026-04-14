'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '../../services/api';

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get('bookingId');

  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('card');

  useEffect(() => {
    if (!bookingId) {
      router.push('/search');
      return;
    }
    fetchBooking();
  }, [bookingId, router]);

  const fetchBooking = async () => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      setBooking(response.data);
    } catch (err) {
      setError('Failed to load booking details');
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!booking) return;

    setProcessing(true);
    setError('');

    try {
      // Initialize payment with Paystack
      const response = await api.post('/paystack/initialize', {
        bookingId,
        amount: booking.totalCost * 100, // Paystack accepts amount in kobo
        email: booking.parentEmail || (typeof window !== 'undefined' ? localStorage.getItem('userEmail') : ''),
        paymentMethod
      });

      const { authorizationUrl } = response.data;

      // Redirect to Paystack payment page
      window.location.href = authorizationUrl;
    } catch (err) {
      setError(err.response?.data?.message || 'Payment initialization failed');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-[#001A72] animate-pulse font-bold text-xl">Loading payment details...</div>
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-600 font-bold text-xl">No booking found</div>
      </div>
    );
  }

  const teacherEarnings = Math.floor(booking.totalCost * 0.85);
  const platformFee = Math.floor(booking.totalCost * 0.10);
  const welfareContribution = Math.floor(booking.totalCost * 0.05);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001A72]/10 to-[#FFB81C]/10 py-12">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#001A72] mb-2">Secure Payment</h1>
          <p className="text-gray-600">Complete your booking with safe, encrypted payment</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Left: Payment Form */}
          <div className="md:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-[#001A72] mb-6">Payment Method</h2>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                  {error}
                </div>
              )}

              {/* Payment Method Selection */}
              <div className="space-y-4 mb-8">
                {[
                  { id: 'card', label: '💳 Debit/Credit Card', icon: '🏦' },
                  { id: 'ussd', label: '📱 USSD Transfer', icon: '📱' },
                  { id: 'bank', label: '🏦 Bank Transfer', icon: '🏦' }
                ].map(method => (
                  <label key={method.id} className="flex items-center p-4 border-2 rounded-lg cursor-pointer transition" style={{
                    borderColor: paymentMethod === method.id ? '#001A72' : '#e5e7eb',
                    backgroundColor: paymentMethod === method.id ? 'rgba(0, 26, 114, 0.05)' : 'transparent'
                  }}>
                    <input
                      type="radio"
                      name="paymentMethod"
                      value={method.id}
                      checked={paymentMethod === method.id}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-5 h-5 text-[#001A72] focus:ring-[#001A72]"
                    />
                    <span className="text-2xl ml-4 mr-4">{method.icon}</span>
                    <span className="font-semibold text-gray-800">{method.label}</span>
                  </label>
                ))}
              </div>

              {/* Security Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
                <div className="flex gap-4">
                  <div className="text-3xl">🔒</div>
                  <div>
                    <h3 className="font-bold text-blue-900 mb-1">Your Payment is Secure</h3>
                    <p className="text-sm text-blue-800">
                      This transaction is protected by Paystack. Your funds are held in escrow until you confirm the lessons are completed.
                    </p>
                  </div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="bg-gray-50 rounded-lg p-6 mb-8">
                <h3 className="font-bold text-[#001A72] mb-4">Payment Breakdown</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-700">✓ Teacher Earnings (85%)</span>
                    <span className="font-semibold">₦{teacherEarnings.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">✓ Edu-Wins Platform Fee (10%)</span>
                    <span className="font-semibold">₦{platformFee.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-700">✓ Welfare Fund (5%)</span>
                    <span className="font-semibold text-green-600">₦{welfareContribution.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full bg-[#001A72] text-white py-4 rounded-lg font-bold text-lg hover:bg-[#001A72]/90 disabled:opacity-50 transition"
              >
                {processing ? 'Processing...' : `Pay ₦${booking.totalCost.toLocaleString()} with ${paymentMethod.toUpperCase()}`}
              </button>
            </div>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="bg-white rounded-xl shadow-lg p-8 sticky top-4">
              <h3 className="text-xl font-bold text-[#001A72] mb-6">Order Summary</h3>

              <div className="space-y-6 mb-8">
                {/* Teacher Info */}
                <div className="border-b pb-6">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Teacher</p>
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#001A72] to-[#FFB81C] rounded-lg flex items-center justify-center text-white font-bold">
                      {booking.teacherName?.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="font-semibold text-[#001A72]">{booking.teacherName}</p>
                      <p className="text-xs text-gray-500">₦{booking.ratePerHour}/hour</p>
                    </div>
                  </div>
                </div>

                {/* Booking Details */}
                <div className="border-b pb-6">
                  <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Booking Details</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Sessions</span>
                      <span className="font-semibold">{booking.totalSessions}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Subject</span>
                      <span className="font-semibold">{booking.subject}</span>
                    </div>
                  </div>
                </div>

                {/* Cost Breakdown */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3 pb-3 border-b">
                    <span className="text-gray-700">Subtotal</span>
                    <span className="font-semibold">₦{booking.totalCost.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Tax & Fees</span>
                    <span className="font-semibold">Included</span>
                  </div>
                </div>
              </div>

              {/* Total */}
              <div className="border-t-2 border-gray-200 pt-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold text-[#001A72]">Total Amount</span>
                  <span className="text-3xl font-bold text-[#FFB81C]">₦{booking.totalCost.toLocaleString()}</span>
                </div>
              </div>

              {/* Escrow Info */}
              <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-900">
                <p className="font-semibold mb-2">⏳ How Escrow Works</p>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>You pay securely via Paystack</li>
                  <li>Money is held safely in escrow</li>
                  <li>Teacher conducts lessons</li>
                  <li>You confirm completion</li>
                  <li>Teacher receives payment</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
