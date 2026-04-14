'use client';

import { useState, useEffect, ReactElement } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '../../../../services/api';
import NavBar from '../../../../components/NavBar';
import { TeacherProfile, User } from '@/types';

interface PremiumMarketplaceItem {
  id: string;
  type: 'video' | 'material';
  subject: string;
  title: string;
  description: string;
  price: number;
  views?: number;
  downloads?: number;
  userHasAccess?: boolean;
  downloadUrl?: string;
  [key: string]: any;
}

interface Message {
  type: 'success' | 'error' | '';
  text: string;
}

export default function TeacherPremiumMarketplacePage(): ReactElement {
  const router = useRouter();
  const params = useParams();
  const teacherId = params?.teacherId as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [content, setContent] = useState<PremiumMarketplaceItem[]>([]);
  const [activeTab, setActiveTab] = useState<'videos' | 'materials'>('videos');
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>({ type: '', text: '' });

  useEffect(() => {
    const init = async () => {
      if (typeof window !== 'undefined') {
        const userJson = localStorage.getItem('user');
        if (userJson) {
          setUser(JSON.parse(userJson));
        }
      }

      if (!teacherId) return;

      try {
        // Fetch teacher profile
        const teacherResponse = await api.get(`/teachers/${teacherId}/profile`);
        setTeacher(teacherResponse.data);

        // Fetch teacher's premium content
        const contentResponse = await api.get(`/premium/teacher/${teacherId}/content`);
        setContent(contentResponse.data.content || []);
      } catch (err) {
        console.error('Error:', err);
        setMessage({ type: 'error', text: 'Failed to load content' });
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [teacherId]);

  const handlePurchaseVideo = async (videoId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setPurchasing(videoId);
    try {
      await api.post(`/premium/video/${videoId}/subscribe`, {});
      setMessage({ type: 'success', text: 'Video access granted! Enjoy learning!' });

      // Refresh content
      const contentResponse = await api.get(`/premium/teacher/${teacherId}/content`);
      setContent(contentResponse.data.content || []);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Purchase failed';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setPurchasing(null);
    }
  };

  const handlePurchaseMaterial = async (materialId: string) => {
    if (!user) {
      router.push('/login');
      return;
    }

    setPurchasing(materialId);
    try {
      await api.post(`/premium/material/${materialId}/purchase`, {});
      setMessage({ type: 'success', text: 'Material purchased successfully! Check your downloads.' });

      // Refresh content
      const contentResponse = await api.get(`/premium/teacher/${teacherId}/content`);
      setContent(contentResponse.data.content || []);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Purchase failed';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setPurchasing(null);
    }
  };

  const videos = content.filter((c) => c.type === 'video');
  const materials = content.filter((c) => c.type === 'material');

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">Opening marketplace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="max-w-6xl mx-auto py-12 px-6">
        {/* Teacher Hero */}
        {teacher && (
          <div className="bg-white rounded-[3rem] shadow-2xl p-10 mb-12 border border-blue-50 relative overflow-hidden">
            <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start gap-10">
              <div className="w-32 h-32 bg-gradient-to-br from-[#001A72] via-[#001A72] to-[#FFB81C] rounded-[2rem] flex items-center justify-center text-white text-5xl shadow-xl">
                {teacher.headshot ? <img src={teacher.headshot} alt="" className="w-full h-full object-cover rounded-[2rem]" /> : '👨‍🏫'}
              </div>
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                  <h1 className="text-4xl font-black text-[#001A72]">
                    {teacher.fullName || teacher.name}
                  </h1>
                  <div className="flex justify-center md:justify-start gap-2">
                    <span className="bg-[#FFB81C] text-[#001A72] px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">⭐ Premium Elite</span>
                    {teacher.credentialsVerified && (
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest shadow-sm">✓ Verified Expert</span>
                    )}
                  </div>
                </div>
                <p className="text-gray-500 font-medium text-lg leading-relaxed max-w-2xl mb-8">
                  {teacher.bio || 'Professional educator dedicated to excellence in teaching and student success.'}
                </p>
                <div className="flex justify-center md:justify-start gap-8">
                  <Stat label="Total Content" value={content.length.toString()} color="text-[#001A72]" />
                  <Stat label="Student Rating" value={teacher.rating || '4.9'} color="text-[#FFB81C]" />
                  <Stat label="Subscribers" value={teacher.subscribersCount || '150+'} color="text-green-600" />
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#001A72]/5 rounded-bl-[10rem]"></div>
          </div>
        )}

        {message.text && (
          <div className={`mb-10 p-5 rounded-2xl border-2 animate-in fade-in duration-500 ${message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-100'
              : 'bg-red-50 text-red-700 border-red-100'
            }`}>
            <p className="font-black flex items-center justify-center gap-3">
              {message.type === 'success' ? '🎟️' : '❌'} {message.text}
            </p>
          </div>
        )}

        {/* Content Explorer Toggle */}
        <div className="bg-white p-2 rounded-3xl shadow-xl border border-gray-100 flex gap-2 mb-12">
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition duration-300 ${activeTab === 'videos' ? 'bg-[#001A72] text-white shadow-lg' : 'text-[#001A72]/40 hover:bg-gray-50'
              }`}
          >
            📽️ Video Library ({videos.length})
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex-1 py-5 rounded-2xl font-black text-sm uppercase tracking-widest transition duration-300 ${activeTab === 'materials' ? 'bg-[#001A72] text-white shadow-lg' : 'text-[#001A72]/40 hover:bg-gray-50'
              }`}
          >
            📄 PDF Marketplace ({materials.length})
          </button>
        </div>

        {/* Storefront Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {(activeTab === 'videos' ? videos : materials).map((item) => (
            <div key={item.id} className="group bg-white rounded-[2.5rem] shadow-xl overflow-hidden border border-gray-50 hover:shadow-2xl transition duration-500 flex flex-col">
              <div className="relative h-56 bg-[#001A72]/5 flex items-center justify-center text-6xl group-hover:bg-[#001A72]/10 transition duration-500">
                {activeTab === 'videos' ? '🎬' : '📚'}
                <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black text-[#001A72] uppercase tracking-[0.2em]">
                  {item.subject}
                </div>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <h3 className="text-xl font-black text-[#001A72] mb-2 leading-tight">{item.title}</h3>
                <p className="text-gray-400 font-medium text-sm line-clamp-2 mb-6 leading-relaxed">
                  {item.description || 'Exclusive premium learning content designed for student mastery.'}
                </p>

                <div className="mt-auto">
                  <div className="flex items-center justify-between mb-6">
                    <div className="text-3xl font-black text-[#001A72]">
                      ₦{item.price?.toLocaleString()}
                    </div>
                    <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      {activeTab === 'videos' ? `${item.views || 0} Streams` : `${item.downloads || 0} Copies`}
                    </div>
                  </div>

                  {item.userHasAccess ? (
                    <button
                      onClick={() => activeTab === 'videos' ? router.push(`/watch-video/${item.id}`) : window.open(item.downloadUrl)}
                      className="w-full py-4 bg-green-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-600 transition shadow-lg shadow-green-100"
                    >
                      {activeTab === 'videos' ? '▶️ Resume Watching' : '📥 Download Files'}
                    </button>
                  ) : (
                    <button
                      onClick={() => activeTab === 'videos' ? handlePurchaseVideo(item.id) : handlePurchaseMaterial(item.id)}
                      disabled={purchasing === item.id}
                      className="w-full py-4 bg-[#001A72] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#1a2d5e] disabled:opacity-50 transition shadow-lg shadow-blue-100"
                    >
                      {purchasing === item.id ? 'Securing Access...' : 'Unlock Content'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}

          {(activeTab === 'videos' ? videos : materials).length === 0 && (
            <div className="col-span-full py-24 text-center">
              <div className="text-7xl mb-6 opacity-20">🛒</div>
              <h3 className="text-2xl font-black text-[#001A72] opacity-40">No {activeTab} available yet.</h3>
            </div>
          )}
        </div>

        {/* Brand Footer */}
        <div className="mt-24 p-12 bg-[#FFB81C] rounded-[4rem] text-[#001A72] text-center relative overflow-hidden shadow-2xl">
          <h3 className="text-3xl font-black mb-4 relative z-10">Quality Education, Verified Expertise.</h3>
          <p className="font-bold text-lg opacity-80 mb-8 relative z-10">Every piece of premium content is vetted for accuracy and educational value.</p>
          <button onClick={() => router.push('/teacher-search')} className="px-10 py-4 bg-[#001A72] text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:shadow-2xl transition relative z-10">
            Discover More Teachers
          </button>
          <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}

interface StatProps {
  label: string;
  value: string;
  color: string;
}

function Stat({ label, value, color }: StatProps): ReactElement {
  return (
    <div className="text-center md:text-left">
      <p className={`text-2xl font-black mb-0.5 ${color}`}>{value}</p>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</p>
    </div>
  );
}
