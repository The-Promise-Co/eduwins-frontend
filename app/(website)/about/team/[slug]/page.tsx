'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, UserRound } from 'lucide-react';
import { useTeamMember } from '@/misc/hooks/api/teamMembers';

export default function TeamMemberProfilePage() {
  const params = useParams<{ slug: string }>();
  const slug = Array.isArray(params.slug) ? params.slug[0] : params.slug;
  const { data: member, isLoading, isError } = useTeamMember(slug || '');

  if (isLoading) {
    return <main className="min-h-[60vh] bg-white px-4 py-20"><div className="mx-auto h-80 max-w-4xl animate-pulse rounded-3xl bg-gray-100" /></main>;
  }

  if (!member || isError) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
        <UserRound size={38} className="text-[#001A72]/40" />
        <h1 className="mt-4 text-2xl font-black text-[#001A72]">Profile not found</h1>
        <p className="mt-2 text-sm text-gray-500">This team profile may have been removed or is not published.</p>
        <Link href="/about#team" className="mt-6 inline-flex items-center gap-2 font-bold text-[#001A72]"><ArrowLeft size={16} /> Back to About</Link>
      </main>
    );
  }

  const initials = member.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join('').toUpperCase();

  return (
    <main className="min-h-screen bg-[#F7F9FC] px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <article className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-sm md:grid md:grid-cols-[0.85fr_1.15fr]">
        <div className="min-h-[320px] bg-[#001A72]/5 md:min-h-[560px]">
          {member.photoUrl ? (
            <img src={member.photoUrl} alt={member.name} className="h-full min-h-[320px] w-full object-cover md:min-h-[560px]" />
          ) : (
            <div className="flex h-full min-h-[320px] items-center justify-center md:min-h-[560px]">
              <span className="flex h-36 w-36 items-center justify-center rounded-full bg-[#001A72] text-4xl font-black text-[#FFB81C]">{initials}</span>
            </div>
          )}
        </div>
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14">
          <Link href="/about#team" className="mb-10 inline-flex w-fit items-center gap-2 text-sm font-bold text-[#001A72] hover:text-[#9A6500]"><ArrowLeft size={16} /> Back to About</Link>
          <p className="text-xs font-black uppercase tracking-widest text-[#B37A00]">Eduwins team</p>
          <h1 className="mt-3 text-3xl font-black text-[#001A72] sm:text-4xl">{member.name}</h1>
          <p className="mt-2 text-lg font-semibold text-gray-500">{member.title}</p>
          <div className="my-7 h-px w-16 bg-[#FFB81C]" />
          <p className="whitespace-pre-line leading-8 text-gray-600">{member.bio}</p>
        </div>
      </article>
    </main>
  );
}
