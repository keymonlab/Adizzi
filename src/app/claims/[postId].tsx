import React from 'react';
import {
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { PostStatusBadge } from '@/components/feed/PostStatusBadge';
import { useClaimsForPost, useApproveClaim, useRejectClaim } from '@/hooks/useClaims';
import { usePost } from '@/hooks/usePost';
import { formatTimeAgo } from '@/utils/format';
import { Colors } from '@/constants/colors';

export default function ClaimsManagementScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>();

  const { data: claims, isLoading: claimsLoading } = useClaimsForPost(postId);
  const { post, isLoading: postLoading } = usePost(postId);
  const approveMutation = useApproveClaim();
  const rejectMutation = useRejectClaim();

  const handleApprove = (claimId: string) => {
    Alert.alert(
      '소유 요청 승인',
      '이 요청을 승인하시겠어요? 승인 후 게시물이 해결됨으로 표시됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '승인',
          style: 'default',
          onPress: () => {
            approveMutation.mutate({ claimId, postId });
          },
        },
      ]
    );
  };

  const handleReject = (claimId: string) => {
    Alert.alert(
      '소유 요청 거절',
      '이 요청을 거절하시겠어요?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '거절',
          style: 'destructive',
          onPress: () => {
            rejectMutation.mutate({ claimId, postId });
          },
        },
      ]
    );
  };

  const isLoading = claimsLoading || postLoading;

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>소유 요청 관리</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Post Summary */}
        {post && (
          <View style={styles.postCard}>
            {post.image_urls?.[0] ? (
              <Image source={{ uri: post.image_urls[0] }} style={styles.postThumbnail} />
            ) : (
              <View style={styles.postThumbnailPlaceholder}>
                <Text style={styles.postThumbnailIcon}>🐾</Text>
              </View>
            )}
            <View style={styles.postInfo}>
              <Text style={styles.postTitle} numberOfLines={2}>
                {post.title}
              </Text>
              <PostStatusBadge status={post.status} />
            </View>
          </View>
        )}

        {/* Claims Count */}
        <Text style={styles.sectionLabel}>
          요청 {claims?.length ?? 0}건
        </Text>

        {/* Claims List */}
        {!claims || claims.length === 0 ? (
          <View style={styles.emptyWrapper}>
            <EmptyState
              icon="📭"
              title="아직 소유 요청이 없어요"
              message="아직 아무도 이 게시물에 소유 요청을 보내지 않았어요."
            />
          </View>
        ) : (
          claims.map((claim) => {
            const isPending = claim.status === 'pending';
            const isVerified = claim.status === 'verified';
            const isRejected = claim.status === 'rejected';

            return (
              <View key={claim.id} style={styles.claimCard}>
                {/* Claimant Info */}
                <View style={styles.claimantRow}>
                  <Avatar
                    uri={claim.claimant.avatar_url}
                    name={claim.claimant.display_name}
                    size="md"
                  />
                  <View style={styles.claimantMeta}>
                    <Text style={styles.claimantName}>{claim.claimant.display_name}</Text>
                    <Text style={styles.claimantHandle}>@{claim.claimant.handle}</Text>
                  </View>
                  <Badge
                    label={
                      isPending ? '대기중' : isVerified ? '인증됨' : '거절됨'
                    }
                    color={
                      isPending
                        ? Colors.warning
                        : isVerified
                        ? Colors.success
                        : Colors.danger
                    }
                  />
                </View>

                {/* Verification match indicator */}
                {isVerified && (
                  <View style={styles.verifiedRow}>
                    <Text style={styles.verifiedText}>✓ 인증 답변 일치</Text>
                  </View>
                )}

                {/* Timestamp */}
                <Text style={styles.timestamp}>{formatTimeAgo(claim.created_at)}</Text>

                {/* Action Buttons for pending claims */}
                {isPending && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.approveBtn]}
                      onPress={() => handleApprove(claim.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <Text style={styles.actionBtnText}>승인</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.rejectBtn]}
                      onPress={() => handleReject(claim.id)}
                      disabled={approveMutation.isPending || rejectMutation.isPending}
                    >
                      <Text style={styles.actionBtnText}>거절</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: 4,
  },
  backArrow: {
    fontSize: 22,
    color: Colors.text,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  headerSpacer: {
    width: 30,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
  },
  postCard: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
    alignItems: 'center',
    marginBottom: 4,
  },
  postThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: Colors.border,
  },
  postThumbnailPlaceholder: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postThumbnailIcon: {
    fontSize: 28,
  },
  postInfo: {
    flex: 1,
    gap: 8,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    lineHeight: 20,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  emptyWrapper: {
    minHeight: 300,
  },
  claimCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  claimantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  claimantMeta: {
    flex: 1,
  },
  claimantName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  claimantHandle: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 1,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.success,
  },
  timestamp: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  approveBtn: {
    backgroundColor: Colors.success,
  },
  rejectBtn: {
    backgroundColor: Colors.danger,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
});
