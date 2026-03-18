import { Slot } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/providers/AuthProvider';
import { NotificationProvider } from '@/providers/NotificationProvider';
import { RealtimeProvider } from '@/providers/RealtimeProvider';
import { AnimatedSplash } from '@/components/ui/AnimatedSplash';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useCallback, useState } from 'react';
import { View } from 'react-native';
import { createSessionFromUrl } from '@/services/auth.service';

SplashScreen.preventAutoHideAsync();

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
  const [showSplash, setShowSplash] = useState(true);
  const onLayoutRootView = useCallback(async () => {
    await SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    if (url) {
      createSessionFromUrl(url).catch(console.error);
    }
  }, [url]);

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <NotificationProvider>
              <RealtimeProvider>
                <StatusBar style="dark" />
                <Slot />
                {showSplash && (
                  <AnimatedSplash onFinish={() => setShowSplash(false)} />
                )}
              </RealtimeProvider>
            </NotificationProvider>
          </AuthProvider>
        </QueryClientProvider>
      </View>
    </SafeAreaProvider>
  );
}
