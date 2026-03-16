import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { PostWithAuthor } from '@/services/posts.service';
import { Colors } from '@/constants/colors';

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

function WebFallback() {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackText}>지도는 모바일 앱에서 사용할 수 있습니다</Text>
    </View>
  );
}

let RNMapView: any = null;
let PostMarkerComponent: any = null;

if (Platform.OS !== 'web') {
  RNMapView = require('react-native-maps').default;
  PostMarkerComponent = require('./PostMarker').PostMarker;
}

export function MapView({ posts, initialRegion, selectedPostId, onMarkerPress }: MapViewProps) {
  if (Platform.OS === 'web' || !RNMapView) {
    return <WebFallback />;
  }

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
