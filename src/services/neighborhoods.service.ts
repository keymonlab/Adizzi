import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type Neighborhood = Database['public']['Tables']['neighborhoods']['Row'];

export async function findByCoordinates(
  lat: number,
  lng: number,
): Promise<Neighborhood | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('find_neighborhood_by_point', { lat, lng });
  if (error) throw error;
  return (data as Neighborhood | null) ?? null;
}

export async function getById(id: string): Promise<Neighborhood | null> {
  const { data, error } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('id', id)
    .single();
  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }
  return data as Neighborhood;
}

export async function listAll(): Promise<Pick<Neighborhood, 'id' | 'name' | 'city' | 'district'>[]> {
  const { data, error } = await supabase
    .from('neighborhoods')
    .select('id, name, city, district')
    .order('city')
    .order('name');
  if (error) throw error;
  return data ?? [];
}
