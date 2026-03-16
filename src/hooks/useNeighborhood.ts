import { useQuery } from '@tanstack/react-query';
import {
  getById,
  listAll,
  findByCoordinates,
  type Neighborhood,
} from '@/services/neighborhoods.service';

export function useNeighborhood(id?: string) {
  return useQuery<Neighborhood | null>({
    queryKey: ['neighborhood', id],
    queryFn: () => getById(id!),
    enabled: !!id,
  });
}

export function useNeighborhoods() {
  return useQuery({
    queryKey: ['neighborhoods'],
    queryFn: listAll,
  });
}

export function useNeighborhoodByLocation(lat?: number, lng?: number) {
  return useQuery<Neighborhood | null>({
    queryKey: ['neighborhood', 'location', lat, lng],
    queryFn: () => findByCoordinates(lat!, lng!),
    enabled: lat !== undefined && lng !== undefined,
  });
}
