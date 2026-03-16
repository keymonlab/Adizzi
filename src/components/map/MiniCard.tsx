import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';
import { getCategoryIcon } from '@/constants/categories';
import { PostStatusBadge } from '@/components/feed/PostStatusBadge';
import { formatTimeAgo } from '@/utils/format';
import type { PostWithAuthor } from '@/services/posts.service';

interface MiniCardProps {
  post: PostWithAuthor;
  onPress: () => void;
}

export function MiniCard({ post, onPress }: MiniCardProps) {
  const icon = getCategoryIcon(post.category);
  const thumbnail = post.image_urls?.[0] ?? null;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {thumbnail ? (
        <Image source={{ uri: thumbnail }} style={styles.thumbnail} resizeMode="cover" />
      ) : (
        <View style={styles.thumbnailPlaceholder}>
          <Text style={styles.placeholderEmoji}>{icon}</Text>
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.category}>{icon}</Text>
          <PostStatusBadge status={post.status} />
        </View>
        <Text style={styles.title} numberOfLines={2}>{post.title}</Text>
        <Text style={styles.time}>{formatTimeAgo(post.created_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  thumbnail: {
    width: 90,
    height: 90,
  },
  thumbnailPlaceholder: {
    width: 90,
    height: 90,
    backgroundColor: Colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderEmoji: {
    fontSize: 32,
  },
  content: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  category: {
    fontSize: FontSize.md,
  },
  title: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '600',
    marginTop: Spacing.xs,
    lineHeight: 18,
  },
  time: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
});
