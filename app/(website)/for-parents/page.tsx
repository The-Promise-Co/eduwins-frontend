import { ReactElement } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BarChart3,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  GraduationCap,
  ShieldCheck,
  Sparkles,
  Star,
  UserPlus,
  Users,
} from 'lucide-react';
import { COMPANY_NAME } from '@/misc/constants';

export const metadata = {
  title: `For Parents | ${COMPANY_NAME}`,
  description:
    "Manage your child's learning journey with course purchases, tutor bookings, child profiles, and performance tracking.",
};

const BENEFITS = [
  {
    icon: BookOpen,
    title: 'Buy Courses with Confidence',
    desc: 'Browse tutor-created courses by subject and level, purchase the right fit, and keep learning resources organized in one place.',
    color: 'text-blue-500',
    bg: 'bg-blue-50',
  },
  {
    icon: CalendarCheck,
    title: 'Book Verified Tutors',
    desc: 'Find tutors for WAEC, JAMB, IELTS, languages, music, and school support. Choose lesson times that work for your family.',
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  },
  {
    icon: Users,
    title: 'Register Every Child',
    desc: 'Create separate child profiles, match each child to the right learning support, and manage their progress without confusion.',
    color: 'text-purple-500',
    bg: 'bg-purple-50',
  },
  {
    icon: BarChart3,
    title: 'Track Performance',
    desc: 'Follow lesson activity, course progress, strengths, weak areas, and learning momentum from your parent dashboard.',
    color: 'text-amber-500',
    bg: 'bg-amber-50',
  },
  {
    icon: ShieldCheck,
    title: 'Secure Learning Space',
    desc: 'Verified accounts, structured booking flows, and clear records help parents stay in control of every learning decision.',
    color: 'text-[#001A72]',
    bg: 'bg-[#001A72]/5',
  },
  {
    icon: CreditCard,
    title: 'Simple Payments',
    desc: 'Pay for courses and lessons through a straightforward flow, then keep purchase and booking history easy to review.',
    color: 'text-rose-500',
    bg: 'bg-rose-50',
  },
];

const FEATURE_BLOCKS = [
  {
    eyebrow: 'Course Purchases',
    title: 'Choose structured lessons your child can revisit anytime.',
    desc: 'Parents can browse courses created by experienced tutors, compare learning levels, and purchase content that supports school topics, exam prep, and skill building.',
    icon: BookOpen,
    points: ['Subject and level filtering', 'Tutor-created course content', 'Useful for revision and holiday learning'],
    href: '/courses',
    cta: 'Browse Courses',
  },
  {
    eyebrow: 'Tutor Bookings',
    title: 'Get one-on-one help when your child needs attention.',
    desc: 'Search for tutors by subject, location, rate, and rating. Book sessions around school schedules and use verified reviews to make better choices.',
    icon: CalendarCheck,
    points: ['Online and in-person options', 'Tutor ratings and profiles', 'Flexible lesson scheduling'],
    href: '/search',
    cta: 'Find a Tutor',
  },
  {
    eyebrow: 'Children & Performance',
    title: 'Manage each child as an individual learner.',
    desc: 'Create profiles for every child, connect learning activity to the right student, and monitor performance signals that show what is improving and what needs support.',
    icon: ClipboardCheck,
    points: ['Separate child profiles', 'Progress and activity tracking', 'Clearer parent oversight'],
    href: '/app/children',
    cta: 'Manage Children',
  },
];

const STEPS = [
  { num: '01', title: 'Create Your Parent Account', desc: 'Sign up free and set up your parent dashboard in minutes.' },
  { num: '02', title: 'Register Your Children', desc: 'Add each child with the right school level, subjects, and learning needs.' },
  { num: '03', title: 'Buy Courses or Book Tutors', desc: "Pick structured courses, live lessons, or both depending on your child's goals." },
  { num: '04', title: 'Monitor Growth', desc: "Use progress updates and activity records to stay close to each child's learning journey." },
];

const STATS = [
  { value: '500+', label: 'Happy Students' },
  { value: '250+', label: 'Verified Tutors' },
  { value: '40+', label: 'Subjects Covered' },
  { value: '4.8★', label: 'Average Rating' },
];

const TESTIMONIALS = [
  {
    name: 'Amaka Okorie',
    subject: 'Parent of a JSS 3 student',
    quote: 'I can book lessons, buy revision courses, and see what my daughter is working on without juggling different platforms.',
    initials: 'AO',
    color: 'from-blue-600 to-blue-800',
  },
  {
    name: 'Seyi Balogun',
    subject: 'Parent of two primary pupils',
    quote: "The child profiles make it easy to separate my sons' lessons and progress. Their tutors know exactly what each child needs.",
    initials: 'SB',
    color: 'from-emerald-600 to-emerald-800',
  },
  {
    name: 'Fatima Hassan',
    subject: 'WAEC parent',
    quote: 'We combined a Mathematics course with weekend tutoring. It gave my son structure during the week and personal help on Saturdays.',
    initials: 'FH',
    color: 'from-purple-600 to-purple-800',
  },
];

