import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowRight,
  BookOpen,
  CalendarCheck,
  GraduationCap,
  HeartHandshake,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { COMPANY_NAME } from '@/misc/constants';
import TeamMembersSection from '@/misc/components/TeamMembersSection';

export const metadata = {
  title: `About | ${COMPANY_NAME}`,
  description: `Learn about ${COMPANY_NAME}'s learning mission, how the platform supports students, parents, and tutors, and meet the team.`,
};

const AUDIENCES = [
  {
    icon: GraduationCap,
    title: 'For students',
    description: 'Explore subjects and tutor profiles, book one-to-one lessons, and learn through courses created by tutors.',
    href: '/search',
    action: 'Find learning support',
    tint: 'bg-blue-50 text-blue-600',
  },
  {
    icon: HeartHandshake,
    title: 'For parents',
    description: 'Create child profiles, find tutors, purchase courses, and keep learning activity organized from a parent dashboard.',
    href: '/for-parents',
    action: 'See the parent experience',
    tint: 'bg-amber-50 text-amber-600',
  },
  {
    icon: BookOpen,
    title: 'For tutors',
    description: 'Build a teaching profile, share your subjects and rates, connect with learners, and create courses.',
    href: '/become-a-tutor',
    action: 'Learn about tutoring',
    tint: 'bg-emerald-50 text-emerald-600',
  },
];

