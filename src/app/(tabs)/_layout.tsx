import { Tabs } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useUnreadCount } from '@/hooks/useNotifications';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';
import { Colors } from '@/constants/colors';
import { BorderRadius, Shadow } from '@/constants/layout';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { default: IoniconName; focused: IoniconName }> = {
  Home: { default: 'home-outline', focused: 'home' },
  Map: { default: 'map-outline', focused: 'map' },
  Notifications: { default: 'notifications-outline', focused: 'notifications' },
  Profile: { default: 'person-outline', focused: 'person' },
};

const TabIcon = ({ name, color, focused }: { name: string; color: string; focused: boolean }) => (
  <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
    <Ionicons
      name={focused ? TAB_ICONS[name].focused : TAB_ICONS[name].default}
      size={focused ? 22 : 21}
      color={color}
    />
  </View>
);

function NotificationsTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { user } = useAuth();
  const { unreadCount } = useUnreadCount(user?.id ?? '');

  return (
    <View style={[styles.iconContainer, focused && styles.iconContainerActive]}>
      <View>
        <Ionicons
          name={focused ? 'notifications' : 'notifications-outline'}
          size={focused ? 22 : 21}
          color={color}
        />
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
          borderTopWidth: 0,
          height: 88,
          paddingBottom: 28,
          paddingTop: 8,
          ...Shadow.lg,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',

          tabBarIcon: ({ color, focused }) => <TabIcon name="Home" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="map"
        options={{
          title: 'Map',
          tabBarIcon: ({ color, focused }) => <TabIcon name="Map" color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.createButton}>
              <Ionicons name="add" size={28} color={Colors.white} />
            </View>
          ),
          tabBarLabel: () => null,
          tabBarAccessibilityLabel: 'Create',
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Notifications',
          tabBarIcon: ({ color, focused }) => <NotificationsTabIcon color={color} focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => <TabIcon name="Profile" color={color} focused={focused} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: BorderRadius.lg,
  },
  iconContainerActive: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.lg,
  },
  createButton: {
    backgroundColor: Colors.primary,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    ...Shadow.sm,
  },
});
