'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowLeft,
  Award,
  Banknote,
  BookOpen,
  Briefcase,
  Calendar,
  CheckCircle2,
  Clock,
  GraduationCap,
  Loader2,
  MapPin,
  MessageCircle,
  PlayCircle,
  ShieldCheck,
  Star,
  Users,
  Video,
} from 'lucide-react';
import { useTeacherProfile } from '@/misc/hooks/api/teachers';
import { TeacherProfile } from '@/misc/types';

const GRADIENT_COLORS = [
  'from-blue-600 to-blue-800',
  'from-purple-600 to-purple-800',
  'from-emerald-600 to-emerald-800',
  'from-rose-500 to-rose-700',
  'from-amber-500 to-amber-700',
  'from-sky-500 to-sky-700',
  'from-indigo-500 to-indigo-700',
];

function pickColor(id: string | undefined) {
  const n = parseInt(String(id ?? '0').replace(/\D/g, '') || '0', 10);
  return GRADIENT_COLORS[n % GRADIENT_COLORS.length];
}

function initials(name: string | undefined) {
  if (!name) return '??';
  return name
    .split(' ')
    .filter(Boolean)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function TutorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const teacherQuery = useTeacherProfile(id);
  const teacher = teacherQuery.data || null;
  const loading = teacherQuery.isLoading || teacherQuery.isPending;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-[#F5F7FC]">
        <Loader2 size={36} className="text-[#001A72] animate-spin" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-[#F5F7FC]">
        <div className="text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <p className="font-bold text-gray-700">Tutor not found</p>
          <Link href="/search" className="mt-3 text-[#001A72] text-sm font-semibold hover:underline inline-block">
            Back to search
          </Link>
        </div>
      </div>
    );
  }

  const t = teacher;
  const name = t.full_name || t.fullName || t.name || 'Tutor';
  const subject = t.subject || (t.subjects && t.subjects[0]) || 'General tutoring';
  const rate = Number(t.hourlyRate ?? t.baseHourlyRate ?? 0);
  const location = t.lga || t.location || '';
  const rating = t.ratingAvg ? Number(t.ratingAvg) : null;
  const reviews = t.students ?? t.reviewsCount ?? t.reviewCount ?? 0;
  const color = pickColor(t.id);
  const firstName = name.split(' ')[0] || 'this tutor';
  const subjects = t.subjects?.length ? t.subjects : [subject];
  const bio = t.bio || '';
  const availabilityConfig = t.availabilityConfig || null;
  const availabilityEntries = availabilityConfig
    ? Object.entries(availabilityConfig).filter(([, ranges]) => ranges.length > 0)
    : [];
  const hasAvailability = Boolean(t.availability) && availabilityEntries.length > 0;

  return (
    <div className="min-h-screen bg-[#F5F7FC] pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex items-center justify-between gap-4 mb-6">
          <nav className="text-xs text-gray-500 flex items-center gap-1.5">
            <Link href="/search" className="hover:text-[#001A72]">Find Tutors</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium line-clamp-1">{name}</span>
          </nav>
          <Link href="/search" className="inline-flex items-center gap-2 text-xs font-bold text-[#001A72] hover:underline">
            <ArrowLeft size={14} /> Back to tutors
          </Link>
        </div>

        <div className="grid lg:grid-cols-[1fr_320px] gap-5 items-start">
          <main className="space-y-5">
            <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6 md:items-start">
                {t.photo ? (
                  <img src={t.photo} alt={name} className="w-28 h-28 rounded-2xl object-cover shadow-sm" />
                ) : (
                  <div className={`w-28 h-28 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-2xl font-black shadow-sm`}>
                    {initials(name)}
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl md:text-3xl font-black text-gray-900">{name}</h1>
                        {t.isVerified && <CheckCircle2 size={19} className="text-emerald-500 shrink-0" />}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{subject}</p>
                    </div>
                    {rate > 0 && (
                      <div className="text-left sm:text-right">
                        <p className="text-2xl font-black text-emerald-600">₦{rate.toLocaleString()}</p>
                        <p className="text-xs text-gray-400 font-semibold">per hour</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-5 grid sm:grid-cols-2 gap-3 text-sm text-gray-600">
                    <InfoLine icon={GraduationCap} label="Teaches" value={subjects.join(', ')} />
                    {location && <InfoLine icon={MapPin} label="Location" value={location} />}
                    {t.yearsOfExperience && <InfoLine icon={Briefcase} label="Experience" value={`${t.yearsOfExperience} years`} />}
                    {t.qualification && <InfoLine icon={Award} label="Qualification" value={t.qualification} />}
                  </div>
                </div>
              </div>
            </section>

            <ProfileSection title="About" icon={BookOpen}>
              <div className="flex flex-wrap gap-2 mb-4">
                {subjects.map((item) => (
                  <span key={item} className="text-xs font-semibold px-3 py-1.5 bg-[#FFB81C]/10 text-[#001A72] rounded-full border border-[#FFB81C]/20">
                    {item}
                  </span>
                ))}
              </div>
              {bio ? (
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{bio}</p>
              ) : (
                <EmptyPanel text="This tutor has not added a bio yet." />
              )}
            </ProfileSection>

            <ProfileSection title="Video Intro" icon={Video}>
              {t.intro_video ? (
                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                  <video src={t.intro_video} controls className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="aspect-video rounded-xl bg-gradient-to-br from-[#001A72] to-[#0040c8] flex flex-col items-center justify-center text-white text-center px-6">
                  <PlayCircle size={42} className="text-[#FFB81C] mb-3" />
                  <p className="font-black">Intro video coming soon</p>
                  <p className="text-sm text-white/60 mt-1">{firstName} has not uploaded a public video yet.</p>
                </div>
              )}
            </ProfileSection>

            <ProfileSection title="Schedule" icon={Calendar}>
              {hasAvailability ? (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {availabilityEntries.map(([day, ranges]) => (
                    <div key={day} className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
                      <p className="text-[10px] text-emerald-600 font-bold uppercase mb-2">{day}</p>
                      <div className="space-y-1">
                        {ranges.map((range) => (
                          <p key={`${day}-${range.from}-${range.to}`} className="text-xs font-black text-gray-800">
                            {range.from} - {range.to}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanel text="This tutor has not published an availability schedule yet." />
              )}
            </ProfileSection>

            <ProfileSection title="Ratings" icon={Star}>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-gray-900">{rating ? rating.toFixed(1) : 'New'}</span>
                  <StarRating rating={rating ? Math.round(rating) : 0} />
                </div>
                <p className="text-sm text-gray-500">{reviews} reviews</p>
              </div>
              <EmptyPanel text="Student reviews will appear here after completed lessons." />
            </ProfileSection>
          </main>

          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-5">
                  <div className="text-2xl font-black text-gray-900">{rating ? rating.toFixed(1) : 'New'}</div>
                  <div>
                    <StarRating rating={rating ? Math.round(rating) : 0} />
                    <p className="text-xs text-gray-400 mt-1">based on {reviews} reviews</p>
                </div>
              </div>
              <Link href="/login" className="flex items-center justify-center gap-2 w-full bg-[#001A72] text-white py-3 rounded-xl font-black text-sm hover:bg-[#0028a8] transition">
                <Calendar size={15} /> Book Now
              </Link>
              <button className="mt-3 flex items-center justify-center gap-2 w-full border border-gray-200 text-[#001A72] py-3 rounded-xl font-bold text-sm hover:border-[#001A72] transition">
                <MessageCircle size={15} /> Message Tutor
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-start gap-3">
                <ShieldCheck size={20} className="text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-sm text-gray-800">Tutor satisfaction guarantee</p>
                  <p className="text-xs text-gray-500 leading-relaxed mt-2">
                    Your first lesson is protected. If the match is not right, contact support and we will help you find a better fit.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <h3 className="font-bold text-gray-800 text-sm mb-4">Quick Stats</h3>
              <div className="space-y-3">
                {rate > 0 && <StatRow icon={Banknote} label="Hourly Rate" value={`₦${rate.toLocaleString()}`} />}
                <StatRow icon={Star} label="Rating" value={`${Number(rating).toFixed(1)} / 5.0`} />
                <StatRow icon={Users} label="Reviews" value={String(reviews)} />
                <StatRow icon={Clock} label="Response" value="Usually within 1 hour" />
                <StatRow icon={CheckCircle2} label="Status" value={t.isVerified ? 'Verified' : 'Unverified'} valueColor={t.isVerified ? 'text-emerald-600' : 'text-amber-600'} />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ title, icon: Icon, action, children }: { title: string; icon: any; action?: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
      <div className="flex items-center justify-between gap-4 mb-5">
        <h2 className="font-black text-lg text-[#001A72] flex items-center gap-2">
          <Icon size={18} className="text-[#001A72]" /> {title}
        </h2>
        {action && <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 bg-amber-50 border border-amber-100 rounded-full px-3 py-1">{action}</span>}
      </div>
      {children}
    </section>
  );
}

function InfoLine({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={15} className="text-gray-400 shrink-0 mt-0.5" />
      <p>
        <span className="font-black text-gray-800">{label}:</span> {value}
      </p>
    </div>
  );
}

function StarRating({ rating, small = false }: { rating: number; small?: boolean }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={small ? 12 : 16} className={i < rating ? 'fill-[#FFB81C] text-[#FFB81C]' : 'text-gray-200'} />
      ))}
    </div>
  );
}

function EmptyPanel({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-5 text-sm text-gray-500">
      {text}
    </div>
  );
}

function StatRow({ icon: Icon, label, value, valueColor }: { icon: any; label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-gray-400" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <span className={`text-xs font-bold text-gray-700 text-right ${valueColor || ''}`}>{value}</span>
    </div>
  );
}
