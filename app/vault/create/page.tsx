'use client';

import { useState, useEffect, ReactElement, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../services/api';
import DashboardNavigation from '../../../components/DashboardNavigation';
import { User } from '@/types';

interface VaultFormData {
  title: string;
  description: string;
  subject: string;
  content_type: string;
  price: string;
  file_url: string;
  preview_url: string;
}

export default function CreateVaultItemPage(): ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<VaultFormData>({
    title: '',
    description: '',
    subject: '',
    content_type: 'notes',
    price: '',
    file_url: '',
    preview_url: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [appLoading, setAppLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  useEffect(() => {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      setUser(JSON.parse(userJson));
    }
    setAppLoading(false);
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!formData.title || !formData.description || !formData.subject || !formData.price || !formData.file_url) {
      setError('Please fill in all required fields');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 100) {
      setError('Minimum price is ₦100');
      return;
    }

    try {
      setLoading(true);
      await api.post('/vault', formData);

      setSuccess('Content successfully added to the Elite Digital Vault! Redirecting...');
      setTimeout(() => {
        router.push('/vault');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to publish content');
    } finally {
      setLoading(false);
    }
  };

  if (appLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600 font-black">Preparing the vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation user={user} />
      <div className="py-12 px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-10 text-center md:text-left">
            <h1 className="text-4xl font-black text-[#001A72] mb-2 flex items-center justify-center md:justify-start gap-4">
              <span>🏦</span> Vault Publishing
            </h1>
            <p className="text-gray-500 font-medium text-lg leading-relaxed">
              Monetize your intellectual property by sharing your resources with the EduWins community.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-10">
            {/* Form Side */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-[2.5rem] shadow-2xl p-10 border border-gray-100 flex flex-col">
                {error && (
                  <div className="mb-8 p-4 bg-red-50 border-2 border-red-100 rounded-2xl text-red-700 font-bold flex items-center gap-3 animate-in fade-in duration-300">
                    <span>⚠️</span> {error}
                  </div>
                )}

                {success && (
                  <div className="mb-8 p-4 bg-green-50 border-2 border-green-100 rounded-2xl text-green-700 font-bold flex items-center gap-3 animate-in fade-in duration-300">
                    <span>💎</span> {success}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Title</label>
                    <input
                      type="text"
                      name="title"
                      value={formData.title}
                      onChange={handleChange}
                      placeholder="e.g., Mathematics JAMB Revision Guide 2026"
                      className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 focus:outline-none focus:border-[#FFB81C] font-black text-[#001A72] transition shadow-inner"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Resource Blueprint (Description)</label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Detail exactly what the student will gain from this resource..."
                      className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 focus:outline-none focus:border-[#FFB81C] font-medium text-gray-700 transition shadow-inner leading-relaxed"
                    />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Subject Area</label>
                      <select
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 focus:outline-none focus:border-[#FFB81C] font-black text-[#001A72] text-sm"
                      >
                        <option value="">Select Category</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="English">English</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Biology">Biology</option>
                        <option value="Social Sciences">Social Sciences</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Art & Design">Art & Design</option>
                        <option value="Business Studies">Business Studies</option>
                        <option value="Other">Other Category</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Format</label>
                      <select
                        name="content_type"
                        value={formData.content_type}
                        onChange={handleChange}
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 focus:outline-none focus:border-[#FFB81C] font-black text-[#001A72] text-sm"
                      >
                        <option value="notes">Lesson Manuscript (PDF)</option>
                        <option value="video">Cinematic Lecture (Video)</option>
                        <option value="worksheet">Interactive Worksheet</option>
                        <option value="ebook">Digital Textbook</option>
                        <option value="bundle">Expert Mastery Bundle</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Asset Value (₦)</label>
                      <input
                        type="number"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        placeholder="500"
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 focus:outline-none focus:border-[#FFB81C] font-black text-[#001A72] transition shadow-inner"
                      />
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1 ml-1 cursor-help group">
                        Estimated Earnings: <span className="text-green-500">₦{Math.round((parseFloat(formData.price) || 0) * 0.95)}</span>
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Cloud Link (File URL)</label>
                      <input
                        type="url"
                        name="file_url"
                        value={formData.file_url}
                        onChange={handleChange}
                        placeholder="https://drive.google.com/..."
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-2xl p-4 focus:outline-none focus:border-[#FFB81C] font-black text-[#001A72] transition shadow-inner"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#001A72] text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest hover:bg-[#1a2d5e] transition shadow-2xl shadow-blue-100 disabled:opacity-50"
                  >
                    {loading ? 'Encrypting & Sealing...' : 'Publish to Digital Vault'}
                  </button>
                </form>
              </div>
            </div>

            {/* Information Side */}
            <div className="lg:col-span-1 space-y-8">
              <div className="bg-[#001A72] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <h3 className="text-xl font-black mb-6 flex items-center gap-2 relative z-10">
                  <span>💎</span> Creator Benefits
                </h3>
                <div className="space-y-6 relative z-10">
                  <Benefit icon="💹" title="95% Revenue" text="Keep the majority of your hard-earned sales." />
                  <Benefit icon="🛡️" title="Secure Escrow" text="Payments are guaranteed and verified." />
                  <Benefit icon="🌍" title="Global Reach" text="Your content is visible to students nationwide." />
                </div>
                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-lg">
                <h3 className="text-xl font-black text-[#001A72] mb-6">Quality Standard</h3>
                <div className="space-y-4">
                  <p className="text-sm font-medium text-gray-500 leading-relaxed italic">
                    "To maintain the Elite status of our vault, ensure your links are publicly accessible and your content is original."
                  </p>
                  <div className="pt-4 border-t border-gray-50 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#FFB81C] flex items-center justify-center text-white">✨</div>
                    <div>
                      <p className="text-[10px] font-black text-[#001A72] uppercase tracking-widest">EduWins Verified</p>
                      <p className="text-[9px] font-bold text-gray-400">Resource Compliance</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface BenefitProps {
  icon: string;
  title: string;
  text: string;
}

function Benefit({ icon, title, text }: BenefitProps): ReactElement {
  return (
    <div className="flex gap-4">
      <div className="text-3xl">{icon}</div>
      <div>
        <h4 className="font-black text-sm">{title}</h4>
        <p className="text-xs font-medium text-blue-100/70">{text}</p>
      </div>
    </div>
  );
}
