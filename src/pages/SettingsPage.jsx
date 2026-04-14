import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavigation from '../components/DashboardNavigation'

export default function SettingsPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [settings, setSettings] = useState({
    notifications: true,
    emailNotifications: true,
    smsNotifications: false,
    timezone: 'Africa/Lagos',
    language: 'English',
    twoFactorEnabled: false,
  })
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
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

  const handleSettingChange = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const handleSelectChange = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handlePasswordChange = (e) => {
    const { name, value } = e.target
    setPasswordForm(prev => ({ ...prev, [name]: value }))
  }

  const handleUpdatePassword = (e) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' })
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }
    setMessage({ type: 'success', text: 'Password updated successfully' })
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  const handleSaveSettings = () => {
    setMessage({ type: 'success', text: 'Settings saved successfully' })
  }

  const handleDeleteAccount = () => {
    if (window.confirm('Are you sure you want to delete your account? This action is permanent.')) {
      setMessage({ type: 'success', text: 'Account deletion initiated' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation user={user} />
      <div className="py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-[#001A72] mb-2">Settings</h1>
            <p className="text-gray-600 mb-8">Manage your account preferences and security</p>

          {message.text && (
            <div className={`mb-6 p-4 rounded ${
              message.type === 'success'
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
              {message.text}
            </div>
          )}

          {/* Notification Settings */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#001A72] mb-4">Notification Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold text-gray-700">All Notifications</p>
                  <p className="text-sm text-gray-600">Enable/disable all notifications</p>
                </div>
                <button
                  onClick={() => handleSettingChange('notifications')}
                  className={`px-4 py-2 rounded font-semibold ${
                    settings.notifications
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  {settings.notifications ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold text-gray-700">Email Notifications</p>
                  <p className="text-sm text-gray-600">Receive updates via email</p>
                </div>
                <button
                  onClick={() => handleSettingChange('emailNotifications')}
                  className={`px-4 py-2 rounded font-semibold ${
                    settings.emailNotifications
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  {settings.emailNotifications ? 'ON' : 'OFF'}
                </button>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
                <div>
                  <p className="font-semibold text-gray-700">SMS Notifications</p>
                  <p className="text-sm text-gray-600">Receive updates via SMS</p>
                </div>
                <button
                  onClick={() => handleSettingChange('smsNotifications')}
                  className={`px-4 py-2 rounded font-semibold ${
                    settings.smsNotifications
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-300 text-gray-500'
                  }`}
                >
                  {settings.smsNotifications ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#001A72] mb-4">Preferences</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                <select
                  value={settings.timezone}
                  onChange={(e) => handleSelectChange('timezone', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#001A72]"
                >
                  <option value="Africa/Lagos">Africa/Lagos (WAT)</option>
                  <option value="Africa/Johannesburg">Africa/Johannesburg (SAST)</option>
                  <option value="UTC">UTC</option>
                  <option value="Europe/London">Europe/London (GMT)</option>
                  <option value="America/New_York">America/New_York (EST)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
                <select
                  value={settings.language}
                  onChange={(e) => handleSelectChange('language', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#001A72]"
                >
                  <option value="English">English</option>
                  <option value="Yoruba">Yoruba</option>
                  <option value="Igbo">Igbo</option>
                  <option value="French">French</option>
                </select>
              </div>
            </div>
            <button
              onClick={handleSaveSettings}
              className="mt-4 bg-[#001A72] text-white px-6 py-2 rounded hover:bg-[#001A72]/90 transition font-semibold"
            >
              Save Preferences
            </button>
          </div>

          {/* Security */}
          <div className="mb-8 pb-8 border-b border-gray-200">
            <h2 className="text-xl font-bold text-[#001A72] mb-4">Security</h2>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-bold text-[#001A72] mb-4">Change Password</h3>
              <form onSubmit={handleUpdatePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#001A72]"
                    required
                  />
                </div>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#001A72]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#001A72]"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  className="bg-[#001A72] text-white px-6 py-2 rounded hover:bg-[#001A72]/90 transition font-semibold"
                >
                  Update Password
                </button>
              </form>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded">
              <div>
                <p className="font-semibold text-gray-700">Two-Factor Authentication</p>
                <p className="text-sm text-gray-600">Add extra security to your account</p>
              </div>
              <button
                onClick={() => handleSettingChange('twoFactorEnabled')}
                className={`px-4 py-2 rounded font-semibold ${
                  settings.twoFactorEnabled
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-500'
                }`}
              >
                {settings.twoFactorEnabled ? 'ENABLED' : 'DISABLED'}
              </button>
            </div>
          </div>

          {/* Account */}
          <div>
            <h2 className="text-xl font-bold text-[#001A72] mb-4">Account</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-gray-700 mb-4">
                Deleting your account will permanently remove all your data from EduWins.
              </p>
              <button
                onClick={handleDeleteAccount}
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700 transition font-semibold"
              >
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
