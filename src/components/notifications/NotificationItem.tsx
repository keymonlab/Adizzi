import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/colors';
import { formatTimeAgo } from '@/utils/format';
import type { NotificationWithActor } from '@/services/notifications.service';
import type { NotificationType } from '@/types/app.types';

interface NotificationItemProps {
  notification: NotificationWithActor;
  onPress: () => void;
}

const TYPE_COLORS: Record<string, string> = {
  new_post: Colors.notification.newPost,
  mention: Colors.notification.mention,
  comment: Colors.notification.comment,
  claim: Colors.notification.claim,
  claim_verified: Colors.notification.mention,
  lost_alert_match: Colors.notification.newPost,
  resolved: Colors.notification.resolved,
};

const TYPE_LABELS: Record<string, string> = {
  new_post: '새 분실물을 등록했어요',
  mention: '회원님을 멘션했어요',
  comment: '댓글을 남겼어요',
  claim: '주인이라고 합니다',
  claim_verified: '소유가 확인되었어요',
  lost_alert_match: '분실물 알림과 일치해요',
  resolved: '해결되었어요',
};

export function NotificationItem({ notification, onPress }: NotificationItemProps) {
  const { actor, post, type, read, created_at } = notification;
  const typeColor = TYPE_COLORS[type] ?? Colors.textSecondary;
  const typeLabel = TYPE_LABELS[type] ?? type;
  const actorName = actor?.display_name ?? '알 수 없는 사용자';

  return (
    <TouchableOpacity
      style={[styles.container, !read && styles.containerUnread]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Type indicator dot */}
      <View style={[styles.typeDot, { backgroundColor: typeColor }]} />

      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        <Avatar uri={actor?.avatar_url} name={actorName} size="md" />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={[styles.actorName, !read && styles.actorNameUnread]} numberOfLines={1}>
          {actorName}
        </Text>
        <Text style={styles.action} numberOfLines={1}>
          {typeLabel}
        </Text>
        {post?.title ? (
          <Text style={styles.postTitle} numberOfLines={1}>
            {post.title}
          </Text>
        ) : null}
      </View>

      {/* Right: time + unread indicator */}
      <View style={styles.rightSection}>
        <Text style={styles.timeAgo}>{formatTimeAgo(created_at)}</Text>
        {!read && <View style={styles.unreadDot} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    minHeight: 72,
  },
  containerUnread: {
    backgroundColor: Colors.primaryLight,
  },
  typeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
    flexShrink: 0,
  },
  avatarWrapper: {
    marginRight: 12,
    flexShrink: 0,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  actorName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  actorNameUnread: {
    fontWeight: '700',
  },
  action: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  postTitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: 6,
    marginLeft: 8,
    flexShrink: 0,
  },
  timeAgo: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.secondary,
  },
});
