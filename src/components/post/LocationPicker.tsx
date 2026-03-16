import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Input } from '@/components/ui/Input';
import { useLocation } from '@/hooks/useLocation';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';

interface LocationValue {
  lat: number;
  lng: number;
  name: string;
}

interface LocationPickerProps {
  value: LocationValue | null;
  onChange: (location: LocationValue | null) => void;
}

export function LocationPicker({ value, onChange }: LocationPickerProps): React.ReactElement {
  const { location, loading, error, requestLocation } = useLocation();

  useEffect(() => {
    requestLocation();
  }, []);

  useEffect(() => {
    if (location && !value) {
      onChange({
        lat: location.latitude,
        lng: location.longitude,
        name: `${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`,
      });
    }
  }, [location]);

  const handleNameChange = (name: string) => {
    if (value) {
      onChange({ ...value, name });
    }
  };

  const handleRetry = () => {
    requestLocation();
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={styles.loadingText}>위치를 확인하는 중...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>위치를 가져올 수 없습니다</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
            <Text style={styles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : value ? (
        <View style={styles.coordsBox}>
          <Text style={styles.coordsLabel}>📍 GPS</Text>
          <Text style={styles.coordsText}>
            {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
          </Text>
        </View>
      ) : null}

      {value && (
        <Input
          label="위치 이름"
          placeholder="위치 이름을 입력하세요"
          value={value.name}
          onChangeText={handleNameChange}
        />
      )}

      {!loading && !value && !error && (
        <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
          <Text style={styles.retryText}>📍 위치 가져오기</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
  },
  loadingText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  coordsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  coordsLabel: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
  coordsText: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    flex: 1,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
  },
  errorText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
  retryButton: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.sm,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    alignSelf: 'flex-start',
  },
  retryText: {
    color: Colors.primary,
    fontSize: FontSize.sm,
    fontWeight: '500',
  },
});
