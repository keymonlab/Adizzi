import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  listNotifications,
  markRead,
  markAllRead,
  getUnreadCount,
  type NotificationWithActor,
  type NotificationsCursorPaginationResult,
} from '@/services/notifications.service';

const NOTIFICATIONS_QUERY_KEY = 'notifications';
const UNREAD_COUNT_QUERY_KEY = 'unreadCount';

export interface UseNotificationsResult {
  notifications: NotificationWithActor[];
  fetchNextPage: () => Promise<void>;
  hasNextPage: boolean | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

export function useNotifications(userId: string): UseNotificationsResult {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isLoading,
    isError,
    error,
    refetch,
  } = useInfiniteQuery({
    queryKey: [NOTIFICATIONS_QUERY_KEY, userId],
    queryFn: async ({ pageParam }) => {
      return listNotifications(userId, pageParam);
    },
    initialPageParam: undefined as
      | { created_at: string; id: string }
      | undefined,
    getNextPageParam: (lastPage: NotificationsCursorPaginationResult) => {
      return lastPage.nextCursor;
    },
    staleTime: 30000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes (formerly cacheTime)
  });

  const notifications = data?.pages.flatMap((page) => page.data) ?? [];

  return {
    notifications,
    fetchNextPage: async () => {
      await fetchNextPage();
    },
    hasNextPage,
    isLoading,
    isError,
    error: error as Error | null,
    refetch: async () => {
      await refetch();
    },
  };
}

export interface UseUnreadCountResult {
  unreadCount: number;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}

export function useUnreadCount(userId: string): UseUnreadCountResult {
  const { data = 0, isLoading, isError, error } = useQuery({
    queryKey: [UNREAD_COUNT_QUERY_KEY, userId],
    queryFn: () => getUnreadCount(userId),
    refetchInterval: 30000, // 30 seconds polling
    staleTime: 10000, // 10 seconds
  });

  return {
    unreadCount: data,
    isLoading,
    isError,
    error: error as Error | null,
  };
}

export interface UseMarkReadResult {
  markAsRead: (id: string) => Promise<void>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}

export function useMarkRead(): UseMarkReadResult {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: (id: string) => markRead(id),
    onSuccess: (_, variables) => {
      // Invalidate both notifications and unread count queries
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_QUERY_KEY] });
    },
  });

  return {
    markAsRead: mutateAsync,
    isPending,
    isError,
    error: error as Error | null,
  };
}

export interface UseMarkAllReadResult {
  markAllAsRead: (userId: string) => Promise<void>;
  isPending: boolean;
  isError: boolean;
  error: Error | null;
}

export function useMarkAllRead(): UseMarkAllReadResult {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: (userId: string) => markAllRead(userId),
    onSuccess: () => {
      // Invalidate both notifications and unread count queries
      queryClient.invalidateQueries({ queryKey: [NOTIFICATIONS_QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: [UNREAD_COUNT_QUERY_KEY] });
    },
  });

  return {
    markAllAsRead: mutateAsync,
    isPending,
    isError,
    error: error as Error | null,
  };
}
