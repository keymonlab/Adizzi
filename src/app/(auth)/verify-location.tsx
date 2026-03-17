import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useLocation } from '@/hooks/useLocation';
import { useNeighborhoodByLocation, useNeighborhoods } from '@/hooks/useNeighborhood';
import { Button } from '@/components/ui/Button';
import { updateLocationVerification } from '@/services/users.service';
import type { Neighborhood } from '@/services/neighborhoods.service';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

// ─── Sub-screens ──────────────────────────────────────────────────────────────

function LoadingView() {
  return (
    <View style={styles.centered}>
      <Ionicons name="location-outline" size={56} color={Colors.primary} style={{ marginBottom: 8 }} />
      <ActivityIndicator size="large" color={Colors.primary} style={{ marginBottom: 16 }} />
      <Text style={styles.title}>위치를 확인하고 있어요...</Text>
      <Text style={styles.subtitle}>잠시만 기다려 주세요</Text>
    </View>
  );
}

interface FoundViewProps {
  neighborhood: Neighborhood;
  onConfirm: () => void;
  onRetry: () => void;
  confirming: boolean;
  accuracy: number | null;
}

function FoundView({ neighborhood, onConfirm, onRetry, confirming, accuracy }: FoundViewProps) {
  const lowAccuracy = accuracy !== null && accuracy > 1000;
  const accuracyKm = accuracy !== null ? Math.round(accuracy / 100) / 10 : null;

  return (
    <View style={styles.centered}>
      <Ionicons name="location" size={56} color={Colors.primary} style={{ marginBottom: 8 }} />
      <Text style={styles.neighborhoodName}>{neighborhood.name}</Text>
      {neighborhood.district ? (
        <Text style={styles.neighborhoodDetail}>
          {neighborhood.city} · {neighborhood.district}
        </Text>
      ) : (
        <Text style={styles.neighborhoodDetail}>{neighborhood.city}</Text>
      )}
      {lowAccuracy && accuracyKm !== null && (
        <Text style={styles.accuracyWarning}>
          GPS 정확도가 낮아요 (약 {accuracyKm}km). 직접 동네를 선택하는 것을 추천해요.
        </Text>
      )}
      <Text style={[styles.title, { marginTop: 24 }]}>이 동네가 맞으세요?</Text>
      <View style={styles.buttonRow}>
        <Button
          title="맞아요"
          onPress={onConfirm}
          variant="primary"
          size="lg"
          loading={confirming}
          style={styles.buttonHalf}
        />
        <Button
          title="다시 찾기"
          onPress={onRetry}
          variant="outline"
          size="lg"
          disabled={confirming}
          style={styles.buttonHalf}
        />
      </View>
    </View>
  );
}

interface NotFoundViewProps {
  onRetry: () => void;
  onManual: () => void;
}

function NotFoundView({ onRetry, onManual }: NotFoundViewProps) {
  return (
    <View style={styles.centered}>
      <Text style={styles.bigIcon}>🔍</Text>
      <Text style={styles.title}>근처 동네를 찾을 수 없어요</Text>
      <Text style={styles.subtitle}>위치를 다시 확인하거나{'\n'}직접 동네를 선택해 주세요</Text>
      <View style={styles.buttonStack}>
        <Button title="다시 시도" onPress={onRetry} variant="primary" size="lg" />
        <Button title="직접 선택하기" onPress={onManual} variant="outline" size="lg" />
      </View>
    </View>
  );
}

interface ErrorViewProps {
  permissionDenied: boolean;
  onRetry: () => void;
  onManual: () => void;
}

function ErrorView({ permissionDenied, onRetry, onManual }: ErrorViewProps) {
  return (
    <View style={styles.centered}>
      <Text style={styles.bigIcon}>{permissionDenied ? '🔒' : '⚠️'}</Text>
      <Text style={styles.title}>
        {permissionDenied ? '위치 권한이 필요해요' : '위치를 가져올 수 없어요'}
      </Text>
      <Text style={styles.subtitle}>
        {permissionDenied
          ? '설정에서 위치 권한을 허용한 뒤\n다시 시도해 주세요'
          : '잠시 후 다시 시도하거나\n직접 동네를 선택해 주세요'}
      </Text>
      <View style={styles.buttonStack}>
        <Button title="다시 시도" onPress={onRetry} variant="primary" size="lg" />
        <Button title="직접 선택하기" onPress={onManual} variant="outline" size="lg" />
      </View>
    </View>
  );
}

// ─── Manual selection modal ───────────────────────────────────────────────────

interface ManualModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (neighborhood: Neighborhood) => void;
  confirming: boolean;
}

