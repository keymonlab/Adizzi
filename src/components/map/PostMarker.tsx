import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

let Marker: any = null;
if (Platform.OS !== 'web') {
  Marker = require('react-native-maps').Marker;
}
import { Colors } from '@/constants/colors';
import { getCategoryIcon } from '@/constants/categories';
import type { PostWithAuthor } from '@/services/posts.service';

interface PostMarkerProps {
  post: PostWithAuthor;
  selected: boolean;
  onPress: () => void;
}

function parseWKT(wkt: string): { latitude: number; longitude: number } | null {
  const match = wkt.match(/POINT\(([^ ]+) ([^ ]+)\)/);
  if (!match) return null;
  return { longitude: parseFloat(match[1]), latitude: parseFloat(match[2]) };
}

export function PostMarker({ post, selected, onPress }: PostMarkerProps) {
  if (Platform.OS === 'web' || !Marker) return null;
  if (!post.location) return null;

  const coords = parseWKT(post.location);
  if (!coords) return null;

  const isResolved = post.status === 'resolved';
  const markerColor = isResolved ? Colors.status.resolved : Colors.status.active;
  const icon = getCategoryIcon(post.category);

  return (
    <Marker coordinate={coords} onPress={onPress} tracksViewChanges={false}>
      <View style={[styles.marker, selected && styles.markerSelected, { borderColor: markerColor }]}>
        <Text style={styles.emoji}>{icon}</Text>
        {selected && <View style={[styles.dot, { backgroundColor: markerColor }]} />}
      </View>
    </Marker>
  );
}

const styles = StyleSheet.create({
  marker: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.status.active,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 5,
  },
  markerSelected: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 3,
  },
  emoji: {
    fontSize: 18,
  },
  dot: {
    position: 'absolute',
    bottom: -6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.status.active,
  },
});
