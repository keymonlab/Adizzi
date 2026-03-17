import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Shadow, Spacing } from '@/constants/layout';
import { getCategoryIcon, getCategoryLabel } from '@/constants/categories';
import { formatTimeAgo } from '@/utils/format';
import { PostStatusBadge } from './PostStatusBadge';
import type { PostWithAuthor } from '@/services/posts.service';

interface PostCardProps {
  post: PostWithAuthor;
  onPress: () => void;
}

export function PostCard({ post, onPress }: PostCardProps) {
  const isResolved = post.status === 'resolved';
  const firstImage = post.image_urls?.[0];
  const categoryIcon = getCategoryIcon(post.category);
  const categoryLabel = getCategoryLabel(post.category);

  return (
    <TouchableOpacity
      style={[styles.card, isResolved && styles.cardResolved]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Thumbnail */}
      {firstImage ? (
        <Image source={{ uri: firstImage }} style={styles.thumbnail} />
      ) : (
        <View style={[styles.thumbnail, styles.thumbnailPlaceholder]}>
          <Ionicons name={categoryIcon as any} size={36} color={Colors.primary} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={2}>
          {post.title}
        </Text>

        <Text style={styles.handle} numberOfLines={1}>
          @{post.author.handle}
        </Text>

        <View style={styles.meta}>
          <View style={styles.metaChip}>
            <Ionicons name={categoryIcon as any} size={11} color={Colors.primary} />
            <Text style={styles.metaChipText}>{categoryLabel}</Text>
          </View>
          {post.location_name ? (
            <Text style={styles.metaText} numberOfLines={1}>
              {post.location_name}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.timeText}>{formatTimeAgo(post.created_at)}</Text>
          <View style={styles.commentRow}>
            <Ionicons name="chatbubble-outline" size={11} color={Colors.textSecondary} />
            <Text style={styles.commentText}>{post.comment_count}</Text>
          </View>
        </View>
      </View>

      {/* Status badge */}
      <View style={styles.badgeContainer}>
        <PostStatusBadge status={post.status as 'active' | 'resolved'} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadow.md,
  },
  cardResolved: {
    opacity: 0.5,
  },
  thumbnail: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.lg,
    flexShrink: 0,
  },
  thumbnailPlaceholder: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    gap: 3,
  },
  title: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: FontSize.md * 1.4,
  },
  handle: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  meta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: 2,
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: Colors.primaryLight,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  metaChipText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    fontWeight: '600',
  },
  metaText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  timeText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  commentText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  badgeContainer: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
  },
});
