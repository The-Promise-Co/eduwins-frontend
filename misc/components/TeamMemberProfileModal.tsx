'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { TeamMember } from '@/misc/hooks/api/teamMembers';
import TeamMemberBio from '@/misc/components/TeamMemberBio';

export default function TeamMemberProfileModal({ member, onClose }: { member: TeamMember; onClose: () => void }) {
  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const initials = member.name
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[#001A72]/60 p-3 backdrop-blur-sm sm:p-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="team-member-name"
        className="relative grid max-h-[92dvh] w-full max-w-6xl grid-cols-1 overflow-hidden bg-white shadow-2xl md:h-[min(82dvh,760px)] md:max-h-[82dvh] md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close team member profile"
          className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center bg-white text-gray-600 shadow-md transition hover:text-[#001A72]"
        >
          <X size={20} />
        </button>

        <div className="flex min-h-0 flex-col border-b border-gray-100 bg-[#F7F9FC] md:border-b-0 md:border-r">
          <div className="relative h-52 shrink-0 bg-[#001A72]/5 sm:h-64 md:h-0 md:min-h-0 md:flex-1">
            {member.photoUrl ? (
              <img src={member.photoUrl} alt={member.name} className="h-full w-full object-cover object-top" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <span className="flex h-28 w-28 items-center justify-center rounded-full bg-[#001A72] text-3xl font-black text-[#FFB81C]">
                  {initials}
                </span>
              </div>
            )}
          </div>
          <div className="shrink-0 px-6 py-5 sm:px-8">
            <p className="text-xs font-black uppercase tracking-widest text-[#9A6500]">Eduwins team</p>
            <h2 id="team-member-name" className="mt-2 text-2xl font-black text-[#001A72] sm:text-3xl">{member.name}</h2>
            <p className="mt-1 text-base font-semibold text-gray-500">{member.title}</p>
          </div>
        </div>

        <div className="flex min-h-0 min-w-0 w-full flex-col p-6 pt-8 sm:p-8 sm:pt-10 md:p-10">
          <h3 className="text-xs font-black uppercase tracking-widest text-[#9A6500]">About {member.name.split(' ')[0]}</h3>
          <div className="mt-5 min-h-0 max-h-[35dvh] flex-1 overflow-y-auto pr-3 md:max-h-none">
            <TeamMemberBio content={member.bio} />
          </div>
        </div>
      </section>
    </div>
  );
}
