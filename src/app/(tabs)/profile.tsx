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
import { useAuth } from '@/hooks/useAuth';
import { useMyPosts } from '@/hooks/useMyPosts';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PostCard } from '@/components/feed/PostCard';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, ScreenPadding, Spacing } from '@/constants/layout';
import type { PostWithAuthor } from '@/services/posts.service';

interface SettingsItemProps {
  label: string;
  onPress: () => void;
}

function SettingsItem({ label, onPress }: SettingsItemProps) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { profile, signOut } = useAuth();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useMyPosts(
    profile?.id ?? ''
  );

  const posts = data?.posts ?? [];
  const postCount = posts.length;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const renderPost = useCallback(
    ({ item }: { item: PostWithAuthor }) => (
      <PostCard
        post={item}
        onPress={() => router.push(`/post/${item.id}`)}
      />
    ),
    []
  );

  const renderHeader = () => (
    <>
      {/* Profile section */}
      <View style={styles.profileCard}>
        <Avatar
          uri={profile?.avatar_url}
          name={profile?.display_name}
          size="lg"
        />
        <Text style={styles.displayName}>{profile?.display_name}</Text>
        <Text style={styles.handle}>@{profile?.handle}</Text>
        {profile?.neighborhood_id ? (
          <Text style={styles.neighborhood}>📍 내 동네</Text>
        ) : null}
        <View style={styles.statsRow}>
          <Text style={styles.statText}>게시물 {postCount}개</Text>
        </View>
      </View>

      <View style={styles.divider} />

      {/* Settings section */}
      <View style={styles.settingsSection}>
        <SettingsItem
          label="프로필 수정"
          onPress={() => router.push('/settings/edit-profile')}
        />
        <View style={styles.itemDivider} />
        <SettingsItem
          label="동네 설정"
          onPress={() => router.push('/settings/neighborhood')}
        />
        <View style={styles.itemDivider} />
        <SettingsItem
          label="분실물 알림"
          onPress={() => router.push('/settings/lost-alerts')}
        />
        <View style={styles.itemDivider} />
        <SettingsItem
          label="연락처 동기화"
          onPress={() => router.push('/settings/contacts')}
        />
      </View>

      <View style={styles.divider} />

      {/* My posts section header */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>내 게시물</Text>
      </View>

      {isLoading ? <LoadingSpinner /> : null}
    </>
  );

  const renderEmpty = () =>
    !isLoading ? (
      <EmptyState
        icon="📭"
        title="아직 작성한 게시물이 없어요"
        message="첫 번째 게시물을 작성해 보세요"
      />
    ) : null;

  const renderFooter = () =>
    isFetchingNextPage ? (
      <View style={styles.footerSpinner}>
        <LoadingSpinner />
      </View>
    ) : null;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>내 프로필</Text>
      </View>

      <FlatList
        data={posts as PostWithAuthor[]}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.postSeparator} />}
        ListFooterComponentStyle={styles.listFooter}
      />

      {/* Logout button */}
      <View style={styles.logoutContainer}>
        <Button
          title="로그아웃"
          onPress={signOut}
          variant="danger"
          size="lg"
          style={styles.logoutButton}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    paddingHorizontal: ScreenPadding,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: ScreenPadding,
    gap: Spacing.xs,
  },
  displayName: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  handle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  neighborhood: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.lg,
  },
  statText: {
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: ScreenPadding,
  },
  settingsSection: {
    backgroundColor: Colors.surface,
    marginHorizontal: ScreenPadding,
    marginVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  settingsLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  chevron: {
    fontSize: FontSize.xl,
    color: Colors.textMuted,
    lineHeight: FontSize.xl * 1.2,
  },
  itemDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginLeft: Spacing.md,
  },
  sectionHeader: {
    paddingHorizontal: ScreenPadding,
    paddingVertical: Spacing.md,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  postSeparator: {
    height: Spacing.sm,
  },
  listFooter: {
    paddingBottom: Spacing.lg,
  },
  footerSpinner: {
    height: 60,
  },
  logoutContainer: {
    paddingHorizontal: ScreenPadding,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.background,
  },
  logoutButton: {
    width: '100%',
  },
});
