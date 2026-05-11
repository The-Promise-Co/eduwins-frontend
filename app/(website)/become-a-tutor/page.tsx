import { ReactElement } from 'react';
import Link from 'next/link';
import {
  Banknote,
  CalendarCheck,
  Globe,
  ShieldCheck,
  TrendingUp,
  Users,
  BookOpen,
  Star,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Clock,
  Award,
  BarChart3,
} from 'lucide-react';

export const metadata = {
  title: 'Become a Tutor | EduWins',
  description:
    'Join thousands of Nigerian tutors earning on their own schedule. Share your knowledge, build your brand, and earn more with EduWins.',
};

/* ── data ──────────────────────────────────────────── */

const REASONS = [
  {
    icon: Banknote,
    title: 'Earn What You Deserve',
    desc: 'Set your own hourly rate. Tutors keep 80% of every lesson. No hidden cuts, no surprise deductions — full transparency.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: CalendarCheck,
    title: 'Work on Your Terms',
    desc: "You control your schedule. Teach in the mornings, evenings, or weekends. Full-time or part-time — it's entirely up to you.",
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    icon: Globe,
    title: 'Reach Students Nationwide',
    desc: 'Your profile is visible to thousands of parents and students across Nigeria looking for exactly your subject and expertise.',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    icon: ShieldCheck,
    title: 'Secure & Guaranteed Payment',
    desc: 'Lesson fees are held in escrow and released to you on completion. You never chase payments — EduWins handles it all.',
    color: 'text-[#001A72]',
    bg: 'bg-[#001A72]/5',
  },
  {
    icon: TrendingUp,
    title: 'Grow Your Reputation',
    desc: 'Students leave verified reviews after every session. A strong rating unlocks higher visibility, more bookings, and premium features.',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: Award,
    title: 'Premium Earning Tools',
    desc: 'Upload paid video lessons, publish teaching materials, and earn passive income while you sleep — exclusively for Premium tutors.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
];

const STEPS = [
  { num: '01', title: 'Create Your Account', desc: 'Sign up free and choose the Tutor role during registration.' },
  { num: '02', title: 'Build Your Profile', desc: 'Add your subjects, rates, bio, and upload your credentials for verification.' },
  { num: '03', title: 'Get Discovered', desc: 'Your profile goes live immediately — parents and students can find and book you.' },
  { num: '04', title: 'Teach & Earn', desc: 'Conduct your sessions and receive payments directly to your wallet.' },
];

const STATS = [
  { value: '5,000+', label: 'Active Tutors' },
  { value: '₦80k', label: 'Avg monthly earnings' },
  { value: '40+', label: 'Subjects covered' },
  { value: '4.8★', label: 'Average tutor rating' },
];

const TESTIMONIALS = [
  {
    name: 'Emeka Obi',
    subject: 'Mathematics Tutor · Lagos',
    quote: 'Within my first month I had 12 regular students. EduWins handles everything — bookings, payments, reviews. I just teach.',
    initials: 'EO',
    color: 'from-blue-600 to-blue-800',
  },
  {
    name: 'Ngozi Eze',
    subject: 'English & IELTS Tutor · Abuja',
    quote: "I left my 9-to-5 to tutor full-time. I now earn 3× what I used to and I'm home for my kids every afternoon.",
    initials: 'NE',
    color: 'from-purple-600 to-purple-800',
  },
  {
    name: 'Tunde Adewale',
    subject: 'Physics & Chemistry Tutor · Ibadan',
    quote: "The premium video upload feature changed my life. Students buy my recorded lessons even when I'm not online.",
    initials: 'TA',
    color: 'from-emerald-600 to-emerald-800',
  },
];

const FAQS = [
  {
    q: 'Is it free to join as a tutor?',
    a: 'Yes — creating an account and listing your profile is completely free. We only earn when you earn: a transparent 20% platform fee per lesson.',
  },
  {
    q: 'How and when do I get paid?',
    a: 'Earnings are credited to your EduWins wallet after each completed session and can be withdrawn to your bank account at any time.',
  },
  {
    q: 'What subjects can I teach?',
    a: 'Any academic subject from primary to university level, professional certifications, languages, music, and more.',
  },
  {
    q: 'Do I need a teaching qualification?',
    a: "Not necessarily. We welcome subject-matter experts of all kinds. Credentials boost your profile's trust score but are not mandatory to start.",
  },
  {
    q: 'Can I teach both online and in-person?',
    a: "Absolutely. Set your preference per subject — online, in-person at the student's location, or both.",
  },
];

/* ── page ──────────────────────────────────────────── */

export default function BecomeATutorPage(): ReactElement {
  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#001A72] pt-24 pb-32 px-4 sm:px-6 lg:px-8">
        {/* bg blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#FFB81C]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFB81C]/15 border border-[#FFB81C]/30 text-[#FFB81C] text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Sparkles size={14} /> For Educators & Subject Experts
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] mb-6">
            Share Your Knowledge.<br />
            <span className="text-[#FFB81C]">Earn on Your Terms.</span>
          </h1>

          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Join over 5,000 tutors across Nigeria who are building sustainable income, growing their personal brand, and changing students' lives — on EduWins.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register?role=tutor"
              className="inline-flex items-center justify-center gap-2 bg-[#FFB81C] text-[#001A72] font-black text-base px-8 py-4 rounded-2xl hover:bg-[#FFB81C]/90 transition shadow-xl shadow-[#FFB81C]/20 hover:-translate-y-0.5"
            >
              Start Teaching Today <ArrowRight size={18} />
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/15 transition"
            >
              <BookOpen size={16} /> See How It Works
            </Link>
          </div>
        </div>

        {/* wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60 L0 30 Q360 0 720 30 Q1080 60 1440 30 L1440 60 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-3xl md:text-4xl font-black text-[#001A72]">{value}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── WHY REASONS ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-2">Why EduWins</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#001A72]">Everything You Need to Thrive</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm">
              We built the tools that let great teachers focus on what they love — teaching.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {REASONS.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition group">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon size={22} className={color} />
                </div>
                <h3 className="font-black text-[#001A72] mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-2">Simple Steps</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#001A72]">Start in 4 Easy Steps</h2>
          </div>

          <div className="relative">
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-[#001A72]/10 via-[#FFB81C]/40 to-[#001A72]/10" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {STEPS.map(({ num, title, desc }, i) => (
                <div key={num} className="flex flex-col items-center text-center group">
                  <div className={`${i % 2 === 0 ? 'bg-[#001A72]' : 'bg-[#FFB81C]'} text-white w-[4.5rem] h-[4.5rem] rounded-2xl flex items-center justify-center text-xl font-black mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                    {num}
                  </div>
                  <h3 className="font-bold text-[#001A72] text-base mb-2">{title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-2">Tutor Stories</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#001A72]">Hear From Our Tutors</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ name, subject, quote, initials, color }) => (
              <div key={name} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-black text-sm shrink-0`}>
                    {initials}
                  </div>
                  <div>
                    <p className="text-sm font-black text-gray-900">{name}</p>
                    <p className="text-[10px] text-gray-400 font-medium">{subject}</p>
                  </div>
                </div>
                <div className="flex gap-0.5 mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={12} className="text-[#FFB81C] fill-[#FFB81C]" />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed flex-1">"{quote}"</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-2">FAQ</p>
            <h2 className="text-3xl font-black text-[#001A72]">Common Questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="bg-gray-50 rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start gap-3">
                  <CheckCircle2 size={16} className="text-[#FFB81C] mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-black text-[#001A72] mb-1">{q}</p>
                    <p className="text-sm text-gray-500 leading-relaxed">{a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#001A72] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#FFB81C]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Start Earning?
          </h2>
          <p className="text-white/60 text-base mb-10 leading-relaxed">
            Join thousands of tutors already building their future on EduWins. It's free to get started.
          </p>
          <Link
            href="/register?role=tutor"
            className="inline-flex items-center gap-2 bg-[#FFB81C] text-[#001A72] font-black text-base px-10 py-4 rounded-2xl hover:bg-[#FFB81C]/90 transition shadow-2xl shadow-[#FFB81C]/20 hover:-translate-y-0.5"
          >
            Create Your Free Tutor Account <ArrowRight size={18} />
          </Link>
          <p className="text-white/30 text-xs mt-6">No credit card required · Takes less than 2 minutes</p>
        </div>
      </section>

    </div>
  );
}
