'use client';

import { useState, useEffect, ReactElement, ChangeEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../src/services/api';
import DashboardNavigation from '../../components/DashboardNavigation';
import { User } from '@/src/types';

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

interface Message {
  type: 'success' | 'error' | '';
  text: string;
}

export default function ProfileBuilderPage(): ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [completion, setCompletion] = useState<ProfileCompletion | null>(null);
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<Message>({ type: '', text: '' });

  useEffect(() => {
    const init = async () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('user');

        if (!token || !userJson) {
          router.push('/login');
          return;
        }

        try {
          const userData = JSON.parse(userJson);
          if (userData.role !== 'teacher') {
            router.push('/dashboard');
            return;
          }
          setUser(userData);

          // Get profile completion status
          const response = await api.get('/uploads/profile-completion');
          setCompletion(response.data);
        } catch (err) {
          console.error('Error:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    init();
  }, [router]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, uploadType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading({ ...uploading, [uploadType]: true });
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append(uploadType, file);

      let response;
      switch (uploadType) {
        case 'headshot':
          response = await api.post('/uploads/headshot', formData);
          break;
        case 'videoIntro':
          response = await api.post('/uploads/video-intro', formData);
          break;
        case 'credentials':
          response = await api.post('/uploads/credentials', formData);
          break;
        default:
          return;
      }

      setMessage({
        type: 'success',
        text: response.data.message,
      });

      // Refresh completion status
      const completionResponse = await api.get('/uploads/profile-completion');
      setCompletion(completionResponse.data);

      // Refresh user data in localStorage
      if (user) {
        const updatedUser = { ...user, ...response.data.user };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Upload failed';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setUploading({ ...uploading, [uploadType]: false });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">Initializing profile builder...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation user={user} />
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-black text-[#001A72] mb-3">🎯 Build Your Elite Profile</h1>
            <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-2xl">
              Complete your profile to increase your visibility to parents and unlock our premium teacher ecosystem features.
            </p>
          </div>

          {message.text && (
            <div className={`mb-8 p-4 rounded-xl border-2 animate-in fade-in duration-500 ${
              message.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-100'
                : 'bg-red-50 text-red-700 border-red-100'
            }`}>
              <p className="font-bold flex items-center gap-2">
                {message.type === 'success' ? '✅' : '❌'} {message.text}
              </p>
            </div>
          )}

          {/* Completion Progress */}
          {completion && (
            <div className="bg-white rounded-2xl shadow-xl p-8 mb-10 border border-gray-100 relative overflow-hidden">
              <div className="flex items-center justify-between mb-6 relative z-10">
                <div>
                  <h2 className="text-xl font-black text-[#001A72]">Profile Readiness</h2>
                  <p className="text-sm font-bold text-gray-400">{completion.nextStep}</p>
                </div>
                <div className="text-5xl font-black text-[#FFB81C]">
                  {Math.round(completion.completionPercentage)}%
                </div>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-6 p-1 relative z-10 shadow-inner">
                <div
                  className="bg-gradient-to-r from-[#001A72] via-[#001A72] to-[#FFB81C] h-4 rounded-full transition-all duration-1000 ease-out"
                  style={{ width: `${completion.completionPercentage}%` }}
                ></div>
              </div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB81C]/5 rounded-bl-full translate-x-12 -translate-y-12"></div>
            </div>
          )}

          {/* Upload Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <UploadCard 
              title="Identity & Face" 
              desc="Professional headshot. Max 5MB." 
              type="headshot" 
              icon="📸" 
              color="border-blue-500" 
              isDone={completion?.completion?.headshot}
              onUpload={handleFileUpload}
              isUploading={uploading.headshot}
            />
            <UploadCard 
              title="Introduction" 
              desc="1-min video intro. Max 50MB." 
              type="videoIntro" 
              icon="🎬" 
              color="border-purple-500" 
              isDone={completion?.completion?.videoIntro}
              onUpload={handleFileUpload}
              isUploading={uploading.videoIntro}
            />
            <UploadCard 
              title="Credentials" 
              desc="TRCN/NIN PDF. Max 10MB." 
              type="credentials" 
              icon="📄" 
              color="border-green-500" 
              isDone={completion?.completion?.credentials}
              onUpload={handleFileUpload}
              isUploading={uploading.credentials}
              verified={completion?.completion?.credentialsVerified}
            />
          </div>

          {/* Roadmap */}
          <div className="bg-[#001A72] rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl">
            <div className="relative z-10">
              <h3 className="text-2xl font-black mb-8">🚀 Your Professional Path</h3>
              <div className="grid md:grid-cols-3 gap-10">
                <Step number="1" title="Get Verified" text="Submit files to build trust with parents." active />
                <Step number="2" title="Go Premium" text="Unlock the marketplace and higher rates." active={completion?.completionPercentage === 100} />
                <Step number="3" title="Earn Big" text="Upload premium content & earn passive income." active={completion?.isPremium} />
              </div>

              {completion?.completionPercentage === 100 && !completion.isPremium && (
                <button
                  onClick={() => router.push('/premium-subscription')}
                  className="mt-12 w-full bg-[#FFB81C] text-[#001A72] py-5 rounded-2xl font-black text-xl hover:bg-[#FFB81C]/90 transition shadow-lg shadow-[#FFB81C]/20 hover:-translate-y-1"
                >
                  UPGRADE TO PREMIUM NOW
                </button>
              )}
            </div>
            <div className="absolute -left-24 -bottom-24 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface UploadCardProps {
  title: string;
  desc: string;
  icon: string;
  color: string;
  isDone?: boolean;
  onUpload: (e: ChangeEvent<HTMLInputElement>, type: string) => Promise<void>;
  isUploading?: boolean;
  verified?: boolean;
  type: string;
}

function UploadCard({ title, desc, icon, color, isDone, onUpload, isUploading, verified, type }: UploadCardProps): ReactElement {
  return (
    <div className={`bg-white rounded-2xl shadow-lg p-6 border-t-8 ${color} hover:shadow-2xl transition duration-300 transform hover:-translate-y-1`}>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-black text-[#001A72] mb-1">{title}</h3>
      <p className="text-xs font-medium text-gray-500 mb-6 leading-relaxed">{desc}</p>
      
      {isDone ? (
        <div className={`p-4 rounded-xl text-center text-xs font-black uppercase tracking-widest ${
          verified === false ? 'bg-orange-50 text-orange-600 border border-orange-100' : 'bg-green-50 text-green-600 border border-green-100'
        }`}>
          {verified === false ? '⏳ Verification Pending' : '✅ Completed'}
        </div>
      ) : (
        <label className="block w-full text-center py-4 bg-[#001A72] text-white rounded-xl font-black text-xs uppercase tracking-widest cursor-pointer hover:bg-[#001A72]/90 transition shadow-md">
          {isUploading ? '📤 Uploading...' : 'Choose File'}
          <input
            type="file"
            accept={type === 'headshot' ? 'image/*' : type === 'videoIntro' ? 'video/*' : '.pdf'}
            onChange={(e) => onUpload(e, type)}
            className="hidden"
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}

interface StepProps {
  number: string;
  title: string;
  text: string;
  active?: boolean;
}

function Step({ number, title, text, active }: StepProps): ReactElement {
  return (
    <div className={`relative ${active ? 'opacity-100' : 'opacity-40'}`}>
      <div className={`w-12 h-12 rounded-2xl mb-4 flex items-center justify-center font-black text-xl ${active ? 'bg-[#FFB81C] text-[#001A72]' : 'bg-white/20 text-white'}`}>
        {number}
      </div>
      <h4 className="font-black text-lg mb-2">{title}</h4>
      <p className="text-sm font-medium text-white/70 leading-relaxed">{text}</p>
    </div>
  );
}
