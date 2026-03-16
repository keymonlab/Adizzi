import React, { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export function RealtimeProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const { user, profile, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // Subscribe to new notifications for this user
    const notificationsChannel = supabase
      .channel('notifications-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
          queryClient.invalidateQueries({ queryKey: ['unreadCount'] });
        }
      )
      .subscribe();

    // Subscribe to posts in user's neighborhood
    const neighborhoodId = profile?.neighborhood_id;
    let postsChannel: ReturnType<typeof supabase.channel> | null = null;

    if (neighborhoodId) {
      postsChannel = supabase
        .channel('posts-realtime')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'posts',
            filter: `neighborhood_id=eq.${neighborhoodId}`,
          },
          (payload) => {
            queryClient.invalidateQueries({ queryKey: ['posts', neighborhoodId] });
            if (payload.eventType === 'UPDATE' && payload.new?.id) {
              queryClient.invalidateQueries({ queryKey: ['post', payload.new.id] });
            }
          }
        )
        .subscribe();
    }

    // Subscribe to comments on posts (for detail screens)
    const commentsChannel = supabase
      .channel('comments-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
        },
        (payload) => {
          const newRecord = payload.new as Record<string, any>;
          if (newRecord?.post_id) {
            queryClient.invalidateQueries({ queryKey: ['comments', newRecord.post_id] });
            queryClient.invalidateQueries({ queryKey: ['post', newRecord.post_id] });
            queryClient.invalidateQueries({ queryKey: ['posts'] });
          }
        }
      )
      .subscribe();

    // Subscribe to claims updates (for post authors)
    const claimsChannel = supabase
      .channel('claims-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'claims',
        },
        (payload) => {
          const newRecord = payload.new as Record<string, any>;
          if (newRecord?.post_id) {
            queryClient.invalidateQueries({ queryKey: ['claims', newRecord.post_id] });
            queryClient.invalidateQueries({ queryKey: ['myClaim'] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsChannel);
      if (postsChannel) supabase.removeChannel(postsChannel);
      supabase.removeChannel(commentsChannel);
      supabase.removeChannel(claimsChannel);
    };
  }, [isAuthenticated, user?.id, profile?.neighborhood_id, queryClient]);

  return <>{children}</>;
}
