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
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/hooks/useAuth';
import { useMyPosts } from '@/hooks/useMyPosts';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PostCard } from '@/components/feed/PostCard';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, ScreenPadding, Shadow, Spacing } from '@/constants/layout';
import type { PostWithAuthor } from '@/services/posts.service';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingsItemProps {
  icon: IoniconName;
  label: string;
  onPress: () => void;
}

function SettingsItem({ icon, label, onPress }: SettingsItemProps) {
  return (
    <TouchableOpacity style={styles.settingsItem} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.settingsIconContainer}>
        <Ionicons name={icon} size={18} color={Colors.primary} />
      </View>
      <Text style={styles.settingsLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
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
        <View style={styles.avatarRing}>
          <Avatar
            uri={profile?.avatar_url}
            name={profile?.display_name}
            size="lg"
          />
        </View>
        <Text style={styles.displayName}>{profile?.display_name}</Text>
        <Text style={styles.handle}>@{profile?.handle}</Text>
        {profile?.neighborhood_id ? (
          <View style={styles.locationChip}>
            <Text style={styles.locationText}>내 동네</Text>
          </View>
        ) : null}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{postCount}</Text>
            <Text style={styles.statLabel}>게시물</Text>
          </View>
        </View>
      </View>

      {/* Settings section */}
      <View style={styles.settingsSection}>
        <SettingsItem
          icon="create-outline"
          label="프로필 수정"
          onPress={() => router.push('/settings/edit-profile')}
        />
        <SettingsItem
          icon="location-outline"
          label="동네 설정"
          onPress={() => router.push('/settings/neighborhood')}
        />
        <SettingsItem
          icon="notifications-outline"
          label="분실물 알림"
          onPress={() => router.push('/settings/lost-alerts')}
        />
        <SettingsItem
          icon="people-outline"
          label="연락처 동기화"
          onPress={() => router.push('/settings/contacts')}
        />
      </View>

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
        icon="mail-open-outline"
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
          variant="outline"
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
  },
  headerTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  listContent: {
    paddingBottom: Spacing.xl,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    paddingHorizontal: ScreenPadding,
    marginHorizontal: ScreenPadding,
    marginBottom: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    ...Shadow.md,
    gap: Spacing.xs,
  },
  avatarRing: {
    padding: 3,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  displayName: {
    fontSize: FontSize.xxl,
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.sm,
  },
  handle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  locationChip: {
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  locationText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: Spacing.sm,
    gap: Spacing.lg,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.text,
  },
  statLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  settingsSection: {
    backgroundColor: Colors.surface,
    marginHorizontal: ScreenPadding,
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.xl,
    ...Shadow.md,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  settingsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsLabel: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    fontWeight: '500',
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
    backgroundColor: Colors.background,
  },
  logoutButton: {
    width: '100%',
  },
});
