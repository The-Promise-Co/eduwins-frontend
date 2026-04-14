import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import DashboardNavigation from '../components/DashboardNavigation'

export default function PremiumSubscriptionPage() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const [subscribing, setSubscribing] = useState(null)
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

        // Get subscription status
        const response = await api.get('/premium/subscription/status')
        setSubscription(response.data)
      } catch (err) {
        console.error('Error:', err)
      } finally {
        setLoading(false)
      }
    }

    init()
  }, [navigate])

  const subscribeToPlan = async (plan) => {
    setSubscribing(plan)
    setMessage({ type: '', text: '' })

    try {
      const response = await api.post('/premium/subscribe', { plan })

      setMessage({
        type: 'success',
        text: `Successfully subscribed to ${plan} plan!`,
      })

      // Update subscription status
      const statusResponse = await api.get('/premium/subscription/status')
      setSubscription(statusResponse.data)

      // Update user
      const updatedUser = { ...user, is_premium: true }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)

      // Redirect to premium features
      setTimeout(() => {
        navigate('/premium-content')
      }, 1500)
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Subscription failed'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setSubscribing(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading subscription plans...</p>
        </div>
      </div>
    )
  }

  const plans = [
    {
      name: 'monthly',
      displayName: 'Monthly',
      price: 5000,
      duration: '1 month',
      icon: '📅',
      features: [
        'Upload subject videos',
        'Upload teaching materials',
        'Premium search visibility',
        'Ad-free experience',
        'Analytics dashboard',
      ],
      popular: false,
    },
    {
      name: 'quarterly',
      displayName: 'Quarterly',
      price: 12000,
      duration: '3 months',
      icon: '⭐',
      features: [
        'All Monthly features',
        'Priority support',
        'Extended content library',
        'Higher earnings rate (10% more)',
        'Featured teacher badge',
      ],
      popular: true,
    },
    {
      name: 'annual',
      displayName: 'Annual',
      price: 40000,
      duration: '12 months',
      icon: '👑',
      features: [
        'All Quarterly features',
        'VIP support',
        'Unlimited uploads',
        'Revenue sharing (20% more)',
        'Custom profile page',
        'Marketing assistance',
      ],
      popular: false,
    },
  ]

  const isSubscribed = subscription?.subscriptionActive
  const currentPlan = subscription?.currentPlan
  const daysRemaining = subscription?.daysRemaining

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <DashboardNavigation user={user} />
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#001A72] mb-4">
              💎 Upgrade to Premium
            </h1>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              Unlock exclusive features, monetize your content, and reach more students. Get verified, showcase your expertise, and earn more.
            </p>
          </div>

        {message.text && (
          <div className={`mb-8 p-4 rounded-lg ${
            message.type === 'success'
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* Current Subscription Status */}
        {isSubscribed && (
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-500 rounded-lg p-6 mb-12">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-bold text-gray-800">
                  ✓ Current Plan: <span className="text-green-600 capitalize">{currentPlan}</span>
                </p>
                <p className="text-gray-600 mt-1">
                  {daysRemaining} days remaining in your subscription
                </p>
              </div>
              <div className="text-4xl">✨</div>
            </div>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`rounded-xl shadow-lg overflow-hidden transform transition hover:scale-105 ${
                plan.popular
                  ? 'border-4 border-[#FFB81C] ring-2 ring-[#FFB81C]/20 md:scale-105'
                  : 'border-2 border-gray-200'
              } ${isSubscribed && currentPlan === plan.name ? 'bg-blue-50' : 'bg-white'}`}
            >
              {plan.popular && (
                <div className="bg-gradient-to-r from-[#FFB81C] to-orange-500 text-white py-2 text-center font-bold">
                  🏆 MOST POPULAR
                </div>
              )}

              <div className="p-8">
                {/* Icon & Name */}
                <div className="text-5xl mb-4">{plan.icon}</div>
                <h3 className="text-2xl font-bold text-[#001A72] mb-2">
                  {plan.displayName}
                </h3>
                <p className="text-sm text-gray-500 mb-6">{plan.duration}</p>

                {/* Price */}
                <div className="mb-6">
                  <span className="text-5xl font-bold text-[#FFB81C]">
                    ₦{plan.price.toLocaleString()}
                  </span>
                  <span className="text-gray-600 ml-2">/ {plan.duration.split(' ')[1]}</span>
                </div>

                {/* Subscribe Button */}
                {isSubscribed && currentPlan === plan.name ? (
                  <button
                    disabled
                    className="w-full py-3 rounded-lg font-bold mb-6 bg-gray-300 text-gray-700 cursor-not-allowed"
                  >
                    ✓ Your Current Plan
                  </button>
                ) : (
                  <button
                    onClick={() => subscribeToPlan(plan.name)}
                    disabled={subscribing === plan.name}
                    className={`w-full py-3 rounded-lg font-bold mb-6 transition ${
                      plan.popular
                        ? 'bg-gradient-to-r from-[#FFB81C] to-orange-500 text-white hover:opacity-90'
                        : 'bg-[#001A72] text-white hover:bg-[#001A72]/90'
                    } disabled:opacity-50`}
                  >
                    {subscribing === plan.name
                      ? 'Processing...'
                      : `Subscribe Now`}
                  </button>
                )}

                {/* Features */}
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-gray-700 mb-4">
                    Includes:
                  </p>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-3">
                      <span className="text-green-500 font-bold">✓</span>
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* FAQ Section */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-[#001A72] mb-8">❓ Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-gray-800 mb-2">What happens to my existing content if I cancel?</h3>
              <p className="text-gray-600">
                Your uploaded content remains available, but you won't be able to upload new content or earn from premium features.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 mb-2">Can I switch plans?</h3>
              <p className="text-gray-600">
                Yes! You can upgrade or downgrade your plan anytime. Changes take effect in your next billing cycle.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-600">
                We accept all major payment methods including bank transfers, cards, and mobile wallets via Paystack.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 mb-2">Is there a free trial?</h3>
              <p className="text-gray-600">
                Currently, we don't offer free trials, but you can cancel anytime if you change your mind.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-gray-800 mb-2">How do I earn more with Premium?</h3>
              <p className="text-gray-600">
                Premium teachers can upload paid subject videos and teaching materials. You set your own prices, and we take a 15-25% commission depending on your subscription tier.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">
            Questions about our plans?
            <a href="/support" className="text-[#001A72] font-bold hover:underline ml-2">
              Contact our support team
            </a>
          </p>
        </div>
      </div>
      </div>
    </div>
  )
}
