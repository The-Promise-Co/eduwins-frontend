import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavigation from '../components/DashboardNavigation'

export default function ViewSchedulePage() {
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
          <p className="text-gray-600">Loading schedule...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation user={user} />
      <div className="py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-[#001A72] mb-2">View Schedule</h1>
            <p className="text-gray-600 mb-6">Manage your lessons and sessions</p>

          {/* Upcoming Sessions */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-[#001A72] mb-4">Upcoming Sessions</h2>
            <div className="grid gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-800">Session {i}</h3>
                      <p className="text-sm text-gray-600">Mathematics • Tomorrow at 3:00 PM</p>
                      <p className="text-sm text-gray-500 mt-1">Duration: 1 hour</p>
                    </div>
                    <div className="text-right">
                      <button className="bg-[#001A72] text-white px-4 py-2 rounded hover:bg-[#001A72]/90 transition mb-2 block">
                        Join
                      </button>
                      <button className="border-2 border-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-50 transition">
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calendar View */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-bold text-[#001A72] mb-4">Calendar</h2>
            <div className="bg-white rounded p-4 border border-gray-200 min-h-80">
              <p className="text-center text-gray-500">Calendar integration coming soon</p>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
