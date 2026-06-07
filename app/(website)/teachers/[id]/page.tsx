'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Star,
  MapPin,
  Banknote,
  BookOpen,
  CheckCircle2,
  GraduationCap,
  Briefcase,
  Award,
  Video,
  Mail,
  Calendar,
  Users,
  MessageCircle,
  Loader2,
  AlertCircle,
  Sparkles,
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

export default function TeacherDetailPage() {
  const { id } = useParams<{ id: string }>();

  const teacherQuery = useTeacherProfile(id);

  const teacher = teacherQuery.data || null;
  const loading = teacherQuery.isLoading || teacherQuery.isPending;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-white">
        <Loader2 size={36} className="text-[#001A72] animate-spin" />
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-white">
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

  const t = teacher as TeacherProfile & Record<string, any>;
  const name = t.full_name || t.fullName || t.name || 'Tutor';
  const subject = t.subject || (t.subjects && t.subjects[0]) || '—';
  const rate = t.hourly_rate ?? t.hourlyRate ?? t.baseHourlyRate ?? t.base_hourly_rate ?? 0;
  const location = t.lga || t.location || '';
  const rating = t.rating ?? 4.5;
  const reviews = t.students ?? t.reviewsCount ?? t.reviewCount ?? 0;
  const color = pickColor(t.id);
  const hasPhoto = !!t.photo_url || !!t.headshot || !!t.profilePhoto;

  return (
    <div className="min-h-screen bg-white">
      {/* ── Back nav ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-0">
        <div className="flex items-center gap-4">
          <Link
            href="/search"
            className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition"
          >
            <ArrowLeft size={16} className="text-gray-600" />
          </Link>
          <nav className="text-xs text-gray-400 flex items-center gap-1.5">
            <Link href="/search" className="hover:text-[#001A72]">Tutors</Link>
            <span>/</span>
            <span className="text-gray-700 font-medium line-clamp-1 max-w-[200px]">{name}</span>
          </nav>
        </div>
      </div>

      {/* ── Profile Header ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-10">
        <div className="bg-gradient-to-r from-[#001A72] to-[#0040c8] rounded-2xl p-6 md:p-8 text-white overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-16 -right-16 w-72 h-72 bg-[#FFB81C]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 -left-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
          </div>

          <div className="relative flex flex-col md:flex-row gap-6 items-start">
            {/* Avatar */}
            <div className="shrink-0">
              {hasPhoto ? (
                <img
                  src={t.photo_url || t.headshot || t.profilePhoto}
                  alt={name}
                  className="w-24 h-24 md:w-28 md:h-28 rounded-2xl object-cover border-4 border-white/20 shadow-lg"
                />
              ) : (
                <div className={`w-24 h-24 md:w-28 md:h-28 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white text-2xl font-black border-4 border-white/20 shadow-lg`}>
                  {initials(name)}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-black">{name}</h1>
                {t.verified !== false && (
                  <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                )}
              </div>
              <p className="text-white/80 text-sm font-medium mb-3">{subject}</p>

              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
                <span className="flex items-center gap-1.5 text-white/70">
                  <Star size={14} className="fill-[#FFB81C] text-[#FFB81C]" />
                  <span className="font-bold">{Number(rating).toFixed(1)}</span>
                  <span className="text-white/50">({reviews} reviews)</span>
                </span>
                {location && (
                  <span className="flex items-center gap-1.5 text-white/70">
                    <MapPin size={14} /> {location}
                  </span>
                )}
                {rate > 0 && (
                  <span className="flex items-center gap-1.5 text-white/70">
                    <Banknote size={14} /> ₦{rate.toLocaleString()}/hr
                  </span>
                )}
                {t.yearsExperience && (
                  <span className="flex items-center gap-1.5 text-white/70">
                    <Briefcase size={14} /> {t.yearsExperience} yrs exp
                  </span>
                )}
              </div>
            </div>

            {/* CTA */}
            <div className="shrink-0 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 border border-white/20 flex flex-col gap-2">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 bg-[#FFB81C] text-[#001A72] py-2.5 px-6 rounded-xl font-black text-sm hover:bg-[#FFB81C]/90 transition whitespace-nowrap"
                >
                  <Calendar size={15} /> Book a Session
                </Link>
                <button className="flex items-center justify-center gap-2 bg-white/10 text-white py-2.5 px-6 rounded-xl font-bold text-sm hover:bg-white/20 transition whitespace-nowrap">
                  <MessageCircle size={15} /> Send Message
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Main Content ── */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left — Bio & Details */}
          <div className="lg:col-span-2 space-y-5">
            {/* Bio */}
            {t.bio && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                  <BookOpen size={16} className="text-[#001A72]" />
                  About
                </h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{t.bio}</p>
              </div>
            )}

            {/* Subjects */}
            {t.subjects && t.subjects.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                  <GraduationCap size={16} className="text-[#001A72]" />
                  Subjects
                </h2>
                <div className="flex flex-wrap gap-2">
                  {t.subjects.map((s) => (
                    <span key={s} className="text-xs font-semibold px-3 py-1.5 bg-[#001A72]/5 text-[#001A72] rounded-full border border-[#001A72]/10">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Credentials */}
            {t.qualification && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                  <Award size={16} className="text-[#001A72]" />
                  Qualifications
                </h2>
                <p className="text-sm text-gray-600">{t.qualification}</p>
              </div>
            )}

            {/* Intro Video */}
            {t.introVideoUrl && (
              <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6">
                <h2 className="font-bold text-gray-800 text-sm mb-3 flex items-center gap-2">
                  <Video size={16} className="text-[#001A72]" />
                  Intro Video
                </h2>
                <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden">
                  <video
                    src={t.introVideoUrl}
                    controls
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Right — Sidebar */}
          <div className="space-y-4">
            {/* Stats */}
            <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-5">
              <h3 className="font-bold text-gray-700 text-sm border-b border-gray-100 pb-3 mb-3">At a Glance</h3>
              <div className="space-y-3">
                {rate > 0 && (
                  <StatRow icon={Banknote} label="Hourly Rate" value={`₦${rate.toLocaleString()}`} />
                )}
                <StatRow icon={Star} label="Rating" value={`${Number(rating).toFixed(1)} / 5.0`} />
                <StatRow icon={Users} label="Students" value={String(reviews)} />
                {location && <StatRow icon={MapPin} label="Location" value={location} />}
                {t.yearsExperience && (
                  <StatRow icon={Briefcase} label="Experience" value={`${t.yearsExperience} years`} />
                )}
                {t.qualification && (
                  <StatRow icon={Award} label="Qualification" value={t.qualification} />
                )}
                <StatRow icon={CheckCircle2} label="Status" value={t.verified !== false ? 'Verified' : 'Unverified'} valueColor={t.verified !== false ? 'text-emerald-600' : 'text-amber-600'} />
              </div>
            </div>

            {/* Contact CTA */}
            <div className="bg-gradient-to-br from-[#001A72] to-[#0028a8] rounded-2xl p-5 text-white text-center">
              <Sparkles size={24} className="mx-auto mb-2 text-[#FFB81C]" />
              <h3 className="font-black text-sm mb-1">Ready to Learn?</h3>
              <p className="text-white/60 text-xs mb-4">
                Book a one-on-one session with {name.split(' ')[0]} today.
              </p>
              <Link
                href="/login"
                className="block w-full bg-[#FFB81C] text-[#001A72] py-2.5 rounded-xl font-black text-sm hover:bg-[#FFB81C]/90 transition"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

/* ── Shared Components ── */

function StatRow({ icon: Icon, label, value, valueColor }: { icon: any; label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Icon size={13} className="text-gray-400" />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <span className={`text-xs font-bold text-gray-700 ${valueColor || ''}`}>{value}</span>
    </div>
  );
}
