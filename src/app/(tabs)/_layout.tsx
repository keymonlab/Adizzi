import { Tabs } from 'expo-router';
import { View, Text } from 'react-native';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useNotifications';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';
import { Colors } from '@/constants/colors';

const TabIcon = ({ name, color }: { name: string; color: string }) => (
  <View style={{ alignItems: 'center', justifyContent: 'center' }}>
    <Text style={{ fontSize: 20, color }}>
      {name === 'Home' && '🏠'}
      {name === 'Map' && '🗺️'}
      {name === 'Create' && '➕'}
      {name === 'Notifications' && '🔔'}
      {name === 'Profile' && '👤'}
    </Text>
  </View>
);

function NotificationsTabIcon({ color }: { color: string }) {
  const { user } = useAuth();
  const { unreadCount } = useUnreadCount(user?.id ?? '');

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <View>
        <Text style={{ fontSize: 20, color }}>🔔</Text>
        <NotificationBadge count={unreadCount} />
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon name="Home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color }) => <TabIcon name="Map" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color }) => <TabIcon name="Create" color={color} />,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color }) => <NotificationsTabIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon name="Profile" color={color} />,
        }}
      />
    </Tabs>
  );
}
