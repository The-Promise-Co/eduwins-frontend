import { useState, useEffect } from 'react'
import api from '../services/api'

export default function AmbassadorPage() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/api/ambassadors/me')
        setData(res.data)
      } catch (err) {
        setError(err.response?.data?.error || 'Unable to load ambassador data')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  const apply = async () => {
    try {
      await api.post('/api/ambassadors/apply')
      alert('Ambassador application sent!')
      window.location.reload()
    } catch (err) {
      alert(err.response?.data?.error || 'Unable to apply')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold text-[#001A72] mb-4">Ambassador Program</h1>
        <p className="text-gray-600 mb-6">Earn bonuses by mentoring and referring teachers in a 2-level plan.</p>

        {loading && <p>Loading...</p>}
        {error && <div className="bg-red-100 text-red-700 p-3 mb-4 rounded">{error}</div>}

        {!loading && !data && (
          <div>
            <p className="mb-4">You are not an ambassador yet.</p>
            <button
              onClick={apply}
              className="bg-[#001A72] text-white px-6 py-2 rounded-lg hover:bg-[#001A72]/90"
            >
              Apply Now
            </button>
          </div>
        )}

        {data && (
          <div className="space-y-4">
            <div className="bg-[#FFB81C]/20 rounded-lg p-4">
              <p className="font-bold">Status: {data.status}</p>
              <p>Level: {data.level}</p>
              <p>Direct referrals: {data.direct_referrals}</p>
              <p>Indirect referrals: {data.indirect_referrals}</p>
              <p>Earned credits: ₦{data.earned_credits}</p>
            </div>
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-bold text-lg">How it works</h2>
              <ul className="list-disc pl-5 mt-2 text-sm text-gray-700">
                <li>Refer teachers to Edu-Wins and earn Welfare Fund rewards.</li>
                <li>Level 1: Earn ₦1,000 for each direct teacher referral.</li>
                <li>Level 2: Earn ₦500 for second-level referrals through your mentees.</li>
                <li>Maintain 4.5+ rating and good behavior to stay active.</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
