import React from 'react';
import Link from 'next/link';
import {
  Pencil,
  Trash2,
  GraduationCap,
  School,
  BookOpen,
  Calendar,
  BarChart3,
  ClipboardList,
} from 'lucide-react';
import { Child } from '@/hooks/useChildren';

interface ChildCardProps {
  child: Child;
  onEdit: () => void;
  onDelete: () => void;
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500',
  'bg-purple-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500',
];

function getInitials(first: string, last: string) {
  return `${first[0] || ''}${last[0] || ''}`.toUpperCase();
}

function getAgeFromDob(dob?: string | null) {
  if (!dob) return null;
  const age = Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  return age >= 0 ? age : null;
}

function getAvatarColor(id: string) {
  return AVATAR_COLORS[id.charCodeAt(0) % AVATAR_COLORS.length];
}

const ChildCard: React.FC<ChildCardProps> = ({ child, onEdit, onDelete }) => {
  const age = getAgeFromDob(child.dateOfBirth);
  const color = getAvatarColor(child.id);

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden flex flex-col justify-between">
      
      {/* Clickable Card Body linking to detailed child dashboard */}
      <Link href={`/app/children/${child.id}`} className="block flex-grow cursor-pointer">
        {/* Card header */}
        <div className="relative px-5 py-5">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center text-white text-xl font-black shadow-sm shrink-0`}>
              {child.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={child.photoUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                getInitials(child.firstName, child.lastName)
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-black text-gray-900 text-sm leading-tight truncate">
                {child.firstName} {child.lastName}
              </h3>
              {age !== null && <p className="text-xs text-gray-400 mt-0.5">{age} yrs old</p>}
              <p className="text-[10px] text-gray-400 truncate mt-0.5">{child.email}</p>
            </div>
          </div>

          {/* Edit / Delete on hover (stops propagation so standard link navigation doesn't occur) */}
          <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEdit();
              }}
              className="w-7 h-7 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-[#001A72] transition"
              title="Edit"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onDelete();
              }}
              className="w-7 h-7 rounded-lg bg-white border border-gray-100 shadow-sm flex items-center justify-center text-gray-400 hover:text-red-500 transition"
              title="Remove"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {/* Meta row */}
        <div className="px-5 pb-4 space-y-1.5">
          {child.grade && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <GraduationCap size={12} className="text-indigo-400 shrink-0" />
              <span>{child.grade}</span>
            </div>
          )}
          {child.school && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <School size={12} className="text-emerald-400 shrink-0" />
              <span className="truncate">{child.school}</span>
            </div>
          )}
          {!child.grade && !child.school && (
            <p className="text-xs text-gray-300 italic">No school details yet</p>
          )}
        </div>
      </Link>

      {/* Quick-access tabs (outside of main Link for clean nested-Link execution) */}
      <div className="border-t border-gray-50 grid grid-cols-4 divide-x divide-gray-50">
        {[
          { icon: BookOpen, label: 'Courses', tab: 'courses' },
          { icon: Calendar, label: 'Schedule', tab: 'schedule' },
          { icon: BarChart3, label: 'Analytics', tab: 'analytics' },
          { icon: ClipboardList, label: 'Assess.', tab: 'assessments' },
        ].map(({ icon: Icon, label, tab }) => (
          <Link
            key={tab}
            href={`/app/children/${child.id}?tab=${tab}`}
            className="flex flex-col items-center gap-1 py-3 text-gray-400 hover:text-[#001A72] hover:bg-gray-50 transition-all group/tab"
            title={label}
          >
            <Icon size={14} className="group-hover/tab:scale-110 transition-transform" />
            <span className="text-[9px] font-bold uppercase tracking-wide">{label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default ChildCard;
