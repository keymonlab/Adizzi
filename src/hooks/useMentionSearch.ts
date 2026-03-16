import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';
import { MENTION_DEBOUNCE_MS } from '@/constants/config';

type UserRow = Database['public']['Tables']['users']['Row'];

export type MentionUser = Pick<UserRow, 'id' | 'handle' | 'display_name' | 'avatar_url'>;

export interface MentionSection {
  title: string;
  data: MentionUser[];
}

export function useMentionSearch(query: string, userId: string, neighborhoodId: string) {
  const [sections, setSections] = useState<MentionSection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!query || query.length < 1) {
      setSections([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        // Search contacts matches first (people the user knows)
        const { data: contacts } = await supabase
          .from('contacts_matches')
          .select('matched_user_id, contact_name, matched_user:matched_user_id(id, handle, display_name, avatar_url)')
          .eq('user_id', userId)
          .ilike('contact_name', `%${query}%`)
          .limit(5);

        // Search by handle/display_name in same neighborhood
        const { data: neighborhoodUsersRaw } = await supabase
          .from('users')
          .select('id, handle, display_name, avatar_url')
          .eq('neighborhood_id', neighborhoodId)
          .neq('id', userId)
          .or(`handle.ilike.%${query}%,display_name.ilike.%${query}%`)
          .limit(10);
        const neighborhoodUsers = (neighborhoodUsersRaw as any[]) as MentionUser[];

        const newSections: MentionSection[] = [];

        // Contacts section
        const contactUsers = (contacts ?? [])
          .map((c: any) => c.matched_user as MentionUser)
          .filter(Boolean);
        if (contactUsers.length > 0) {
          newSections.push({ title: '내 연락처', data: contactUsers });
        }

        // Neighborhood section (exclude already shown contacts)
        const contactIds = new Set(contactUsers.map((u: MentionUser) => u.id));
        const filteredNeighborhood = neighborhoodUsers.filter(
          (u) => !contactIds.has(u.id)
        );
        if (filteredNeighborhood.length > 0) {
          newSections.push({ title: '동네 이웃', data: filteredNeighborhood });
        }

        setSections(newSections);
      } catch (error) {
        console.error('Mention search error:', error);
        setSections([]);
      } finally {
        setIsLoading(false);
      }
    }, MENTION_DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, userId, neighborhoodId]);

  return { sections, isLoading };
}
