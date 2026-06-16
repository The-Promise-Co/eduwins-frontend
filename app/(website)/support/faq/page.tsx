'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ChevronDown, 
  Search, 
  HelpCircle, 
  BookOpen, 
  Users, 
  ShieldCheck, 
  MessageCircle,
  Mail,
  ArrowRight,
  Sparkles
} from 'lucide-react';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
}

const FAQItem = ({ question, answer, isOpen, onClick }: FAQItemProps) => {
  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onClick}
        className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
      >
        <span className={`text-lg font-bold transition-colors ${isOpen ? 'text-[#001A72]' : 'text-gray-700 group-hover:text-[#001A72]'}`}>
          {question}
        </span>
        <div className={`p-2 rounded-full transition-all ${isOpen ? 'bg-[#001A72] text-white rotate-180' : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'}`}>
          <ChevronDown size={20} />
        </div>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 opacity-0'}`}
      >
        <p className="text-gray-600 leading-relaxed">
          {answer}
        </p>
      </div>
    </div>
  );
};

const FAQ_DATA = [
  {
    category: 'General',
    icon: HelpCircle,
    items: [
      {
        q: 'What is Eduwins?',
        a: "Eduwins is Nigeria's leading marketplace connecting students with verified, top-rated tutors for personalized learning. We provide a secure platform for discovering, booking, and conducting lessons across hundreds of subjects."
      },
      {
        q: 'Is Eduwins available across Nigeria?',
        a: 'Yes! Eduwins operates nationwide. You can find tutors for both online lessons (accessible from anywhere) and in-person lessons in major cities including Lagos, Abuja, Port Harcourt, and more.'
      },
      {
        q: 'How do I contact support?',
        a: 'Our support team is available to help you with any questions or issues. You can reach us via email at support@eduwins.com or through our contact page. We typically respond within 24 hours.'
      }
    ]
  },
  {
    category: 'For Students',
    icon: BookOpen,
    items: [
      {
        q: 'How do I find the right tutor?',
        a: "You can search for tutors by subject, level, and location. Each tutor profile includes their qualifications, experience, hourly rate, and reviews from other students. We recommend reading reviews and checking their 'Trust Score' to find your perfect match."
      },
      {
        q: 'How do I pay for lessons?',
        a: 'All payments are handled securely through our platform using Paystack. You can pay via debit/credit card, bank transfer, or USSD. Funds are held in escrow and only released to the tutor after the lesson is completed.'
      },
      {
        q: 'Are the tutors verified?',
        a: 'Absolutely. Every tutor on Eduwins goes through a multi-step verification process, which includes identity verification, credential checks (degrees/certifications), and sometimes a teaching trial.'
      },
      {
        q: 'Can I get a refund if I\'m not satisfied?',
        a: 'Yes. We have a Satisfaction Guarantee. If a scheduled lesson doesn\'t take place or if there is a significant issue with the quality, you can report it to support for a full refund or a credit towards another tutor.'
      }
    ]
  },
  {
    category: 'For Tutors',
    icon: Users,
    items: [
      {
        q: 'How do I become a tutor on Eduwins?',
        a: 'Click on "Become a Tutor", create an account, and complete your professional profile. You\'ll need to provide your qualifications, subjects you teach, and identification. Once our team reviews and approves your profile, you\'ll start appearing in search results.'
      },
      {
        q: 'How much can I earn?',
        a: 'As a tutor, you set your own hourly rates. Your earnings depend on your subjects, expertise, and the number of hours you teach. Many of our dedicated tutors earn between ₦50,000 to ₦150,000+ monthly.'
      },
      {
        q: 'When do I get paid?',
        a: 'Earnings from completed lessons are credited to your Eduwins wallet. Once the student confirms the lesson, the funds are released. You can withdraw your balance to any Nigerian bank account at any time.'
      },
      {
        q: 'What are the platform fees?',
        a: 'Eduwins takes a flat 20% commission on every lesson. This fee covers platform maintenance, marketing to bring you more students, secure payment processing, and dedicated support for both you and your students.'
      }
    ]
  },
  {
    category: 'Premium Features',
    icon: Sparkles,
    items: [
      {
        q: 'How do I earn more with Premium?',
        a: 'Premium tutors can upload paid subject videos and teaching materials. You set your own prices, and earnings are higher for premium tiers.'
      },
      {
        q: 'What happens to my content if I cancel my subscription?',
        a: "Your uploaded content remains available for sale, but you won't be able to upload new premium materials or access advanced analytics until you renew."
      },
      {
        q: 'Can I switch between plans?',
        a: 'Yes! You can upgrade or downgrade your subscription plan at any time. Changes will typically take effect at the start of your next billing cycle.'
      },
      {
        q: 'Is there a free trial for Premium?',
        a: "We don't currently offer a free trial, but our platform remains free for basic tutoring. You can upgrade to Premium whenever you're ready to scale your teaching business."
      }
    ]
  }
];

