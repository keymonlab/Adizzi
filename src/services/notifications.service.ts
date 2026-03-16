import { supabase } from '@/lib/supabase';
import { NOTIFICATIONS_PAGE_SIZE } from '@/constants/config';
import type { Database } from '@/types/database.types';

export type NotificationWithActor = Database['public']['Tables']['notifications']['Row'] & {
  actor: {
    display_name: string;
    handle: string;
    avatar_url: string | null;
  } | null;
  post: {
    title: string;
  } | null;
};

export type NotificationsCursorPaginationResult = {
  data: NotificationWithActor[];
  nextCursor?: {
    created_at: string;
    id: string;
  };
};

export async function listNotifications(
  userId: string,
  cursor?: { created_at: string; id: string }
): Promise<NotificationsCursorPaginationResult> {
  let query = supabase
    .from('notifications')
    .select(
      `
      id,
      recipient_id,
      type,
      post_id,
      actor_id,
      read,
      created_at,
      updated_at,
      actor:actor_id (
        display_name,
        handle,
        avatar_url
      ),
      post:post_id (
        title
      )
    `
    )
    .eq('recipient_id', userId)
    .order('created_at', { ascending: false })
    .limit(NOTIFICATIONS_PAGE_SIZE + 1);

  if (cursor) {
    query = query.lt('created_at', cursor.created_at).or(
      `created_at.eq.${cursor.created_at},id.lt.${cursor.id}`
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list notifications: ${error.message}`);
  }

  if (!data) {
    return { data: [] };
  }

  const hasMore = data.length > NOTIFICATIONS_PAGE_SIZE;
  const notifications = hasMore ? data.slice(0, NOTIFICATIONS_PAGE_SIZE) : data;

  const result: NotificationsCursorPaginationResult = {
    data: notifications as NotificationWithActor[],
  };

  if (hasMore && notifications.length > 0) {
    const lastNotification = notifications[notifications.length - 1] as NotificationWithActor;
    result.nextCursor = {
      created_at: lastNotification.created_at,
      id: lastNotification.id,
    };
  }

  return result;
}

export async function markRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to mark notification as read: ${error.message}`);
  }
}

export async function markAllRead(userId: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ read: true })
    .eq('recipient_id', userId)
    .eq('read', false);

  if (error) {
    throw new Error(`Failed to mark all notifications as read: ${error.message}`);
  }
}

export async function getUnreadCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('recipient_id', userId)
    .eq('read', false);

  if (error) {
    throw new Error(`Failed to get unread count: ${error.message}`);
  }

  return count ?? 0;
}
