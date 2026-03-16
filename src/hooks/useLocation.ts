import { useState, useCallback } from 'react';
import { requestLocationPermission, getCurrentPosition } from '@/lib/location';

interface LocationState {
  latitude: number;
  longitude: number;
}

interface UseLocationResult {
  location: LocationState | null;
  loading: boolean;
  error: string | null;
  hasPermission: boolean | null;
  requestLocation: () => Promise<void>;
}

export function useLocation(): UseLocationResult {
  const [location, setLocation] = useState<LocationState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const granted = await requestLocationPermission();
      setHasPermission(granted);

      if (!granted) {
        setError('Location permission denied');
        return;
      }

      const coords = await getCurrentPosition();
      setLocation(coords);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get location');
    } finally {
      setLoading(false);
    }
  }, []);

  return { location, loading, error, hasPermission, requestLocation };
}
