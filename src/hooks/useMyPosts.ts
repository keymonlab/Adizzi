import { useInfiniteQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { FEED_PAGE_SIZE } from '@/constants/config';
import type { Database } from '@/types/database.types';

type PostRow = Database['public']['Tables']['posts']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];

type PostWithAuthor = PostRow & {
  author: Pick<UserRow, 'handle' | 'display_name' | 'avatar_url'>;
  comment_count: number;
};

export function useMyPosts(userId: string) {
  return useInfiniteQuery({
    queryKey: ['myPosts', userId],
    queryFn: async ({ pageParam }) => {
      let query = supabase
        .from('posts')
        .select(`
          *,
          author:users!posts_author_id_fkey(handle, display_name, avatar_url),
          comment_count:comments(count)
        `)
        .eq('author_id', userId)
        .is('deleted_at', null)
        .order('created_at', { ascending: false })
        .limit(FEED_PAGE_SIZE);

      if (pageParam) {
        query = query.or(
          `created_at.lt.${pageParam.created_at},and(created_at.eq.${pageParam.created_at},id.lt.${pageParam.id})`
        );
      }

      const { data, error } = await query;
      if (error) throw error;

      const rows = (data as unknown as Array<PostRow & {
        author: Pick<UserRow, 'handle' | 'display_name' | 'avatar_url'>;
        comment_count: { count: number }[];
      }>).map(({ comment_count, author, ...post }) => ({
        ...post,
        author,
        comment_count: comment_count?.[0]?.count ?? 0,
      }));

      const nextCursor = rows.length === FEED_PAGE_SIZE
        ? { created_at: rows[rows.length - 1].created_at, id: rows[rows.length - 1].id }
        : null;

      return { data: rows as PostWithAuthor[], nextCursor };
    },
    initialPageParam: undefined as { created_at: string; id: string } | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    select: (data) => ({
      ...data,
      posts: data.pages.flatMap((page) => page.data),
    }),
    enabled: !!userId,
  });
}
