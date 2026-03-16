import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  approveClaim,
  getClaimsForPost,
  getMyClaimForPost,
  rejectClaim,
  submitClaim,
} from '@/services/claims.service';

// For post author: list all claims on their post
export function useClaimsForPost(postId: string) {
  return useQuery({
    queryKey: ['claims', 'post', postId],
    queryFn: () => getClaimsForPost(postId),
    enabled: !!postId,
  });
}

// For viewers: check if they already claimed this post
export function useMyClaimForPost(postId: string, userId: string | undefined) {
  return useQuery({
    queryKey: ['claims', 'mine', postId, userId],
    queryFn: () => getMyClaimForPost(postId, userId!),
    enabled: !!postId && !!userId,
  });
}

// Submit a claim
export function useSubmitClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ postId, answer }: { postId: string; answer?: string }) =>
      submitClaim(postId, answer),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['claims', 'mine', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['claims', 'post', variables.postId] });
    },
  });
}

// Approve a claim (post author action)
export function useApproveClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ claimId, postId }: { claimId: string; postId: string }) =>
      approveClaim(claimId, postId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['claims', 'post', variables.postId] });
      queryClient.invalidateQueries({ queryKey: ['post', variables.postId] });
    },
  });
}

// Reject a claim (post author action)
export function useRejectClaim() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ claimId, postId }: { claimId: string; postId: string }) =>
      rejectClaim(claimId).then(() => ({ postId })),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['claims', 'post', result.postId] });
    },
  });
}
