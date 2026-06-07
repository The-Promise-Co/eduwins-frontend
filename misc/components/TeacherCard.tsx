import Link from 'next/link';
import { Star, Banknote, MapPin, CheckCircle2 } from 'lucide-react';
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

interface TeacherCardProps {
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

export default function TeacherCard({ teacher }: TeacherCardProps) {
  const teacherId = teacher.id;
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
            href={`/teachers/${teacherId}`}
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
