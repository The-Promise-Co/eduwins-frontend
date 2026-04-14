import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function PremiumContentPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isPremium, setIsPremium] = useState(false)
  const [activeTab, setActiveTab] = useState('videos')
  const [contentList, setContentList] = useState([])
  const [message, setMessage] = useState({ type: '', text: '' })
  const [uploading, setUploading] = useState(false)

  // Form states
  const [videoForm, setVideoForm] = useState({
    subject: '',
    title: '',
    description: '',
    price: '',
    file: null,
  })

  const [materialForm, setMaterialForm] = useState({
    subject: '',
    title: '',
    description: '',
    price: '',
    file: null,
  })

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

        // Check if premium
        const statusResponse = await api.get('/premium/subscription/status')
        if (statusResponse.data.subscriptionActive) {
          setIsPremium(true)
          loadContent()
        } else {
          setMessage({
            type: 'warning',
            text: 'You need an active Premium subscription to use this feature.',
          })
          setTimeout(() => navigate('/premium-subscription'), 2000)
        }
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [navigate])

  const loadContent = async () => {
    try {
      const response = await api.get('/premium/teacher-content')
      setContentList(response.data.content)
    } catch (err) {
      console.error('Error loading content:', err)
    }
  }

  const handleVideoUpload = async (e) => {
    e.preventDefault()
    if (!videoForm.file || !videoForm.subject || !videoForm.title || !videoForm.price) {
      setMessage({ type: 'error', text: 'Please fill all fields and select a file' })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('subject', videoForm.subject)
    formData.append('title', videoForm.title)
    formData.append('description', videoForm.description)
    formData.append('price', videoForm.price)
    formData.append('videoFile', videoForm.file)

    try {
      await api.post('/premium/subject-video', formData)
      setMessage({ type: 'success', text: 'Subject video uploaded successfully!' })
      setVideoForm({ subject: '', title: '', description: '', price: '', file: null })
      loadContent()
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Upload failed'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setUploading(false)
    }
  }

  const handleMaterialUpload = async (e) => {
    e.preventDefault()
    if (!materialForm.file || !materialForm.subject || !materialForm.title || !materialForm.price) {
      setMessage({ type: 'error', text: 'Please fill all fields and select a file' })
      return
    }

    setUploading(true)
    const formData = new FormData()
    formData.append('subject', materialForm.subject)
    formData.append('title', materialForm.title)
    formData.append('description', materialForm.description)
    formData.append('price', materialForm.price)
    formData.append('materialFile', materialForm.file)

    try {
      await api.post('/premium/teaching-material', formData)
      setMessage({ type: 'success', text: 'Teaching material uploaded successfully!' })
      setMaterialForm({ subject: '', title: '', description: '', price: '', file: null })
      loadContent()
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Upload failed'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setUploading(false)
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

  if (!isPremium) {
    return null
  }

  const subjects = ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'History', 'Geography', 'CRS', 'ISS', 'Other']
  const videos = contentList.filter((c) => c.type === 'video')
  const materials = contentList.filter((c) => c.type === 'material')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-[#001A72] mb-2">
            📺 Premium Content Manager
          </h1>
          <p className="text-gray-600">Upload and manage your paid content</p>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : message.type === 'error'
              ? 'bg-red-100 text-red-700 border border-red-300'
              : 'bg-yellow-100 text-yellow-700 border border-yellow-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-t-lg shadow-lg flex border-b">
          <button
            onClick={() => setActiveTab('videos')}
            className={`flex-1 py-4 px-6 font-bold text-center transition ${
              activeTab === 'videos'
                ? 'bg-[#001A72] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            📹 Subject Videos ({videos.length})
          </button>
          <button
            onClick={() => setActiveTab('materials')}
            className={`flex-1 py-4 px-6 font-bold text-center transition ${
              activeTab === 'materials'
                ? 'bg-[#001A72] text-white'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            📄 Materials ({materials.length})
          </button>
        </div>

        {/* Content Grid */}
        <div className="bg-white rounded-b-lg shadow-lg p-8 mb-8">
          {activeTab === 'videos' ? (
            <div>
              <h2 className="text-2xl font-bold text-[#001A72] mb-6">
                Upload Subject Video
              </h2>

              <form onSubmit={handleVideoUpload} className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      value={videoForm.subject}
                      onChange={(e) =>
                        setVideoForm({ ...videoForm, subject: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72]"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Price (₦) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={videoForm.price}
                      onChange={(e) =>
                        setVideoForm({ ...videoForm, price: e.target.value })
                      }
                      placeholder="e.g., 1000"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72]"
                    />
                  </div>

                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={videoForm.title}
                      onChange={(e) =>
                        setVideoForm({ ...videoForm, title: e.target.value })
                      }
                      placeholder="e.g., Quadratic Equations Explained"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72]"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={videoForm.description}
                      onChange={(e) =>
                        setVideoForm({ ...videoForm, description: e.target.value })
                      }
                      placeholder="Describe what students will learn"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72]"
                    ></textarea>
                  </div>

                  {/* File Upload */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Video File (Max 500MB) *
                    </label>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={(e) =>
                        setVideoForm({ ...videoForm, file: e.target.files[0] })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    {videoForm.file && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {videoForm.file.name} selected
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="mt-6 bg-[#001A72] text-white py-3 px-8 rounded-lg font-bold hover:bg-[#001A72]/90 disabled:opacity-50 transition"
                >
                  {uploading ? 'Uploading...' : 'Upload Video'}
                </button>
              </form>

              {/* Videos List */}
              <h3 className="text-xl font-bold text-[#001A72] mb-4">Your Videos ({videos.length})</h3>
              {videos.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No videos uploaded yet. Start by uploading your first subject video!
                </p>
              ) : (
                <div className="grid gap-4">
                  {videos.map((video) => (
                    <div key={video.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-[#001A72]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">{video.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{video.subject}</p>
                          <p className="text-sm text-gray-600">{video.description}</p>
                          <div className="flex gap-4 mt-3 text-sm">
                            <span className="text-[#FFB81C] font-bold">₦{video.price?.toLocaleString()}/access</span>
                            <span>{video.views || 0} views</span>
                            <span>{video.subscribers?.length || 0} subscribers</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-[#001A72] mb-6">
                Upload Teaching Material
              </h2>

              <form onSubmit={handleMaterialUpload} className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Subject */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Subject *
                    </label>
                    <select
                      value={materialForm.subject}
                      onChange={(e) =>
                        setMaterialForm({ ...materialForm, subject: e.target.value })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72]"
                    >
                      <option value="">Select Subject</option>
                      {subjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Price */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Price (₦) *
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={materialForm.price}
                      onChange={(e) =>
                        setMaterialForm({ ...materialForm, price: e.target.value })
                      }
                      placeholder="e.g., 500"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72]"
                    />
                  </div>

                  {/* Title */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={materialForm.title}
                      onChange={(e) =>
                        setMaterialForm({ ...materialForm, title: e.target.value })
                      }
                      placeholder="e.g., JAMB Chemistry Practice Questions"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72]"
                    />
                  </div>

                  {/* Description */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={materialForm.description}
                      onChange={(e) =>
                        setMaterialForm({ ...materialForm, description: e.target.value })
                      }
                      placeholder="Describe the material content"
                      rows="3"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72]"
                    ></textarea>
                  </div>

                  {/* File Upload */}
                  <div className="md:col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      File (PDF or Word, Max 50MB) *
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      onChange={(e) =>
                        setMaterialForm({ ...materialForm, file: e.target.files[0] })
                      }
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                    />
                    {materialForm.file && (
                      <p className="text-sm text-green-600 mt-2">
                        ✓ {materialForm.file.name} selected
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="mt-6 bg-[#001A72] text-white py-3 px-8 rounded-lg font-bold hover:bg-[#001A72]/90 disabled:opacity-50 transition"
                >
                  {uploading ? 'Uploading...' : 'Upload Material'}
                </button>
              </form>

              {/* Materials List */}
              <h3 className="text-xl font-bold text-[#001A72] mb-4">Your Materials ({materials.length})</h3>
              {materials.length === 0 ? (
                <p className="text-gray-600 text-center py-8">
                  No materials uploaded yet. Start by uploading your first teaching material!
                </p>
              ) : (
                <div className="grid gap-4">
                  {materials.map((material) => (
                    <div key={material.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-[#001A72]">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-800">{material.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{material.subject}</p>
                          <p className="text-sm text-gray-600">{material.description}</p>
                          <div className="flex gap-4 mt-3 text-sm">
                            <span className="text-[#FFB81C] font-bold">₦{material.price?.toLocaleString()}/download</span>
                            <span>{material.downloads || 0} downloads</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Videos</p>
                <p className="text-3xl font-bold text-[#001A72]">{videos.length}</p>
              </div>
              <div className="text-4xl">📹</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Materials</p>
                <p className="text-3xl font-bold text-[#001A72]">{materials.length}</p>
              </div>
              <div className="text-4xl">📄</div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm">Total Content</p>
                <p className="text-3xl font-bold text-[#001A72]">{videos.length + materials.length}</p>
              </div>
              <div className="text-4xl">💎</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
