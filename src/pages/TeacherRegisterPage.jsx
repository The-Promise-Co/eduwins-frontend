import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../services/api'

export default function TeacherRegisterPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    qualification: '',
    yearsExperience: '',
    bio: '',
    profilePhoto: null,
    videoIntro: null,
    credentials: null,
    subjects: [],
    baseHourlyRate: '',
    location: ''
  })

  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)

  const subjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology', 'English', 'French', 
    'Spanish', 'History', 'Geography', 'Economics', 'Music', 'Guitar', 
    'Piano', 'Saxophone', 'Violin'
  ]

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    
    if (name === 'subjects') {
      setFormData(prev => ({
        ...prev,
        subjects: checked 
          ? [...prev.subjects, value]
          : prev.subjects.filter(s => s !== value)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }))
    }
  }

  const handleFileChange = (e) => {
    const { name, files } = e.target
    if (files && files[0]) {
      setFormData(prev => ({
        ...prev,
        [name]: files[0]
      }))
    }
  }

  const handleSendOtp = async () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/send-otp', { 
        email: formData.email,
        phone: formData.phone 
      })
      setOtpSent(true)
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    setLoading(true)
    setError('')
    try {
      const response = await api.post('/auth/verify-otp', {
        email: formData.email,
        otp: otp
      })
      setStep(3)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const formDataToSend = new FormData()
    formDataToSend.append('fullName', formData.fullName)
    formDataToSend.append('email', formData.email)
    formDataToSend.append('phone', formData.phone)
    formDataToSend.append('password', formData.password)
    formDataToSend.append('role', 'teacher')
    formDataToSend.append('qualification', formData.qualification)
    formDataToSend.append('yearsExperience', formData.yearsExperience)
    formDataToSend.append('bio', formData.bio)
    formDataToSend.append('subjects', JSON.stringify(formData.subjects))
    formDataToSend.append('baseHourlyRate', formData.baseHourlyRate)
    formDataToSend.append('location', formData.location)
    
    if (formData.profilePhoto) formDataToSend.append('profilePhoto', formData.profilePhoto)
    if (formData.videoIntro) formDataToSend.append('videoIntro', formData.videoIntro)
    if (formData.credentials) formDataToSend.append('credentials', formData.credentials)

    try {
      const response = await api.post('/auth/register', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      localStorage.setItem('token', response.data.token)
      localStorage.setItem('user', JSON.stringify(response.data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#001A72]/10 to-[#FFB81C]/10 py-12">
      <div className="max-w-2xl mx-auto px-4">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-4xl font-bold text-[#001A72] mb-2 text-center">Become a Teacher</h1>
          <p className="text-gray-600 text-center mb-8">Join thousands of educators earning on Edu-Wins</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              {error}
            </div>
          )}

          {/* Step Indicator */}
          <div className="flex justify-between mb-8">
            {[1, 2, 3].map(stepNum => (
              <div key={stepNum} className="flex items-center flex-1">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                  step >= stepNum ? 'bg-[#001A72] text-white' : 'bg-gray-200 text-gray-600'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && <div className={`flex-1 h-1 mx-2 ${step > stepNum ? 'bg-[#001A72]' : 'bg-gray-200'}`}></div>}
              </div>
            ))}
          </div>

          {/* Step 1: Basic Info */}
          {step === 1 && (
            <form onSubmit={(e) => { e.preventDefault(); handleSendOtp() }} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Phone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Location (LGA) *</label>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="e.g., Ikoyi, Lagos"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#001A72] text-white py-3 rounded-lg font-semibold hover:bg-[#001A72]/90 disabled:opacity-50 transition"
              >
                {loading ? 'Sending OTP...' : 'Continue'}
              </button>

              <p className="text-center text-sm text-gray-600">
                Already have an account? <Link to="/login" className="text-[#001A72] font-semibold hover:underline">Sign In</Link>
              </p>
            </form>
          )}

          {/* Step 2: OTP Verification */}
          {step === 2 && (
            <form onSubmit={(e) => { e.preventDefault(); handleVerifyOtp() }} className="space-y-6">
              <div>
                <p className="text-gray-700 mb-4">We've sent an OTP to <strong>{formData.email}</strong> and <strong>{formData.phone}</strong></p>
                <label className="block text-sm font-medium text-gray-700 mb-2">Enter OTP *</label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="000000"
                  maxLength="6"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#001A72] text-white py-3 rounded-lg font-semibold hover:bg-[#001A72]/90 disabled:opacity-50 transition"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </form>
          )}

          {/* Step 3: Profile & Documents */}
          {step === 3 && (
            <form onSubmit={handleRegister} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Qualification *</label>
                  <input
                    type="text"
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    placeholder="e.g., Bachelor's in Education"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Years of Experience *</label>
                  <input
                    type="number"
                    name="yearsExperience"
                    value={formData.yearsExperience}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Base Hourly Rate (₦) *</label>
                <input
                  type="number"
                  name="baseHourlyRate"
                  value={formData.baseHourlyRate}
                  onChange={handleInputChange}
                  placeholder="e.g., 5000"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Select Subjects You Teach *</label>
                <div className="grid md:grid-cols-3 gap-3">
                  {subjects.map(subject => (
                    <label key={subject} className="flex items-center">
                      <input
                        type="checkbox"
                        name="subjects"
                        value={subject}
                        checked={formData.subjects.includes(subject)}
                        onChange={handleInputChange}
                        className="w-4 h-4 text-[#001A72] rounded"
                      />
                      <span className="ml-2 text-sm text-gray-700">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Professional Bio</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleInputChange}
                  placeholder="Tell parents about your teaching style and experience..."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#001A72] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Profile Photo</label>
                <input
                  type="file"
                  name="profilePhoto"
                  onChange={handleFileChange}
                  accept="image/*"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Upload a professional headshot JPG/PNG</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">1-Minute Video Intro</label>
                <input
                  type="file"
                  name="videoIntro"
                  onChange={handleFileChange}
                  accept="video/*"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Max 1 minute video introducing yourself to parents</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">TRCN/NIN Credentials (PDF)</label>
                <input
                  type="file"
                  name="credentials"
                  onChange={handleFileChange}
                  accept=".pdf"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                />
                <p className="text-xs text-gray-500 mt-1">Upload PDF of your TRCN, NIN, or relevant credentials</p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#FFB81C] text-[#001A72] py-3 rounded-lg font-semibold hover:bg-[#ffd06f] disabled:opacity-50 transition"
              >
                {loading ? 'Creating Profile...' : 'Complete Registration'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
