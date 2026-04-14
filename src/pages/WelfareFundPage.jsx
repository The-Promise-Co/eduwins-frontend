import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import DashboardNavigation from '../components/DashboardNavigation'

export default function WelfareFundPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [welfareFund, setWelfareFund] = useState(null)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

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
        if (userData.role !== 'teacher') {
          navigate('/dashboard')
          return
        }
        setUser(userData)

        // Fetch welfare fund data
        try {
          const response = await api.get(`/payments/welfare-fund/${userData.id}`)
          setWelfareFund(response.data)
        } catch (innerErr) {
          if (innerErr.response?.status === 404) {
            // Create local empty welfare record for UI when no db record yet
            setWelfareFund({
              teacherId: userData.id,
              total_accumulated: 0,
              available_balance: 0,
              locked_balance: 0,
              contributions: [],
            })
          } else {
            throw innerErr
          }
        }
      } catch (err) {
        console.error('Error:', err)
        if (!user || !localStorage.getItem('token')) {
          navigate('/login')
        }
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [navigate])

  const handleWithdraw = async (e) => {
    e.preventDefault()
    setMessage({ type: '', text: '' })

    if (!withdrawAmount || withdrawAmount <= 0) {
      setMessage({ type: 'error', text: 'Please enter a valid amount' })
      return
    }

    if (withdrawAmount > (welfareFund?.available_balance || 0)) {
      setMessage({ type: 'error', text: 'Insufficient available balance' })
      return
    }

    try {
      const response = await api.post(`/payments/welfare-fund/${user.id}/withdraw`, {
        amount: parseFloat(withdrawAmount),
      })

      setMessage({
        type: 'success',
        text: `Withdrawal request of ₦${withdrawAmount.toLocaleString()} submitted successfully!`,
      })
      setWithdrawAmount('')
      setShowWithdrawForm(false)

      // Refresh welfare fund data
      const updatedResponse = await api.get(`/payments/welfare-fund/${user.id}`)
      setWelfareFund(updatedResponse.data)
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Withdrawal failed'
      setMessage({ type: 'error', text: errorMsg })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading welfare fund...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation user={user} />
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#001A72] mb-2">💰 Welfare Fund</h1>
            <p className="text-gray-600">
              Your protected savings account - 10% of every lesson payment goes here automatically
            </p>
          </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Main Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-purple-500">
            <p className="text-sm text-gray-600 font-semibold mb-2">TOTAL ACCUMULATED</p>
            <p className="text-4xl font-bold text-purple-600 mb-1">
              ₦{(welfareFund?.total_accumulated || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">All contributions since joining</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-indigo-500">
            <p className="text-sm text-gray-600 font-semibold mb-2">AVAILABLE TO WITHDRAW</p>
            <p className="text-4xl font-bold text-indigo-600 mb-1">
              ₦{(welfareFund?.available_balance || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Ready for withdrawal</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-pink-500">
            <p className="text-sm text-gray-600 font-semibold mb-2">LOCKED (CURRENT PERIOD)</p>
            <p className="text-4xl font-bold text-pink-600 mb-1">
              ₦{(welfareFund?.locked_balance || 0).toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">Unlocks on 5th of next month</p>
          </div>
        </div>

        {/* Information Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* How it Works */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#001A72] mb-4">📋 How It Works</h2>
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="text-2xl">1️⃣</div>
                <div>
                  <p className="font-semibold text-gray-800">Automatic Contribution</p>
                  <p className="text-sm text-gray-600">10% of every lesson payment automatically goes into your welfare fund</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">2️⃣</div>
                <div>
                  <p className="font-semibold text-gray-800">Financial Protection</p>
                  <p className="text-sm text-gray-600">Creates a safety net for unexpected emergencies</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">3️⃣</div>
                <div>
                  <p className="font-semibold text-gray-800">Monthly Unlocking</p>
                  <p className="text-sm text-gray-600">Current month funds lock until the 5th of the following month</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="text-2xl">4️⃣</div>
                <div>
                  <p className="font-semibold text-gray-800">Student Protection</p>
                  <p className="text-sm text-gray-600">Your welfare fund helps cover refund guarantees for students</p>
                </div>
              </div>
            </div>
          </div>

          {/* Benefits */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold text-[#001A72] mb-4">✨ Benefits</h2>
            <ul className="space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span className="text-gray-700">Emergency Financial Cushion</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span className="text-gray-700">Secure Account Management</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span className="text-gray-700">Refund Coverage Protection</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span className="text-gray-700">Transparent Tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span className="text-gray-700">Anytime Withdrawal Access*</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-500 font-bold">✓</span>
                <span className="text-gray-700">No Hidden Fees</span>
              </li>
            </ul>
            <p className="text-xs text-gray-500 mt-4">*Subject to monthly lock period</p>
          </div>
        </div>

        {/* Withdraw Section */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-[#001A72]">Withdraw Funds</h2>
            <button
              onClick={() => setShowWithdrawForm(!showWithdrawForm)}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition font-semibold text-sm"
            >
              {showWithdrawForm ? 'Cancel' : 'Withdraw Now'}
            </button>
          </div>

          {showWithdrawForm && (
            <form onSubmit={handleWithdraw} className="bg-white rounded p-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Withdrawal Amount (₦)
                </label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter amount to withdraw"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#001A72]"
                  min="1"
                  step="0.01"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Available: ₦{(welfareFund?.available_balance || 0).toLocaleString()}
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-gray-700">
                  <strong>Processing:</strong> Withdrawals are processed within 2-3 business days to your registered account.
                </p>
              </div>

              <button
                type="submit"
                className="w-full bg-[#001A72] text-white py-2 rounded font-semibold hover:bg-[#001A72]/90 transition"
              >
                Submit Withdrawal Request
              </button>
            </form>
          )}
        </div>

        {/* Recent Contributions */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-[#001A72] mb-4">Recent Contributions</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Lesson</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Amount</th>
                  <th className="text-right py-3 px-4 font-semibold text-gray-700">Your Welfare (10%)</th>
                  <th className="text-left py-3 px-4 font-semibold text-gray-700">Status</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { date: 'Mar 28, 2026', lesson: 'Mathematics', total: 10000, status: 'Available' },
                  { date: 'Mar 27, 2026', lesson: 'English', total: 10000, status: 'Available' },
                  { date: 'Mar 26, 2026', lesson: 'Physics', total: 12000, status: 'Locked' },
                  { date: 'Mar 25, 2026', lesson: 'Chemistry', total: 10000, status: 'Available' },
                  { date: 'Mar 24, 2026', lesson: 'Biology', total: 8500, status: 'Available' },
                ].map((contrib, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50 transition">
                    <td className="py-3 px-4">{contrib.date}</td>
                    <td className="py-3 px-4">{contrib.lesson}</td>
                    <td className="py-3 px-4 text-right font-semibold">₦{contrib.total.toLocaleString()}</td>
                    <td className="py-3 px-4 text-right font-bold text-purple-600">
                      ₦{(contrib.total * 0.10).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        contrib.status === 'Available'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {contrib.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