function ManualModal({ visible, onClose, onSelect, confirming }: ManualModalProps) {
  const { data: neighborhoods, isLoading } = useNeighborhoods();
  const [search, setSearch] = useState('');

  const filtered = (neighborhoods ?? []).filter((n) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      n.name.toLowerCase().includes(q) ||
      n.city.toLowerCase().includes(q) ||
      (n.district ?? '').toLowerCase().includes(q)
    );
  });

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={styles.modalContainer}>
        {/* Header */}
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>동네 선택</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Text style={styles.modalClose}>닫기</Text>
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchWrapper}>
          <TextInput
            style={styles.searchInput}
            placeholder="동네 이름으로 검색..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
          />
        </View>

        {/* List */}
        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingBottom: 32 }}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            ListEmptyComponent={
              <Text style={[styles.subtitle, { textAlign: 'center', marginTop: 32 }]}>
                검색 결과가 없어요
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.neighborhoodRow}
                onPress={() => onSelect(item as Neighborhood)}
                disabled={confirming}
                activeOpacity={0.7}
              >
                <Text style={styles.rowName}>{item.name}</Text>
                <Text style={styles.rowDetail}>
                  {item.city}{item.district ? ` · ${item.district}` : ''}
                </Text>
              </TouchableOpacity>
            )}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type ScreenState = 'idle' | 'loading' | 'found' | 'not_found' | 'error';

export default function VerifyLocationScreen() {
  const { user, refreshProfile } = useAuth();
  const { location, loading: locLoading, error: locError, hasPermission, requestLocation } = useLocation();
  const [confirming, setConfirming] = useState(false);
  const [showManual, setShowManual] = useState(false);

  // Kick off GPS on mount
  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  // PostGIS lookup — only runs when we have coordinates
  const {
    data: foundNeighborhood,
    isFetching: neighborhoodFetching,
    isSuccess: neighborhoodSuccess,
  } = useNeighborhoodByLocation(
    location?.latitude,
    location?.longitude,
  );

  // Derive current UI state
  let screenState: ScreenState = 'idle';
  if (locLoading || neighborhoodFetching) {
    screenState = 'loading';
  } else if (locError || hasPermission === false) {
    screenState = 'error';
  } else if (neighborhoodSuccess && foundNeighborhood) {
    screenState = 'found';
  } else if (neighborhoodSuccess && !foundNeighborhood && location) {
    screenState = 'not_found';
  } else if (location) {
    // location obtained but query not yet triggered / settled
    screenState = 'loading';
  }

  const confirmNeighborhood = async (neighborhood: Neighborhood) => {
    if (!user) return;
    setConfirming(true);
    try {
      await updateLocationVerification(user.id, neighborhood.id);
      await refreshProfile();
      router.replace('/(tabs)');
    } catch (err) {
      console.error('Failed to confirm neighborhood', err);
    } finally {
      setConfirming(false);
    }
  };

  const handleManualSelect = async (neighborhood: Neighborhood) => {
    setShowManual(false);
    await confirmNeighborhood(neighborhood);
  };

  const handleRetry = () => {
    requestLocation();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {screenState === 'loading' && <LoadingView />}

        {screenState === 'found' && foundNeighborhood && (
          <FoundView
            neighborhood={foundNeighborhood}
            onConfirm={() => confirmNeighborhood(foundNeighborhood)}
            onRetry={handleRetry}
            confirming={confirming}
            accuracy={location?.accuracy ?? null}
          />
        )}

        {screenState === 'not_found' && (
          <NotFoundView onRetry={handleRetry} onManual={() => setShowManual(true)} />
        )}

        {screenState === 'error' && (
          <ErrorView
            permissionDenied={hasPermission === false}
            onRetry={handleRetry}
            onManual={() => setShowManual(true)}
          />
        )}

        {/* Idle — show nothing meaningful while permissions are still unresolved */}
        {screenState === 'idle' && <LoadingView />}
      </View>

      <ManualModal
        visible={showManual}
        onClose={() => setShowManual(false)}
        onSelect={handleManualSelect}
        confirming={confirming}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  bigIcon: {
    fontSize: 64,
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  neighborhoodName: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.secondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  neighborhoodDetail: {
    fontSize: 15,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  accuracyWarning: {
    fontSize: 13,
    color: Colors.warning,
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
    width: '100%',
  },
  buttonHalf: {
    flex: 1,
  },
  buttonStack: {
    gap: 12,
    width: '100%',
    marginTop: 8,
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
  searchWrapper: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchInput: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginHorizontal: 16,
  },
  neighborhoodRow: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  rowName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  rowDetail: {
    fontSize: 13,
    color: Colors.textMuted,
  },
});
