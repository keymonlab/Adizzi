import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import {
  useNeighborhood,
  useNeighborhoodByLocation,
  useNeighborhoods,
} from '@/hooks/useNeighborhood';
import { updateLocationVerification } from '@/services/users.service';
import { Button } from '@/components/ui/Button';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function NeighborhoodScreen() {
  const { user, profile, refreshProfile } = useAuth();

  const { data: currentNeighborhood, isLoading: loadingCurrent } = useNeighborhood(
    profile?.neighborhood_id ?? undefined
  );
  const { data: allNeighborhoods, isLoading: loadingAll } = useNeighborhoods();

  const { location, loading: locationLoading, error: locationError, requestLocation } = useLocation();

  const { data: detectedNeighborhood, isFetching: detectingNeighborhood } =
    useNeighborhoodByLocation(location?.latitude, location?.longitude);

  const [saving, setSaving] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // When GPS detects a neighborhood, auto-prompt
  useEffect(() => {
    if (detectedNeighborhood && verifying) {
      setVerifying(false);
    }
  }, [detectedNeighborhood, verifying]);

  const handleVerify = useCallback(async () => {
    setVerifying(true);
    await requestLocation();
  }, [requestLocation]);

  useEffect(() => {
    if (!verifying) return;
    if (locationError) {
      setVerifying(false);
      Alert.alert('위치 오류', '위치를 가져오지 못했어요. 다시 시도해 주세요.');
    }
  }, [locationError, verifying]);

  const handleSelectNeighborhood = useCallback(
    async (neighborhoodId: string) => {
      if (!user) return;
      setSaving(true);
      try {
        await updateLocationVerification(user.id, neighborhoodId);
        await refreshProfile();
        Alert.alert('완료', '동네가 변경되었어요.', [{ text: '확인', onPress: () => router.back() }]);
      } catch {
        Alert.alert('오류', '동네 변경에 실패했어요. 다시 시도해 주세요.');
      } finally {
        setSaving(false);
      }
    },
    [user, refreshProfile]
  );

  const handleApplyDetected = useCallback(async () => {
    if (!detectedNeighborhood) return;
    await handleSelectNeighborhood(detectedNeighborhood.id);
  }, [detectedNeighborhood, handleSelectNeighborhood]);

  const isVerifyLoading = verifying || locationLoading || detectingNeighborhood;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>{'<'} 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>동네 설정</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current neighborhood */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>현재 동네</Text>
          {loadingCurrent ? (
            <LoadingSpinner />
          ) : (
            <View style={styles.currentNeighborhoodRow}>
              <Text style={styles.currentNeighborhoodName}>
                {currentNeighborhood?.name ?? '설정된 동네 없음'}
              </Text>
              {currentNeighborhood && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>현재 동네</Text>
                </View>
              )}
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* GPS verification */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>GPS로 동네 인증</Text>
          <Text style={styles.sectionDescription}>
            현재 위치를 기반으로 동네를 자동으로 인증해요.
          </Text>

          <Button
            title={isVerifyLoading ? '위치 확인 중...' : '동네 다시 인증하기'}
            onPress={handleVerify}
            loading={isVerifyLoading}
            disabled={isVerifyLoading || saving}
            variant="outline"
            style={styles.verifyButton}
          />

          {location?.accuracy !== undefined && location.accuracy !== null && location.accuracy > 1000 && (
            <Text style={styles.accuracyWarning}>
              GPS 정확도가 낮아요 (약 {Math.round(location.accuracy / 100) / 10}km). 직접 동네를 선택하는 것을 추천해요.
            </Text>
          )}

          {detectedNeighborhood && (
            <View style={styles.detectedBox}>
              <Text style={styles.detectedLabel}>감지된 동네</Text>
              <Text style={styles.detectedName}>{detectedNeighborhood.name}</Text>
              <Button
                title="이 동네로 설정"
                onPress={handleApplyDetected}
                loading={saving}
                disabled={saving}
                style={styles.applyButton}
              />
            </View>
          )}

          {location && !detectedNeighborhood && !detectingNeighborhood && (
            <Text style={styles.noDetectedText}>
              현재 위치에서 서비스 가능한 동네를 찾지 못했어요.
            </Text>
          )}
        </View>

        <View style={styles.divider} />

        {/* Warning text */}
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            동네를 변경하면 이전 동네의 게시물은 보이지 않아요
          </Text>
        </View>

        <View style={styles.divider} />

        {/* Manual selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>직접 선택</Text>
          <Text style={styles.sectionDescription}>
            목록에서 동네를 선택해 수동으로 설정할 수 있어요.
          </Text>

          {loadingAll ? (
            <LoadingSpinner />
          ) : (
            <View style={styles.neighborhoodList}>
              {(allNeighborhoods ?? []).map((neighborhood) => {
                const isCurrent = neighborhood.id === profile?.neighborhood_id;
                return (
                  <TouchableOpacity
                    key={neighborhood.id}
                    style={[styles.neighborhoodItem, isCurrent && styles.neighborhoodItemActive]}
                    onPress={() => handleSelectNeighborhood(neighborhood.id)}
                    disabled={saving || isCurrent}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.neighborhoodItemText,
                        isCurrent && styles.neighborhoodItemTextActive,
                      ]}
                    >
                      {neighborhood.name}
                    </Text>
                    {isCurrent && (
                      <View style={styles.badge}>
                        <Text style={styles.badgeText}>현재</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
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
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    minWidth: 64,
  },
  backText: {
    color: Colors.primary,
    fontSize: FontSize.md,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  headerRight: {
    minWidth: 64,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  section: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  sectionLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: Spacing.xs,
  },
  sectionDescription: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  currentNeighborhoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  currentNeighborhoodName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  badgeText: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    color: Colors.white,
  },
  verifyButton: {
    marginTop: Spacing.xs,
  },
  detectedBox: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.secondary,
    marginTop: Spacing.sm,
  },
  detectedLabel: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detectedName: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    color: Colors.text,
  },
  applyButton: {
    marginTop: Spacing.xs,
  },
  noDetectedText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  accuracyWarning: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    lineHeight: 18,
    marginTop: Spacing.xs,
  },
  warningBox: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.surface,
  },
  warningText: {
    fontSize: FontSize.sm,
    color: Colors.warning,
    lineHeight: 20,
  },
  neighborhoodList: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  neighborhoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 4,
    paddingHorizontal: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  neighborhoodItemActive: {
    borderColor: Colors.primary,
  },
  neighborhoodItemText: {
    fontSize: FontSize.md,
    color: Colors.text,
  },
  neighborhoodItemTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
});
