import { useState, useEffect } from 'react'
import api from '../services/api'

export default function AdminVettingDashboard() {
  const [activeTab, setActiveTab] = useState('vetting')
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalParents: 0,
    totalEarnings: 0,
    welfarePooled: 0
  })

  useEffect(() => {
    fetchData()
  }, [activeTab])

  const fetchData = async () => {
    setLoading(true)
    try {
      if (activeTab === 'vetting') {
        const response = await api.get('/admin/teachers-pending')
        setTeachers(response.data)
      } else if (activeTab === 'escrow') {
        const response = await api.get('/admin/bookings-pending')
        setBookings(response.data)
      } else if (activeTab === 'stats') {
        const response = await api.get('/admin/stats')
        setStats(response.data)
      }
    } catch (err) {
      console.error('Failed to fetch data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleApproveTeacher = async (teacherId) => {
    try {
      await api.put(`/admin/teachers/${teacherId}/approve`)
      fetchData()
    } catch (err) {
      alert('Failed to approve teacher')
    }
  }

  const handleRejectTeacher = async (teacherId) => {
    try {
      await api.put(`/admin/teachers/${teacherId}/reject`)
      fetchData()
    } catch (err) {
      alert('Failed to reject teacher')
    }
  }

  const handleReleaseFunds = async (bookingId) => {
    try {
      await api.put(`/admin/bookings/${bookingId}/release-funds`)
      alert('Funds released successfully!')
      fetchData()
    } catch (err) {
      alert('Failed to release funds')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#001A72] mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage teachers, handle disputes, and oversee finances</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-gray-200">
          {['vetting', 'escrow', 'stats'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-semibold border-b-2 transition ${
                activeTab === tab
                  ? 'border-[#001A72] text-[#001A72]'
                  : 'border-transparent text-gray-600 hover:text-[#001A72]'
              }`}
            >
              {tab === 'vetting' && '🧑‍🏫 Teacher Vetting'}
              {tab === 'escrow' && '💳 Escrow Management'}
              {tab === 'stats' && '📊 Analytics'}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-[#001A72]">Loading...</div>
          </div>
        ) : (
          <>
            {/* Teacher Vetting Tab */}
            {activeTab === 'vetting' && (
              <div className="space-y-6">
                {teachers.length === 0 ? (
                  <div className="bg-white rounded-xl p-12 text-center">
                    <p className="text-gray-600">No teachers pending approval</p>
                  </div>
                ) : (
                  teachers.map(teacher => (
                    <div key={teacher.id} className="bg-white rounded-xl shadow-lg p-8">
                      <div className="flex flex-col md:flex-row gap-8">
                        {/* Left: Profile */}
                        <div className="md:w-1/3">
                          <div className="aspect-square bg-gradient-to-br from-[#001A72] to-[#FFB81C] rounded-lg mb-4 flex items-center justify-center text-white text-4xl">
                            {teacher.fullName?.charAt(0) || '?'}
                          </div>
                          <h3 className="text-2xl font-bold text-[#001A72] mb-2">{teacher.fullName}</h3>
                          <p className="text-gray-600 mb-4">{teacher.email}</p>
                          <p className="text-sm text-gray-500"><strong>Location:</strong> {teacher.location}</p>
                          <p className="text-sm text-gray-500"><strong>Experience:</strong> {teacher.yearsExperience} years</p>
                        </div>

                        {/* Middle: Details */}
                        <div className="md:w-1/3">
                          <h4 className="font-semibold text-[#001A72] mb-3">Credentials</h4>
                          <ul className="space-y-2 text-sm mb-6">
                            <li><strong>Qualification:</strong> {teacher.qualification}</li>
                            <li><strong>Base Rate:</strong> ₦{teacher.baseHourlyRate}/hr</li>
                            <li><strong>Subjects:</strong> {(teacher.subjects || []).join(', ')}</li>
                          </ul>

                          {teacher.credentials && (
                            <a
                              href={teacher.credentials}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#001A72] font-semibold hover:underline"
                            >
                              📄 View Credentials (PDF)
                            </a>
                          )}
                        </div>

                        {/* Right: Actions */}
                        <div className="md:w-1/3 flex flex-col gap-3">
                          <button
                            onClick={() => handleApproveTeacher(teacher.id)}
                            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold hover:bg-green-700 transition"
                          >
                            ✓ Approve Teacher
                          </button>
                          <button
                            onClick={() => handleRejectTeacher(teacher.id)}
                            className="w-full bg-red-600 text-white py-3 rounded-lg font-semibold hover:bg-red-700 transition"
                          >
                            ✗ Reject
                          </button>
                          <p className="text-xs text-gray-500 text-center">
                            Status: <span className="font-bold">Pending Review</span>
                          </p>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* Escrow Management Tab */}
            {activeTab === 'escrow' && (
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {bookings.length === 0 ? (
                  <div className="p-12 text-center">
                    <p className="text-gray-600">No pending bookings</p>
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="bg-gray-100 border-b">
                      <tr>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Parent</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Teacher</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Amount</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Sessions</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                        <th className="px-6 py-3 text-left font-semibold text-gray-700">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookings.map(booking => (
                        <tr key={booking.id} className="border-b hover:bg-gray-50">
                          <td className="px-6 py-4 text-gray-700">{booking.parentName}</td>
                          <td className="px-6 py-4 text-gray-700">{booking.teacherName}</td>
                          <td className="px-6 py-4 font-semibold text-[#FFB81C]">₦{booking.totalCost}</td>
                          <td className="px-6 py-4 text-gray-700">{booking.totalSessions}</td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              booking.status === 'completed'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {booking.status === 'completed' && (
                              <button
                                onClick={() => handleReleaseFunds(booking.id)}
                                className="text-[#001A72] font-semibold hover:text-[#001A72]/70"
                              >
                                Release Funds
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'stats' && (
              <div className="grid md:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="text-4xl font-bold text-[#001A72] mb-2">{stats.totalTeachers}</div>
                  <p className="text-gray-600">Active Teachers</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="text-4xl font-bold text-[#001A72] mb-2">{stats.totalParents}</div>
                  <p className="text-gray-600">Total Parents</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="text-4xl font-bold text-[#FFB81C] mb-2">₦{stats.totalEarnings}</div>
                  <p className="text-gray-600">Total Earnings</p>
                </div>
                <div className="bg-white rounded-xl shadow-lg p-6 text-center">
                  <div className="text-4xl font-bold text-green-600 mb-2">₦{stats.welfarePooled}</div>
                  <p className="text-gray-600">Welfare Fund</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
