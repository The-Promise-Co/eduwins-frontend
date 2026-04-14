import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import DashboardNavigation from '../components/DashboardNavigation'

export default function ReportPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({
    studentName: '',
    subject: '',
    grade: '',
    comments: '',
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmitReport = (e) => {
    e.preventDefault()
    // Handle report submission
    console.log('Report submitted:', formData)
    setFormData({ studentName: '', subject: '', grade: '', comments: '' })
    setShowForm(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading reports...</p>
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
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-[#001A72] mb-2">Reports</h1>
                <p className="text-gray-600">Manage progress reports for your students</p>
              </div>
              {user?.role === 'teacher' && (
                <button
                  onClick={() => setShowForm(!showForm)}
                  className="bg-[#FFB81C] text-white px-6 py-2 rounded hover:bg-[#FFB81C]/90 transition font-semibold"
                >
                  {showForm ? 'Cancel' : 'Create Report'}
                </button>
              )}
            </div>

          {/* Report Form */}
          {showForm && user?.role === 'teacher' && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-bold text-[#001A72] mb-4">Create New Report</h3>
              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Student Name</label>
                    <input
                      type="text"
                      name="studentName"
                      value={formData.studentName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#001A72]"
                      placeholder="Enter student name"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                    <input
                      type="text"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#001A72]"
                      placeholder="E.g., Mathematics"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                    <select
                      name="grade"
                      value={formData.grade}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#001A72]"
                      required
                    >
                      <option value="">Select grade</option>
                      <option value="A">A (Excellent)</option>
                      <option value="B">B (Good)</option>
                      <option value="C">C (Satisfactory)</option>
                      <option value="D">D (Fair)</option>
                      <option value="F">F (Poor)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Session Date</label>
                    <input
                      type="date"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-[#001A72]"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Comments</label>
                  <textarea
                    name="comments"
                    value={formData.comments}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded h-24 focus:outline-none focus:border-[#001A72]"
                    placeholder="Write detailed comments about the student's progress..."
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="bg-[#001A72] text-white px-6 py-2 rounded hover:bg-[#001A72]/90 transition font-semibold"
                >
                  Submit Report
                </button>
              </form>
            </div>
          )}

          {/* Reports List */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-[#001A72]">Previous Reports</h2>
            {[
              {
                id: 1,
                studentName: 'John Doe',
                subject: 'Mathematics',
                grade: 'A',
                date: 'Mar 25, 2026',
                comments: 'Excellent progress in algebra and geometry. Keep up the good work!',
              },
              {
                id: 2,
                studentName: 'Jane Smith',
                subject: 'English',
                grade: 'B',
                date: 'Mar 24, 2026',
                comments: 'Good understanding of literature concepts. Work on essay structure.',
              },
              {
                id: 3,
                studentName: 'Mike Johnson',
                subject: 'Physics',
                grade: 'A',
                date: 'Mar 23, 2026',
                comments: 'Outstanding grasp of complex physics concepts. Top performer!',
              },
              {
                id: 4,
                studentName: 'Sarah Williams',
                subject: 'Chemistry',
                grade: 'C',
                date: 'Mar 22, 2026',
                comments: 'Needs more practice with stoichiometry. Available for extra sessions.',
              },
            ].map((report) => (
              <div key={report.id} className="bg-gray-50 border border-gray-200 rounded-lg p-6 hover:shadow-md transition">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-[#001A72]">{report.studentName}</h3>
                    <p className="text-gray-600 mb-2">{report.subject} • {report.date}</p>
                    <p className="text-gray-700">{report.comments}</p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-4 py-2 rounded-full font-bold text-white ${
                      report.grade === 'A' 
                        ? 'bg-green-500'
                        : report.grade === 'B'
                        ? 'bg-blue-500'
                        : report.grade === 'C'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                    }`}>
                      Grade {report.grade}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                  <button className="text-[#001A72] hover:text-[#001A72]/70 transition font-semibold text-sm">
                    Download PDF
                  </button>
                  <button className="text-red-500 hover:text-red-700 transition font-semibold text-sm">
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </div>
    </div>
  )
}
