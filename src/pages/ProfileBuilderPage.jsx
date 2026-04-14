import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import DashboardNavigation from '../components/DashboardNavigation'

export default function ProfileBuilderPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [completion, setCompletion] = useState(null)
  const [uploading, setUploading] = useState({})
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

        // Get profile completion status
        const response = await api.get('/uploads/profile-completion')
        setCompletion(response.data)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [navigate])

  const handleFileUpload = async (e, uploadType) => {
    const file = e.target.files[0]
    if (!file) return

    setUploading({ ...uploading, [uploadType]: true })
    setMessage({ type: '', text: '' })

    try {
      const formData = new FormData()
      formData.append(uploadType, file)

      let response
      switch (uploadType) {
        case 'headshot':
          response = await api.post('/uploads/headshot', formData)
          break
        case 'videoIntro':
          response = await api.post('/uploads/video-intro', formData)
          break
        case 'credentials':
          response = await api.post('/uploads/credentials', formData)
          break
        default:
          return
      }

      setMessage({
        type: 'success',
        text: response.data.message,
      })

      // Refresh completion status
      const completionResponse = await api.get('/uploads/profile-completion')
      setCompletion(completionResponse.data)

      // Refresh user data
      localStorage.setItem('user', JSON.stringify({ ...user, ...response.data.user }))
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Upload failed'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setUploading({ ...uploading, [uploadType]: false })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile builder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardNavigation user={user} />
      <div className="py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-[#001A72] mb-2">🎯 Build Your Profile</h1>
            <p className="text-gray-600 text-lg">
              Complete your profile to increase visibility and unlock premium features
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

        {/* Completion Progress */}
        {completion && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#001A72]">Profile Completion</h2>
              <span className="text-3xl font-bold text-[#FFB81C]">
                {Math.round(completion.completionPercentage)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-[#001A72] to-[#FFB81C] h-3 rounded-full transition-all"
                style={{ width: `${completion.completionPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-4">
              {completion.nextStep}
            </p>
          </div>
        )}

        {/* Upload Forms Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Headshot */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-blue-500 hover:shadow-xl transition">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="text-xl font-bold text-[#001A72] mb-2">Professional Headshot</h3>
            <p className="text-gray-600 text-sm mb-4">
              Upload a professional photo. Max 5MB (JPEG, PNG, GIF)
            </p>
            {completion?.completion?.headshot ? (
              <div className="p-3 bg-green-100 rounded mb-4 text-sm font-semibold text-green-700">
                ✓ Uploaded
              </div>
            ) : (
              <label className="flex items-center justify-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 cursor-pointer transition mb-4">
                {uploading.headshot ? 'Uploading...' : 'Choose Photo'}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'headshot')}
                  className="hidden"
                  disabled={uploading.headshot}
                />
              </label>
            )}
            <p className="text-xs text-gray-500">
              Required for profile visibility
            </p>
          </div>

          {/* Video Intro */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-purple-500 hover:shadow-xl transition">
            <div className="text-4xl mb-4">🎬</div>
            <h3 className="text-xl font-bold text-[#001A72] mb-2">1-Minute Video Intro</h3>
            <p className="text-gray-600 text-sm mb-4">
              Introduce yourself. Max 50MB (MP4, MOV)
            </p>
            {completion?.completion?.videoIntro ? (
              <div className="p-3 bg-green-100 rounded mb-4 text-sm font-semibold text-green-700">
                ✓ Uploaded
              </div>
            ) : (
              <label className="flex items-center justify-center px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 cursor-pointer transition mb-4">
                {uploading.videoIntro ? 'Uploading...' : 'Choose Video'}
                <input
                  type="file"
                  accept="video/*"
                  onChange={(e) => handleFileUpload(e, 'videoIntro')}
                  className="hidden"
                  disabled={uploading.videoIntro}
                />
              </label>
            )}
            <p className="text-xs text-gray-500">
              Increases student engagement by 300%
            </p>
          </div>

          {/* Credentials */}
          <div className="bg-white rounded-lg shadow-lg p-6 border-t-4 border-green-500 hover:shadow-xl transition">
            <div className="text-4xl mb-4">📄</div>
            <h3 className="text-xl font-bold text-[#001A72] mb-2">TRCN/NIN Credentials</h3>
            <p className="text-gray-600 text-sm mb-4">
              Upload PDF of credentials. Max 10MB
            </p>
            {completion?.completion?.credentials ? (
              <div className={`p-3 rounded mb-4 text-sm font-semibold ${
                completion.completion.credentialsVerified
                  ? 'bg-green-100 text-green-700'
                  : 'bg-yellow-100 text-yellow-700'
              }`}>
                {completion.completion.credentialsVerified ? '✓ Verified' : '⏳ Pending Verification'}
              </div>
            ) : (
              <label className="flex items-center justify-center px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 cursor-pointer transition mb-4">
                {uploading.credentials ? 'Uploading...' : 'Choose PDF'}
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e, 'credentials')}
                  className="hidden"
                  disabled={uploading.credentials}
                />
              </label>
            )}
            <p className="text-xs text-gray-500">
              Verified by admin team
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-[#001A72]/10 to-[#FFB81C]/10 border-2 border-[#001A72] rounded-lg p-6">
          <h3 className="text-xl font-bold text-[#001A72] mb-4">🚀 Next Steps</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center font-bold">1</div>
              <div>
                <p className="font-semibold text-gray-800">Complete Your Profile</p>
                <p className="text-sm text-gray-600">Upload all required documents for full access</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-500 text-white flex items-center justify-center font-bold">2</div>
              <div>
                <p className="font-semibold text-gray-800">Subscribe to Premium</p>
                <p className="text-sm text-gray-600">Unlock advanced features and higher earnings</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold">3</div>
              <div>
                <p className="font-semibold text-gray-800">Upload Premium Content</p>
                <p className="text-sm text-gray-600">Share subject videos and teaching materials for additional income</p>
              </div>
            </div>
          </div>

          {completion?.completionPercentage === 100 && !completion.isPremium && (
            <button
              onClick={() => navigate('/premium-subscription')}
              className="mt-6 w-full bg-[#FFB81C] text-[#001A72] py-3 rounded-lg font-bold hover:bg-[#FFB81C]/90 transition"
            >
              Subscribe to Premium & Unlock Features
            </button>
          )}
        </div>
      </div>
      </div>
    </div>
  )
}
