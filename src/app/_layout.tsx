import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/providers/AuthProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { RealtimeProvider } from '@/providers/RealtimeProvider';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { Platform } from 'react-native';
import { createSessionFromUrl } from '@/services/auth.service';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
    },
  },
});

export default function RootLayout() {
  const url = Linking.useURL();

  useEffect(() => {
    if (url && Platform.OS !== 'web') {
      createSessionFromUrl(url).catch(console.error);
    }
  }, [url]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <NotificationProvider>
            <RealtimeProvider>
              <StatusBar style="dark" />
              <Slot />
            </RealtimeProvider>
          </NotificationProvider>
        </AuthProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
