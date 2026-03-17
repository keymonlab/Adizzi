import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';
import { useMyClaimForPost, useSubmitClaim } from '@/hooks/useClaims';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import type { PostWithAuthor } from '@/services/posts.service';

const MAX_ATTEMPTS = 3;

interface ClaimButtonProps {
  post: PostWithAuthor;
  userId: string;
}

export function ClaimButton({ post, userId }: ClaimButtonProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [answer, setAnswer] = useState('');
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [resultSuccess, setResultSuccess] = useState(false);

  const { data: myClaim, isLoading: claimLoading } = useMyClaimForPost(post.id, userId);
  const submitClaim = useSubmitClaim();

  // Own post: don't show button
  if (post.author_id === userId) return null;

  // Post not active
  if (post.status !== 'active') return null;

  const hasQuestion = !!post.verification_question;
  const alreadyClaimed = !!myClaim;
  const claimStatus = myClaim?.status;
  const failedAttempts = myClaim?.failed_attempts ?? 0;
  const maxAttemptsReached = failedAttempts >= MAX_ATTEMPTS;

  const handlePress = () => {
    setResultMessage(null);
    if (hasQuestion) {
      setModalVisible(true);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async (submittedAnswer?: string) => {
    const result = await submitClaim.mutateAsync({
      postId: post.id,
      answer: submittedAnswer,
    });
    setResultSuccess(result.success);
    setResultMessage(result.message);
    if (result.success) {
      setModalVisible(false);
      setAnswer('');
    }
  };

  const handleModalSubmit = () => {
    handleSubmit(answer.trim() || undefined);
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setAnswer('');
    setResultMessage(null);
  };

  if (claimLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  // Already verified
  if (claimStatus === 'verified') {
    return (
      <View style={[styles.statusBanner, styles.statusVerified]}>
        <Text style={styles.statusText}>{post.post_type === 'lost' ? '발견 확인 완료!' : '인증 완료! 주인님이 확인했어요'}</Text>
      </View>
    );
  }

  // Already pending
  if (claimStatus === 'pending') {
    return (
      <View style={[styles.statusBanner, styles.statusPending]}>
        <Text style={styles.statusText}>{post.post_type === 'lost' ? '발견 신고 중... 글쓴이 확인을 기다리고 있어요' : '인증 신청 중... 주인님 확인을 기다리고 있어요'}</Text>
      </View>
    );
  }

  // Rejected + max attempts reached
  if (claimStatus === 'rejected' && maxAttemptsReached) {
    return (
      <View style={[styles.statusBanner, styles.statusRejected]}>
        <Text style={styles.statusText}>인증 횟수를 초과했어요 ({MAX_ATTEMPTS}/{MAX_ATTEMPTS})</Text>
      </View>
    );
  }

  // Rejected but can retry
  const isRetry = claimStatus === 'rejected';
  const remainingAttempts = MAX_ATTEMPTS - failedAttempts;

  return (
    <>
      {/* Inline result message (no-question flow) */}
      {resultMessage && !hasQuestion && (
        <View style={[styles.resultBanner, resultSuccess ? styles.resultSuccess : styles.resultError]}>
          <Text style={styles.resultText}>{resultMessage}</Text>
        </View>
      )}

      <Button
        title={isRetry ? `다시 시도하기 (${remainingAttempts}회 남음)` : post.post_type === 'lost' ? '찾았어요!' : '제 물건이에요!'}
        onPress={handlePress}
        variant="primary"
        size="lg"
        loading={submitClaim.isPending}
        style={styles.claimButton}
      />

      {/* Verification modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleModalClose}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleModalClose}
        >
          <TouchableOpacity activeOpacity={1} style={styles.modalCard}>
            <Text style={styles.modalTitle}>{post.post_type === 'lost' ? '발견 확인' : '소유 확인'}</Text>
            <Text style={styles.modalQuestion}>{post.verification_question}</Text>

            {isRetry && (
              <Text style={styles.attemptsText}>
                남은 시도 횟수: {remainingAttempts}회
              </Text>
            )}

            <Input
              label="답변"
              placeholder="답변을 입력하세요"
              value={answer}
              onChangeText={setAnswer}
              style={styles.answerInput}
            />

            {resultMessage && (
              <Text style={[styles.modalResultText, resultSuccess ? styles.textSuccess : styles.textError]}>
                {resultMessage}
              </Text>
            )}

            <View style={styles.modalActions}>
              <Button
                title="취소"
                onPress={handleModalClose}
                variant="outline"
                size="md"
                style={styles.modalButton}
              />
              <Button
                title="제출"
                onPress={handleModalSubmit}
                variant="primary"
                size="md"
                loading={submitClaim.isPending}
                disabled={!answer.trim()}
                style={styles.modalButton}
              />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  claimButton: {
    marginTop: Spacing.sm,
  },
  statusBanner: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  statusVerified: {
    backgroundColor: Colors.secondary + '33',
    borderWidth: 1,
    borderColor: Colors.secondary,
  },
  statusPending: {
    backgroundColor: Colors.warning + '22',
    borderWidth: 1,
    borderColor: Colors.warning,
  },
  statusRejected: {
    backgroundColor: Colors.textMuted + '22',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  statusText: {
    color: Colors.text,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  resultBanner: {
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
  },
  resultSuccess: {
    backgroundColor: Colors.secondary + '22',
  },
  resultError: {
    backgroundColor: Colors.primary + '22',
  },
  resultText: {
    color: Colors.text,
    fontSize: FontSize.sm,
  },
  // Modal styles
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    width: '100%',
    gap: Spacing.md,
  },
  modalTitle: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    color: Colors.text,
  },
  modalQuestion: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: 22,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  attemptsText: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    fontWeight: '500',
  },
  answerInput: {
    // no extra styles needed
  },
  modalResultText: {
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
  textSuccess: {
    color: Colors.secondary,
  },
  textError: {
    color: Colors.primary,
  },
  modalActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  modalButton: {
    flex: 1,
  },
});
