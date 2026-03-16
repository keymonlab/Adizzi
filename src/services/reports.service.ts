import { supabase } from '@/lib/supabase';

export type ReportTargetType = 'post' | 'comment';
export type ReportReason = 'spam' | 'inappropriate' | 'fraud' | 'harassment' | 'other';

export async function createReport(data: {
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  description?: string;
}): Promise<void> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('reports')
    .insert({
      reporter_id: user.id,
      post_id: data.target_type === 'post' ? data.target_id : null,
      comment_id: data.target_type === 'comment' ? data.target_id : null,
      reason: data.reason,
    });

  if (error) throw error;
}
