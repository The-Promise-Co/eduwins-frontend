import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

export default function TeacherPremiumMarketplacePage() {
  const navigate = useNavigate()
  const { teacherId } = useParams()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [teacher, setTeacher] = useState(null)
  const [content, setContent] = useState([])
  const [activeTab, setActiveTab] = useState('videos')
  const [purchasing, setPurchasing] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    const init = async () => {
      const userJson = localStorage.getItem('user')
      if (userJson) {
        setUser(JSON.parse(userJson))
      }

      try {
        // Fetch teacher profile
        const teacherResponse = await api.get(`/teachers/${teacherId}/profile`)
        setTeacher(teacherResponse.data)

        // Fetch teacher's premium content
        const contentResponse = await api.get(`/premium/teacher/${teacherId}/content`)
        setContent(contentResponse.data.content || [])
      } catch (err) {
        console.error('Error:', err)
        setMessage({ type: 'error', text: 'Failed to load content' })
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [teacherId])

  const handlePurchaseVideo = async (videoId) => {
    if (!user) {
      navigate('/login')
      return
    }

    setPurchasing(videoId)
    try {
      const response = await api.post(`/premium/video/${videoId}/subscribe`, {})
      setMessage({ type: 'success', text: 'Video access granted! Enjoy learning!' })
      
      // Refresh content
      const contentResponse = await api.get(`/premium/teacher/${teacherId}/content`)
      setContent(contentResponse.data.content || [])
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Purchase failed'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setPurchasing(null)
    }
  }

  const handlePurchaseMaterial = async (materialId) => {
    if (!user) {
      navigate('/login')
      return
    }

    setPurchasing(materialId)
    try {
      const response = await api.post(`/premium/material/${materialId}/purchase`, {})
      setMessage({ type: 'success', text: 'Material purchased successfully! Check your downloads.' })
      
      // Refresh content
      const contentResponse = await api.get(`/premium/teacher/${teacherId}/content`)
      setContent(contentResponse.data.content || [])
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Purchase failed'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setPurchasing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading content...</p>
        </div>
      </div>
    )
  }

  const videos = content.filter((c) => c.type === 'video')
  const materials = content.filter((c) => c.type === 'material')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Teacher Header */}
        {teacher && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 bg-gradient-to-br from-[#001A72] to-[#FFB81C] rounded-full flex items-center justify-center text-white text-4xl">
                👨‍🏫
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-[#001A72] mb-2">
                  {teacher.fullName || teacher.name}
                </h1>
                <div className="flex items-center gap-3 mb-3">
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-semibold">
                    ⭐ Premium Teacher
                  </span>
                  {teacher.credentialsVerified && (
                    <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold">
                      ✓ Verified
                    </span>
                  )}
                </div>
                <p className="text-gray-600 mb-4">
                  {teacher.bio || 'Professional educator with premium content'}
                </p>
                <div className="flex gap-4">
                  <div>
                    <p className="text-2xl font-bold text-[#FFB81C]">{videos.length}</p>
                    <p className="text-sm text-gray-600">Videos</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#FFB81C]">{materials.length}</p>
                    <p className="text-sm text-gray-600">Materials</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#FFB81C]">{teacher.rating || '4.8'}</p>
                    <p className="text-sm text-gray-600">Rating</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {message.text && (
          <div className={`mb-8 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
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
            📄 Teaching Materials ({materials.length})
          </button>
        </div>

        {/* Content Grid */}
        <div className="bg-white rounded-b-lg shadow-lg p-8">
          {activeTab === 'videos' ? (
            <div>
              <h2 className="text-2xl font-bold text-[#001A72] mb-6">
                Subject Videos
              </h2>

              {videos.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📹</div>
                  <p className="text-gray-600 text-lg">
                    No videos available from this teacher
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {videos.map((video) => (
                    <div key={video.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                      {/* Thumbnail */}
                      <div className="w-full h-40 bg-gradient-to-br from-[#001A72] to-[#FFB81C] flex items-center justify-center text-white text-6xl">
                        🎥
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="font-bold text-lg text-gray-800 mb-2">
                          {video.title}
                        </h3>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-semibold">Subject:</span> {video.subject}
                        </p>

                        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
                          {video.description}
                        </p>

                        <div className="flex items-center justify-between mb-4">
                          <div className="text-3xl font-bold text-[#FFB81C]">
                            ₦{video.price?.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-600">
                            {video.views || 0} views
                          </div>
                        </div>

                        {video.userHasAccess ? (
                          <button
                            onClick={() => navigate(`/watch-video/${video.id}`)}
                            className="w-full py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition"
                          >
                            ✓ Watch Now
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePurchaseVideo(video.id)}
                            disabled={purchasing === video.id}
                            className="w-full py-3 bg-[#001A72] text-white rounded-lg font-bold hover:bg-[#001A72]/90 disabled:opacity-50 transition"
                          >
                            {purchasing === video.id ? 'Processing...' : 'Buy Access'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <h2 className="text-2xl font-bold text-[#001A72] mb-6">
                Teaching Materials
              </h2>

              {materials.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📄</div>
                  <p className="text-gray-600 text-lg">
                    No materials available from this teacher
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {materials.map((material) => (
                    <div key={material.id} className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition">
                      {/* Icon */}
                      <div className="w-full h-40 bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-6xl">
                        📚
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <h3 className="font-bold text-lg text-gray-800 mb-2">
                          {material.title}
                        </h3>
                        
                        <p className="text-sm text-gray-600 mb-2">
                          <span className="font-semibold">Subject:</span> {material.subject}
                        </p>

                        <p className="text-gray-700 text-sm mb-2 line-clamp-2">
                          {material.description}
                        </p>

                        <p className="text-xs text-gray-500 mb-4">
                          📄 {material.fileType?.toUpperCase()}{' '}
                          <span className="ml-2">({material.downloads || 0} downloads)</span>
                        </p>

                        <div className="flex items-center justify-between mb-4">
                          <div className="text-3xl font-bold text-[#FFB81C]">
                            ₦{material.price?.toLocaleString()}
                          </div>
                        </div>

                        {material.userHasAccess ? (
                          <button
                            onClick={() => window.open(material.downloadUrl)}
                            className="w-full py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition"
                          >
                            ⬇️ Download
                          </button>
                        ) : (
                          <button
                            onClick={() => handlePurchaseMaterial(material.id)}
                            disabled={purchasing === material.id}
                            className="w-full py-3 bg-[#001A72] text-white rounded-lg font-bold hover:bg-[#001A72]/90 disabled:opacity-50 transition"
                          >
                            {purchasing === material.id ? 'Processing...' : 'Buy Now'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="mt-12 bg-gradient-to-r from-[#001A72] to-blue-900 rounded-lg text-white p-8 text-center">
          <h3 className="text-2xl font-bold mb-3">Want to become a Premium Teacher?</h3>
          <p className="mb-6 text-blue-100">
            Create premium content and start earning today!
          </p>
          {user?.role === 'teacher' && !user?.is_premium ? (
            <button
              onClick={() => navigate('/premium-subscription')}
              className="bg-[#FFB81C] text-[#001A72] px-8 py-3 rounded-lg font-bold hover:bg-[#FFB81C]/90 transition"
            >
              Become Premium Teacher
            </button>
          ) : user?.role === 'teacher' ? (
            <button
              onClick={() => navigate('/premium-content')}
              className="bg-[#FFB81C] text-[#001A72] px-8 py-3 rounded-lg font-bold hover:bg-[#FFB81C]/90 transition"
            >
              Manage Your Content
            </button>
          ) : (
            <button
              onClick={() => navigate('/teacher-register')}
              className="bg-[#FFB81C] text-[#001A72] px-8 py-3 rounded-lg font-bold hover:bg-[#FFB81C]/90 transition"
            >
              Become a Teacher
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