export default function FAQPage() {
  const [openItems, setOpenItems] = useState<Record<string, number | null>>({
    'General': 0,
    'For Students': null,
    'For Tutors': null,
    'Premium Features': null
  });
  const [searchQuery, setSearchQuery] = useState('');

  const toggleItem = (category: string, index: number) => {
    setOpenItems(prev => ({
      ...prev,
      [category]: prev[category] === index ? null : index
    }));
  };

  const filteredFaqs = FAQ_DATA.map(cat => ({
    ...cat,
    items: cat.items.filter(item => 
      item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      item.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  return (
    <div className="min-h-screen bg-white">
      {/* ── HERO SECTION ── */}
      <section className="relative pt-24 pb-20 overflow-hidden bg-[#001A72]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#FFB81C]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFB81C]/15 border border-[#FFB81C]/30 text-[#FFB81C] text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Sparkles size={14} /> Help Center
          </div>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-6">
            How can we <span className="text-[#FFB81C]">help you?</span>
          </h1>
          <p className="text-white/70 text-lg max-w-2xl mx-auto mb-10">
            Search our frequently asked questions or browse by category to find the answers you need.
          </p>

          <div className="max-w-xl mx-auto relative group">
            <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
              <Search size={20} className="text-gray-400 group-focus-within:text-[#001A72] transition-colors" />
            </div>
            <input
              type="text"
              placeholder="Search for questions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-gray-900 rounded-2xl py-4 pl-14 pr-6 shadow-xl focus:outline-none focus:ring-2 focus:ring-[#FFB81C] transition-all"
            />
          </div>
        </div>
      </section>

      {/* ── FAQ CONTENT ── */}
      <section className="py-20 px-4 max-w-4xl mx-auto">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map((category) => (
            <div key={category.category} className="mb-16 last:mb-0">
              <div className="flex items-center gap-3 mb-8 pb-4 border-b-2 border-[#001A72]/10">
                <div className="p-2.5 bg-[#001A72]/5 rounded-xl text-[#001A72]">
                  <category.icon size={24} />
                </div>
                <h2 className="text-2xl font-black text-[#001A72]">{category.category}</h2>
              </div>
              
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-6 md:px-8">
                {category.items.map((item, idx) => (
                  <FAQItem
                    key={idx}
                    question={item.q}
                    answer={item.a}
                    isOpen={openItems[category.category] === idx}
                    onClick={() => toggleItem(category.category, idx)}
                  />
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search size={32} className="text-gray-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-500">We couldn't find any questions matching "{searchQuery}".</p>
            <button 
              onClick={() => setSearchQuery('')}
              className="mt-6 text-[#001A72] font-bold hover:underline"
            >
              Clear search
            </button>
          </div>
        )}
      </section>

      {/* ── CONTACT SECTION ── */}
      <section className="pb-24 px-4 max-w-5xl mx-auto">
        <div className="bg-gray-50 rounded-[2.5rem] p-8 md:p-14 relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-3xl font-black text-[#001A72] mb-4">Still have questions?</h2>
              <p className="text-gray-600 text-lg mb-8">
                Can't find what you're looking for? Our friendly team is here to help you every step of the way.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <a 
                  href="mailto:support@eduwins.com"
                  className="inline-flex items-center gap-2 bg-[#001A72] text-white font-bold px-6 py-3.5 rounded-2xl hover:bg-[#001A72]/90 transition shadow-lg shadow-[#001A72]/20"
                >
                  <Mail size={18} /> Email Support
                </a>
                <Link 
                  href="/register"
                  className="inline-flex items-center gap-2 bg-white text-[#001A72] border border-gray-200 font-bold px-6 py-3.5 rounded-2xl hover:bg-gray-50 transition"
                >
                  Join Community <ArrowRight size={18} />
                </Link>
              </div>
            </div>
            <div className="hidden lg:block relative">
              <div className="w-48 h-48 bg-[#FFB81C]/20 rounded-full absolute -inset-4 blur-2xl animate-pulse" />
              <div className="w-40 h-40 bg-[#001A72] rounded-3xl flex items-center justify-center relative shadow-2xl">
                <MessageCircle size={64} className="text-[#FFB81C]" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
