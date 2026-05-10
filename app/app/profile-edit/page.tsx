'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import DashboardNavigation from '@/components/DashboardNavigation';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import { TeacherProfile } from '@/types';
import { User, Camera, Mail, Phone, FileText } from 'lucide-react';

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    photo_url: '',
  });

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');

      if (!token || !userJson) {
        router.push('/login');
        return;
      }

      try {
        const userData = JSON.parse(userJson);
        setUser(userData);
        setFormData({
          firstName: userData.firstName || '',
          lastName: userData.lastName || '',
          email: userData.email || '',
          phone: userData.phone || '',
          bio: userData.bio || '',
          photo_url: userData.photo_url || '',
        });
      } catch (err) {
        console.error('Error parsing user data:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      setSaving(true);

      await api.put('/auth/profile', formData);

      // Update localStorage with new user data
      const updatedUser = { ...(user || {}), ...formData } as TeacherProfile;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setSuccess('Profile updated successfully!');
      setTimeout(() => {
        setSuccess('');
      }, 3000);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.response?.data?.error || 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#001A72]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <PageHeader
        title="Edit Profile"
        subtitle="Update your personal information and public bio"
        rightElement={
          <button
            onClick={() => router.push('/app/dashboard')}
            className="text-xs font-bold text-gray-400 hover:text-[#001A72] transition flex items-center gap-1"
          >
            Cancel and return
          </button>
        }
      />

      {error && (
        <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3">
          <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
            <span className="font-bold">!</span>
          </div>
          {error}
        </div>
      )}

      {success && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
            <span className="font-bold">✓</span>
          </div>
          {success}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <form onSubmit={handleSubmit} className="divide-y divide-gray-50">

          {/* Section: Basic Info */}
          <div className="p-8 space-y-6">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#001A72]">
                <User size={18} />
              </div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Basic Information</h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">First Name</label>
                <input
                  type="text"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition"
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Last Name</label>
                <input
                  type="text"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <div className="space-y-2 opacity-70">
                <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  <Mail size={12} /> Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  disabled
                  className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                />
              </div>
              <div className="space-y-2 opacity-70">
                <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  <Phone size={12} /> Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  disabled
                  className="w-full px-4 py-3 border border-gray-100 rounded-xl bg-gray-50 text-gray-500 text-sm cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Section: Bio & Profile */}
          <div className="p-8 space-y-6 bg-gray-50/30">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
                <FileText size={18} />
              </div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-widest">Bio & Profile</h2>
            </div>

            <div className="space-y-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Professional Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={5}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition resize-none"
                placeholder="Tell students about your experience, teaching style, and passion..."
              />
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="flex items-center gap-1.5 text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">
                  <Camera size={12} /> Profile Photo URL
                </label>
                <input
                  type="url"
                  name="photo_url"
                  value={formData.photo_url}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition"
                  placeholder="https://example.com/photo.jpg"
                />
              </div>

              {formData.photo_url && (
                <div className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 w-fit">
                  <img
                    src={formData.photo_url}
                    alt="Profile preview"
                    className="h-20 w-20 rounded-xl object-cover ring-4 ring-gray-50"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Preview</p>
                    <p className="text-[10px] text-gray-400">How you appear to students</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 bg-gray-50 flex flex-col sm:flex-row gap-3">
            <Button
              type="submit"
              isLoading={saving}
              loadingText="Saving changes..."
              variant="primary"
              className="px-8 py-3.5"
            >
              Save Changes
            </Button>
            <button
              type="button"
              onClick={() => router.push('/app/dashboard')}
              className="px-8 py-3.5 rounded-xl font-bold text-sm text-gray-600 hover:bg-gray-100 transition border border-transparent"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
