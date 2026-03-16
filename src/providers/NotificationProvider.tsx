import React, { createContext, useContext, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { registerForPushNotifications, savePushToken } from '@/lib/notifications';
import { useAuth } from '@/hooks/useAuth';

interface NotificationContextValue {
  // For future expansion (e.g., local notification triggers)
}

const NotificationContext = createContext<NotificationContextValue>({});

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const notificationListener = useRef<Notifications.EventSubscription | undefined>(undefined);
  const responseListener = useRef<Notifications.EventSubscription | undefined>(undefined);

  // Register and save token when authenticated
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (Platform.OS === 'web') return;

    registerForPushNotifications().then((token) => {
      if (token && user.id) {
        savePushToken(user.id, token).catch(console.error);
      }
    });
  }, [isAuthenticated, user]);

  // Listen for notifications received while app is foregrounded
  useEffect(() => {
    if (Platform.OS === 'web') return;

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      // Could update unread count badge here
      console.log('Notification received:', notification);
    });

    // Handle notification tap (navigate to relevant screen)
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data;
      if (data?.post_id) {
        router.push(`/post/${data.post_id}`);
      } else {
        router.push('/(tabs)/notifications');
      }
    });

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <NotificationContext.Provider value={{}}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotificationContext() {
  return useContext(NotificationContext);
}
