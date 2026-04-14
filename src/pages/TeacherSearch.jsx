import { useState, useEffect } from 'react';
import api from '../services/api';
import TeacherCard from '../components/TeacherCard';

export default function TeacherSearch() {
  const [teachers, setTeachers] = useState([]);
  const [filters, setFilters] = useState({ subject: '', lga: '', maxRate: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchTeachers();
  }, [filters]);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams(
        Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      ).toString();
      const res = await api.get(`/teachers/search?${params}`);
      setTeachers(res.data || []);
    } catch (err) {
      console.error('Error fetching teachers:', err);
      // Mock data for demo
      setTeachers([
        {
          id: 1,
          full_name: 'Mr. Okonkwo',
          hourly_rate: 500,
          avatar: '👨‍🏫',
          subject: 'Mathematics',
          lga: 'Lagos Island',
          rating: 4.8,
          students: 45,
        },
        {
          id: 2,
          full_name: 'Mrs. Adeyemi',
          hourly_rate: 400,
          avatar: '👩‍🏫',
          subject: 'English',
          lga: 'Lekki',
          rating: 4.9,
          students: 32,
        },
        {
          id: 3,
          full_name: 'Dr. Chukwu',
          hourly_rate: 800,
          avatar: '👨‍🏫',
          subject: 'Physics',
          lga: 'VI',
          rating: 4.7,
          students: 28,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">Find a Tutor</h1>
          <p className="text-gray-600">Search by subject, location, and hourly rate</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
              <input
                type="text"
                placeholder="e.g., Mathematics, English"
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location (LGA)</label>
              <input
                type="text"
                placeholder="e.g., Lagos Island, Lekki"
                value={filters.lga}
                onChange={(e) => setFilters({ ...filters, lga: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Max Hourly Rate (₦)</label>
              <input
                type="number"
                placeholder="e.g., 1000"
                value={filters.maxRate}
                onChange={(e) => setFilters({ ...filters, maxRate: e.target.value })}
                className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-primary outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">&nbsp;</label>
              <button
                onClick={fetchTeachers}
                className="w-full bg-[#001A72] text-white p-3 rounded-lg hover:bg-[#001A72]/90 font-semibold transition"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">Loading tutors...</p>
          </div>
        ) : teachers.length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {teachers.map((teacher) => (
              <TeacherCard key={teacher.id} teacher={teacher} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600 text-lg">No tutors found. Try adjusting your filters.</p>
          </div>
        )}
      </div>
    </div>
  );
}
