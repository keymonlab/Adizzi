import { supabase } from '@/lib/supabase';
import type { Category } from '@/types/app.types';
import type { Database } from '@/types/database.types';

type LostAlertRow = Database['public']['Tables']['lost_alerts']['Row'];

export type LostAlert = LostAlertRow;

export interface CreateLostAlertData {
  category: Category;
  keywords: string[];
  neighborhood_id: string;
}

export interface UpdateLostAlertData {
  category?: Category;
  keywords?: string[];
  active?: boolean;
}

/**
 * Create a new lost alert for the user
 */
export async function createAlert(
  data: CreateLostAlertData,
  userId: string,
): Promise<LostAlert> {
  const { data: alert, error } = await supabase
    .from('lost_alerts')
    .insert({
      user_id: userId,
      category: data.category,
      keywords: data.keywords,
      neighborhood_id: data.neighborhood_id,
      active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return alert as LostAlert;
}

/**
 * List all alerts for a specific user, ordered by creation date (descending)
 */
export async function listMyAlerts(userId: string): Promise<LostAlert[]> {
  const { data, error } = await supabase
    .from('lost_alerts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as LostAlert[];
}

/**
 * Update a lost alert
 */
export async function updateAlert(
  id: string,
  data: UpdateLostAlertData,
): Promise<void> {
  const update: Record<string, unknown> = {};

  if (data.category !== undefined) {
    update.category = data.category;
  }
  if (data.keywords !== undefined) {
    update.keywords = data.keywords;
  }
  if (data.active !== undefined) {
    update.active = data.active;
  }

  const { error } = await supabase
    .from('lost_alerts')
    .update(update)
    .eq('id', id);

  if (error) throw error;
}

/**
 * Toggle the active status of an alert
 */
export async function toggleAlert(id: string, active: boolean): Promise<void> {
  const { error } = await supabase
    .from('lost_alerts')
    .update({ active } as Record<string, unknown>)
    .eq('id', id);

  if (error) throw error;
}

/**
 * Hard delete a lost alert
 */
export async function deleteAlert(id: string): Promise<void> {
  const { error } = await supabase.from('lost_alerts').delete().eq('id', id);

  if (error) throw error;
}
