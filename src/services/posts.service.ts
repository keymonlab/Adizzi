import { supabase } from '@/lib/supabase';
import { FEED_PAGE_SIZE } from '@/constants/config';
import type { Category, PostStatus, PostType } from '@/types/app.types';
import type { Database } from '@/types/database.types';

type PostRow = Database['public']['Tables']['posts']['Row'];
type UserRow = Database['public']['Tables']['users']['Row'];

export type Post = PostRow;

export type PostWithAuthor = Post & {
  author: Pick<UserRow, 'handle' | 'display_name' | 'avatar_url'>;
  comment_count: number;
};

export interface CreatePostData {
  post_type: PostType;
  title: string;
  description: string;
  category: Category;
  location?: { lat: number; lng: number } | string | null;
  location_name?: string | null;
  image_urls?: string[];
  neighborhood_id: string;
  verification_question?: string | null;
  verification_answer_hash?: string | null;
}

interface ListPostsParams {
  neighborhoodId: string;
  category?: Category;
  status?: PostStatus;
  postType?: PostType;
  cursor?: { created_at: string; id: string };
}

interface ListPostsResult {
  data: PostWithAuthor[];
  nextCursor: { created_at: string; id: string } | null;
}

function toWKT(location: { lat: number; lng: number } | string): string {
  if (typeof location === 'string') return location;
  return `POINT(${location.lng} ${location.lat})`;
}

export async function createPost(
  data: CreatePostData,
  authorId: string,
): Promise<Post> {
  const insert: Database['public']['Tables']['posts']['Insert'] = {
    author_id: authorId,
    post_type: data.post_type,
    neighborhood_id: data.neighborhood_id,
    title: data.title,
    description: data.description,
    category: data.category,
    image_urls: data.image_urls ?? [],
    location: data.location != null ? toWKT(data.location) : null,
    location_name: data.location_name ?? null,
    verification_question: data.verification_question ?? null,
    verification_answer_hash: data.verification_answer_hash ?? null,
  };

  const { data: post, error } = await supabase
    .from('posts')
    .insert(insert)
    .select()
    .single();

  if (error) throw error;
  return post as Post;
}

export async function getPost(id: string): Promise<PostWithAuthor> {
  const { data, error } = await supabase
    .from('posts')
    .select(
      `
      *,
      author:users!posts_author_id_fkey(handle, display_name, avatar_url),
      comment_count:comments(count)
    `,
    )
    .eq('id', id)
    .is('deleted_at', null)
    .single();

  if (error) throw error;

  const { comment_count, author, ...post } = data as unknown as PostRow & {
    author: Pick<UserRow, 'handle' | 'display_name' | 'avatar_url'>;
    comment_count: { count: number }[];
  };

  return {
    ...post,
    author,
    comment_count: comment_count?.[0]?.count ?? 0,
  };
}

export async function listPosts(
  params: ListPostsParams,
): Promise<ListPostsResult> {
  const { neighborhoodId, category, status, cursor } = params;

  let query = supabase
    .from('posts')
    .select(
      `
      *,
      author:users!posts_author_id_fkey(handle, display_name, avatar_url),
      comment_count:comments(count)
    `,
    )
    .eq('neighborhood_id', neighborhoodId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .order('id', { ascending: false })
    .limit(FEED_PAGE_SIZE);

  if (category) {
    query = query.eq('category', category);
  }

  if (status) {
    query = query.eq('status', status);
  }

  if (params.postType) {
    query = query.eq('post_type', params.postType);
  }

  if (cursor) {
    query = query.or(
      `created_at.lt.${cursor.created_at},and(created_at.eq.${cursor.created_at},id.lt.${cursor.id})`,
    );
  }

  const { data, error } = await query;

  if (error) throw error;

  const rows = (
    data as unknown as Array<
      PostRow & {
        author: Pick<UserRow, 'handle' | 'display_name' | 'avatar_url'>;
        comment_count: { count: number }[];
      }
    >
  ).map(({ comment_count, author, ...post }) => ({
    ...post,
    author,
    comment_count: comment_count?.[0]?.count ?? 0,
  }));

  const nextCursor =
    rows.length === FEED_PAGE_SIZE
      ? { created_at: rows[rows.length - 1].created_at, id: rows[rows.length - 1].id }
      : null;

  return { data: rows, nextCursor };
}

export async function updatePostStatus(
  id: string,
  status: PostStatus,
): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .update({ status })
    .eq('id', id);

  if (error) throw error;
}

export async function softDeletePost(id: string): Promise<void> {
  const { error } = await supabase
    .from('posts')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
}
