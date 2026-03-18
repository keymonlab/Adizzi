import React, { useCallback } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { FontSize, Spacing } from '@/constants/layout';
import { EmptyState } from '@/components/ui/EmptyState';
import { PostCard } from './PostCard';
import type { PostWithAuthor } from '@/services/posts.service';

interface PostListProps {
  posts: PostWithAuthor[];
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  fetchNextPage: () => void;
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  refetch: () => void;
  onPostPress: (postId: string) => void;
}

function ListFooter({ isFetchingNextPage }: { isFetchingNextPage: boolean }) {
  if (!isFetchingNextPage) return null;
  return (
    <View style={styles.footer}>
      <ActivityIndicator size="small" color={Colors.primary} />
    </View>
  );
}

export function PostList({
  posts,
  isLoading,
  isError,
  error,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  refetch,
  onPostPress,
}: PostListProps) {
  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  if (isLoading && posts.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>
          {error?.message ?? '게시물을 불러오지 못했어요.'}
        </Text>
        <Text style={styles.retryText} onPress={() => refetch()}>
          다시 시도
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <PostCard post={item} onPress={() => onPostPress(item.id)} />
      )}
      contentContainerStyle={posts.length === 0 ? styles.emptyContainer : styles.listContent}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      ListEmptyComponent={
        <EmptyState
          icon="search-outline"
          title="아직 게시물이 없어요"
          message="우리 동네 첫 분실물을 등록해 보세요!"
        />
      }
      ListFooterComponent={<ListFooter isFetchingNextPage={isFetchingNextPage} />}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor={Colors.white}
          colors={[Colors.primary]}
        />
      }
      onEndReached={handleEndReached}
      onEndReachedThreshold={0.5}
    />
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  emptyContainer: {
    flexGrow: 1,
  },
  listContent: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  separator: {
    height: Spacing.sm,
  },
  footer: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  retryText: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: '600',
  },
});
