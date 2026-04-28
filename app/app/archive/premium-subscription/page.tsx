'use client';

import { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/services/api';
import DashboardNavigation from '@/components/DashboardNavigation';
import { User } from '@/types';

interface SubscriptionStatus {
  subscriptionActive: boolean;
  currentPlan: string | null;
  daysRemaining: number | null;
}

interface Plan {
  name: string;
  displayName: string;
  price: number;
  duration: string;
  icon: string;
  color: string;
  features: string[];
  popular: boolean;
}

interface Message {
  type: 'success' | 'error' | '';
  text: string;
}

export default function PremiumSubscriptionPage(): ReactElement {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [subscribing, setSubscribing] = useState<string | null>(null);
  const [message, setMessage] = useState<Message>({ type: '', text: '' });

  useEffect(() => {
    const init = async () => {
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        const userJson = localStorage.getItem('user');

        if (!token || !userJson) {
          router.push('/login');
          return;
        }

        try {
          const userData = JSON.parse(userJson);
          if (userData.role !== 'teacher') {
            router.push('/dashboard');
            return;
          }
          setUser(userData);

          // Get subscription status
          const response = await api.get('/premium/subscription/status');
          setSubscription(response.data);
        } catch (err) {
          console.error('Error:', err);
        } finally {
          setLoading(false);
        }
      }
    };

    init();
  }, [router]);

  const subscribeToPlan = async (plan: string) => {
    setSubscribing(plan);
    setMessage({ type: '', text: '' });

    try {
      await api.post('/premium/subscribe', { plan });

      setMessage({
        type: 'success',
        text: `Successfully subscribed to ${plan} plan! Redirecting to features...`,
      });

      if (user) {
        // Update local storage and user state
        const updatedUser = { ...user, is_premium: true } as (User & { is_premium: boolean });
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }

      // Refresh subscription status
      const statusResponse = await api.get('/premium/subscription/status');
      setSubscription(statusResponse.data);

      setTimeout(() => {
        router.push('/premium-content');
      }, 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || 'Subscription failed';
      setMessage({ type: 'error', text: errorMsg });
    } finally {
      setSubscribing(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#001A72] mx-auto mb-4"></div>
          <p className="text-gray-600 font-black">Loading premium plans...</p>
        </div>
      </div>
    );
  }

  const plans: Plan[] = [
    {
      name: 'monthly',
      displayName: 'Monthly',
      price: 5000,
      duration: '1 month',
      icon: '📅',
      color: 'border-blue-500',
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
      color: 'border-[#FFB81C]',
      features: [
        'All Monthly features',
        'Priority support',
        'Extended content library',
        'Higher earnings (10% more)',
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
      color: 'border-purple-600',
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
  ];

  const isSubscribed = subscription?.subscriptionActive;
  const currentPlan = subscription?.currentPlan;
  const daysRemaining = subscription?.daysRemaining;

  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardNavigation user={user} />
      <div className="py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-16">
            <h1 className="text-5xl font-black text-[#001A72] mb-4">Elite Premium Plans</h1>
            <p className="text-gray-500 font-medium text-xl max-w-3xl mx-auto leading-relaxed">
              Unlock exclusive teaching tools, monetize your knowledge, and boost your earnings by reaching a global audience of students.
            </p>
          </div>

          {message.text && (
            <div className={`mb-10 p-5 rounded-2xl border-2 animate-in fade-in slide-in-from-top-4 duration-500 ${message.type === 'success'
                ? 'bg-green-50 text-green-700 border-green-100'
                : 'bg-red-50 text-red-700 border-red-100'
              }`}>
              <p className="font-black flex items-center justify-center gap-3">
                {message.type === 'success' ? '🚀' : '❌'} {message.text}
              </p>
            </div>
          )}

          {/* Current Status */}
          {isSubscribed && (
            <div className="bg-[#001A72] text-white rounded-3xl p-8 mb-16 shadow-2xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <h2 className="text-2xl font-black mb-1">Your Premium Status is Active! ✨</h2>
                  <p className="text-blue-200 font-bold capitalize">Plan: {currentPlan} • {daysRemaining} days remaining</p>
                </div>
                <button onClick={() => router.push('/premium-content')} className="px-8 py-3 bg-[#FFB81C] text-[#001A72] font-black rounded-xl hover:scale-105 transition shadow-lg">
                  Go to Workspace
                </button>
              </div>
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -translate-x-12 -translate-y-12"></div>
            </div>
          )}

          {/* Plan Grid */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`flex flex-col bg-white rounded-3xl shadow-xl overflow-hidden border-t-8 ${plan.color} relative transform transition duration-300 hover:-translate-y-2 ${plan.popular ? 'md:scale-105 z-20 shadow-2xl ring-2 ring-[#FFB81C]' : 'z-10'
                  }`}
              >
                {plan.popular && (
                  <div className="bg-[#FFB81C] text-[#001A72] py-2 text-center text-[10px] font-black uppercase tracking-widest">
                    Best Value Option
                  </div>
                )}

                <div className="p-8 flex-1 flex flex-col">
                  <div className="text-5xl mb-4">{plan.icon}</div>
                  <h3 className="text-2xl font-black text-[#001A72] mb-1">{plan.displayName}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">{plan.duration}</p>

                  <div className="mb-8">
                    <span className="text-5xl font-black text-[#001A72]">₦{plan.price.toLocaleString()}</span>
                  </div>

                  <button
                    onClick={() => subscribeToPlan(plan.name)}
                    disabled={subscribing === plan.name || (isSubscribed && currentPlan === plan.name)}
                    className={`w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest mb-8 transition shadow-lg ${isSubscribed && currentPlan === plan.name
                        ? 'bg-gray-100 text-gray-400 cursor-default'
                        : plan.popular
                          ? 'bg-[#FFB81C] text-[#001A72] hover:bg-[#FFB81C]/90'
                          : 'bg-[#001A72] text-white hover:bg-[#001A72]/90'
                      }`}
                  >
                    {subscribing === plan.name ? 'Processing...' : contributesStatus(!!isSubscribed, currentPlan ?? null, plan.name)}
                  </button>

                  <div className="space-y-4">
                    <p className="text-xs font-black text-[#001A72] uppercase tracking-widest opacity-40">Features</p>
                    {plan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-[10px] text-white">✓</div>
                        <span className="text-sm font-bold text-gray-600 tracking-tight">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* FAQ Breakdown */}
          <div className="bg-white rounded-[3rem] shadow-xl p-12 border border-gray-100">
            <h2 className="text-3xl font-black text-[#001A72] mb-12 text-center">Plan Intelligence & FAQ</h2>
            <div className="grid md:grid-cols-2 gap-10">
              <FaqItem
                q="What happens to my uploads if I cancel?"
                a="Your existing premium content stays live for current purchasers, but you cannot upload new materials until you resubscribe."
              />
              <FaqItem
                q="Can I switch between plans?"
                a="Absolutely. Upgrading takes effect immediately. Downgrading occurs at the end of your current cycle."
              />
              <FaqItem
                q="How are my earnings calculated?"
                a="Premium users keep a higher percentage of content sales. Quarterly and Annual plans reduce platform fees by up to 20%."
              />
              <FaqItem
                q="Are there any hidden costs?"
                a="No hidden fees. The price you see includes all taxes and transaction processing costs."
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function contributesStatus(isSubscribed: boolean, currentPlan: string | null, planName: string): string {
  if (isSubscribed && currentPlan === planName) return 'Current Plan';
  return 'Subscribe Now';
}

interface FaqItemProps {
  q: string;
  a: string;
}

function FaqItem({ q, a }: FaqItemProps): ReactElement {
  return (
    <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100">
      <h4 className="font-black text-[#001A72] mb-2 leading-tight">{q}</h4>
      <p className="text-sm font-bold text-gray-400 leading-relaxed">{a}</p>
    </div>
  );
}
