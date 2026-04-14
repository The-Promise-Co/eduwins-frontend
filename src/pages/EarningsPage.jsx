import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'
import DashboardNavigation from '../components/DashboardNavigation'

export default function EarningsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token')
      const userJson = localStorage.getItem('user')

      if (!token || !userJson) {
        navigate('/login')
        return
      }

      try {
        const userData = JSON.parse(userJson)
        setUser(userData)
      } catch (err) {
        console.error('Error parsing user data:', err)
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading earnings...</p>
        </div>
      </div>
    )
  }

  const isTeacher = user?.role === 'teacher'

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation user={user} />
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-[#001A72] mb-2">Earnings</h1>
            <p className="text-gray-600 mb-8">Track your income and payments</p>

          {isTeacher ? (
            <>
              {/* Teacher Earnings & Welfare Fund Summary */}
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                  <p className="text-sm text-gray-600 mb-2">Personal Earnings (75%)</p>
                  <p className="text-3xl font-bold text-green-600">₦45,000</p>
                  <p className="text-xs text-gray-500 mt-2">Your take-home</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">Platform Fee (15%)</p>
                  <p className="text-3xl font-bold text-blue-600">₦9,000</p>
                  <p className="text-xs text-gray-500 mt-2">EduWins takes</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                  <p className="text-sm text-gray-600 mb-2">Welfare Fund (10%)</p>
                  <p className="text-3xl font-bold text-purple-600">₦6,000</p>
                  <p className="text-xs text-gray-500 mt-2">Your welfare pool</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
                  <p className="text-sm text-gray-600 mb-2">Wallet Balance</p>
                  <p className="text-3xl font-bold text-yellow-600">₦28,500</p>
                  <p className="text-xs text-gray-500 mt-2">Available</p>
                </div>
              </div>

              {/* Payment Split Explanation */}
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-6 mb-8">
                <h3 className="text-lg font-bold text-[#001A72] mb-4">🛡️ Payment Split & Welfare Fund</h3>
                <p className="text-gray-700 mb-4">
                  When a parent confirms your service, payments are automatically split using our secure escrow system:
                </p>
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-white rounded p-4 border-l-4 border-green-500">
                    <p className="font-semibold text-gray-800">Your Earnings (75%)</p>
                    <p className="text-sm text-gray-600 mt-1">Paid directly to your wallet within 24 hours</p>
                  </div>
                  <div className="bg-white rounded p-4 border-l-4 border-blue-500">
                    <p className="font-semibold text-gray-800">Platform Fee (15%)</p>
                    <p className="text-sm text-gray-600 mt-1">Covers platform maintenance & development</p>
                  </div>
                  <div className="bg-white rounded p-4 border-l-4 border-purple-500">
                    <p className="font-semibold text-gray-800">Welfare Fund (10%)</p>
                    <p className="text-sm text-gray-600 mt-1">Protected savings for you and your students</p>
                  </div>
                </div>
              </div>

              {/* Welfare Fund Details */}
              <div className="bg-white border-2 border-purple-200 rounded-lg p-6 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[#001A72]">💰 Your Welfare Fund</h2>
                  <div className="flex gap-2">
                    <Link
                      to="/welfare-fund"
                      className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700 transition font-semibold text-sm"
                    >
                      View Details
                    </Link>
                    <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition font-semibold text-sm">
                      Withdraw from Fund
                    </button>
                  </div>
                </div>
                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div className="bg-purple-50 rounded p-4">
                    <p className="text-xs text-gray-600 font-semibold mb-1">TOTAL ACCUMULATED</p>
                    <p className="text-2xl font-bold text-purple-600">₦156,000</p>
                  </div>
                  <div className="bg-indigo-50 rounded p-4">
                    <p className="text-xs text-gray-600 font-semibold mb-1">AVAILABLE TO WITHDRAW</p>
                    <p className="text-2xl font-bold text-indigo-600">₦140,000</p>
                  </div>
                  <div className="bg-pink-50 rounded p-4">
                    <p className="text-xs text-gray-600 font-semibold mb-1">LOCKED (Current Period)</p>
                    <p className="text-2xl font-bold text-pink-600">₦16,000</p>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  ℹ️ Welfare funds from the current month are locked until the 5th of the following month. This ensures stable emergency coverage for you and protects student refunds.
                </p>
              </div>

              {/* Payment History */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-[#001A72]">Payment History</h2>
                  <button className="bg-[#001A72] text-white px-4 py-2 rounded hover:bg-[#001A72]/90 transition font-semibold">
                    Withdraw
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Lesson</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Student</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Your Earnings (75%)</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Platform (15%)</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Welfare (10%)</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { date: 'Mar 28, 2026', lesson: 'Mathematics', student: 'John Doe', amount: 10000, status: 'Completed' },
                        { date: 'Mar 27, 2026', lesson: 'English', student: 'Jane Smith', amount: 10000, status: 'Completed' },
                        { date: 'Mar 26, 2026', lesson: 'Physics', student: 'Mike Johnson', amount: 12000, status: 'Pending' },
                        { date: 'Mar 25, 2026', lesson: 'Chemistry', student: 'Sarah Williams', amount: 10000, status: 'Completed' },
                      ].map((entry, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-3 px-4">{entry.date}</td>
                          <td className="py-3 px-4">{entry.lesson}</td>
                          <td className="py-3 px-4">{entry.student}</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">
                            ₦{(entry.amount * 0.75).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-blue-600">
                            ₦{(entry.amount * 0.15).toLocaleString()}
                          </td>
                          <td className="py-3 px-4 text-right font-semibold text-purple-600">
                            ₦{(entry.amount * 0.10).toLocaleString()}
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              entry.status === 'Completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Parent View */}
              <div className="grid md:grid-cols-4 gap-4 mb-8">
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-6 border border-green-200">
                  <p className="text-sm text-gray-600 mb-2">Total Spent</p>
                  <p className="text-3xl font-bold text-green-600">₦45,000</p>
                </div>
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-6 border border-blue-200">
                  <p className="text-sm text-gray-600 mb-2">This Month</p>
                  <p className="text-3xl font-bold text-blue-600">₦12,500</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-6 border border-yellow-200">
                  <p className="text-sm text-gray-600 mb-2">Active Sessions</p>
                  <p className="text-3xl font-bold text-yellow-600">5</p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-6 border border-purple-200">
                  <p className="text-sm text-gray-600 mb-2">Refund Balance</p>
                  <p className="text-3xl font-bold text-purple-600">₦0</p>
                </div>
              </div>

              {/* Payment History */}
              <div>
                <h2 className="text-xl font-bold text-[#001A72] mb-4">Payment History</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Lesson</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Tutor</th>
                        <th className="text-right py-3 px-4 font-semibold text-gray-700">Amount</th>
                        <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { date: 'Mar 28, 2026', lesson: 'Mathematics', tutor: 'John Doe', amount: '₦2,500', status: 'Completed' },
                        { date: 'Mar 27, 2026', lesson: 'English', tutor: 'Jane Smith', amount: '₦2,500', status: 'Completed' },
                        { date: 'Mar 26, 2026', lesson: 'Physics', tutor: 'Mike Johnson', amount: '₦3,000', status: 'Pending' },
                        { date: 'Mar 25, 2026', lesson: 'Chemistry', tutor: 'Sarah Williams', amount: '₦2,500', status: 'Completed' },
                      ].map((entry, i) => (
                        <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="py-3 px-4">{entry.date}</td>
                          <td className="py-3 px-4">{entry.lesson}</td>
                          <td className="py-3 px-4">{entry.tutor}</td>
                          <td className="py-3 px-4 text-right font-semibold text-green-600">{entry.amount}</td>
                          <td className="py-3 px-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              entry.status === 'Completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {entry.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
