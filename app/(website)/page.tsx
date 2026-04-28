'use client';

import { useState, useEffect, ReactElement } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Star,
  Banknote,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Users,
  TrendingUp,
  Play,
  Sparkles,
  MapPin,
  ChevronLeft,
  ChevronRight,
  LucideIcon,
} from 'lucide-react';

const SUBJECTS = [
  { label: 'Mathematics', icon: '📐' },
  { label: 'English', icon: '📖' },
  { label: 'Physics', icon: '⚛️' },
  { label: 'Chemistry', icon: '🧪' },
  { label: 'Biology', icon: '🧬' },
  { label: 'French', icon: '🇫🇷' },
  { label: 'IELTS', icon: '🌍' },
  { label: 'Music', icon: '🎵' },
];

const TUTORS = [
  { name: 'Mr. Okonkwo', subject: 'Mathematics', rating: '4.8', reviews: 45, rate: '₦500/hr', location: 'Lagos Island', initials: 'OK', color: 'from-blue-600 to-blue-800' },
  { name: 'Mrs. Adeyemi', subject: 'English Language', rating: '4.9', reviews: 32, rate: '₦400/hr', location: 'Lekki', initials: 'AD', color: 'from-purple-600 to-purple-800' },
  { name: 'Dr. Chukwu', subject: 'Physics & Chemistry', rating: '4.7', reviews: 28, rate: '₦800/hr', location: 'Victoria Island', initials: 'DC', color: 'from-emerald-600 to-emerald-800' },
  { name: 'Miss Inyene', subject: 'Biology & Health', rating: '4.8', reviews: 38, rate: '₦550/hr', location: 'Ikeja', initials: 'IN', color: 'from-rose-500 to-rose-700' },
  { name: 'Mr. Afolabi', subject: 'History & Civics', rating: '4.9', reviews: 52, rate: '₦450/hr', location: 'Ikoyi', initials: 'AF', color: 'from-amber-500 to-amber-700' },
];

const TESTIMONIALS = [
  { name: 'Adaeze Nwosu', role: 'WAEC Student', quote: 'EduWins helped me go from a D to a B in Mathematics in just 6 weeks. My tutor was patient and explained everything clearly.', rating: 5 },
  { name: 'Chidi Okafor', role: 'JAMB Candidate', quote: "I found an amazing Physics tutor within minutes. The booking process was seamless and I passed my JAMB with 310!", rating: 5 },
  { name: 'Fatima Bello', role: 'IELTS Candidate', quote: "Scored 7.5 on my IELTS with my tutor's guidance. The platform made everything so easy to manage and track my progress.", rating: 5 },
];

