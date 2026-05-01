'use client';

import { ReactElement } from 'react';
import Link from 'next/link';
import { Star, Banknote, MapPin, CheckCircle2 } from 'lucide-react';

export interface TutorCardProps {
  name: string;
  subject: string;
  rating: string;
  reviews: number;
  rate: string;
  location: string;
  initials: string;
  color: string;
  href?: string;
}

export default function TutorCard({
  name,
  subject,
  rating,
  reviews,
  rate,
  location,
  initials,
  color,
  href = '/search',
}: TutorCardProps): ReactElement {
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
          href={href}
          className="mt-3 block w-full bg-[#001A72] text-white text-xs font-bold py-2.5 rounded-xl text-center hover:bg-[#001A72]/90 transition"
        >
          View &amp; Book
        </Link>
      </div>
    </div>
  );
}
