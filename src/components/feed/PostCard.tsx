import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';
import { getCategoryIcon } from '@/constants/categories';
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
          <Text style={styles.thumbnailEmoji}>{getCategoryIcon(post.category)}</Text>
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
          <Text style={styles.metaText}>
            {getCategoryIcon(post.category)} {post.category}
          </Text>
          {post.location_name ? (
            <Text style={styles.metaText} numberOfLines={1}>
              📍 {post.location_name}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.timeText}>{formatTimeAgo(post.created_at)}</Text>
          <Text style={styles.commentText}>💬 {post.comment_count}</Text>
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
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardResolved: {
    opacity: 0.5,
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    flexShrink: 0,
  },
  thumbnailPlaceholder: {
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbnailEmoji: {
    fontSize: 32,
  },
  content: {
    flex: 1,
    gap: 4,
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
    gap: Spacing.sm,
    marginTop: 2,
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
