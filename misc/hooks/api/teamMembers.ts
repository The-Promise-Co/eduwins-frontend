import { useQuery } from '@tanstack/react-query';
import api from '@/misc/services/api';

export interface TeamMember {
  id: string;
  slug: string;
  name: string;
  title: string;
  bio: string;
  photoUrl?: string | null;
  displayOrder: number;
  isPublished: boolean;
}

export const useTeamMembers = () => useQuery<TeamMember[]>({
  queryKey: ['team-members'],
  queryFn: async () => {
    const response = await api.get<TeamMember[]>('/team-members');
    return response.data;
  },
});

export const useTeamMember = (slug: string) => useQuery<TeamMember>({
  queryKey: ['team-members', slug],
  queryFn: async () => {
    const response = await api.get<TeamMember>(`/team-members/${encodeURIComponent(slug)}`);
    return response.data;
  },
  enabled: !!slug,
});
