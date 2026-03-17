import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { FontSize, ScreenPadding, Spacing } from '@/constants/layout';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { CategoryFilter } from '@/components/feed/CategoryFilter';
import { PostList } from '@/components/feed/PostList';
import type { Category } from '@/types/app.types';

export default function HomeScreen() {
  const { profile } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<Category | undefined>(undefined);

  const neighborhoodId = profile?.neighborhood_id ?? '';

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = usePosts(neighborhoodId, selectedCategory);

  const posts = data?.posts ?? [];

  const handlePostPress = (postId: string) => {
    router.push(`/post/${postId}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerGreeting}>
              안녕하세요
            </Text>
            <Text style={styles.headerTitle}>우리 동네</Text>
          </View>
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>어디찌</Text>
          </View>
        </View>
        {profile?.neighborhood_id ? (
          <Text style={styles.headerSub}>내 동네 분실물</Text>
        ) : null}
      </View>

      {/* Category filter */}
      <CategoryFilter
        selectedCategory={selectedCategory}
        onSelect={setSelectedCategory}
      />

      {/* Feed */}
      <PostList
        posts={posts}
        isLoading={isLoading}
        isError={isError}
        error={error as Error | null}
        fetchNextPage={fetchNextPage}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        refetch={refetch}
        onPostPress={handlePostPress}
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
    paddingHorizontal: ScreenPadding,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerGreeting: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: FontSize.title,
    fontWeight: '800',
    color: Colors.text,
  },
  headerBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
    borderRadius: Spacing.sm + 4,
  },
  headerBadgeText: {
    color: Colors.white,
    fontSize: FontSize.sm,
    fontWeight: '800',
  },
  headerSub: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: 4,
  },
});
