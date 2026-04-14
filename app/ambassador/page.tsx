'use client';

import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AmbassadorPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/ambassadors/me');
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load ambassador data');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const apply = async () => {
    try {
      await api.post('/api/ambassadors/apply');
      alert('Ambassador application sent!');
      window.location.reload();
    } catch (err) {
      alert(err.response?.data?.error || 'Unable to apply');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-[#001A72] mb-4">Ambassador Program</h1>
        <p className="text-gray-600 mb-6">Earn bonuses by mentoring and referring teachers in a 2-level plan.</p>

        {loading && <p className="text-gray-500 animate-pulse">Loading ambassador status...</p>}
        {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded border border-red-200">{error}</div>}

        {!loading && !data && (
          <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
            <p className="mb-4 text-blue-800 font-medium">You are not an ambassador yet. Ready to join our elite team of mentors?</p>
            <button
              onClick={apply}
              className="bg-[#001A72] text-white px-8 py-3 rounded-lg font-bold hover:bg-[#001A72]/90 transition shadow-md hover:shadow-lg"
            >
              Apply Now
            </button>
          </div>
        )}

        {data && (
          <div className="space-y-6">
            <div className="bg-[#FFB81C]/10 rounded-xl p-6 border-2 border-[#FFB81C]/30 shadow-sm">
              <div className="grid md:grid-cols-2 gap-4 text-[#001A72]">
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Status</p>
                  <p className="text-xl font-black">{data.status.toUpperCase()}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Ambassador Level</p>
                  <p className="text-xl font-black">{data.level}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Direct Referrals</p>
                  <p className="text-xl font-black">{data.direct_referrals}</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">Indirect Referrals</p>
                  <p className="text-xl font-black">{data.indirect_referrals}</p>
                </div>
              </div>

              <div className="mt-6 bg-[#001A72] text-white p-4 rounded-lg flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-blue-300">Total Earned Credits</p>
                  <p className="text-3xl font-black">₦{data.earned_credits.toLocaleString()}</p>
                </div>
                <div className="text-4xl">💰</div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow p-6 border border-gray-100">
              <h2 className="font-bold text-xl text-[#001A72] mb-4 flex items-center gap-2">
                <span>📘</span> How it works
              </h2>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-green-100 border border-green-200 text-green-700 rounded-full flex items-center justify-center shrink-0 font-bold">1</div>
                  <p className="text-gray-700 text-sm">Refer teachers to Edu-Wins and earn Welfare Fund rewards instantly.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-green-100 border border-green-200 text-green-700 rounded-full flex items-center justify-center shrink-0 font-bold">2</div>
                  <p className="text-gray-700 text-sm"><span className="font-bold text-[#001A72]">Level 1:</span> Earn ₦1,000 for each direct teacher referral you bring to the platform.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-green-100 border border-green-200 text-green-700 rounded-full flex items-center justify-center shrink-0 font-bold">3</div>
                  <p className="text-gray-700 text-sm"><span className="font-bold text-[#001A72]">Level 2:</span> Earn ₦500 for every referral made by your direct mentees.</p>
                </div>
                <div className="flex gap-4">
                  <div className="w-8 h-8 bg-green-100 border border-green-200 text-green-700 rounded-full flex items-center justify-center shrink-0 font-bold">4</div>
                  <p className="text-gray-700 text-sm">Maintain a <span className="font-bold text-[#FFB81C]">4.5+ rating</span> and uphold community standards to stay in the program.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
