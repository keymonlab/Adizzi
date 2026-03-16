import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';
import { usePost } from '@/hooks/usePost';
import { useAuth } from '@/hooks/useAuth';
import { ImageSlider } from '@/components/post/ImageSlider';
import { PostStatusBadge } from '@/components/feed/PostStatusBadge';
import { Avatar } from '@/components/ui/Avatar';
import { ClaimButton } from '@/components/post/ClaimButton';
import { CommentList } from '@/components/comments/CommentList';
import { CommentInput } from '@/components/comments/CommentInput';
import { formatTimeAgo } from '@/utils/format';
import { getCategoryIcon, getCategoryLabel } from '@/constants/categories';
import { createReport, type ReportReason, type ReportTargetType } from '@/services/reports.service';
import { softDeletePost } from '@/services/posts.service';

const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: 'spam', label: '스팸/광고' },
  { value: 'inappropriate', label: '부적절한 내용' },
  { value: 'fraud', label: '사기/허위 정보' },
  { value: 'harassment', label: '괴롭힘/혐오' },
  { value: 'other', label: '기타' },
];

interface ReportModalProps {
  visible: boolean;
  targetType: ReportTargetType;
  targetId: string;
  title: string;
  onClose: () => void;
}

function ReportModal({ visible, targetType, targetId, title, onClose }: ReportModalProps) {
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleClose = () => {
    setSelectedReason(null);
    setDescription('');
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('신고 사유를 선택해주세요');
      return;
    }
    setIsSubmitting(true);
    try {
      await createReport({
        target_type: targetType,
        target_id: targetId,
        reason: selectedReason,
        description: description.trim() || undefined,
      });
      handleClose();
      Alert.alert('신고가 접수되었습니다');
    } catch {
      Alert.alert('오류', '신고 접수 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleClose}>
        <TouchableOpacity activeOpacity={1} onPress={() => {}}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{title}</Text>

            <View style={styles.reasonList}>
              {REPORT_REASONS.map((r) => (
                <TouchableOpacity
                  key={r.value}
                  style={styles.reasonRow}
                  onPress={() => setSelectedReason(r.value)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.radio, selectedReason === r.value && styles.radioSelected]}>
                    {selectedReason === r.value && <View style={styles.radioDot} />}
                  </View>
                  <Text style={styles.reasonLabel}>{r.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.descInput}
              placeholder="추가 설명 (선택사항)"
              placeholderTextColor={Colors.textSecondary}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
              maxLength={500}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleClose}>
                <Text style={styles.cancelBtnText}>취소</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Text style={styles.submitBtnText}>신고하기</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { post, isLoading, error } = usePost(id);

  const [menuVisible, setMenuVisible] = useState(false);
  const [reportTarget, setReportTarget] = useState<{
    type: ReportTargetType;
    id: string;
    title: string;
  } | null>(null);

  const isOwnPost = user && post && user.id === post.author_id;

  const handleMenuPress = () => setMenuVisible(true);

  const handleReportPost = () => {
    setMenuVisible(false);
    if (!post) return;
    setReportTarget({ type: 'post', id: post.id, title: '게시물 신고' });
  };

  const handleDeletePost = () => {
    setMenuVisible(false);
    Alert.alert('삭제', '게시물을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          try {
            await softDeletePost(id);
          } catch {
            Alert.alert('오류', '게시물 삭제 중 오류가 발생했습니다.');
            return;
          }
          router.back();
        },
      },
    ]);
  };

  const handleReportComment = (commentId: string) => {
    setReportTarget({ type: 'comment', id: commentId, title: '댓글 신고' });
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (error || !post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>게시물을 불러올 수 없어요</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>돌아가기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerBack} hitSlop={8}>
          <Text style={styles.headerBackIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {post.title || '게시물 상세'}
        </Text>
        {user ? (
          <TouchableOpacity style={styles.headerMenuBtn} onPress={handleMenuPress} hitSlop={8}>
            <Text style={styles.headerMenuIcon}>⋯</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.headerRight} />
        )}
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Image slider */}
        {post.image_urls && post.image_urls.length > 0 && (
          <ImageSlider images={post.image_urls} />
        )}

        {/* Post info */}
        <View style={styles.content}>
          {/* Title + status row */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={2}>
              {post.title}
            </Text>
            <PostStatusBadge status={post.status} />
          </View>

          {/* Author row */}
          <TouchableOpacity style={styles.authorRow} activeOpacity={0.7}>
            <Avatar
              uri={post.author.avatar_url}
              name={post.author.display_name}
              size="sm"
            />
            <View style={styles.authorInfo}>
              <Text style={styles.authorName}>{post.author.display_name}</Text>
              <Text style={styles.authorHandle}>@{post.author.handle}</Text>
            </View>
          </TouchableOpacity>

          {/* Meta row */}
          <View style={styles.metaRow}>
            <Text style={styles.metaItem}>
              {getCategoryIcon(post.category)} {getCategoryLabel(post.category)}
            </Text>
            {post.location_name ? (
              <Text style={styles.metaItem}>📍 {post.location_name}</Text>
            ) : null}
            <Text style={styles.metaItem}>{formatTimeAgo(post.created_at)}</Text>
          </View>

          {/* Description */}
          {post.description ? (
            <Text style={styles.description}>{post.description}</Text>
          ) : null}

          {/* Claim button */}
          {user && (
            <ClaimButton post={post} userId={user.id} />
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Comments section header */}
          <View style={styles.commentsHeader}>
            <Text style={styles.commentsTitle}>댓글</Text>
            <Text style={styles.commentsCount}>{post.comment_count}</Text>
          </View>

          {/* Comment list */}
          <CommentList postId={id} onReportComment={handleReportComment} />
        </View>
      </ScrollView>

      {/* Comment input fixed at bottom */}
      {user && <CommentInput postId={id} />}

      {/* Three-dot menu modal */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <TouchableOpacity activeOpacity={1} onPress={() => {}}>
            <View style={styles.menuCard}>
              {isOwnPost ? (
                <TouchableOpacity style={styles.menuItem} onPress={handleDeletePost}>
                  <Text style={[styles.menuItemText, styles.menuItemDestructive]}>삭제하기</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.menuItem} onPress={handleReportPost}>
                  <Text style={styles.menuItemText}>신고하기</Text>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Report modal */}
      {reportTarget && (
        <ReportModal
          visible={!!reportTarget}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          title={reportTarget.title}
          onClose={() => setReportTarget(null)}
        />
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: FontSize.md,
  },
  backBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
  },
  backBtnText: {
    color: Colors.text,
    fontSize: FontSize.md,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerBack: {
    width: 36,
    justifyContent: 'center',
  },
  headerBackIcon: {
    fontSize: FontSize.xl,
    color: Colors.text,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  headerRight: {
    width: 36,
  },
  headerMenuBtn: {
    width: 36,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  headerMenuIcon: {
    fontSize: FontSize.xl,
    color: Colors.textSecondary,
    letterSpacing: 2,
  },
  // Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  // Content
  content: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    lineHeight: 32,
  },
  // Author
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  authorInfo: {
    gap: 2,
  },
  authorName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  authorHandle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  // Meta
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  metaItem: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  // Description
  description: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },
  // Comments
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  commentsTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  commentsCount: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  // Menu card
  menuCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    minWidth: 160,
  },
  menuItem: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  menuItemText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  menuItemDestructive: {
    color: Colors.danger,
  },
  // Modal shared
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Report modal
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    width: 320,
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  reasonList: {
    gap: 2,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioSelected: {
    borderColor: Colors.primary,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  reasonLabel: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  descInput: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    color: Colors.text,
    fontSize: FontSize.md,
    minHeight: 72,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    justifyContent: 'flex-end',
    marginTop: Spacing.xs,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceLight,
  },
  cancelBtnText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  submitBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.secondary,
    minWidth: 80,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.white,
  },
});
