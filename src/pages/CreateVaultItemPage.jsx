import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function CreateVaultItemPage() {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subject: '',
    content_type: 'notes',
    price: '',
    file_url: '',
    preview_url: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    // Validation
    if (!formData.title || !formData.description || !formData.subject || !formData.price || !formData.file_url) {
      setError('Please fill in all required fields')
      return
    }

    if (formData.price < 100) {
      setError('Minimum price is ₦100')
      return
    }

    try {
      setLoading(true)
      const response = await api.post('/vault', formData)

      setSuccess('Content uploaded successfully! Redirecting to vault...')
      setTimeout(() => {
        navigate('/vault')
      }, 2000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload content')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#001A72] mb-2">Sell Your Content</h1>
          <p className="text-gray-600">Upload lesson notes, videos, or study materials to earn passive income</p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                placeholder="e.g., Complete Algebra Workbook with Solutions"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                placeholder="Describe what students will learn, what's included, and any prerequisites..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject *
              </label>
              <select
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
              >
                <option value="">Select Subject</option>
                <option value="Mathematics">Mathematics</option>
                <option value="English">English</option>
                <option value="Physics">Physics</option>
                <option value="Chemistry">Chemistry</option>
                <option value="Biology">Biology</option>
                <option value="Geography">Geography</option>
                <option value="History">History</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Economics">Economics</option>
                <option value="Literature">Literature</option>
                <option value="Government">Government</option>
                <option value="Commerce">Commerce</option>
                <option value="Accounting">Accounting</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content Type *
              </label>
              <select
                name="content_type"
                value={formData.content_type}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
              >
                <option value="notes">Lesson Notes</option>
                <option value="video">Video Tutorial</option>
                <option value="worksheet">Worksheet/Exercises</option>
                <option value="ebook">E-book/PDF</option>
                <option value="quiz">Practice Quiz</option>
                <option value="bundle">Content Bundle</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price (₦) *
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="100"
                step="50"
                placeholder="500"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Minimum ₦100. You'll earn 95% of this amount.</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Download URL *
              </label>
              <input
                type="url"
                name="file_url"
                value={formData.file_url}
                onChange={handleChange}
                required
                placeholder="https://drive.google.com/file/d/... or https://yourfile.com/download"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Link to your file (Google Drive, Dropbox, etc.)</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Preview URL (Optional)
              </label>
              <input
                type="url"
                name="preview_url"
                value={formData.preview_url}
                onChange={handleChange}
                placeholder="https://youtube.com/watch?v=... or https://yourpreview.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">Optional preview video or sample content</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-800 mb-2">💰 Earnings Breakdown</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>Student pays: ₦{formData.price || 0}</p>
              <p>You earn: ₦{Math.round((formData.price || 0) * 0.95)}</p>
              <p>Platform fee: ₦{Math.round((formData.price || 0) * 0.05)}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => navigate('/vault')}
              className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-300 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#001A72] text-white py-3 rounded-lg font-semibold hover:bg-[#001A72]/90 transition disabled:opacity-50"
            >
              {loading ? 'Uploading...' : 'Upload Content'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
