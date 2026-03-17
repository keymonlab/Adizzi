import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
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

// ── Web: Kakao Maps inline picker ────────────────────────────────────────────

function WebMapPicker({
  lat,
  lng,
  onLocationChange,
}: {
  lat: number;
  lng: number;
  onLocationChange: (lat: number, lng: number) => void;
}) {
  const containerRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [sdkReady, setSdkReady] = React.useState(false);

  // Load SDK
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const kakao = (window as any).kakao;
    if (kakao?.maps) {
      setSdkReady(true);
      return;
    }
    const appKey =
      process.env.EXPO_PUBLIC_KAKAO_JS_KEY ??
      process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ??
      '';
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
    script.async = true;
    script.onload = () => {
      (window as any).kakao.maps.load(() => setSdkReady(true));
    };
    document.head.appendChild(script);
  }, []);

  // Init map
  React.useEffect(() => {
    if (!sdkReady || !containerRef.current) return;
    const kakao = (window as any).kakao;
    const center = new kakao.maps.LatLng(lat, lng);
    const map = new kakao.maps.Map(containerRef.current, {
      center,
      level: 3,
    });
    mapRef.current = map;

    // Add marker
    const marker = new kakao.maps.Marker({ position: center, map });
    markerRef.current = marker;

    // Click to move marker
    kakao.maps.event.addListener(map, 'click', (mouseEvent: any) => {
      const latlng = mouseEvent.latLng;
      marker.setPosition(latlng);
      onLocationChange(latlng.getLat(), latlng.getLng());
    });
  }, [sdkReady]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update marker when lat/lng props change externally
  React.useEffect(() => {
    if (!sdkReady || !markerRef.current || !mapRef.current) return;
    const kakao = (window as any).kakao;
    const pos = new kakao.maps.LatLng(lat, lng);
    markerRef.current.setPosition(pos);
  }, [lat, lng, sdkReady]);

  if (!sdkReady) {
    return (
      <View style={pickerStyles.mapLoading}>
        <ActivityIndicator size="small" color={Colors.primary} />
      </View>
    );
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: 200,
        borderRadius: 12,
        overflow: 'hidden',
      }}
    />
  );
}

// ── Main LocationPicker ──────────────────────────────────────────────────────

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
        name: '',
      });
    }
  }, [location]);

  const handleMapLocationChange = (lat: number, lng: number) => {
    onChange({
      lat,
      lng,
      name: value?.name ?? '',
    });
  };

  const handleNameChange = (name: string) => {
    if (value) {
      onChange({ ...value, name });
    }
  };

  const handleRetry = () => {
    requestLocation();
  };

  return (
    <View style={pickerStyles.container}>
      {loading ? (
        <View style={pickerStyles.loadingRow}>
          <ActivityIndicator size="small" color={Colors.primary} />
          <Text style={pickerStyles.loadingText}>위치를 확인하는 중...</Text>
        </View>
      ) : error ? (
        <View style={pickerStyles.errorContainer}>
          <Text style={pickerStyles.errorText}>위치를 가져올 수 없습니다</Text>
          <TouchableOpacity style={pickerStyles.retryButton} onPress={handleRetry}>
            <Text style={pickerStyles.retryText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      ) : value ? (
        <>
          {Platform.OS === 'web' && (
            <View style={pickerStyles.mapContainer}>
              <WebMapPicker
                lat={value.lat}
                lng={value.lng}
                onLocationChange={handleMapLocationChange}
              />
              <Text style={pickerStyles.mapHint}>지도를 탭하여 위치를 변경할 수 있습니다</Text>
            </View>
          )}
          <View style={pickerStyles.coordsBox}>
            <Text style={pickerStyles.coordsLabel}>📍 GPS</Text>
            <Text style={pickerStyles.coordsText}>
              {value.lat.toFixed(5)}, {value.lng.toFixed(5)}
            </Text>
          </View>
          <Input
            label="위치 이름"
            placeholder="분실 추정 장소를 입력하세요 (예: 강남역 2번 출구)"
            value={value.name}
            onChangeText={handleNameChange}
          />
        </>
      ) : null}

      {!loading && !value && !error && (
        <TouchableOpacity style={pickerStyles.retryButton} onPress={handleRetry}>
          <Text style={pickerStyles.retryText}>📍 위치 가져오기</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const pickerStyles = StyleSheet.create({
  container: {
    gap: Spacing.sm,
  },
  mapContainer: {
    gap: Spacing.xs,
  },
  mapLoading: {
    height: 200,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapHint: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    textAlign: 'center',
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
