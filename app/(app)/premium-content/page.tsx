'use client';

import { useState, useEffect, ReactElement, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import DashboardNavigation from '@/components/DashboardNavigation';
import { User } from '@/types';
import { 
  Gem, 
  Tv, 
  Rocket, 
  AlertTriangle, 
  AlertCircle, 
  Video, 
  BookOpen, 
  UploadCloud, 
  PackageOpen, 
  PlayCircle 
} from 'lucide-react';

interface PremiumContent {
  id: string;
  type: 'video' | 'material';
  subject: string;
  title: string;
  description: string;
  price: number;
  views?: number;
  downloads?: number;
  subscribers?: string[];
  [key: string]: any;
}

interface ContentForm {
  subject: string;
  title: string;
  description: string;
  price: string;
  file: File | null;
}

interface Message {
  type: 'success' | 'error' | 'warning' | '';
  text: string;
}

export default function PremiumContentPage(): ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'videos' | 'materials'>('videos');
  const [contentList, setContentList] = useState<PremiumContent[]>([]);
  const [message, setMessage] = useState<Message>({ type: '', text: '' });
  const [uploading, setUploading] = useState<boolean>(false);

  // Form states
  const [videoForm, setVideoForm] = useState<ContentForm>({
    subject: '',
    title: '',
    description: '',
    price: '',
    file: null,
  });

  const [materialForm, setMaterialForm] = useState<ContentForm>({
    subject: '',
    title: '',
    description: '',
    price: '',
    file: null,
  });

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

          // Check if premium
          const statusResponse = await api.get('/premium/subscription/status');
          if (statusResponse.data.subscriptionActive) {
            setIsPremium(true);
            loadContent();
          } else {
            setMessage({
              type: 'warning',
              text: 'You need an active Premium subscription to use this feature. Redirecting to plans...',
            });
            setTimeout(() => router.push('/premium-subscription'), 2500);
          }
        } catch (err) {
          console.error('Error:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    init();
  }, [router]);

  const loadContent = async () => {
    try {
      const response = await api.get('/premium/teacher-content');
      setContentList(response.data.content || []);
    } catch (err) {
      console.error('Error loading content:', err);
    }
  };

  const handleVideoUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!videoForm.file || !videoForm.subject || !videoForm.title || !videoForm.price) {
      setMessage({ type: 'error', text: 'Please fill all fields and select a file' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('subject', videoForm.subject);
    formData.append('title', videoForm.title);
    formData.append('description', videoForm.description);
    formData.append('price', videoForm.price);
    formData.append('videoFile', videoForm.file);

    try {
      await api.post('/premium/subject-video', formData);
      setMessage({ type: 'success', text: 'Subject video uploaded successfully!' });
      setVideoForm({ subject: '', title: '', description: '', price: '', file: null });
      loadContent();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Upload failed';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setUploading(false);
    }
  };

  const handleMaterialUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!materialForm.file || !materialForm.subject || !materialForm.title || !materialForm.price) {
      setMessage({ type: 'error', text: 'Please fill all fields and select a file' });
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('subject', materialForm.subject);
    formData.append('title', materialForm.title);
    formData.append('description', materialForm.description);
    formData.append('price', materialForm.price);
    formData.append('materialFile', materialForm.file);

    try {
      await api.post('/premium/teaching-material', formData);
      setMessage({ type: 'success', text: 'Teaching material uploaded successfully!' });
      setMaterialForm({ subject: '', title: '', description: '', price: '', file: null });
      loadContent();
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Upload failed';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold tracking-tight">Accessing content workshop...</p>
        </div>
      </div>
    );
  }

  if (!isPremium) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-gray-100 text-center max-w-md">
          <div className="flex justify-center mb-4 text-[#FFB81C]">
            <Gem size={64} />
          </div>
          <h2 className="text-2xl font-black text-[#001A72] mb-3">Premium Access Required</h2>
          <p className="text-gray-500 font-medium mb-6">{message.text || 'You need an active subscription to access this workshop.'}</p>
        </div>
      </div>
    );
  }

  const subjects = ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'CRS', 'ISS', 'Other'];
  const videos = contentList.filter((c) => c.type === 'video');
  const materials = contentList.filter((c) => c.type === 'material');

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation user={user} />
      <div className="max-w-6xl mx-auto py-12 px-6">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-4xl font-black text-[#001A72] mb-2 flex items-center gap-3">
            <Tv size={32} /> Content Workshop
          </h1>
          <p className="text-gray-500 font-medium text-lg">Upload and monetize your teaching expertise</p>
        </div>

        {message.text && (
          <div className={`mb-10 p-5 rounded-2xl border-2 animate-in fade-in duration-500 ${message.type === 'success'
              ? 'bg-green-50 text-green-700 border-green-100'
              : message.type === 'warning'
                ? 'bg-yellow-50 text-yellow-700 border-yellow-100'
                : 'bg-red-50 text-red-700 border-red-100'
            }`}>
            <p className="font-bold flex items-center gap-3">
              {message.type === 'success' ? <Rocket size={20} /> : message.type === 'warning' ? <AlertTriangle size={20} /> : <AlertCircle size={20} />} {message.text}
            </p>
          </div>
        )}

        {/* Action Toggle */}
        <div className="bg-white p-2 rounded-2xl shadow-lg border border-gray-100 flex gap-2 mb-10">
            className={`flex-1 py-4 px-6 rounded-xl font-black text-sm uppercase tracking-widest transition duration-300 flex items-center justify-center gap-2 ${activeTab === 'videos' ? 'bg-[#001A72] text-white shadow-lg' : 'text-[#001A72]/50 hover:bg-gray-50'
              }`}
          >
            <Video size={18} /> Video Lectures ({videos.length})
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex-1 py-4 px-6 rounded-xl font-black text-sm uppercase tracking-widest transition duration-300 flex items-center justify-center gap-2 ${activeTab === 'materials' ? 'bg-[#001A72] text-white shadow-lg' : 'text-[#001A72]/50 hover:bg-gray-50'
              }`}
          >
            <BookOpen size={18} /> Study Materials ({materials.length})
          </button>
        </div>

        {/* Workshop Area */}
        <div className="grid lg:grid-cols-3 gap-10">
          {/* Form Side */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100 sticky top-10">
              <h3 className="text-2xl font-black text-[#001A72] mb-6">
                {activeTab === 'videos' ? 'Upload Video' : 'Upload Material'}
              </h3>

              <form onSubmit={activeTab === 'videos' ? handleVideoUpload : handleMaterialUpload} className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Subject</label>
                    <select
                      value={activeTab === 'videos' ? videoForm.subject : materialForm.subject}
                      onChange={(e) => activeTab === 'videos'
                        ? setVideoForm({ ...videoForm, subject: e.target.value })
                        : setMaterialForm({ ...materialForm, subject: e.target.value })
                      }
                      className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl p-3 focus:outline-none focus:border-[#FFB81C] font-bold text-sm"
                    >
                      <option value="">Select</option>
                      {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Price (₦)</label>
                    <input
                      type="number"
                      value={activeTab === 'videos' ? videoForm.price : materialForm.price}
                      onChange={(e) => activeTab === 'videos'
                        ? setVideoForm({ ...videoForm, price: e.target.value })
                        : setMaterialForm({ ...materialForm, price: e.target.value })
                      }
                      className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl p-3 focus:outline-none focus:border-[#FFB81C] font-bold text-sm"
                      placeholder="500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Title</label>
                  <input
                    type="text"
                    value={activeTab === 'videos' ? videoForm.title : materialForm.title}
                    onChange={(e) => activeTab === 'videos'
                      ? setVideoForm({ ...videoForm, title: e.target.value })
                      : setMaterialForm({ ...materialForm, title: e.target.value })
                    }
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl p-3 focus:outline-none focus:border-[#FFB81C] font-bold text-sm"
                    placeholder="Topic name"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Description</label>
                  <textarea
                    value={activeTab === 'videos' ? videoForm.description : materialForm.description}
                    onChange={(e) => activeTab === 'videos'
                      ? setVideoForm({ ...videoForm, description: e.target.value })
                      : setMaterialForm({ ...materialForm, description: e.target.value })
                    }
                    className="w-full bg-gray-50 border-2 border-gray-50 rounded-xl p-3 focus:outline-none focus:border-[#FFB81C] font-bold text-sm"
                    rows={3}
                    placeholder="Brief overview..."
                  ></textarea>
                </div>

                <div className="p-4 bg-blue-50/50 border-2 border-dashed border-blue-100 rounded-2xl text-center">
                  <label className="cursor-pointer block">
                    <div className="flex justify-center mb-1 text-[#001A72] opacity-50">
                      <UploadCloud size={32} />
                    </div>
                    <span className="text-xs font-black text-[#001A72] uppercase tracking-widest">
                      {activeTab === 'videos' ? (videoForm.file ? 'Replace Video' : 'Choose Video File') : (materialForm.file ? 'Replace File' : 'Choose Material PDF')}
                    </span>
                    <input
                      type="file"
                      accept={activeTab === 'videos' ? 'video/*' : '.pdf,.doc,.docx'}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => {
                        const file = e.target.files?.[0] || null;
                        activeTab === 'videos'
                          ? setVideoForm({ ...videoForm, file })
                          : setMaterialForm({ ...materialForm, file });
                      }}
                      className="hidden"
                    />
                  </label>
                  {(activeTab === 'videos' ? videoForm.file : materialForm.file) && (
                    <p className="text-[10px] text-green-600 font-bold mt-2 truncate">
                      ✓ {(activeTab === 'videos' ? videoForm.file?.name : materialForm.file?.name)}
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="w-full bg-[#001A72] text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#001A72]/90 disabled:opacity-50 transition shadow-lg shadow-[#001A72]/20"
                >
                  {uploading ? 'Processing Upload...' : (activeTab === 'videos' ? 'Publish Video' : 'Publish Material')}
                </button>
              </form>
            </div>
          </div>

          {/* List Side */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-xl font-black text-[#001A72] mb-4">Your Published {activeTab === 'videos' ? 'Videos' : 'Materials'}</h3>

            {(activeTab === 'videos' ? videos : materials).length === 0 ? (
              <div className="bg-white rounded-3xl p-20 text-center border border-gray-100 shadow-xl">
                <div className="flex justify-center mb-4 opacity-20 text-[#001A72]">
                  <PackageOpen size={64} />
                </div>
                <p className="text-gray-400 font-bold">No content found in this category.</p>
              </div>
            ) : (
              <div className="grid gap-6">
                {(activeTab === 'videos' ? videos : materials).map((content) => (
                  <div key={content.id} className="bg-white rounded-3xl p-6 shadow-xl border border-gray-100 flex flex-col md:flex-row gap-6 hover:border-[#FFB81C] transition duration-300">
                    <div className="w-full md:w-32 h-32 bg-[#001A72]/5 rounded-2xl flex items-center justify-center text-[#001A72]">
                      {activeTab === 'videos' ? <PlayCircle size={48} /> : <BookOpen size={48} />}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[10px] font-black text-[#FFB81C] uppercase tracking-widest">{content.subject}</p>
                          <h4 className="text-xl font-black text-[#001A72] mt-1">{content.title}</h4>
                        </div>
                        <div className="bg-green-50 text-green-600 px-3 py-1 rounded-lg font-black text-sm">
                          ₦{content.price?.toLocaleString()}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-500 mb-4 leading-relaxed">{content.description}</p>
                      <div className="flex gap-6 border-t pt-4">
                        <ContentStat label={activeTab === 'videos' ? 'Views' : 'Downloads'} value={(activeTab === 'videos' ? (content.views || 0) : (content.downloads || 0)).toString()} />
                        <ContentStat label="Sales" value={(content.subscribers?.length || 0).toString()} />
                        <ContentStat label="Rating" value="4.8/5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface ContentStatProps {
  label: string;
  value: string;
}

function ContentStat({ label, value }: ContentStatProps): ReactElement {
  return (
    <div>
      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">{label}</p>
      <p className="text-xs font-black text-[#001A72]">{value}</p>
    </div>
  );
}
