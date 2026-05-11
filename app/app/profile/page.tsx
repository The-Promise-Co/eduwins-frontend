'use client';

import { useState, useEffect, ReactElement, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import { useUser } from '@/context/UserContext';
import { TeacherProfile } from '@/types';
import {
  User,
  Camera,
  Mail,
  Phone,
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  ArrowRight,
  Gem,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';

interface ProfileCompletion {
  completionPercentage: number;
  nextStep: string;
  isPremium: boolean;
  completion: {
    headshot: boolean;
    videoIntro: boolean;
    credentials: boolean;
    credentialsVerified: boolean;
  };
}

const TABS = ['Info', 'Uploads & Verification'] as const;
type Tab = (typeof TABS)[number];

export default function ProfilePage(): ReactElement {
  const router = useRouter();
  const { user: ctxUser } = useUser();
  const [user, setUser] = useState<TeacherProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('Info');

  // Info tab state
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    bio: '',
    photo_url: '',
  });

  // Uploads tab state
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});

  // Shared
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({
    type: '',
    text: '',
  });

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');
      if (!token || !userJson) { router.push('/login'); return; }

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

        if (userData.role === 'teacher') {
          try {
            const res = await api.get('/uploads/profile-completion');
            setCompletion(res.data);
          } catch { /* non-critical */ }
        }
      } catch (err) {
        console.error(err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };
    init();
  }, [router]);

  /* ── Info handlers ── */
  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((p) => ({ ...p, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });
    setSaving(true);
    try {
      await api.put('/auth/profile', formData);
      const updated = { ...(user || {}), ...formData } as TeacherProfile;
      localStorage.setItem('user', JSON.stringify(updated));
      setUser(updated);
      setMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Failed to update profile.' });
    } finally {
      setSaving(false);
    }
  };

  /* ── Upload handler ── */
  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, uploadType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // ── Validation ──
    const sizeInMB = file.size / (1024 * 1024);
    let maxSize = 5;

    if (uploadType === 'headshot') {
      maxSize = 5;
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: 'Please select a valid image file.' });
        return;
      }
    } else if (uploadType === 'videoIntro') {
      maxSize = 50;
      if (!file.type.startsWith('video/')) {
        setMessage({ type: 'error', text: 'Please select a valid video file.' });
        return;
      }
    } else if (uploadType === 'credentials') {
      maxSize = 10;
      if (file.type !== 'application/pdf') {
        setMessage({ type: 'error', text: 'Please upload a PDF document.' });
        return;
      }
    }

    if (sizeInMB > maxSize) {
      setMessage({ type: 'error', text: `File is too large (${sizeInMB.toFixed(1)}MB). Max allowed is ${maxSize}MB.` });
      return;
    }

    setUploading((p) => ({ ...p, [uploadType]: true }));
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append(uploadType, file);

      const endpointMap: Record<string, string> = {
        headshot: '/uploads/headshot',
        videoIntro: '/uploads/video-intro',
        credentials: '/uploads/credentials',
      };
      const res = await api.post(endpointMap[uploadType], formData);
      setMessage({ type: 'success', text: res.data.message });

      const completionRes = await api.get('/uploads/profile-completion');
      setCompletion(completionRes.data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Upload failed' });
    } finally {
      setUploading((p) => ({ ...p, [uploadType]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-[#001A72]" />
      </div>
    );
  }

  const isTeacher = user?.role === 'teacher';

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <PageHeader title="Profile" subtitle="Manage your personal information and verification documents" />

      {/* Alert */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${
          message.type === 'success'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
            : 'bg-red-50 text-red-700 border-red-100'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tab bar */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {(isTeacher ? TABS : (['Info'] as const)).map((tab) => (
          <button
            key={tab}
            onClick={() => { setActiveTab(tab as Tab); setMessage({ type: '', text: '' }); }}
            className={`px-5 py-2 rounded-lg text-xs font-bold transition ${
              activeTab === tab
                ? 'bg-white text-[#001A72] shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Info Tab ── */}
      {activeTab === 'Info' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <form onSubmit={handleSubmit} className="divide-y divide-gray-50">
            {/* Basic Info */}
            <div className="p-6 space-y-5">
              <SectionHead icon={User} label="Basic Information" />
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="First Name">
                  <input name="firstName" value={formData.firstName} onChange={handleChange} className={INPUT} placeholder="First name" />
                </Field>
                <Field label="Last Name">
                  <input name="lastName" value={formData.lastName} onChange={handleChange} className={INPUT} placeholder="Last name" />
                </Field>
              </div>
              <div className="grid sm:grid-cols-2 gap-4 opacity-60">
                <Field label={<span className="flex items-center gap-1"><Mail size={10} /> Email</span>}>
                  <input value={formData.email} disabled className={INPUT + ' bg-gray-50 cursor-not-allowed'} />
                </Field>
                <Field label={<span className="flex items-center gap-1"><Phone size={10} /> Phone</span>}>
                  <input value={formData.phone} disabled className={INPUT + ' bg-gray-50 cursor-not-allowed'} />
                </Field>
              </div>
            </div>

            {/* Bio & Photo */}
            <div className="p-6 space-y-5 bg-gray-50/30">
              <SectionHead icon={FileText} label="Bio & Profile Photo" color="text-purple-600" bg="bg-purple-50" />
              <Field label="Professional Bio">
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows={4}
                  className={INPUT + ' resize-none'}
                  placeholder="Tell students about your experience, teaching style, and passion..."
                />
              </Field>
              <Field label={<span className="flex items-center gap-1"><Camera size={10} /> Profile Photo URL</span>}>
                <input
                  type="url"
                  name="photo_url"
                  value={formData.photo_url}
                  onChange={handleChange}
                  className={INPUT}
                  placeholder="https://example.com/photo.jpg"
                />
              </Field>
              {formData.photo_url && (
                <div className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 w-fit">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={formData.photo_url} alt="Preview" className="h-16 w-16 rounded-xl object-cover" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Preview</p>
                    <p className="text-[10px] text-gray-400">How you appear to students</p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 flex gap-3 bg-gray-50">
              <Button type="submit" isLoading={saving} loadingText="Saving..." variant="primary" className="px-8">
                Save Changes
              </Button>
              <button type="button" onClick={() => router.push('/app/dashboard')} className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── Uploads & Verification Tab ── */}
      {activeTab === 'Uploads & Verification' && isTeacher && (
        <div className="space-y-6">
          {/* Progress bar */}
          {completion && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-widest text-gray-400">Profile Readiness</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{completion.nextStep}</p>
                </div>
                <span className="text-2xl font-black text-[#FFB81C]">{Math.round(completion.completionPercentage)}%</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-[#001A72] to-[#FFB81C] h-3 rounded-full transition-all duration-700"
                  style={{ width: `${completion.completionPercentage}%` }}
                />
              </div>
            </div>
          )}

          {/* Upload cards */}
          <div className="grid sm:grid-cols-3 gap-4">
            <UploadCard title="Headshot" desc="Professional photo · max 5MB" icon={Camera} type="headshot"
              isDone={completion?.completion?.headshot} isUploading={uploading.headshot} onUpload={handleFileUpload}
              accept="image/*" color="text-blue-600" bg="bg-blue-50" />
            <UploadCard title="Video Intro" desc="1-min intro video · max 50MB" icon={FileText} type="videoIntro"
              isDone={completion?.completion?.videoIntro} isUploading={uploading.videoIntro} onUpload={handleFileUpload}
              accept="video/*" color="text-purple-600" bg="bg-purple-50" />
            <UploadCard title="Credentials" desc="TRCN / NIN PDF · max 10MB" icon={FileText} type="credentials"
              isDone={completion?.completion?.credentials} isUploading={uploading.credentials} onUpload={handleFileUpload}
              accept=".pdf" color="text-emerald-600" bg="bg-emerald-50"
              verified={completion?.completion?.credentialsVerified} />
          </div>

          {/* Roadmap */}
          <div className="bg-[#001A72] rounded-2xl p-6 text-white">
            <p className="text-xs font-black uppercase tracking-widest text-white/40 mb-4">Your Professional Path</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { n: '1', title: 'Get Verified', text: 'Submit your files to build trust with parents.', active: true },
                { n: '2', title: 'Go Premium', text: 'Unlock the marketplace and higher earnings.', active: completion?.completionPercentage === 100 },
                { n: '3', title: 'Earn Big', text: 'Upload premium content and earn passively.', active: completion?.isPremium },
              ].map((s) => (
                <div key={s.n} className={`flex gap-3 ${s.active ? 'opacity-100' : 'opacity-30'}`}>
                  <div className={`w-8 h-8 rounded-xl shrink-0 flex items-center justify-center text-xs font-black ${s.active ? 'bg-[#FFB81C] text-[#001A72]' : 'bg-white/10 text-white'}`}>
                    {s.n}
                  </div>
                  <div>
                    <p className="text-xs font-black">{s.title}</p>
                    <p className="text-[10px] text-white/50 mt-0.5 leading-relaxed">{s.text}</p>
                  </div>
                </div>
              ))}
            </div>
            {completion?.completionPercentage === 100 && !completion.isPremium && (
              <button
                onClick={() => router.push('/app/premium-subscription')}
                className="mt-6 w-full flex items-center justify-center gap-2 bg-[#FFB81C] text-[#001A72] py-3 rounded-xl font-black text-sm hover:bg-[#FFB81C]/90 transition"
              >
                <Gem size={15} /> Upgrade to Premium
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────── */

function SectionHead({ icon: Icon, label, color = 'text-[#001A72]', bg = 'bg-blue-50' }: { icon: any; label: string; color?: string; bg?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center ${color}`}>
        <Icon size={15} />
      </div>
      <h2 className="text-xs font-black text-gray-700 uppercase tracking-widest">{label}</h2>
    </div>
  );
}

function Field({ label, children }: { label: React.ReactNode; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function UploadCard({ title, desc, icon: Icon, type, isDone, isUploading, onUpload, accept, color, bg, verified }:
  { title: string; desc: string; icon: any; type: string; isDone?: boolean; isUploading?: boolean; onUpload: (e: ChangeEvent<HTMLInputElement>, t: string) => void; accept: string; color: string; bg: string; verified?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3">
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center`}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <p className="text-xs font-black text-gray-800">{title}</p>
        <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
      </div>
      {isDone ? (
        <div className={`flex items-center gap-1.5 text-[10px] font-black rounded-lg px-3 py-2 ${
          verified === false
            ? 'bg-amber-50 text-amber-600'
            : 'bg-emerald-50 text-emerald-600'
        }`}>
          {verified === false ? <Clock size={11} /> : <CheckCircle2 size={11} />}
          {verified === false ? 'Verification Pending' : 'Uploaded & Verified'}
        </div>
      ) : (
        <label className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-pointer transition ${
          isUploading ? 'bg-gray-100 text-gray-400' : 'bg-[#001A72] text-white hover:bg-[#001A72]/90'
        }`}>
          <Upload size={12} />
          {isUploading ? 'Uploading…' : 'Choose File'}
          <input type="file" accept={accept} onChange={(e) => onUpload(e, type)} className="hidden" disabled={isUploading} />
        </label>
      )}
    </div>
  );
}

const INPUT = 'w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition';
