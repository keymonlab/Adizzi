import { supabase } from '@/lib/supabase';
import { COMMENTS_PAGE_SIZE } from '@/constants/config';
import type { Database } from '@/types/database.types';

export type Comment = Database['public']['Tables']['comments']['Row'] & {
  author?: {
    id: string;
    handle: string;
    display_name: string;
    avatar_url: string | null;
  };
};

export type CommentCursor = {
  created_at: string;
  id: string;
};

export interface CreateCommentData {
  post_id: string;
  content: string;
  mentions?: string[];
}

/**
 * Create a new comment on a post
 */
export async function createComment(
  data: CreateCommentData
): Promise<Comment> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('User not authenticated');
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      post_id: data.post_id,
      author_id: user.id,
      content: data.content,
      mentions: data.mentions || [],
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create comment: ${error.message}`);
  }

  return comment as Comment;
}

/**
 * List comments for a post with cursor pagination
 */
export async function listComments(
  postId: string,
  cursor?: CommentCursor
): Promise<{ data: Comment[]; nextCursor?: CommentCursor }> {
  let query = supabase
    .from('comments')
    .select(
      `
      *,
      author:author_id(
        id,
        handle,
        display_name,
        avatar_url
      )
    `
    )
    .eq('post_id', postId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })
    .limit(COMMENTS_PAGE_SIZE + 1); // +1 to check if there are more

  if (cursor) {
    query = query.gt('created_at', cursor.created_at).or(
      `created_at.eq.${cursor.created_at},id.gt.${cursor.id}`,
      { referencedTable: 'comments' }
    );
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to list comments: ${error.message}`);
  }

  if (!data) {
    return { data: [] };
  }

  // Check if there are more results
  let hasMore = false;
  let comments = data as Comment[];

  if (data.length > COMMENTS_PAGE_SIZE) {
    hasMore = true;
    comments = data.slice(0, COMMENTS_PAGE_SIZE);
  }

  const nextCursor =
    hasMore && comments.length > 0
      ? {
          created_at: comments[comments.length - 1].created_at,
          id: comments[comments.length - 1].id,
        }
      : undefined;

  return { data: comments, nextCursor };
}

/**
 * Soft delete a comment (mark as deleted without removing)
 */
export async function softDeleteComment(id: string): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete comment: ${error.message}`);
  }
}
