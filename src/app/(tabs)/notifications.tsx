import React, { useCallback } from 'react';
import {
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import {
  useNotifications,
  useMarkRead,
  useMarkAllRead,
} from '@/hooks/useNotifications';
import { NotificationItem } from '@/components/notifications/NotificationItem';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import type { NotificationWithActor } from '@/services/notifications.service';

export default function NotificationsScreen() {
  const { user } = useAuth();
  const userId = user?.id ?? '';

  const { notifications, fetchNextPage, hasNextPage, isLoading, refetch } =
    useNotifications(userId);
  const { markAsRead } = useMarkRead();
  const { markAllAsRead, isPending: isMarkingAll } = useMarkAllRead();

  const handlePress = useCallback(
    async (notification: NotificationWithActor) => {
      if (!notification.read) {
        await markAsRead(notification.id);
      }
      if (notification.post_id) {
        router.push(`/post/${notification.post_id}`);
      }
    },
    [markAsRead]
  );

  const handleMarkAllRead = useCallback(async () => {
    if (userId) {
      await markAllAsRead(userId);
    }
  }, [markAllAsRead, userId]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage]);

  const renderItem = useCallback(
    ({ item }: { item: NotificationWithActor }) => (
      <NotificationItem
        notification={item}
        onPress={() => handlePress(item)}
      />
    ),
    [handlePress]
  );

  const keyExtractor = useCallback(
    (item: NotificationWithActor) => item.id,
    []
  );

  const ItemSeparator = useCallback(
    () => <View style={styles.separator} />,
    []
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>알림</Text>
        <TouchableOpacity
          onPress={handleMarkAllRead}
          disabled={isMarkingAll || notifications.length === 0}
          style={styles.markAllButton}
        >
          <Text
            style={[
              styles.markAllText,
              (isMarkingAll || notifications.length === 0) &&
                styles.markAllTextDisabled,
            ]}
          >
            모두 읽음
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={notifications}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ItemSeparatorComponent={ItemSeparator}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        onRefresh={refetch}
        refreshing={isLoading}
        contentContainerStyle={
          notifications.length === 0 ? styles.emptyContent : undefined
        }
        ListEmptyComponent={
          <EmptyState
            icon="🔔"
            title="새로운 알림이 없어요"
            message="활동이 생기면 여기에 알림이 표시됩니다"
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  markAllButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  markAllText: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  markAllTextDisabled: {
    color: Colors.textMuted,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: 16 + 8 + 40 + 12, // typeDot margin + dot width + avatar width + avatar margin
  },
  emptyContent: {
    flex: 1,
  },
});