export default function HomePage(): ReactElement {
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const t = setInterval(() => setTestimonialIdx(i => (i + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <section className="relative overflow-hidden bg-[#001A72]">
        {/* background decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#FFB81C]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/[0.02] rounded-full" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-28">
          <div className="max-w-3xl mx-auto text-center">
            {/* pill badge */}
            <div className="inline-flex items-center gap-2 bg-[#FFB81C]/15 border border-[#FFB81C]/30 text-[#FFB81C] text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
              <Sparkles size={14} />
              Nigeria's #1 Tutor Marketplace
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] mb-6">
              Learn from the{' '}
              <span className="text-[#FFB81C] relative">
                Best Tutors
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                  <path d="M0 6 Q100 0 200 6" stroke="#FFB81C" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5"/>
                </svg>
              </span>{' '}
              in Nigeria
            </h1>

            <p className="text-white/70 text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
              Connect with verified, top-rated tutors for WAEC, JAMB, IELTS and more. Flexible scheduling, secure payments, real results.
            </p>

            {/* search bar */}
            <div className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
              <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-lg">
                <BookOpen size={18} className="text-[#001A72] shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="What do you want to learn?"
                  className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none"
                  onKeyDown={e => {
                    if (e.key === 'Enter' && searchQuery.trim()) {
                      window.location.href = `/search?subject=${encodeURIComponent(searchQuery)}`;
                    }
                  }}
                />
              </div>
              <Link
                href={searchQuery.trim() ? `/search?subject=${encodeURIComponent(searchQuery)}` : '/search'}
                className="bg-[#FFB81C] text-[#001A72] font-bold px-6 py-3.5 rounded-2xl hover:bg-[#ffd06f] transition flex items-center justify-center gap-2 shadow-lg whitespace-nowrap"
              >
                Find a Tutor <ArrowRight size={16} />
              </Link>
            </div>

            {/* trust chips */}
            <div className="flex flex-wrap items-center justify-center gap-4 mt-8 text-sm text-white/60">
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#FFB81C]" /> 250+ Verified Tutors</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#FFB81C]" /> Secure Payments</span>
              <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-[#FFB81C]" /> Free to Sign Up</span>
            </div>
          </div>
        </div>

        {/* wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60 L0 30 Q360 0 720 30 Q1080 60 1440 30 L1440 60 Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ── STATS STRIP ── */}
      <section className="py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { value: '250+', label: 'Active Tutors', icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
            { value: '500+', label: 'Happy Students', icon: Star, color: 'text-amber-500', bg: 'bg-amber-50' },
            { value: '₦15M+', label: 'Paid to Tutors', icon: Banknote, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { value: '4.8★', label: 'Average Rating', icon: TrendingUp, color: 'text-[#001A72]', bg: 'bg-[#001A72]/5' },
          ].map(({ value, label, icon: Icon, color, bg }) => (
            <div key={label} className="flex items-center gap-4 bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-4">
              <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center shrink-0`}>
                <Icon size={20} className={color} />
              </div>
              <div>
                <p className={`text-2xl font-black ${color}`}>{value}</p>
                <p className="text-xs text-gray-500 font-medium">{label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── BROWSE BY SUBJECT ── */}
      <section className="py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-1">Explore</p>
            <h2 className="text-2xl md:text-3xl font-black text-[#001A72]">Browse by Subject</h2>
          </div>
          <Link href="/search" className="text-sm font-semibold text-[#001A72] hover:text-[#FFB81C] transition flex items-center gap-1">
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {SUBJECTS.map(({ label, icon }) => (
            <Link
              key={label}
              href={`/search?subject=${encodeURIComponent(label)}`}
              className="group flex flex-col items-center gap-2 bg-white border border-gray-100 rounded-2xl p-4 hover:border-[#001A72] hover:shadow-md transition cursor-pointer text-center"
            >
              <span className="text-2xl group-hover:scale-110 transition-transform">{icon}</span>
              <span className="text-xs font-bold text-gray-700 group-hover:text-[#001A72] transition">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED TUTORS ── */}
      <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-1">Top Rated</p>
            <h2 className="text-2xl md:text-3xl font-black text-[#001A72]">Featured Tutors</h2>
          </div>
          <Link href="/search" className="text-sm font-semibold text-[#001A72] hover:text-[#FFB81C] transition flex items-center gap-1">
            See All Tutors <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {TUTORS.map((tutor) => (
            <TutorCard key={tutor.name} {...tutor} />
          ))}
        </div>
      </section>

      {/* ── WHY EDUWINS ── */}
      <section className="py-16 bg-[#001A72] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#FFB81C]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-2">Why Us</p>
            <h2 className="text-2xl md:text-3xl font-black text-white">Why Choose EduWins?</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: ShieldCheck, title: 'Secure & Safe', desc: 'OTP verification & filtered chat keep every interaction safe and trusted.', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
              { icon: Star, title: 'Trusted Tutors', desc: 'Dynamic trust scores based on real student reviews and lesson history.', color: 'text-[#FFB81C]', bg: 'bg-[#FFB81C]/10' },
              { icon: Banknote, title: 'Fair Payments', desc: 'Secure escrow — tutors keep 80%, fully transparent with no hidden fees.', color: 'text-blue-400', bg: 'bg-blue-400/10' },
              { icon: Smartphone, title: 'Works Offline', desc: 'Progressive web app — install on any device and access from anywhere.', color: 'text-purple-400', bg: 'bg-purple-400/10' },
            ].map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={22} className={color} />
                </div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-sm text-white/60 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-2">Simple Steps</p>
          <h2 className="text-2xl md:text-3xl font-black text-[#001A72]">How It Works</h2>
          <p className="text-gray-500 mt-2 max-w-lg mx-auto text-sm">Getting started with EduWins takes less than 2 minutes.</p>
        </div>
        <div className="relative">
          {/* connector line */}
          <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-0.5 bg-gradient-to-r from-[#001A72]/10 via-[#FFB81C]/40 to-[#001A72]/10" />
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: '01', title: 'Sign Up', desc: 'Create your free account with email verification in under a minute.', col: 'text-[#001A72]', bg: 'bg-[#001A72]' },
              { num: '02', title: 'Find a Tutor', desc: 'Search by subject, location or rate. Read reviews and pick your match.', col: 'text-[#FFB81C]', bg: 'bg-[#FFB81C]' },
              { num: '03', title: 'Book & Pay', desc: 'Schedule a lesson and pay securely. Funds held in escrow until complete.', col: 'text-[#001A72]', bg: 'bg-[#001A72]' },
              { num: '04', title: 'Learn & Grow', desc: 'Attend your lessons, leave reviews, and track your progress over time.', col: 'text-[#FFB81C]', bg: 'bg-[#FFB81C]' },
            ].map(({ num, title, desc, bg }) => (
              <div key={num} className="flex flex-col items-center text-center group">
                <div className={`${bg} text-white w-[4.5rem] h-[4.5rem] rounded-2xl flex items-center justify-center text-xl font-black mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  {num}
                </div>
                <h3 className="font-bold text-[#001A72] text-lg mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="py-16 bg-gray-50 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-2">Testimonials</p>
          <h2 className="text-2xl md:text-3xl font-black text-[#001A72] mb-10">What Students Are Saying</h2>

          {/* testimonial card */}
          <div className="relative bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-10 min-h-[200px]">
            {TESTIMONIALS.map((t, i) => (
              <div
                key={i}
                className={`transition-all duration-500 ${i === testimonialIdx ? 'opacity-100 translate-y-0' : 'opacity-0 absolute inset-0 translate-y-2 pointer-events-none'}`}
              >
                <div className="flex justify-center gap-1 mb-5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={18} className="fill-[#FFB81C] text-[#FFB81C]" />
                  ))}
                </div>
                <p className="text-gray-700 text-base md:text-lg leading-relaxed italic mb-6">"{t.quote}"</p>
                <div className="flex items-center justify-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#001A72] flex items-center justify-center text-white text-sm font-black">
                    {t.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-[#001A72] text-sm">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* dots */}
          <div className="flex justify-center gap-2 mt-6">
            {TESTIMONIALS.map((_, i) => (
              <button
                key={i}
                onClick={() => setTestimonialIdx(i)}
                className={`h-2 rounded-full transition-all ${i === testimonialIdx ? 'bg-[#001A72] w-6' : 'bg-gray-300 w-2'}`}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="bg-gradient-to-r from-[#001A72] via-[#0028a8] to-[#001A72] rounded-3xl p-10 md:p-14 text-center relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FFB81C]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          </div>
          <div className="relative">
            <div className="inline-flex items-center gap-2 bg-[#FFB81C]/15 border border-[#FFB81C]/30 text-[#FFB81C] text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
              <Sparkles size={14} />
              Start Learning Today — It's Free!
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-4">Ready to Achieve Your Goals?</h2>
            <p className="text-white/70 text-base md:text-lg mb-8 max-w-xl mx-auto">
              Join thousands of students and tutors already using EduWins to transform learning outcomes across Nigeria.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register"
                className="bg-[#FFB81C] text-[#001A72] font-black px-8 py-4 rounded-2xl hover:bg-[#ffd06f] transition shadow-lg flex items-center justify-center gap-2"
              >
                Get Started Free <ArrowRight size={18} />
              </Link>
              <Link
                href="/search"
                className="bg-white/10 border border-white/20 text-white font-bold px-8 py-4 rounded-2xl hover:bg-white/20 transition flex items-center justify-center gap-2"
              >
                <Play size={16} /> Browse Tutors
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}

/* ── Tutor Card ── */
interface TutorCardProps {
  name: string;
  subject: string;
  rating: string;
  reviews: number;
  rate: string;
  location: string;
  initials: string;
  color: string;
}

function TutorCard({ name, subject, rating, reviews, rate, location, initials, color }: TutorCardProps): ReactElement {
  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#001A72]/20 transition overflow-hidden flex flex-col">
      {/* avatar header */}
      <div className={`bg-gradient-to-br ${color} p-6 flex flex-col items-center`}>
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-black mb-3 group-hover:scale-105 transition-transform">
          {initials}
        </div>
        <p className="font-bold text-white text-sm text-center">{name}</p>
        <p className="text-white/80 text-xs text-center mt-0.5">{subject}</p>
      </div>

      {/* body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Star size={13} className="fill-[#FFB81C] text-[#FFB81C]" />
            <span className="font-black text-sm text-[#001A72]">{rating}</span>
          </div>
          <span className="text-xs text-gray-400">{reviews} reviews</span>
        </div>

        <div className="space-y-1.5 mb-4 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Banknote size={12} className="text-gray-400" /> {rate}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <MapPin size={12} className="text-gray-400" /> {location}
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
          <span className="text-[10px] font-bold text-emerald-700">Verified</span>
        </div>

        <Link
          href="/search"
          className="mt-3 block w-full bg-[#001A72] text-white text-xs font-bold py-2.5 rounded-xl text-center hover:bg-[#001A72]/90 transition"
        >
          View & Book
        </Link>
      </div>
    </div>
  );
}
