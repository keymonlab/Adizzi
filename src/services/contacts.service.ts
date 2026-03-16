import { supabase } from '@/lib/supabase';
import type { PhoneContact } from '@/lib/contacts';

export interface MatchedContact {
  user_id: string;
  handle: string;
  display_name: string;
  avatar_url: string | null;
  contact_name: string;
}

// Sync contacts via edge function (server-side HMAC hashing)
export async function syncContacts(contacts: PhoneContact[]): Promise<MatchedContact[]> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  // Send max 500 contacts
  const batch = contacts.slice(0, 500);

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/sync-contacts`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ contacts: batch }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to sync contacts');
  }

  const result = await response.json();
  return result.matches ?? [];
}

// Get previously matched contacts from DB
export async function getMatchedContacts(userId: string): Promise<MatchedContact[]> {
  const { data, error } = await supabase
    .from('contacts_matches')
    .select(`
      contact_name,
      matched_user:matched_user_id(
        id,
        handle,
        display_name,
        avatar_url
      )
    `)
    .eq('user_id', userId);

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    user_id: row.matched_user.id,
    handle: row.matched_user.handle,
    display_name: row.matched_user.display_name,
    avatar_url: row.matched_user.avatar_url,
    contact_name: row.contact_name,
  }));
}
