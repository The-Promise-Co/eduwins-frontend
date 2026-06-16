'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Search,
  MapPin,
  Banknote,
  Star,
  CheckCircle2,
  SlidersHorizontal,
  X,
  Loader2,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { useTeacherSearch } from '@/misc/hooks/api/teachers';
import { TeacherProfile } from '@/misc/types';

/* ─── colour helpers for avatar gradients ─── */
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

/* ─── Tutor result card ─── */
interface ResultCardProps {
  teacher: Partial<TeacherProfile> & {
    photo_url?: string;
    full_name?: string;
    hourly_rate?: number;
    baseHourlyRate?: number;
    lga?: string;
    students?: number;
    fullName?: string;
    subject?: string;
  };
}

function ResultCard({ teacher }: ResultCardProps) {
  const name = teacher.full_name || teacher.fullName || 'Tutor';
  const subject = teacher.subject || (teacher.subjects && teacher.subjects[0]) || '—';
  const rate = teacher.hourly_rate ?? teacher.hourlyRate ?? teacher.baseHourlyRate ?? 0;
  const location = teacher.lga || teacher.location || 'Lagos';
  const rating = teacher.rating ?? 4.5;
  const reviews = teacher.students ?? teacher.reviewsCount ?? 0;
  const color = pickColor(teacher.id);

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-[#001A72]/20 transition overflow-hidden flex flex-col">
      {/* avatar header */}
      <div className={`bg-gradient-to-br ${color} p-6 flex flex-col items-center`}>
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-white text-xl font-black mb-3 group-hover:scale-105 transition-transform">
          {initials(name)}
        </div>
        <p className="font-bold text-white text-sm text-center">{name}</p>
        <p className="text-white/80 text-xs text-center mt-0.5">{subject}</p>
      </div>

      {/* body */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1">
            <Star size={13} className="fill-[#FFB81C] text-[#FFB81C]" />
            <span className="font-black text-sm text-[#001A72]">{Number(rating).toFixed(1)}</span>
          </div>
          <span className="text-xs text-gray-400">{reviews} reviews</span>
        </div>

        <div className="space-y-1.5 mb-4 flex-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <Banknote size={12} className="text-gray-400" />
            ₦{rate.toLocaleString()}/hr
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <MapPin size={12} className="text-gray-400" />
            {location}
          </div>
        </div>

        <div className="flex items-center gap-1.5 mb-3">
          <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
          <span className="text-[10px] font-bold text-emerald-700">Verified Tutor</span>
        </div>

        <div className="flex gap-2">
          <Link
            href={`/teachers/${teacher.id}`}
            className="flex-1 bg-[#001A72] text-white text-xs font-bold py-2.5 rounded-xl text-center hover:bg-[#001A72]/90 transition"
          >
            View &amp; Book
          </Link>
          <button className="px-3 py-2.5 rounded-xl border border-[#FFB81C] text-[#FFB81C] text-xs font-bold hover:bg-[#FFB81C]/10 transition">
            Chat
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Empty state ─── */
function EmptyState({ query }: { query: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-[#001A72]/5 flex items-center justify-center mb-5">
        <BookOpen size={32} className="text-[#001A72]/40" />
      </div>
      <h3 className="text-xl font-black text-[#001A72] mb-2">No Tutors Found</h3>
      <p className="text-gray-500 text-sm max-w-xs">
        {query
          ? `We couldn't find any tutors matching "${query}". Try a different subject or remove a filter.`
          : 'Start searching by entering a subject, location or rate above.'}
      </p>
    </div>
  );
}

/* ─── Page Content ─── */
function SearchContent() {
  const searchParams = useSearchParams();
  const [filters, setFilters] = useState({
    subject: searchParams.get('subject') ?? '',
    lga: '',
    maxRate: '',
  });
  const [submittedFilters, setSubmittedFilters] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);
  const params = new URLSearchParams(
    Object.fromEntries(Object.entries(submittedFilters).filter(([_, v]) => v))
  ).toString();
  const teachersQuery = useTeacherSearch(params);
  const fallbackTeachers = [
    { id: '1', full_name: 'Mr. Okonkwo', baseHourlyRate: 500, subjects: ['Mathematics'], location: 'Lagos Island', rating: 4.8, students: 45 },
    { id: '2', full_name: 'Mrs. Adeyemi', baseHourlyRate: 400, subjects: ['English Language'], location: 'Lekki', rating: 4.9, students: 32 },
    { id: '3', full_name: 'Dr. Chukwu', baseHourlyRate: 800, subjects: ['Physics', 'Chemistry'], location: 'Victoria Island', rating: 4.7, students: 28 },
    { id: '4', full_name: 'Miss Inyene', baseHourlyRate: 550, subjects: ['Biology', 'Health'], location: 'Ikeja', rating: 4.8, students: 38 },
    { id: '5', full_name: 'Mr. Afolabi', baseHourlyRate: 450, subjects: ['History', 'Civics'], location: 'Ikoyi', rating: 4.9, students: 52 },
    { id: '6', full_name: 'Dr. Nwosu', baseHourlyRate: 700, subjects: ['Chemistry'], location: 'Surulere', rating: 4.6, students: 22 },
  ];
  const teachers = (teachersQuery.isError ? fallbackTeachers : teachersQuery.data?.data || []) as ResultCardProps['teacher'][];
  const loading = teachersQuery.isLoading || teachersQuery.isFetching;

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedFilters(filters);
  };

  const clearFilter = (key: 'subject' | 'lga' | 'maxRate') =>
    setFilters((f) => ({ ...f, [key]: '' }));

  const activeFilters = Object.entries(filters).filter(([_, v]) => v);

  return (
    <div className="min-h-screen bg-white">

      {/* ── Hero search bar ── */}
      <section className="relative overflow-hidden bg-[#001A72]">
        {/* decorations */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-72 h-72 bg-[#FFB81C]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 -left-16 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 pb-20">
          {/* label */}
          <div className="inline-flex items-center gap-2 bg-[#FFB81C]/15 border border-[#FFB81C]/30 text-[#FFB81C] text-sm font-semibold px-4 py-1.5 rounded-full mb-5">
            <Sparkles size={14} />
            Browse All Tutors
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-white mb-3 leading-tight">
            Find Your Perfect{' '}
            <span className="text-[#FFB81C] relative">
              Tutor
              <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none">
                <path d="M0 6 Q100 0 200 6" stroke="#FFB81C" strokeWidth="3" strokeLinecap="round" fill="none" opacity="0.5" />
              </svg>
            </span>
          </h1>
          <p className="text-white/60 text-sm mb-8 max-w-lg">
            Search by subject, location, or rate. Every tutor is verified and rated by real students.
          </p>

          {/* main search */}
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <div className="flex-1 flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-lg">
              <Search size={18} className="text-[#001A72] shrink-0" />
              <input
                type="text"
                value={filters.subject}
                onChange={(e) => setFilters((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Subject, e.g. Mathematics, IELTS…"
                className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none"
              />
              {filters.subject && (
                <button type="button" onClick={() => clearFilter('subject')} className="text-gray-300 hover:text-gray-500 transition">
                  <X size={14} />
                </button>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className="flex items-center justify-center gap-2 bg-white/10 border border-white/20 text-white font-semibold px-5 py-3.5 rounded-2xl hover:bg-white/20 transition"
            >
              <SlidersHorizontal size={16} />
              Filters
            </button>
            <button
              type="submit"
              className="bg-[#FFB81C] text-[#001A72] font-black px-7 py-3.5 rounded-2xl hover:bg-[#ffd06f] transition flex items-center justify-center gap-2 shadow-lg whitespace-nowrap"
            >
              Search <ArrowRight size={16} />
            </button>
          </form>

          {/* expanded filters */}
          {showFilters && (
            <div className="mt-4 grid sm:grid-cols-2 gap-3 max-w-2xl">
              <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-lg">
                <MapPin size={16} className="text-[#001A72] shrink-0" />
                <input
                  type="text"
                  value={filters.lga}
                  onChange={(e) => setFilters((f) => ({ ...f, lga: e.target.value }))}
                  placeholder="Location / LGA"
                  className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none"
                />
                {filters.lga && (
                  <button type="button" onClick={() => clearFilter('lga')} className="text-gray-300 hover:text-gray-500 transition">
                    <X size={14} />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3.5 shadow-lg">
                <Banknote size={16} className="text-[#001A72] shrink-0" />
                <input
                  type="number"
                  value={filters.maxRate}
                  onChange={(e) => setFilters((f) => ({ ...f, maxRate: e.target.value }))}
                  placeholder="Max hourly rate (₦)"
                  className="flex-1 text-sm text-gray-800 placeholder-gray-400 bg-transparent outline-none"
                />
                {filters.maxRate && (
                  <button type="button" onClick={() => clearFilter('maxRate')} className="text-gray-300 hover:text-gray-500 transition">
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60 L0 30 Q360 0 720 30 Q1080 60 1440 30 L1440 60 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ── Results area ── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* active filter chips */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {activeFilters.map(([key, value]) => (
              <span
                key={key}
                className="flex items-center gap-1.5 bg-[#001A72]/5 border border-[#001A72]/10 text-[#001A72] text-xs font-semibold px-3 py-1.5 rounded-full"
              >
                {value}
                <button onClick={() => clearFilter(key as any)} className="hover:text-red-500 transition">
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* result count header */}
        <div className="flex items-end justify-between mb-6">
          <div>
            <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-1">Results</p>
            <h2 className="text-2xl font-black text-[#001A72]">
              {loading ? 'Searching…' : `${teachers.length} Tutor${teachers.length !== 1 ? 's' : ''} Found`}
            </h2>
          </div>
        </div>

        {/* grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Loader2 size={36} className="text-[#001A72] animate-spin" />
            <p className="text-gray-500 font-medium text-sm">Finding the best tutors…</p>
          </div>
        ) : teachers.length > 0 ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {teachers.map((teacher) => (
              <ResultCard key={teacher.id} teacher={teacher} />
            ))}
          </div>
        ) : (
          <EmptyState query={filters.subject} />
        )}
      </section>

      {/* ── Bottom CTA ── */}
      {!loading && teachers.length > 0 && (
        <section className="py-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <div className="bg-gradient-to-r from-[#001A72] via-[#0028a8] to-[#001A72] rounded-3xl p-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 right-0 w-48 h-48 bg-[#FFB81C]/10 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full blur-3xl" />
            </div>
            <div className="relative">
              <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-3">Are You a Tutor?</p>
              <h2 className="text-2xl md:text-3xl font-black text-white mb-3">Join Eduwins &amp; Start Earning</h2>
              <p className="text-white/60 text-sm mb-7 max-w-md mx-auto">
                Create your tutor profile for free and connect with hundreds of students across Nigeria.
              </p>
              <Link
                href="/register-teacher"
                className="inline-flex items-center gap-2 bg-[#FFB81C] text-[#001A72] font-black px-8 py-3.5 rounded-2xl hover:bg-[#ffd06f] transition shadow-lg"
              >
                Apply as a Tutor <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 size={36} className="text-[#001A72] animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
