import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  createAlert,
  deleteAlert,
  listMyAlerts,
  toggleAlert,
  updateAlert,
  type CreateLostAlertData,
  type LostAlert,
  type UpdateLostAlertData,
} from '@/services/lost-alerts.service';

const LOST_ALERTS_QUERY_KEY = 'lost-alerts';

/**
 * Hook to fetch user's lost alerts
 */
export function useLostAlerts(userId: string) {
  const { data: alerts = [], isLoading, refetch } = useQuery({
    queryKey: [LOST_ALERTS_QUERY_KEY, userId],
    queryFn: () => listMyAlerts(userId),
    enabled: !!userId,
  });

  return {
    alerts,
    isLoading,
    refetch,
  };
}

/**
 * Hook to create a new lost alert
 */
export function useCreateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateLostAlertData & { userId: string }) => {
      const { userId, ...alertData } = data;
      return createAlert(alertData, userId);
    },
    onSuccess: (newAlert) => {
      // Invalidate the user's alerts query
      queryClient.invalidateQueries({
        queryKey: [LOST_ALERTS_QUERY_KEY, newAlert.user_id],
      });
    },
  });
}

/**
 * Hook to update a lost alert
 */
export function useUpdateAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; updates: UpdateLostAlertData; userId: string }) => {
      return updateAlert(data.id, data.updates);
    },
    onSuccess: (_, { userId }) => {
      // Invalidate the user's alerts query
      queryClient.invalidateQueries({
        queryKey: [LOST_ALERTS_QUERY_KEY, userId],
      });
    },
  });
}

/**
 * Hook to toggle an alert's active status
 */
export function useToggleAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; active: boolean; userId: string }) => {
      return toggleAlert(data.id, data.active);
    },
    onSuccess: (_, { userId }) => {
      // Invalidate the user's alerts query
      queryClient.invalidateQueries({
        queryKey: [LOST_ALERTS_QUERY_KEY, userId],
      });
    },
  });
}

/**
 * Hook to delete a lost alert
 */
export function useDeleteAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { id: string; userId: string }) => {
      return deleteAlert(data.id);
    },
    onSuccess: (_, { userId }) => {
      // Invalidate the user's alerts query
      queryClient.invalidateQueries({
        queryKey: [LOST_ALERTS_QUERY_KEY, userId],
      });
    },
  });
}
