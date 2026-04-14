import { useState, useEffect } from 'react'
import api from '../services/api'

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [applications, setApplications] = useState([])
  const [ambassadors, setAmbassadors] = useState([])
  const [vettingQueue, setVettingQueue] = useState([])
  const [disputes, setDisputes] = useState([])
  const [welfareAnalytics, setWelfareAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const token = localStorage.getItem('token')
  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h1 className="text-3xl font-bold text-[#001A72] mb-4">Admin Dashboard</h1>
            <p className="text-red-600">Please login first to access the admin dashboard.</p>
            <a href="/login" className="text-blue-600 underline">Go to Login</a>
          </div>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const load = async () => {
      try {
        const [overviewRes, rentRes, ambRes, vetRes, discRes, welfareRes] = await Promise.all([
          api.get('/api/admin/overview'),
          api.get('/api/admin/rent-applications'),
          api.get('/api/admin/ambassadors'),
          api.get('/api/admin/vetting'),
          api.get('/api/admin/disputes'),
          api.get('/api/admin/welfare-analytics'),
        ])

        setStats(overviewRes.data)
        setApplications(rentRes.data)
        setAmbassadors(ambRes.data)
        setVettingQueue(vetRes.data)
        setDisputes(discRes.data)
        setWelfareAnalytics(welfareRes.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Could not load admin dashboard')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const updateApplicationStatus = async (id, status) => {
    try {
      await api.post(`/api/admin/rent-applications/${id}`, { status })
      setApplications((prev) => prev.map((app) => (app.id === id ? { ...app, status } : app)))
    } catch (err) {
      alert(err.response?.data?.error || 'Could not update status')
    }
  }

  const processVettingAction = async (teacherId, action) => {
    try {
      const response = await api.post(`/api/admin/vetting/${teacherId}`, { action })
      setVettingQueue((prev) => prev.filter((t) => t.id !== teacherId))
      alert(response.data.message)
    } catch (err) {
      alert(err.response?.data?.error || 'Could not process vetting action')
    }
  }

  const resolveDispute = async (disputeId, status) => {
    try {
      await api.patch(`/api/admin/disputes/${disputeId}`, { status })
      setDisputes((prev) => prev.map((d) => (d.id === disputeId ? { ...d, status } : d)))
    } catch (err) {
      alert(err.response?.data?.error || 'Could not update dispute')
    }
  }

  const payoutBooking = async (bookingId) => {
    try {
      await api.post(`/api/admin/escrow/payout/${bookingId}`)
      alert('Escrow payout executed')
    } catch (err) {
      alert(err.response?.data?.error || 'Could not payout escrow')
    }
  }

  if (loading) return <p className="text-center py-8">Loading admin data...</p>

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-[#001A72] mb-4">Admin Dashboard</h1>

          {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

          <div className="grid md:grid-cols-5 gap-4">
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-500">Users</p>
              <p className="text-2xl font-bold">{stats.totalUsers}</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-500">Teachers</p>
              <p className="text-2xl font-bold">{stats.totalTeachers}</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-500">Parents</p>
              <p className="text-2xl font-bold">{stats.totalParents}</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-500">Pending rent apps</p>
              <p className="text-2xl font-bold">{stats.pendingRentApplications}</p>
            </div>
            <div className="bg-gray-100 rounded-lg p-4">
              <p className="text-sm text-gray-500">Vault items</p>
              <p className="text-2xl font-bold">{stats.totalVaultItems}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#001A72] mb-4">Vetting Queue</h2>
          {vettingQueue.length === 0 ? (
            <p>No pending teacher vetting profiles.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr>
                    <th className="px-3 py-2">Teacher</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Rate</th>
                    <th className="px-3 py-2">Credentials</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {vettingQueue.map((teacher) => (
                    <tr key={teacher.id} className="border-t">
                      <td className="px-3 py-2">{teacher.full_name}</td>
                      <td className="px-3 py-2">{teacher.email}</td>
                      <td className="px-3 py-2">₦{teacher.base_hourly_rate}</td>
                      <td className="px-3 py-2">
                        {teacher.credentials_url ? (
                          <a href={teacher.credentials_url} target="_blank" rel="noreferrer" className="text-blue-600">View</a>
                        ) : 'Not uploaded'}
                      </td>
                      <td className="px-3 py-2 space-x-2">
                        <button className="text-green-700" onClick={() => processVettingAction(teacher.id, 'approve')}>Approve</button>
                        <button className="text-red-700" onClick={() => processVettingAction(teacher.id, 'reject')}>Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#001A72] mb-4">Welfare Fund Analytics</h2>
          {welfareAnalytics ? (
            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Welfare Pool</p>
                <p className="text-2xl font-bold">₦{welfareAnalytics.totalAccumulated.toLocaleString()}</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-500">Available Funds</p>
                <p className="text-2xl font-bold">₦{welfareAnalytics.totalAvailable.toLocaleString()}</p>
              </div>
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="text-sm text-gray-500">Locked Funds</p>
                <p className="text-2xl font-bold">₦{welfareAnalytics.totalLocked.toLocaleString()}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-600">Welfare analytics data unavailable.</p>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#001A72] mb-4">Conflict Resolution - Disputes</h2>
          {disputes.length === 0 ? (
            <p>No open disputes.</p>
          ) : (
            <div className="space-y-4">
              {disputes.map((dispute) => (
                <div key={dispute.id} className="border border-gray-200 rounded-lg p-4">
                  <p className="font-semibold">Booking: {dispute.booking_id}</p>
                  <p>Issue: {dispute.issue}</p>
                  <p>Status: {dispute.status}</p>
                  <p>Created by: {dispute.created_by}</p>
                  <div className="space-x-2 mt-2">
                    <button className="text-green-700" onClick={() => resolveDispute(dispute.id, 'resolved')}>Resolve</button>
                    <button className="text-red-700" onClick={() => resolveDispute(dispute.id, 'rejected')}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#001A72] mb-4">Rent Advance Applications</h2>

          {applications.length === 0 ? (
            <p>No applications yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left">
                <thead>
                  <tr>
                    <th className="px-3 py-2">Teacher</th>
                    <th className="px-3 py-2">Property</th>
                    <th className="px-3 py-2">Amount</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app) => (
                    <tr key={app.id} className="border-t">
                      <td className="px-3 py-2">{app.teacher_name}</td>
                      <td className="px-3 py-2">{app.property_address}</td>
                      <td className="px-3 py-2">₦{app.total_advance}</td>
                      <td className="px-3 py-2">{app.status}</td>
                      <td className="px-3 py-2 space-x-2">
                        <button onClick={() => updateApplicationStatus(app.id,'approved')} className="text-green-700">Approve</button>
                        <button onClick={() => updateApplicationStatus(app.id,'rejected')} className="text-red-700">Reject</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#001A72] mb-4">Ambassador Program</h2>
          {ambassadors.length === 0 ? (
            <p>No ambassadors yet.</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {ambassadors.map((amb) => (
                <div key={amb.user_id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold mb-1">{amb.teacher_name}</h3>
                  <p>Level {amb.level}</p>
                  <p>Direct: {amb.direct_referrals}</p>
                  <p>Indirect: {amb.indirect_referrals}</p>
                  <p>Credits: ₦{amb.earned_credits}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
