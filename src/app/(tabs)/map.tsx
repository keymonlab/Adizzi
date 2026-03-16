import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { usePosts } from '@/hooks/usePosts';
import { MapView } from '@/components/map/MapView';
import { MiniCard } from '@/components/map/MiniCard';
import type { PostWithAuthor } from '@/services/posts.service';

const SEOUL_DEFAULT: Region = {
  latitude: 37.4837,
  longitude: 127.0324,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function MapScreen() {
  const { profile } = useAuth();
  const neighborhoodId = profile?.neighborhood_id ?? '';
  const { data } = usePosts(neighborhoodId);
  const posts = data?.posts ?? [];

  const [selectedPost, setSelectedPost] = useState<PostWithAuthor | null>(null);

  function handleMarkerPress(post: PostWithAuthor) {
    setSelectedPost((prev) => (prev?.id === post.id ? null : post));
  }

  function handleMiniCardPress() {
    if (!selectedPost) return;
    router.push(`/post/${selectedPost.id}`);
  }

  return (
    <View style={styles.container}>
      <MapView
        posts={posts}
        initialRegion={SEOUL_DEFAULT}
        selectedPostId={selectedPost?.id}
        onMarkerPress={handleMarkerPress}
      />

      {selectedPost && (
        <View style={styles.miniCardContainer}>
          <MiniCard post={selectedPost} onPress={handleMiniCardPress} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  miniCardContainer: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
  },
});
