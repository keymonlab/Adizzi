import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';
import {
  requestContactsPermission,
  getPhoneContacts,
} from '@/lib/contacts';
import {
  syncContacts,
  getMatchedContacts,
  type MatchedContact,
} from '@/services/contacts.service';

type SyncState = 'idle' | 'requesting' | 'loading' | 'syncing' | 'done' | 'error';

export default function ContactsSyncScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [contactCount, setContactCount] = useState<number | null>(null);
  const [matches, setMatches] = useState<MatchedContact[]>([]);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Load previously matched contacts on mount
  useEffect(() => {
    if (!user) return;
    getMatchedContacts(user.id)
      .then(data => {
        if (data.length > 0) {
          setMatches(data);
          setSyncState('done');
        }
      })
      .catch(() => {
        // Silently ignore — user may not have synced yet
      });
  }, [user]);

  async function handleSync() {
    if (Platform.OS === 'web') {
      Alert.alert('알림', '연락처 기능은 모바일 앱에서만 사용할 수 있습니다.');
      return;
    }

    setErrorMessage('');
    try {
      // Step 1: Request permission
      setSyncState('requesting');
      const granted = await requestContactsPermission();
      if (!granted) {
        setErrorMessage('연락처 접근 권한이 필요합니다. 설정에서 허용해 주세요.');
        setSyncState('error');
        return;
      }

      // Step 2: Read contacts
      setSyncState('loading');
      const contacts = await getPhoneContacts();
      setContactCount(contacts.length);

      // Step 3: Sync with server
      setSyncState('syncing');
      const result = await syncContacts(contacts);
      setMatches(result);
      setLastSynced(new Date());
      setSyncState('done');
    } catch (err: any) {
      setErrorMessage(err?.message ?? '동기화 중 오류가 발생했어요.');
      setSyncState('error');
    }
  }

  const isLoading =
    syncState === 'requesting' ||
    syncState === 'loading' ||
    syncState === 'syncing';

  function getLoadingLabel(): string {
    if (syncState === 'requesting') return '권한 확인 중...';
    if (syncState === 'loading') return '연락처 불러오는 중...';
    if (syncState === 'syncing') return '이웃 찾는 중...';
    return '';
  }

  function formatDate(date: Date): string {
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')}`;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>연락처 동기화</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Explanation card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoText}>
            연락처를 동기화하면 아는 사람을 @멘션할 때 쉽게 찾을 수 있어요
          </Text>
          <View style={styles.privacyRow}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.privacyText}>
              연락처 정보는 암호화되어 안전하게 처리됩니다
            </Text>
          </View>
        </View>

        {/* Sync button / loading state */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.secondary} />
            <Text style={styles.loadingLabel}>{getLoadingLabel()}</Text>
            {contactCount !== null && syncState === 'syncing' && (
              <Text style={styles.contactCountText}>
                {contactCount.toLocaleString()}개의 연락처를 찾았어요
              </Text>
            )}
          </View>
        ) : (
          <Button
            title="연락처 동기화하기"
            onPress={handleSync}
            variant="primary"
            size="lg"
            style={styles.syncButton}
          />
        )}

        {/* Error */}
        {syncState === 'error' && errorMessage ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Success state */}
        {syncState === 'done' && (
          <>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                {matches.length > 0
                  ? `${matches.length}명의 이웃을 찾았어요!`
                  : '아직 연결된 이웃이 없어요'}
              </Text>
              {lastSynced && (
                <Text style={styles.lastSyncedText}>
                  마지막 동기화: {formatDate(lastSynced)}
                </Text>
              )}
            </View>

            {matches.length > 0 ? (
              <View style={styles.matchList}>
                {matches.map(item => (
                  <View key={item.user_id} style={styles.matchCard}>
                    <Avatar
                      uri={item.avatar_url}
                      name={item.display_name}
                      size="md"
                    />
                    <View style={styles.matchInfo}>
                      <Text style={styles.matchDisplayName}>{item.display_name}</Text>
                      <Text style={styles.matchHandle}>@{item.handle}</Text>
                    </View>
                    <Text style={styles.matchContactName}>{item.contact_name}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>👥</Text>
                <Text style={styles.emptyTitle}>이웃이 없어요</Text>
                <Text style={styles.emptyMessage}>
                  연락처에 있는 사람들이 맘파에 가입하면{'\n'}여기서 만날 수 있어요
                </Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Spacing.xs,
    marginRight: Spacing.sm,
  },
  backIcon: {
    fontSize: FontSize.xl,
    color: Colors.text,
  },
  headerTitle: {
    flex: 1,
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: Spacing.xl * 2,
    gap: Spacing.md,
  },
  infoCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: FontSize.md,
    color: Colors.text,
    lineHeight: FontSize.md * 1.6,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  lockIcon: {
    fontSize: FontSize.md,
  },
  privacyText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
  },
  syncButton: {
    marginTop: Spacing.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingLabel: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  contactCountText: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
  },
  errorBox: {
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.danger,
    lineHeight: FontSize.sm * 1.5,
  },
  resultHeader: {
    gap: Spacing.xs,
  },
  resultTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  lastSyncedText: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  matchList: {
    gap: Spacing.sm,
  },
  matchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  matchInfo: {
    flex: 1,
    gap: 2,
  },
  matchDisplayName: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  matchHandle: {
    fontSize: FontSize.sm,
    color: Colors.secondary,
  },
  matchContactName: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 1.5,
    gap: Spacing.sm,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: Spacing.sm,
  },
  emptyTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  emptyMessage: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: FontSize.md * 1.6,
  },
});