const PLATFORM_STEPS = [
  {
    number: '01',
    label: 'Your learning hub',
    title: 'Keep learning activity in one place.',
    description: 'The dashboard gives families a clear starting point, with quick access to courses, schedules, assessments, chat, and children’s learning activity.',
    image: '/pages/dashboard.png',
    alt: 'Eduwins parent dashboard with learning overview and quick access cards',
    href: '/for-parents',
    action: 'Explore the parent experience',
  },
  {
    number: '02',
    label: 'Tutor discovery',
    title: 'Find support that fits your goals.',
    description: 'Browse tutor profiles and compare subjects, experience, ratings, and hourly rates to find the right learning support.',
    image: '/pages/tutor.png',
    alt: 'Eduwins tutor search page showing tutor profiles and search filters',
    href: '/search',
    action: 'Find a tutor',
  },
  {
    number: '03',
    label: 'Lesson schedule',
    title: 'Stay on top of lessons.',
    description: 'The schedule brings booking requests, upcoming lessons, and past sessions together so families and tutors can keep track of learning.',
    image: '/pages/shedule.png',
    alt: 'Eduwins schedule page showing upcoming and completed lessons',
    href: '/search',
    action: 'Browse tutors to get started',
  },
  {
    number: '04',
    label: 'Tutor-created courses',
    title: 'Build skills at your own pace.',
    description: 'Explore structured courses from tutors across subjects and levels, then choose learning resources that fit your goals and schedule.',
    image: '/pages/course%20.jpg',
    alt: 'Eduwins course catalog showing courses across subjects and levels',
    href: '/courses',
    action: 'Explore our courses',
  },
];

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-white">
      <section className="relative overflow-hidden bg-[#001A72] px-4 pb-24 pt-16 sm:px-6 lg:px-8 lg:pb-28 lg:pt-20">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -right-24 -top-28 h-96 w-96 rounded-full bg-[#FFB81C]/10 blur-3xl" />
          <div className="absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-white/5 blur-3xl" />
        </div>
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#FFB81C]/30 bg-[#FFB81C]/15 px-4 py-1.5 text-sm font-semibold text-[#FFB81C]">
              <Users size={15} /> About {COMPANY_NAME}
            </span>
            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl md:text-6xl">
              Better learning starts with the <span className="text-[#FFB81C]">right support.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/75 md:text-xl">
              {COMPANY_NAME} brings learners, families, and tutors together in one place to find, organize, and take part in learning.
            </p>
            <a href="#mission" className="mt-9 inline-flex items-center gap-2 rounded-2xl bg-[#FFB81C] px-6 py-3.5 font-black text-[#001A72] transition hover:bg-[#ffd06f]">
              Discover our mission <ArrowRight size={17} />
            </a>
          </div>
          <div className="relative mx-auto w-full max-w-3xl lg:ml-auto">
            <div className="absolute -inset-4 rounded-[2rem] bg-[#FFB81C]/10 blur-2xl" />
            <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-white p-2 shadow-2xl sm:rounded-3xl sm:p-3">
              <Image
                src="/pages/dashboard.png"
                alt="Eduwins dashboard bringing courses, schedule, assessments, and learning activity together"
                width={1907}
                height={1044}
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="h-auto w-full rounded-xl sm:rounded-2xl"
              />
            </div>
            <div className="absolute -bottom-5 right-4 rounded-xl border border-white/20 bg-[#001A72]/90 px-4 py-3 text-sm font-bold text-white shadow-lg backdrop-blur sm:right-8">
              One connected learning experience
            </div>
          </div>
        </div>
      </section>

      <section id="mission" className="mx-auto grid max-w-7xl gap-10 px-4 py-20 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8 lg:py-24">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-[#B37A00]">Our learning mission</p>
          <h2 className="mt-3 text-3xl font-black leading-tight text-[#001A72] md:text-4xl">Make quality learning support easier to find and manage.</h2>
        </div>
        <div className="space-y-5 text-base leading-relaxed text-gray-600">
          <p>Finding the right tutor or learning resource can take time. Eduwins brings tutor discovery, lesson bookings, courses, and learning management together so learners and families can focus on progress.</p>
          <p>We support different learning needs by connecting students and parents with tutors, and by giving tutors tools to present their expertise and share structured learning resources.</p>
          <div className="flex items-start gap-3 rounded-2xl border border-[#001A72]/10 bg-[#001A72]/[0.03] p-5">
            <ShieldCheck className="mt-0.5 shrink-0 text-[#001A72]" size={21} />
            <p className="text-sm">From tutor profiles and scheduling to course access and progress visibility, the platform brings essential learning activities into one connected experience.</p>
          </div>
        </div>
      </section>

      <section className="bg-[#F7F9FC] px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="text-xs font-black uppercase tracking-widest text-[#B37A00]">One platform, connected journeys</p>
            <h2 className="mt-3 text-3xl font-black text-[#001A72] md:text-4xl">How people use Eduwins</h2>
            <p className="mt-4 leading-relaxed text-gray-600">Each person has a different role in learning. Eduwins gives students, parents, and tutors tools suited to those needs.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {AUDIENCES.map(({ icon: Icon, title, description, href, action, tint }) => (
              <article key={title} className="flex flex-col rounded-3xl border border-gray-100 bg-white p-7 shadow-sm">
                <span className={`flex h-12 w-12 items-center justify-center rounded-2xl ${tint}`}><Icon size={22} /></span>
                <h3 className="mt-5 text-xl font-black text-[#001A72]">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-gray-600">{description}</p>
                <Link href={href} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#001A72] hover:text-[#9A6500]">
                  {action} <ArrowRight size={15} />
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-[#001A72]/5 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-12 max-w-3xl text-center">
            <p className="text-xs font-black uppercase tracking-widest text-[#9A6500]">One connected platform</p>
            <h2 className="mt-3 text-3xl font-black text-[#001A72] md:text-4xl">See how learning comes together</h2>
            <p className="mt-4 leading-relaxed text-gray-600">
              From finding a tutor to keeping lessons on track and exploring courses, Eduwins brings key parts of the learning journey together.
            </p>
          </div>

          <div className="relative">
            {PLATFORM_STEPS.map((step, index) => (
              <article
                key={step.number}
                className="relative mb-8 border border-[#D9E3FF] bg-[#EEF3FF] p-5 shadow-[0_16px_48px_rgba(0,26,114,0.08)] last:mb-0 md:sticky md:mb-[42vh] md:grid md:min-h-[62vh] md:grid-cols-[0.72fr_1.28fr] md:items-center md:gap-8 md:p-8"
                style={{ zIndex: index + 1, top: `calc(6rem + ${index * 12}px)` }}
              >
                <div className="mb-5 md:mb-0 md:py-8">
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-[#9A6500]">
                    {step.number} <span className="mx-1 text-gray-300">/</span> {step.label}
                  </p>
                  <h3 className="mt-4 text-2xl font-black leading-tight text-[#001A72] sm:text-3xl">
                    {step.title}
                  </h3>
                  <p className="mt-4 text-sm leading-relaxed text-gray-600 sm:text-base">
                    {step.description}
                  </p>
                  <Link href={step.href} className="mt-6 inline-flex items-center gap-2 text-sm font-bold text-[#001A72] transition hover:text-[#9A6500]">
                    {step.action} <ArrowRight size={16} />
                  </Link>
                </div>
                <div className="relative aspect-[16/10] overflow-hidden border border-gray-200 bg-gray-100 shadow-[0_26px_56px_rgba(0,26,114,0.3)] md:aspect-[16/9]">
                  <Image
                    src={step.image}
                    alt={step.alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 65vw"
                    className="object-cover object-top"
                  />
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-16 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="flex items-start gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FFB81C]/20 text-[#9A6500]"><CalendarCheck size={22} /></span>
          <div>
            <h2 className="text-xl font-black text-[#001A72]">Ready to take the next step?</h2>
            <p className="mt-1 text-sm text-gray-600">Explore tutors, courses, and ways to get involved.</p>
          </div>
        </div>
        <Link href="/search" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#001A72] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#001A72]/90">
          Explore learning on Eduwins <ArrowRight size={16} />
        </Link>
      </section>

      <TeamMembersSection />
    </main>
  );
}
