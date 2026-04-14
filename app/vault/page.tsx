'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '../../services/api';

export default function DigitalVaultPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    subject: '',
    minPrice: '',
    maxPrice: ''
  });
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.subject) params.append('subject', filters.subject);
      if (filters.minPrice) params.append('min_price', filters.minPrice);
      if (filters.maxPrice) params.append('max_price', filters.maxPrice);

      const response = await api.get(`/vault?${params}`);
      setItems(response.data);
    } catch (err) {
      console.error('Failed to fetch vault items:', err);
      // Mock data for demo if API fails
      setItems([
        {
          id: 1,
          title: 'Complete Mathematics Lesson Notes (Grade 7-9)',
          description: 'Detailed lesson notes covering algebra, geometry, and statistics for junior secondary students.',
          content_type: 'PDF',
          teacher_name: 'Mr. Okonkwo',
          price: 2500,
          subject: 'Mathematics',
          rating_avg: 4.8,
          total_sessions: 124
        },
        {
          id: 2,
          title: 'Physics Practical Video Guide',
          description: 'A step-by-step video guide for WAEC/NECO physics practicals including light and electricity experiments.',
          content_type: 'Video',
          teacher_name: 'Dr. Chukwu',
          price: 3500,
          subject: 'Physics',
          rating_avg: 4.9,
          total_sessions: 89
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchItems();
  };

  const handlePurchase = async (itemId) => {
    try {
      await api.post(`/vault/${itemId}/purchase`);
      alert('Purchase successful! Check your purchases for download link.');
      fetchItems();
    } catch (err) {
      alert(err.response?.data?.error || 'Purchase failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600 font-bold">Loading Digital Vault...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#001A72]">Digital Vault</h1>
              <p className="text-gray-600 mt-1">Buy and sell lesson notes, videos, and study materials</p>
            </div>
            {user?.role === 'tutor' || user?.role === 'teacher' && (
              <Link
                href="/vault/create"
                className="bg-[#FFB81C] text-[#001A72] px-6 py-2 rounded-lg font-semibold hover:bg-[#FFB81C]/90 transition"
              >
                Sell Your Content
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-bold text-[#001A72] mb-4">Filter Content</h2>
          <form onSubmit={handleFilterSubmit} className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select
                name="subject"
                value={filters.subject}
                onChange={handleFilterChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72]"
              >
                <option value="">All Subjects</option>
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Geography">Geography</option>
                <option value="History">History</option>
                <option value="Computer Science">Computer Science</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (₦)</label>
              <input
                type="number"
                name="minPrice"
                value={filters.minPrice}
                onChange={handleFilterChange}
                placeholder="0"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (₦)</label>
              <input
                type="number"
                name="maxPrice"
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="10000"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72]"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full bg-[#001A72] text-white py-2 rounded-lg font-semibold hover:bg-[#001A72]/90 transition"
              >
                Apply Filters
              </button>
            </div>
          </form>
        </div>

        {/* Items Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-white rounded-lg shadow hover:shadow-lg transition flex flex-col h-full border border-gray-100 overflow-hidden">
              <div className="p-6 flex-1">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="text-lg font-bold text-[#001A72] line-clamp-2">{item.title}</h3>
                  <span className="bg-[#FFB81C]/20 text-[#001A72] px-2 py-1 rounded text-xs font-bold border border-[#FFB81C]/50">
                    {item.content_type}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">{item.description}</p>

                <div className="flex items-center justify-between mb-4 mt-auto">
                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">Tutor</p>
                    <p className="text-sm font-bold text-gray-900">{item.teacher_name}</p>
                    <div className="flex items-center mt-1">
                      <span className="text-yellow-400 text-xs">★★★★★</span>
                      <span className="text-xs text-gray-600 ml-1 font-medium">
                        {item.rating_avg?.toFixed(1) || '4.5'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 font-semibold mb-1 uppercase tracking-wider">{item.subject}</p>
                    <p className="text-2xl font-black text-[#001A72]">₦{item.price.toLocaleString()}</p>
                  </div>
                </div>
              </div>

              <div className="px-6 pb-6 mt-auto">
                <button
                  onClick={() => handlePurchase(item.id)}
                  className="w-full bg-[#001A72] text-white py-3 rounded-lg font-bold hover:bg-[#001A72]/90 transition shadow-sm hover:shadow-md"
                >
                  Purchase & Download
                </button>
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-20 bg-white rounded-xl shadow-inner border-2 border-dashed border-gray-200">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-gray-500 text-xl font-semibold">No items found matching your criteria.</p>
            <p className="text-gray-400 mt-2">Try adjusting your filters or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}
