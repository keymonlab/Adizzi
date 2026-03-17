import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import {
  useLostAlerts,
  useCreateAlert,
  useToggleAlert,
  useDeleteAlert,
} from '@/hooks/useLostAlerts';
import { CategoryPicker } from '@/components/post/CategoryPicker';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { formatTimeAgo } from '@/utils/format';
import { getCategoryLabel, getCategoryIcon } from '@/constants/categories';
import type { Category } from '@/types/app.types';
import type { LostAlert } from '@/services/lost-alerts.service';

// ─── Create Alert Modal ───────────────────────────────────────────────────────

interface CreateModalProps {
  visible: boolean;
  neighborhoodId: string;
  userId: string;
  onClose: () => void;
}

function CreateAlertModal({ visible, neighborhoodId, userId, onClose }: CreateModalProps) {
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [keywordsText, setKeywordsText] = useState('');
  const { mutateAsync: createAlert, isPending } = useCreateAlert();

  const handleCreate = async () => {
    if (!category) {
      Alert.alert('카테고리를 선택해주세요');
      return;
    }
    const keywords = keywordsText
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
    if (keywords.length === 0) {
      Alert.alert('키워드를 하나 이상 입력해주세요');
      return;
    }
    try {
      await createAlert({ category, keywords, neighborhood_id: neighborhoodId, userId });
      setCategory(undefined);
      setKeywordsText('');
      onClose();
    } catch {
      Alert.alert('오류', '알림을 만드는 데 실패했어요. 다시 시도해주세요.');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>분실물 알림 만들기</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.modalClose}>닫기</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
          <Text style={styles.fieldLabel}>카테고리</Text>
          <CategoryPicker selected={category} onSelect={setCategory} />

          <View style={styles.fieldGap} />

          <Input
            label="키워드 (쉼표로 구분)"
            placeholder="예: 지갑, 검정색, 가죽"
            value={keywordsText}
            onChangeText={setKeywordsText}
            autoCorrect={false}
          />

          <Text style={styles.helperText}>
            등록한 키워드가 새 게시물 제목이나 내용에 포함되면 알림을 받아요.
          </Text>

          <Button
            title="알림 만들기"
            onPress={handleCreate}
            loading={isPending}
            disabled={!category || !keywordsText.trim()}
            size="lg"
            style={styles.createBtn}
          />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Alert Row ────────────────────────────────────────────────────────────────

interface AlertRowProps {
  alert: LostAlert;
  userId: string;
}

function AlertRow({ alert, userId }: AlertRowProps) {
  const { mutate: toggleAlert, isPending: toggling } = useToggleAlert();
  const { mutate: deleteAlert, isPending: deleting } = useDeleteAlert();

  const handleToggle = (value: boolean) => {
    toggleAlert({ id: alert.id, active: value, userId });
  };

  const handleDelete = () => {
    Alert.alert('알림 삭제', '이 알림을 삭제하시겠어요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => deleteAlert({ id: alert.id, userId }),
      },
    ]);
  };

  return (
    <View style={styles.alertCard}>
      <View style={styles.alertTop}>
        <View style={styles.alertMeta}>
          <Text style={styles.alertCategory}>
            {getCategoryIcon(alert.category as Category)}{' '}
            {getCategoryLabel(alert.category as Category)}
          </Text>
          <Text style={styles.alertTime}>{formatTimeAgo(alert.created_at)}</Text>
        </View>
        <Switch
          value={alert.active}
          onValueChange={handleToggle}
          disabled={toggling}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor={Colors.white}
        />
      </View>

      <View style={styles.keywordsRow}>
        {alert.keywords.map((kw) => (
          <View key={kw} style={styles.keywordBadge}>
            <Text style={styles.keywordText}>{kw}</Text>
          </View>
        ))}
      </View>

      {!alert.active && (
        <Text style={styles.inactiveLabel}>비활성화됨</Text>
      )}

      <TouchableOpacity
        onPress={handleDelete}
        disabled={deleting}
        style={styles.deleteBtn}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.deleteBtnText}>삭제</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function LostAlertsScreen() {
  const { user, profile } = useAuth();
  const userId = user?.id ?? '';
  const neighborhoodId = profile?.neighborhood_id ?? '';

  const { alerts, isLoading } = useLostAlerts(userId);
  const [showCreate, setShowCreate] = useState(false);

  if (isLoading) return <LoadingSpinner />;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>분실물 알림</Text>
        <TouchableOpacity onPress={() => setShowCreate(true)} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ 추가</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.headerDesc}>
        새 분실물 게시물이 알림 조건과 일치하면 알려드려요.
      </Text>

      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <AlertRow alert={item} userId={userId} />}
        contentContainerStyle={alerts.length === 0 ? styles.emptyContent : styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <EmptyState
            icon="notifications-outline"
            title="알림이 없어요"
            message={'분실물 키워드를 등록하면\n새 게시물이 올라올 때 알림을 받아요.'}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      <CreateAlertModal
        visible={showCreate}
        neighborhoodId={neighborhoodId}
        userId={userId}
        onClose={() => setShowCreate(false)}
      />
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
  addButton: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  headerDesc: {
    fontSize: 13,
    color: Colors.textSecondary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    lineHeight: 18,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  emptyContent: {
    flex: 1,
  },
  separator: {
    height: 12,
  },
  alertCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    gap: 10,
  },
  alertTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  alertMeta: {
    gap: 2,
  },
  alertCategory: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  alertTime: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  keywordsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  keywordBadge: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  keywordText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  inactiveLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  deleteBtn: {
    alignSelf: 'flex-end',
  },
  deleteBtnText: {
    fontSize: 13,
    color: Colors.danger,
    fontWeight: '500',
  },
  // Modal
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  modalClose: {
    fontSize: 15,
    color: Colors.primary,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
    gap: 4,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  fieldGap: {
    height: 16,
  },
  helperText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginTop: 8,
  },
  createBtn: {
    marginTop: 24,
  },
});
