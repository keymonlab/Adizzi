import { useQuery } from '@tanstack/react-query';
import { getPost } from '@/services/posts.service';

export function usePost(id: string) {
  const { data: post, isLoading, error, refetch } = useQuery({
    queryKey: ['post', id],
    queryFn: () => getPost(id),
    enabled: !!id,
  });

  return { post, isLoading, error, refetch };
}
