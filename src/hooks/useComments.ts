import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import {
  createComment,
  listComments,
  softDeleteComment,
  type Comment,
  type CommentCursor,
  type CreateCommentData,
} from '@/services/comments.service';

const COMMENTS_QUERY_KEY = 'comments';

/**
 * Hook to fetch comments with infinite cursor pagination
 */
export function useComments(postId: string) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: [COMMENTS_QUERY_KEY, postId],
    queryFn: async ({ pageParam }: { pageParam?: CommentCursor }) => {
      return listComments(postId, pageParam);
    },
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  // Flatten pages into single array of comments
  const comments = data?.pages.flatMap((page) => page.data) ?? [];

  return {
    comments,
    fetchNextPage,
    hasNextPage: !!hasNextPage,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
  };
}

/**
 * Hook to create a new comment
 */
export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCommentData) => createComment(data),
    onSuccess: (newComment) => {
      // Invalidate comments query to refetch
      queryClient.invalidateQueries({
        queryKey: [COMMENTS_QUERY_KEY, newComment.post_id],
      });
    },
  });
}

/**
 * Hook to delete a comment
 */
export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (commentId: string) => softDeleteComment(commentId),
    onSuccess: (_, commentId) => {
      // Invalidate all comments queries to refetch
      queryClient.invalidateQueries({
        queryKey: [COMMENTS_QUERY_KEY],
      });
    },
  });
}
