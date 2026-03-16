import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listPosts,
  createPost,
  updatePostStatus,
  type CreatePostData,
} from '@/services/posts.service';
import { supabase } from '@/lib/supabase';
import type { Category, PostStatus } from '@/types/app.types';

export function usePosts(neighborhoodId: string, category?: Category) {
  return useInfiniteQuery({
    queryKey: ['posts', neighborhoodId, category],
    queryFn: ({ pageParam }) =>
      listPosts({
        neighborhoodId,
        category,
        cursor: pageParam as { created_at: string; id: string } | undefined,
      }),
    initialPageParam: undefined as { created_at: string; id: string } | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => ({
      ...data,
      posts: data.pages.flatMap((page) => page.data),
    }),
    enabled: !!neighborhoodId,
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      data,
      authorId,
    }: {
      data: CreatePostData;
      authorId: string;
    }) => createPost(data, authorId),
    onSuccess: (post, { data }) => {
      queryClient.invalidateQueries({
        queryKey: ['posts', data.neighborhood_id],
      });
      // Fire-and-forget: trigger lost alert matching for the new post
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (!session) return;
        fetch(
          `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/match-lost-alerts`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ post_id: post.id }),
          },
        ).catch(() => {
          // Non-fatal: ignore errors from lost alert matching
        });
      });
    },
  });
}

export function useUpdatePostStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: PostStatus }) =>
      updatePostStatus(id, status),
    onSuccess: (_void, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      queryClient.invalidateQueries({ queryKey: ['post', id] });
    },
  });
}
