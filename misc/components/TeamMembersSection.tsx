'use client';

import Link from 'next/link';
import { ArrowRight, Users } from 'lucide-react';
import { useTeamMembers } from '@/misc/hooks/api/teamMembers';

export default function TeamMembersSection() {
  const { data: members = [], isLoading, isError, refetch } = useTeamMembers();

  return (
    <section className="bg-[#F7F9FC] py-20 px-4 sm:px-6 lg:px-8" id="team">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-black text-[#FFB81C] uppercase tracking-widest mb-2">The people behind Eduwins</p>
          <h2 className="text-3xl md:text-4xl font-black text-[#001A72]">Meet our team</h2>
          <p className="text-gray-600 mt-4 leading-relaxed">Get to know the people working to make learning support easier to find and manage.</p>
        </div>

        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-label="Loading team members">
            {[1, 2, 3].map((item) => <div key={item} className="h-72 rounded-3xl bg-white animate-pulse" />)}
          </div>
        ) : isError ? (
          <div className="rounded-3xl border border-gray-100 bg-white px-6 py-12 text-center">
            <p className="font-bold text-[#001A72]">Team profiles are temporarily unavailable.</p>
            <button onClick={() => refetch()} className="mt-3 text-sm font-bold text-[#001A72] underline underline-offset-4">Try again</button>
          </div>
        ) : members.length ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {members.map((member) => (
              <Link
                key={member.id}
                href={`/about/team/${member.slug}`}
                className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="h-64 bg-[#001A72]/5 overflow-hidden flex items-center justify-center">
                  {member.photoUrl ? (
                    <img src={member.photoUrl} alt={member.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="h-24 w-24 rounded-full bg-[#001A72] text-[#FFB81C] flex items-center justify-center text-3xl font-black">
                      {member.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="p-6">
                  <p className="text-xs font-black uppercase tracking-wider text-[#FFB81C]">{member.title}</p>
                  <h3 className="mt-2 text-xl font-black text-[#001A72]">{member.name}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-600 line-clamp-3">{member.bio}</p>
                  <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#001A72] group-hover:text-[#9A6500]">
                    View profile <ArrowRight size={15} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#001A72]/20 bg-white px-6 py-12 text-center">
            <Users className="mx-auto text-[#001A72]/40" size={32} />
            <p className="mt-4 font-bold text-[#001A72]">Team profiles are being added.</p>
            <p className="mt-1 text-sm text-gray-500">Please check back soon to meet the people behind Eduwins.</p>
          </div>
        )}
      </div>
    </section>
  );
}
