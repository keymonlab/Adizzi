import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';
import { useComments, useDeleteComment } from '@/hooks/useComments';
import { useAuth } from '@/hooks/useAuth';
import { formatTimeAgo } from '@/utils/format';
import type { Comment } from '@/services/comments.service';

const MENTION_SPLIT_REGEX = /@(\w+)/g;

function renderCommentContent(content: string) {
  const parts = content.split(MENTION_SPLIT_REGEX);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <Text key={i} style={styles.mention}>
          @{part}
        </Text>
      );
    }
    return <Text key={i}>{part}</Text>;
  });
}

interface CommentRowProps {
  comment: Comment;
  currentUserId?: string;
  onDelete: (commentId: string) => void;
  isDeleting: boolean;
  onReport: (commentId: string) => void;
}

function CommentRow({ comment, currentUserId, onDelete, isDeleting, onReport }: CommentRowProps) {
  const isOwn = currentUserId != null && currentUserId === (comment.author?.id ?? comment.author_id);

  const handleLongPress = () => {
    if (isOwn) return;
    Alert.alert('댓글', undefined, [
      { text: '신고하기', onPress: () => onReport(comment.id) },
      { text: '취소', style: 'cancel' },
    ]);
  };

  return (
    <Pressable
      onLongPress={handleLongPress}
      delayLongPress={400}
    >
      <View style={styles.row}>
        <Avatar
          uri={comment.author?.avatar_url ?? null}
          name={comment.author?.display_name ?? comment.author?.handle ?? '?'}
          size="sm"
        />
        <View style={styles.rowBody}>
          <View style={styles.rowHeader}>
            <Text style={styles.authorName} numberOfLines={1}>
              {comment.author?.display_name ?? comment.author?.handle ?? '알 수 없음'}
            </Text>
            <Text style={styles.authorHandle} numberOfLines={1}>
              @{comment.author?.handle ?? ''}
            </Text>
            <Text style={styles.timeAgo}>{formatTimeAgo(comment.created_at)}</Text>
          </View>
          <Text style={styles.content}>{renderCommentContent(comment.content)}</Text>
        </View>
        {isOwn && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={() => onDelete(comment.id)}
            disabled={isDeleting}
            hitSlop={8}
          >
            <Text style={styles.deleteBtnText}>삭제</Text>
          </TouchableOpacity>
        )}
      </View>
    </Pressable>
  );
}

interface CommentListProps {
  postId: string;
  onReportComment?: (commentId: string) => void;
}

export function CommentList({ postId, onReportComment }: CommentListProps) {
  const { comments, fetchNextPage, hasNextPage, isLoading, isFetchingNextPage } =
    useComments(postId);
  const { mutate: deleteComment, isPending: isDeleting } = useDeleteComment();
  const { user } = useAuth();

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={comments}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <CommentRow
          comment={item}
          currentUserId={user?.id}
          onDelete={(id) => deleteComment(id)}
          isDeleting={isDeleting}
          onReport={(commentId) => onReportComment?.(commentId)}
        />
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            아직 댓글이 없어요. 첫 댓글을 남겨보세요!
          </Text>
        </View>
      }
      ListFooterComponent={
        hasNextPage ? (
          <TouchableOpacity
            style={styles.loadMoreBtn}
            onPress={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? (
              <ActivityIndicator size="small" color={Colors.secondary} />
            ) : (
              <Text style={styles.loadMoreText}>더 보기</Text>
            )}
          </TouchableOpacity>
        ) : null
      }
      scrollEnabled={false}
      style={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 0,
  },
  centered: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  rowBody: {
    flex: 1,
    gap: 4,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  authorName: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.text,
  },
  authorHandle: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },
  timeAgo: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginLeft: 'auto',
  },
  content: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 20,
  },
  mention: {
    color: Colors.secondary,
    fontWeight: '600',
  },
  deleteBtn: {
    paddingHorizontal: Spacing.xs,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
  },
  deleteBtnText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
  },
  loadMoreBtn: {
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  loadMoreText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
    fontWeight: '500',
  },
});
