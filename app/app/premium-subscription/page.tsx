'use client';

import { useState, useEffect, ReactElement } from 'react';
import { useRouter } from 'next/navigation';
import { useApiMutation, useApiQuery } from '@/hooks/useApi';
import { useUser } from '@/context/UserContext';
import {
  Gem,
  CheckCircle2,
  Loader2,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import PageHeader from '@/components/PageHeader';

interface Plan {
  name: string;
  displayName: string;
  price: number;
  duration: string;
  periodLabel: string;
  features: string[];
  popular: boolean;
}

interface Subscription {
  subscriptionActive: boolean;
  currentPlan?: string;
  daysRemaining?: number;
}

const PLANS: Plan[] = [
  {
    name: 'monthly',
    displayName: 'Monthly',
    price: 5000,
    duration: '1 month',
    periodLabel: 'month',
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
    periodLabel: 'quarter',
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
    periodLabel: 'year',
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

const FAQS = [
  {
    q: 'What happens to my existing content if I cancel?',
    a: "Your uploaded content remains available, but you won't be able to upload new content or earn from premium features.",
  },
  {
    q: 'Can I switch plans?',
    a: 'Yes! You can upgrade or downgrade your plan anytime. Changes take effect in your next billing cycle.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all major payment methods including bank transfers, cards, and mobile wallets via Paystack.',
  },
  {
    q: 'Is there a free trial?',
    a: "Currently, we don't offer free trials, but you can cancel anytime if you change your mind.",
  },
  {
    q: 'How do I earn more with Premium?',
    a: 'Premium teachers can upload paid subject videos and teaching materials. You set your own prices, and we take a 15–25% commission depending on your subscription tier.',
  },
];

export default function PremiumSubscriptionPage(): ReactElement {
  const router = useRouter();
  const { user } = useUser();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error' | ''; text: string }>({ type: '', text: '' });
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const subscriptionQuery = useApiQuery<Subscription>(
    ['premium', 'subscription-status'],
    user?.role === 'teacher' ? '/premium/subscription/status' : null
  );
  const subscribeMutation = useApiMutation<unknown, { plan: string }>({
    method: 'post',
    url: '/premium/subscribe',
    data: (data) => data,
    invalidate: [['premium', 'subscription-status']],
  });

  useEffect(() => {
    if (!user) return;
    if (user.role !== 'teacher') {
      router.replace('/app/dashboard');
      return;
    }
  }, [user, router]);

  const subscribeToPlan = async (planName: string) => {
    setSelectedPlan(planName);
    setMessage({ type: '', text: '' });
    try {
      await subscribeMutation.mutateAsync({ plan: planName });
      setMessage({ type: 'success', text: `Successfully subscribed to ${planName} plan!` });

      setTimeout(() => router.push('/app/premium-content'), 1500);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.error || 'Subscription failed' });
    } finally {
      setSelectedPlan(null);
    }
  };

  const subscription = subscriptionQuery.data;
  const isSubscribed = subscription?.subscriptionActive;
  const currentPlan = subscription?.currentPlan;
  const daysRemaining = subscription?.daysRemaining;

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <PageHeader
        title="Premium"
        subtitle="Unlock exclusive features, monetize your content, and reach more students"
      />

      {/* Alert */}
      {message.text && (
        <div className={`p-4 rounded-xl text-sm font-medium border ${message.type === 'success'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
          : 'bg-red-50 text-red-700 border-red-100'
          }`}>
          {message.text}
        </div>
      )}

      {/* Current plan banner */}
      {isSubscribed && (
        <div className="bg-gradient-to-r from-[#001A72] to-[#002aad] rounded-2xl p-6 text-white flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-[#FFB81C] flex items-center justify-center">
              <Sparkles size={18} className="text-[#001A72]" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-widest text-white/50 mb-0.5">Active Plan</p>
              <p className="text-lg font-black capitalize">{currentPlan}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/50 font-medium">Days remaining</p>
            <p className="text-3xl font-black text-[#FFB81C]">{daysRemaining}</p>
          </div>
        </div>
      )}

      {/* Pricing cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan) => {
          const isCurrent = isSubscribed && currentPlan === plan.name;
          const isProcessing = subscribeMutation.isPending && selectedPlan === plan.name;
          return (
            <div
              key={plan.name}
              className={`relative bg-white rounded-2xl overflow-hidden flex flex-col transition-shadow hover:shadow-lg ${plan.popular
                ? 'border-2 border-[#FFB81C] shadow-md'
                : 'border border-gray-100 shadow-sm'
                } ${isCurrent ? 'ring-2 ring-emerald-400' : ''}`}
            >
              {plan.popular && (
                <div className="bg-[#FFB81C] text-[#001A72] text-[10px] font-black uppercase tracking-widest text-center py-2">
                  Most Popular
                </div>
              )}
              {isCurrent && (
                <div className="bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest text-center py-2">
                  Your Current Plan
                </div>
              )}

              <div className="p-6 flex flex-col flex-1">
                {/* Plan name & price */}
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">{plan.displayName}</p>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-3xl font-black text-[#001A72]">₦{plan.price.toLocaleString()}</span>
                  <span className="text-xs text-gray-400 font-medium pb-1">/ {plan.periodLabel}</span>
                </div>
                <p className="text-[10px] text-gray-400 mb-6">{plan.duration}</p>

                {/* CTA */}
                {isCurrent ? (
                  <button disabled className="w-full py-3 rounded-xl text-sm font-bold bg-gray-100 text-gray-400 cursor-not-allowed mb-6 flex items-center justify-center gap-2">
                    <CheckCircle2 size={15} /> Active
                  </button>
                ) : (
                  <button
                    onClick={() => subscribeToPlan(plan.name)}
                    disabled={!!subscribing}
                    className={`w-full py-3 rounded-xl text-sm font-bold mb-6 transition flex items-center justify-center gap-2 disabled:opacity-60 ${plan.popular
                      ? 'bg-[#FFB81C] text-[#001A72] hover:bg-[#FFB81C]/90'
                      : 'bg-[#001A72] text-white hover:bg-[#001A72]/90'
                      }`}
                  >
                    {isProcessing ? (
                      <><Loader2 size={14} className="animate-spin" /> Processing…</>
                    ) : (
                      <><Gem size={14} /> Subscribe Now</>
                    )}
                  </button>
                )}

                {/* Features */}
                <div className="space-y-2.5">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3">Includes</p>
                  {plan.features.map((feature, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0 mt-0.5" />
                      <span className="text-xs text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* FAQ */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-50">
          <h2 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-2">
            <ShieldCheck size={14} className="text-[#001A72]" /> Frequently Asked Questions
          </h2>
        </div>
        <div className="divide-y divide-gray-50">
          {FAQS.map((faq, i) => (
            <div key={i}>
              <button
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50/50 transition"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <span className="text-sm font-bold text-gray-800 pr-4">{faq.q}</span>
                {openFaq === i
                  ? <ChevronUp size={16} className="text-gray-400 shrink-0" />
                  : <ChevronDown size={16} className="text-gray-400 shrink-0" />
                }
              </button>
              {openFaq === i && (
                <div className="px-6 pb-4">
                  <p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-gray-400">
        Questions about our plans?{' '}
        <a href="/support/faq" className="text-[#001A72] font-bold hover:underline">
          Contact our support team
        </a>
      </p>
    </div>
  );
}
