import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function IndexRedirect() {
  const { loading, isAuthenticated, isOnboarded, isVerified } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    } else if (!isOnboarded) {
      router.replace('/(auth)/onboarding');
    } else if (!isVerified) {
      router.replace('/(auth)/verify-location');
    } else {
      router.replace('/(tabs)');
    }
  }, [loading, isAuthenticated, isOnboarded, isVerified]);

  return <LoadingSpinner />;
}
