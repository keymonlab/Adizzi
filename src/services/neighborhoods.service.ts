import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

export type Neighborhood = Database['public']['Tables']['neighborhoods']['Row'];

export async function findByCoordinates(
  lat: number,
  lng: number,
): Promise<Neighborhood | null> {
  const apiKey = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY;
  if (!apiKey) throw new Error('Missing EXPO_PUBLIC_KAKAO_REST_API_KEY');

  // Call Kakao reverse geocoding API
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/geo/coord2regioncode.json?x=${lng}&y=${lat}`,
    { headers: { Authorization: `KakaoAK ${apiKey}` } },
  );
  if (!res.ok) throw new Error(`Kakao API error: ${res.status}`);

  const json = await res.json();
  // Find 행정동 (region_type: "H")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const region = json.documents?.find((d: any) => d.region_type === 'H');
  if (!region) return null;

  const name: string = region.region_3depth_name; // 동 이름
  const city: string = region.region_1depth_name; // 시/도
  const district: string = region.region_2depth_name; // 구

  // Check if this neighborhood already exists in our DB
  const { data: existing } = await supabase
    .from('neighborhoods')
    .select('*')
    .eq('name', name)
    .eq('city', city)
    .eq('district', district)
    .maybeSingle();

  if (existing) return existing as Neighborhood;

  // Auto-insert new neighborhood
  const { data: inserted, error } = await supabase
    .from('neighborhoods')
    .insert({ name, city, district })
    .select()
    .single();

  if (error) throw error;
  return inserted as Neighborhood;
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
