import { useState, useEffect } from 'react'
import { useNavigate, Link, useLocation } from 'react-router-dom'
import api from '../services/api'

export default function DashboardPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [children, setChildren] = useState([])
  const [pendingLessons, setPendingLessons] = useState([])
  const [otpInput, setOtpInput] = useState({})
  const [confirmMessage, setConfirmMessage] = useState('')
  const [confirmError, setConfirmError] = useState('')

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token')
      const userJson = localStorage.getItem('user')

      if (!token || !userJson) {
        navigate('/login')
        return
      }

      try {
        const meRes = await api.get('/auth/me')
        const userData = meRes.data
        setUser(userData)
        localStorage.setItem('user', JSON.stringify(userData))
      } catch (err) {
        console.error('Error loading profile:', err)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        navigate('/login')
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [navigate])

  useEffect(() => {
    if (!loading && user?.role === 'parent') {
      const fetchParentData = async () => {
        try {
          const [childrenRes, pendingRes] = await Promise.all([
            api.get('/lessons/parent/children'),
            api.get('/lessons/parent/pending'),
          ])

          setChildren(childrenRes.data.children || [])
          setPendingLessons(pendingRes.data.lessons || [])
        } catch (err) {
          console.error('Unable to load parent dashboard data:', err)
        }
      }

      fetchParentData()
    }
  }, [loading, user])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const handleApproveLesson = async (lessonId) => {
    setConfirmMessage('')
    setConfirmError('')

    const otp = otpInput[lessonId]
    if (!otp) {
      setConfirmError('OTP is required to confirm this lesson.')
      return
    }

    try {
      await api.post(`/lessons/${lessonId}/confirm`, { otp })
      setConfirmMessage('Lesson confirmed successfully!')
      setPendingLessons(prev => prev.filter(item => item.lesson_id !== lessonId))
      setOtpInput(prev => ({ ...prev, [lessonId]: '' }))
    } catch (err) {
      setConfirmError(err.response?.data?.error || 'Unable to confirm lesson.')
      console.error('Confirm lesson error:', err)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  const isParent = user?.role === 'parent'

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Dashboard Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#001A72]">
                Welcome, {user?.fullName || 'User'}!
              </h1>
              <p className="text-gray-600 mt-1">
                {isParent ? 'Parent Dashboard' : 'Tutor Dashboard'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex gap-0 overflow-x-auto">
            <Link
              to="/dashboard"
              className={`px-6 py-4 font-semibold whitespace-nowrap transition border-b-2 ${
                location.pathname === '/dashboard'
                  ? 'border-[#001A72] text-[#001A72]'
                  : 'border-transparent text-gray-600 hover:text-[#001A72]'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/profile-edit"
              className={`px-6 py-4 font-semibold whitespace-nowrap transition border-b-2 ${
                location.pathname === '/profile-edit'
                  ? 'border-[#001A72] text-[#001A72]'
                  : 'border-transparent text-gray-600 hover:text-[#001A72]'
              }`}
            >
              Edit Profile
            </Link>
            {user?.role === 'teacher' && (
              <>
                <Link
                  to="/profile-builder"
                  className={`px-6 py-4 font-semibold whitespace-nowrap transition border-b-2 ${
                    location.pathname === '/profile-builder'
                      ? 'border-[#001A72] text-[#001A72]'
                      : 'border-transparent text-gray-600 hover:text-[#001A72]'
                  }`}
                >
                  🎯 Profile Builder
                </Link>
                <Link
                  to="/premium-subscription"
                  className={`px-6 py-4 font-semibold whitespace-nowrap transition border-b-2 ${
                    location.pathname === '/premium-subscription'
                      ? 'border-[#001A72] text-[#001A72]'
                      : 'border-transparent text-gray-600 hover:text-[#001A72]'
                  }`}
                >
                  💎 Premium
                </Link>
                {user?.is_premium && (
                  <Link
                    to="/premium-content"
                    className={`px-6 py-4 font-semibold whitespace-nowrap transition border-b-2 ${
                      location.pathname === '/premium-content'
                        ? 'border-[#001A72] text-[#001A72]'
                        : 'border-transparent text-gray-600 hover:text-[#001A72]'
                    }`}
                  >
                    📺 My Content
                  </Link>
                )}
              </>
            )}
            {user?.role === 'teacher' && (
              <Link
                to="/welfare-fund"
                className={`px-6 py-4 font-semibold whitespace-nowrap transition border-b-2 ${
                  location.pathname === '/welfare-fund'
                    ? 'border-[#001A72] text-[#001A72]'
                    : 'border-transparent text-gray-600 hover:text-[#001A72]'
                }`}
              >
                🤝 Welfare Fund
              </Link>
            )}
            <Link
              to="/schedule"
              className={`px-6 py-4 font-semibold whitespace-nowrap transition border-b-2 ${
                location.pathname === '/schedule'
                  ? 'border-[#001A72] text-[#001A72]'
                  : 'border-transparent text-gray-600 hover:text-[#001A72]'
              }`}
            >
              View Schedule
            </Link>
            <Link
              to="/earnings"
              className={`px-6 py-4 font-semibold whitespace-nowrap transition border-b-2 ${
                location.pathname === '/earnings'
                  ? 'border-[#001A72] text-[#001A72]'
                  : 'border-transparent text-gray-600 hover:text-[#001A72]'
              }`}
            >
              Earnings
            </Link>
            <Link
              to="/progress"
              className={`px-6 py-4 font-semibold whitespace-nowrap transition border-b-2 ${
                location.pathname === '/progress'
                  ? 'border-[#001A72] text-[#001A72]'
                  : 'border-transparent text-gray-600 hover:text-[#001A72]'
              }`}
            >
              Report
            </Link>
            <Link
              to="/dashboard-settings"
              className={`px-6 py-4 font-semibold whitespace-nowrap transition border-b-2 ${
                location.pathname === '/dashboard-settings'
                  ? 'border-[#001A72] text-[#001A72]'
                  : 'border-transparent text-gray-600 hover:text-[#001A72]'
              }`}
            >
              Settings
            </Link>
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Your referral code</p>
            <p className="text-lg font-bold text-[#001A72]">{user?.referralCode || 'N/A'}</p>
            <p className="text-xs break-all mt-2">Share: {window.location.origin}/register?ref={user?.referralCode || ''}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Referred users</p>
            <p className="text-3xl font-bold text-[#FFB81C]">{user?.referralCount || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Referral rewards</p>
            <p className="text-3xl font-bold text-green-600">₦{(user?.referralCount || 0) * 500}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Welfare boost (teachers)</p>
            <p className="text-3xl font-bold text-blue-600">₦{user?.welfareBoost?.toLocaleString() || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <p className="text-sm text-gray-600">Parent discount credit</p>
            <p className="text-3xl font-bold text-green-700">₦{user?.referralDiscount?.toLocaleString() || 0}</p>
          </div>
        </div>

        {isParent ? (
          // Parent Dashboard
          <div className="space-y-6">
            {/* Parent key metrics */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Children</h3>
                <p className="text-3xl font-bold text-[#001A72]">{children.length || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Pending Confirmations</h3>
                <p className="text-3xl font-bold text-[#FFB81C]">{pendingLessons.length || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Referral Income</h3>
                <p className="text-3xl font-bold text-green-600">₦{(user?.referralCount || 0) * 1000}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Parent Discount Credit</h3>
                <p className="text-3xl font-bold text-green-700">₦{user?.referralDiscount?.toLocaleString() || 0}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Referral Count</h3>
                <p className="text-3xl font-bold text-[#001A72]">{user?.referralCount || 0}</p>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-[#001A72] mb-4">Your Children</h2>
              {children.length === 0 ? (
                <p className="text-sm text-gray-600">You have no children linked yet.</p>
              ) : (
                <div className="grid md:grid-cols-auto gap-3">
                  {children.map((child) => (
                    <div key={child.id} className="border border-gray-200 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900">{child.name}</h3>
                      <p className="text-sm text-gray-600">{child.email}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Lesson confirmation section */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-[#001A72] mb-4">Lesson Confirmation Security</h2>
              <p className="text-gray-600 mb-4">
                Parent must approve session logs in your portal. After teacher marks a lesson completed, you receive OTP via SMS. Enter OTP below to confirm.
              </p>

              {confirmMessage && <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-700 rounded">{confirmMessage}</div>}
              {confirmError && <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded">{confirmError}</div>}

              {pendingLessons.length === 0 ? (
                <p className="text-sm text-gray-600">No lessons pending confirmation.</p>
              ) : (
                <div className="space-y-4">
                  {pendingLessons.map((lesson) => (
                    <div key={lesson.lesson_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <h3 className="font-semibold text-gray-900">{lesson.subject || 'Lesson'}</h3>
                          <p className="text-sm text-gray-600">Teacher: {lesson.teacher_name}</p>
                          <p className="text-sm text-gray-600">When: {new Date(lesson.scheduled_time).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Status: {lesson.status || 'Pending'}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-col md:flex-row gap-2">
                        <input
                          value={otpInput[lesson.lesson_id] || ''}
                          onChange={(e) => setOtpInput((prev) => ({ ...prev, [lesson.lesson_id]: e.target.value }))}
                          placeholder="Enter OTP received by SMS"
                          className="flex-1 border border-gray-300 rounded px-3 py-2"
                        />
                        <button
                          onClick={() => handleApproveLesson(lesson.lesson_id)}
                          className="bg-[#001A72] text-white px-5 py-2 rounded hover:bg-[#001A72]/90 transition"
                        >
                          Approve Lesson
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          // Tutor Dashboard
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="grid md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Active Students</h3>
                <p className="text-3xl font-bold text-[#001A72]">8</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Monthly Earnings</h3>
                <p className="text-3xl font-bold text-green-600">₦45,000</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Rating</h3>
                <p className="text-3xl font-bold text-[#FFB81C]">4.9 ⭐</p>
              </div>
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-gray-600 text-sm font-medium mb-2">Lessons Completed</h3>
                <p className="text-3xl font-bold text-[#001A72]">124</p>
              </div>
            </div>

            {/* Main Content */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-[#001A72] mb-4">Upcoming Lessons</h2>
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="border border-gray-200 rounded p-4 hover:shadow-md transition">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-semibold text-gray-800">Student Name {i}</h3>
                          <p className="text-sm text-gray-600">Mathematics • Tomorrow at 3:00 PM</p>
                        </div>
                        <button className="bg-[#001A72] text-white px-4 py-2 rounded hover:bg-[#001A72]/90 transition">
                          Start Lesson
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold text-[#001A72] mb-4">Quick Actions</h2>
                <div className="space-y-3">
                  <button onClick={() => navigate('/profile-edit')} className="w-full bg-[#FFB81C] text-[#001A72] py-2 rounded-lg font-semibold hover:bg-[#FFB81C]/90 transition">
                    Edit Profile
                  </button>
                  <button onClick={() => navigate('/schedule')} className="w-full border-2 border-[#001A72] text-[#001A72] py-2 rounded-lg font-semibold hover:bg-[#001A72]/5 transition">
                    View Schedule
                  </button>
                  <button onClick={() => navigate('/earnings')} className="w-full border-2 border-[#001A72] text-[#001A72] py-2 rounded-lg font-semibold hover:bg-[#001A72]/5 transition">
                    Earnings Report
                  </button>
                  <button onClick={() => navigate('/dashboard-settings')} className="w-full border-2 border-[#001A72] text-[#001A72] py-2 rounded-lg font-semibold hover:bg-[#001A72]/5 transition">
                    Settings
                  </button>
                </div>
              </div>
            </div>

            {/* Statistics */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-[#001A72] mb-4">Statistics</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-600 mb-2">Completion Rate</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-[#001A72] h-2 rounded-full" style={{ width: '98%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">98% of lessons completed</p>
                </div>
                <div>
                  <p className="text-gray-600 mb-2">Student Satisfaction</p>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '96%' }}></div>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">4.9/5.0 average rating</p>
                </div>
              </div>
            </div>

            {/* Welfare Fund Overview */}
            <div className="bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-300 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-[#001A72]">💰 Your Welfare Fund</h2>
                <span className="text-sm bg-purple-200 text-purple-700 px-3 py-1 rounded-full font-semibold">10% of earnings</span>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white rounded p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-1">TOTAL ACCUMULATED</p>
                  <p className="text-2xl font-bold text-purple-600">₦156,000</p>
                </div>
                <div className="bg-white rounded p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-1">AVAILABLE</p>
                  <p className="text-2xl font-bold text-indigo-600">₦140,000</p>
                </div>
                <div className="bg-white rounded p-4">
                  <p className="text-xs font-semibold text-gray-600 mb-1">LOCKED THIS MONTH</p>
                  <p className="text-2xl font-bold text-pink-600">₦16,000</p>
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-4 p-3 bg-white rounded border-l-4 border-purple-500">
                ℹ️ <strong>What is the Welfare Fund?</strong> 10% of every lesson payment goes into your protected savings account. Locked funds become available on the 5th of each month, ensuring financial stability for you and your students.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
