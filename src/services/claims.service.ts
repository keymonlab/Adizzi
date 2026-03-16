import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database.types';

type ClaimRow = Database['public']['Tables']['claims']['Row'];

export type ClaimWithClaimant = ClaimRow & {
  claimant: {
    id: string;
    handle: string;
    display_name: string;
    avatar_url: string | null;
  };
};

// Submit a claim (calls verify-claim edge function)
export async function submitClaim(
  postId: string,
  answer?: string,
): Promise<{ success: boolean; message: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  const response = await fetch(
    `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/verify-claim`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ post_id: postId, answer }),
    },
  );

  const result = await response.json();
  if (!response.ok) {
    return { success: false, message: result.error || '인증에 실패했어요' };
  }
  return { success: true, message: result.message || '인증되었어요!' };
}

// Get claims for a post (for post author)
export async function getClaimsForPost(postId: string): Promise<ClaimWithClaimant[]> {
  const { data, error } = await supabase
    .from('claims')
    .select(`*, claimant:claimant_id(id, handle, display_name, avatar_url)`)
    .eq('post_id', postId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as ClaimWithClaimant[];
}

// Get my claim for a specific post
export async function getMyClaimForPost(
  postId: string,
  userId: string,
): Promise<ClaimRow | null> {
  const { data, error } = await supabase
    .from('claims')
    .select('*')
    .eq('post_id', postId)
    .eq('claimant_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data as ClaimRow | null;
}

// Approve claim (for post author) - sets post to resolved
export async function approveClaim(claimId: string, postId: string): Promise<void> {
  // Verify claim belongs to this post
  const { data: claim, error: fetchError } = await supabase
    .from('claims')
    .select('post_id')
    .eq('id', claimId)
    .single();

  if (fetchError || !claim) throw new Error('Claim not found');
  if ((claim as any).post_id !== postId) throw new Error('Claim does not belong to this post');

  // Update claim status
  const { error: claimError } = await supabase
    .from('claims')
    .update({ status: 'verified' as const })
    .eq('id', claimId);
  if (claimError) throw claimError;

  // Update post status - rollback claim if this fails
  const { error: postError } = await supabase
    .from('posts')
    .update({ status: 'resolved' as const })
    .eq('id', postId);

  if (postError) {
    // Rollback claim status
    await supabase.from('claims').update({ status: 'pending' as const }).eq('id', claimId);
    throw postError;
  }
}

// Reject claim
export async function rejectClaim(claimId: string): Promise<void> {
  const { error } = await supabase
    .from('claims')
    .update({ status: 'rejected' })
    .eq('id', claimId);
  if (error) throw error;
}
