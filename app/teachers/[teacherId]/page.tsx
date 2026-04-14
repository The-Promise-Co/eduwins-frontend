'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import { TeacherProfile } from '@/types';

export default function TeacherProfilePage({ params }: { params: { teacherId: string } }) {
  const { teacherId } = params;
  const router = useRouter();
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [sessions, setSessions] = useState(4);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTeacher();
  }, [teacherId]);

  const fetchTeacher = async () => {
    try {
      const response = await api.get(`/teachers/${teacherId}`);
      setTeacher(response.data);
    } catch (err) {
      setError('Failed to load teacher profile');
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = async () => {
    if (typeof window !== 'undefined' && !localStorage.getItem('token')) {
      router.push(`/login?redirect=/teachers/${teacherId}`);
      return;
    }

    if (!teacher) return;

    setBookingLoading(true);
    try {
      const totalCost = (teacher.baseHourlyRate || 0) * sessions;
      const response = await api.post('/bookings', {
        teacherId,
        totalSessions: sessions,
        totalCost,
        status: 'pending'
      });

      // Redirect to payment with query param
      router.push(`/payment?bookingId=${response.data.id}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Booking failed');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-[#001A72] text-xl">Loading...</div></div>;
  }

  if (!teacher) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-red-600">Teacher not found</div></div>;
  }

  const totalCost = (teacher.baseHourlyRate || 0) * sessions;

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-5xl mx-auto px-4">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-8">
          {/* Left Column: Profile Info */}
          <div className="md:col-span-1">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden sticky top-4">
              {/* Profile Image */}
              <div className="aspect-square bg-gradient-to-br from-[#001A72] to-[#FFB81C] flex items-center justify-center">
                <img
                  src={teacher.photo_url || teacher.profilePhoto || `https://via.placeholder.com/400/001A72/FFFFFF?text=${encodeURIComponent(teacher.full_name || teacher.fullName || 'Teacher')}`}
                  alt={teacher.full_name || teacher.fullName}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="p-6">
                <h1 className="text-3xl font-bold text-[#001A72] mb-2">{teacher.full_name || teacher.fullName}</h1>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className={`text-lg ${i < (teacher.rating || 4) ? 'text-yellow-400' : 'text-gray-300'}`}>★</span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">({teacher.reviewCount || 12} reviews)</span>
                </div>

                <p className="text-2xl font-bold text-[#FFB81C] mb-4">₦{teacher.baseHourlyRate}/hr</p>

                {/* Location */}
                <div className="flex items-center gap-2 mb-4 text-gray-700">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>{teacher.location || 'Lagos'}</span>
                </div>

                {/* Qualification */}
                <div className="mb-4">
                  <p className="text-sm font-semibold text-gray-700">Qualification</p>
                  <p className="text-gray-600">{teacher.qualification}</p>
                </div>

                {/* Experience */}
                <div className="mb-6">
                  <p className="text-sm font-semibold text-gray-700">Experience</p>
                  <p className="text-gray-600">{teacher.yearsExperience} years</p>
                </div>

                {/* Subjects */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-2">Subjects</p>
                  <div className="flex flex-wrap gap-2">
                    {(teacher.subjects || []).map(subject => (
                      <span key={subject} className="px-3 py-1 bg-[#001A72]/10 text-[#001A72] text-xs font-semibold rounded-full">
                        {subject}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Middle Column: Details */}
          <div className="md:col-span-2">
            {/* Bio */}
            <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
              <h2 className="text-2xl font-bold text-[#001A72] mb-4">About</h2>
              <p className="text-gray-700 leading-relaxed">
                {teacher.bio || 'No bio provided yet.'}
              </p>
            </div>

            {/* Video Intro */}
            {teacher.videoIntro && (
              <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
                <h2 className="text-2xl font-bold text-[#001A72] mb-4">Video Introduction</h2>
                <video
                  src={teacher.videoIntro}
                  controls
                  className="w-full rounded-lg bg-black"
                />
              </div>
            )}

            {/* Availability */}
            <div className="bg-white rounded-xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-[#001A72] mb-4">Availability</h2>
              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                  <div key={day} className="text-center">
                    <p className="text-sm font-semibold text-gray-600 mb-2">{day}</p>
                    <div className="aspect-square bg-[#001A72]/10 rounded-lg flex items-center justify-center text-xs text-gray-600">
                      ✓
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Booking Card */}
        <div className="mt-8">
          <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
            <h3 className="text-xl font-bold text-[#001A72] mb-4">Book a Session</h3>

            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Number of Sessions</label>
              <div className="flex items-center gap-4 mb-4">
                <button
                  onClick={() => setSessions(Math.max(1, sessions - 1))}
                  className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  −
                </button>
                <span className="text-2xl font-bold text-[#001A72]">{sessions}</span>
                <button
                  onClick={() => setSessions(sessions + 1)}
                  className="w-10 h-10 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  +
                </button>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700">Rate per session:</span>
                <span className="font-semibold">₦{teacher.baseHourlyRate}</span>
              </div>
              <div className="flex justify-between items-center border-t pt-2 mt-2">
                <span className="text-lg font-bold text-[#001A72]">Total:</span>
                <span className="text-2xl font-bold text-[#FFB81C]">₦{totalCost}</span>
              </div>
            </div>

            <button
              onClick={handleBooking}
              disabled={bookingLoading}
              className="w-full bg-[#001A72] text-white py-3 rounded-lg font-bold hover:bg-[#001A72]/90 disabled:opacity-50 transition text-lg"
            >
              {bookingLoading ? 'Processing...' : 'Proceed to Payment'}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Payment is secured via Paystack. Your money is held in escrow until lessons are completed.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
