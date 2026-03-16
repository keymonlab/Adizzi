import React, { useRef } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { PostWithAuthor } from '@/services/posts.service';
import { Colors } from '@/constants/colors';
import { getCategoryIcon } from '@/constants/categories';

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

interface MapViewProps {
  posts: PostWithAuthor[];
  initialRegion: Region;
  selectedPostId?: string;
  onMarkerPress: (post: PostWithAuthor) => void;
}

// ─── WKT parser (shared) ──────────────────────────────────────────────────────

function parseWKT(wkt: string): { lat: number; lng: number } | null {
  const match = wkt.match(/POINT\(([^ ]+) ([^ ]+)\)/);
  if (!match) return null;
  return { lng: parseFloat(match[1]), lat: parseFloat(match[2]) };
}

// ─── Web: Kakao Maps ──────────────────────────────────────────────────────────
//
// NOTE: Kakao Maps JS SDK requires a "JavaScript 앱 키" from Kakao Developers
// console (https://developers.kakao.com/), which is different from the REST API
// key. Add EXPO_PUBLIC_KAKAO_JS_KEY to .env.local with your JavaScript 앱 키.
// Falling back to EXPO_PUBLIC_KAKAO_REST_API_KEY for now — replace if the map
// fails to load.

let KakaoMapComponent: React.ComponentType<MapViewProps> | null = null;

if (Platform.OS === 'web') {
  function WebMapView({ posts, initialRegion, selectedPostId, onMarkerPress }: MapViewProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const kakaoMapRef = useRef<any>(null);
    const overlaysRef = useRef<any[]>([]);
    const [sdkLoaded, setSdkLoaded] = React.useState(false);

    // ── Load Kakao Maps SDK script once ────────────────────────────────────
    React.useEffect(() => {
      if (typeof window === 'undefined') return;

      const kakao = (window as any).kakao;
      if (kakao?.maps) {
        setSdkLoaded(true);
        return;
      }

      // Prefer JS key; fall back to REST API key
      const appKey =
        process.env.EXPO_PUBLIC_KAKAO_JS_KEY ??
        process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ??
        '';

      const script = document.createElement('script');
      script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`;
      script.async = true;
      script.onload = () => {
        (window as any).kakao.maps.load(() => setSdkLoaded(true));
      };
      script.onerror = () => {
        console.error('[MapView] Failed to load Kakao Maps SDK. Check your app key.');
      };
      document.head.appendChild(script);
    }, []);

    // ── Initialize map once SDK is ready ───────────────────────────────────
    React.useEffect(() => {
      if (!sdkLoaded || !mapContainerRef.current) return;

      const kakao = (window as any).kakao;
      const center = new kakao.maps.LatLng(
        initialRegion.latitude,
        initialRegion.longitude
      );

      // Approximate Kakao zoom level from latitudeDelta
      // Kakao level 1 = closest, 14 = farthest; invert the Google-style zoom
      const kakaoLevel = Math.max(1, Math.min(14, Math.round(initialRegion.latitudeDelta * 111)));

      const map = new kakao.maps.Map(mapContainerRef.current, {
        center,
        level: kakaoLevel > 0 ? kakaoLevel : 5,
      });

      kakaoMapRef.current = map;
    }, [sdkLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Sync markers whenever posts or selectedPostId changes ───────────────
    React.useEffect(() => {
      if (!sdkLoaded || !kakaoMapRef.current) return;

      const kakao = (window as any).kakao;
      const map = kakaoMapRef.current;

      // Remove previous overlays
      overlaysRef.current.forEach((ov) => ov.setMap(null));
      overlaysRef.current = [];

      const postsWithCoords = posts
        .filter((p) => p.location)
        .map((p) => ({ post: p, coords: parseWKT(p.location!) }))
        .filter(
          (x): x is { post: PostWithAuthor; coords: { lat: number; lng: number } } =>
            x.coords !== null
        );

      postsWithCoords.forEach(({ post, coords }) => {
        const isSelected = post.id === selectedPostId;
        const isResolved = post.status === 'resolved';
        const icon = getCategoryIcon(post.category);

        const size = isSelected ? 48 : 40;
        const borderWidth = isSelected ? 3 : 2;
        const borderColor = isResolved ? Colors.status.resolved : Colors.status.active;
        const fontSize = isSelected ? 20 : 18;

        // Build the custom overlay HTML
        const dotHtml = isSelected
          ? `<div style="
              position:absolute;
              bottom:-6px;
              left:50%;
              transform:translateX(-50%);
              width:8px;
              height:8px;
              border-radius:50%;
              background-color:${borderColor};
              pointer-events:none;
            "></div>`
          : '';

        const content = document.createElement('div');
        content.style.cssText = `
          transform: translate(-50%, -50%);
          width: ${size}px;
          height: ${size}px;
          border-radius: 50%;
          background-color: ${Colors.white};
          border: ${borderWidth}px solid ${borderColor};
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          box-shadow: 0 2px 6px rgba(0,0,0,0.35);
          position: relative;
          font-size: ${fontSize}px;
          user-select: none;
          transition: all 0.15s ease;
        `;
        content.innerHTML = `${icon}${dotHtml}`;
        content.addEventListener('click', () => onMarkerPress(post));

        const position = new kakao.maps.LatLng(coords.lat, coords.lng);
        const overlay = new kakao.maps.CustomOverlay({
          position,
          content,
          map,
          zIndex: isSelected ? 10 : 1,
        });

        overlaysRef.current.push(overlay);
      });
    }, [sdkLoaded, posts, selectedPostId, onMarkerPress]);

    if (!sdkLoaded) return <LoadingView />;

    return (
      <div
        ref={mapContainerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
    );
  }

  KakaoMapComponent = WebMapView;
}

// ─── Native: react-native-maps ────────────────────────────────────────────────

let RNMapView: any = null;
let PostMarkerComponent: any = null;

if (Platform.OS !== 'web') {
  RNMapView = require('react-native-maps').default;
  PostMarkerComponent = require('./PostMarker').PostMarker;
}

// ─── Loading placeholder ──────────────────────────────────────────────────────

function LoadingView() {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackText}>지도를 불러오는 중...</Text>
    </View>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function MapView({ posts, initialRegion, selectedPostId, onMarkerPress }: MapViewProps) {
  if (Platform.OS === 'web') {
    if (!KakaoMapComponent) return <LoadingView />;
    return (
      <View style={styles.container}>
        <KakaoMapComponent
          posts={posts}
          initialRegion={initialRegion}
          selectedPostId={selectedPostId}
          onMarkerPress={onMarkerPress}
        />
      </View>
    );
  }

  if (!RNMapView) return <LoadingView />;

  return (
    <RNMapView
      style={styles.map}
      initialRegion={initialRegion}
      customMapStyle={[]}
      showsUserLocation
      showsMyLocationButton={false}
    >
      {posts.filter((p) => p.location).map((post) => (
        <PostMarkerComponent
          key={post.id}
          post={post}
          selected={post.id === selectedPostId}
          onPress={() => onMarkerPress(post)}
        />
      ))}
    </RNMapView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceLight,
  },
  fallbackText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
});
