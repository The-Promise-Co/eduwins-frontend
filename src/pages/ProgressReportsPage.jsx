import { useState, useEffect } from 'react'
import api from '../services/api'

export default function ProgressReportsPage() {
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/progress-reports/my')
        setReports(res.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load progress reports')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  if (loading) return <p className="text-center py-8">Loading reports...</p>

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-[#001A72] mb-4">Progress Reports</h1>
        <p className="text-gray-600 mb-6">Weekly learning updates from your student's teachers.</p>

        {error && <div className="bg-red-100 text-red-700 p-3 rounded mb-4">{error}</div>}

        {reports.length === 0 ? (
          <p className="text-gray-600">No reports available yet.</p>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-1">
                  <div>
                    <h3 className="font-bold text-lg">Week: {new Date(report.week_start).toLocaleDateString()}</h3>
                    <p className="text-sm text-gray-500">Teacher: {report.teacher_name}</p>
                  </div>
                  <span className="text-xs bg-[#001A72] text-white px-2 py-1 rounded">{report.attendance_score}/100 Attendance</span>
                </div>
                <p className="text-sm text-gray-700 mb-2">{report.performance_summary}</p>
                <p className="text-sm text-gray-700 mb-1">Skill improvement: {report.skill_improvement_score}/100</p>
                <p className="text-sm text-gray-700 mb-1">Homework completion: {report.homework_completion}%</p>
                <p className="text-sm text-gray-500 mt-2">Notes: {report.notes || 'None'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