const FAQS = [
  {
    q: 'Can I register more than one child?',
    a: 'Yes. You can create separate profiles for each child, making it easier to manage lessons, courses, and progress individually.',
  },
  {
    q: 'Can my child use both courses and tutor bookings?',
    a: 'Absolutely. Courses are useful for structured self-paced learning, while tutor bookings provide live support for questions and difficult topics.',
  },
  {
    q: 'How do I know which tutor to choose?',
    a: 'You can review tutor subjects, rates, locations, ratings, and profiles before booking. This helps you match each child with the right support.',
  },
  {
    q: 'What can I track as a parent?',
    a: 'You can keep an eye on child profiles, learning activity, purchased courses, bookings, and performance-related updates from your dashboard.',
  },
];

export default function ForParentsPage(): ReactElement {
  return (
    <div className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-[#001A72] pt-24 pb-32 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#FFB81C]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-[#FFB81C]/15 border border-[#FFB81C]/30 text-[#FFB81C] text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            <Sparkles size={14} /> For Parents & Guardians
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white leading-[1.1] mb-6">
            Manage Your Child's<br />
            <span className="text-[#FFB81C]">Learning Journey.</span>
          </h1>

          <p className="text-white/70 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Use {COMPANY_NAME} to buy courses, book trusted tutors, register your children, and track performance from one parent-friendly dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register?role=parent"
              className="inline-flex items-center justify-center gap-2 bg-[#FFB81C] text-[#001A72] font-black text-base px-8 py-4 rounded-2xl hover:bg-[#FFB81C]/90 transition shadow-xl shadow-[#FFB81C]/20 hover:-translate-y-0.5"
            >
              Start as a Parent <ArrowRight size={18} />
            </Link>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-bold text-base px-8 py-4 rounded-2xl hover:bg-white/15 transition"
            >
              <GraduationCap size={16} /> Explore Tutors
            </Link>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60 L0 30 Q360 0 720 30 Q1080 60 1440 30 L1440 60 Z" fill="white" />
          </svg>
        </div>
      </section>

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

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-2">Why Parents Choose {COMPANY_NAME}</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#001A72]">Everything Your Child Needs to Learn Better</h2>
            <p className="text-gray-500 mt-3 max-w-xl mx-auto text-sm">
              Keep courses, tutors, child profiles, and learning progress connected in one simple parent experience.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {BENEFITS.map(({ icon: Icon, title, desc, color, bg }) => (
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

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-2">Parent Toolkit</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#001A72]">Built Around Real Family Workflows</h2>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {FEATURE_BLOCKS.map(({ eyebrow, title, desc, icon: Icon, points, href, cta }) => (
              <div key={title} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col">
                <div className="w-12 h-12 bg-[#001A72]/5 rounded-xl flex items-center justify-center mb-5">
                  <Icon size={22} className="text-[#001A72]" />
                </div>
                <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-2">{eyebrow}</p>
                <h3 className="text-xl font-black text-[#001A72] leading-tight mb-3">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed mb-5">{desc}</p>
                <div className="space-y-3 mb-6">
                  {points.map((point) => (
                    <div key={point} className="flex items-start gap-2">
                      <CheckCircle2 size={15} className="text-[#FFB81C] mt-0.5 shrink-0" />
                      <span className="text-sm font-semibold text-gray-600">{point}</span>
                    </div>
                  ))}
                </div>
                <Link href={href} className="inline-flex items-center gap-2 text-sm font-black text-[#001A72] hover:text-[#FFB81C] transition mt-auto">
                  {cta} <ArrowRight size={15} />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-2">Simple Steps</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#001A72]">Start Supporting Your Child in 4 Steps</h2>
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

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-2">Parent Stories</p>
            <h2 className="text-3xl md:text-4xl font-black text-[#001A72]">Learning Support Families Can Actually Manage</h2>
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

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-2">FAQ</p>
            <h2 className="text-3xl font-black text-[#001A72]">Common Questions</h2>
          </div>
          <div className="space-y-4">
            {FAQS.map(({ q, a }) => (
              <div key={q} className="bg-white rounded-2xl border border-gray-100 p-6">
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

      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-[#001A72] relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] bg-[#FFB81C]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-24 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#FFB81C]/15 text-[#FFB81C] mb-6">
            <UserPlus size={24} />
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
            Ready to Organize Your Child's Learning?
          </h2>
          <p className="text-white/60 text-base mb-10 leading-relaxed">
            Create a parent account, register your children, and start choosing the tutors and courses that help them grow.
          </p>
          <Link
            href="/register?role=parent"
            className="inline-flex items-center gap-2 bg-[#FFB81C] text-[#001A72] font-black text-base px-10 py-4 rounded-2xl hover:bg-[#FFB81C]/90 transition shadow-2xl shadow-[#FFB81C]/20 hover:-translate-y-0.5"
          >
            Create Your Parent Account <ArrowRight size={18} />
          </Link>
          <p className="text-white/30 text-xs mt-6">No credit card required · Takes less than 2 minutes</p>
        </div>
      </section>
    </div>
  );
}
