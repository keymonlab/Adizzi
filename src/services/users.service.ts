import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type UserRow = Database['public']['Tables']['users']['Row'];

// Check if a handle is available (returns true if available)
export async function checkHandleAvailability(handle: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true })
    .eq('handle', handle);
  if (error) throw error;
  return (count ?? 0) === 0;
}

// Update user profile (display_name, handle, avatar_url)
export async function updateProfile(
  userId: string,
  data: {
    display_name?: string;
    handle?: string;
    avatar_url?: string;
  }
): Promise<UserRow> {
  const { data: profile, error } = await supabase
    .from('users')
    .update(data)
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return profile as UserRow;
}

// Set neighborhood and mark location as verified
export async function updateLocationVerification(
  userId: string,
  neighborhoodId: string,
): Promise<UserRow> {
  const { data: profile, error } = await supabase
    .from('users')
    .update({ neighborhood_id: neighborhoodId, location_verified: true })
    .eq('id', userId)
    .select()
    .single();
  if (error) throw error;
  return profile as UserRow;
}

// Get user profile by ID
export async function getProfile(userId: string): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as UserRow;
}

// Search users by handle (for @mention)
export async function searchByHandle(
  query: string,
  limit = 10
): Promise<Pick<UserRow, 'id' | 'handle' | 'display_name' | 'avatar_url'>[]> {
  const { data, error } = await supabase
    .from('users')
    .select('id, handle, display_name, avatar_url')
    .ilike('handle', `${query}%`)
    .limit(limit);
  if (error) throw error;
  return data ?? [];
}
