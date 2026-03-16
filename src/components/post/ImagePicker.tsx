import React from 'react';
import {
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Text,
  StyleSheet,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { MAX_IMAGES } from '@/constants/config';

interface ImagePickerProps {
  images: string[];
  onPickImages: () => Promise<void>;
  onTakePhoto: () => Promise<void>;
  onRemoveImage: (index: number) => void;
  maxImages?: number;
}

export function ImagePicker({
  images,
  onPickImages,
  onTakePhoto,
  onRemoveImage,
  maxImages = MAX_IMAGES,
}: ImagePickerProps): React.ReactElement {
  const canAdd = images.length < maxImages;

  return (
    <View style={styles.container}>
      {images.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No images added</Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {images.map((uri, index) => (
            <View key={`${uri}-${index}`} style={styles.imageWrapper}>
              <Image source={{ uri }} style={styles.image} />
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => onRemoveImage(index)}
                hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}

      <View style={styles.footer}>
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionButton, !canAdd && styles.actionButtonDisabled]}
            onPress={onTakePhoto}
            disabled={!canAdd}
          >
            <Text style={styles.actionButtonText}>📷 Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, !canAdd && styles.actionButtonDisabled]}
            onPress={onPickImages}
            disabled={!canAdd}
          >
            <Text style={styles.actionButtonText}>🖼 Gallery</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.counter}>
          {images.length}/{maxImages}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  emptyState: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  emptyText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  scrollContent: {
    gap: 8,
    paddingVertical: 4,
  },
  imageWrapper: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'visible',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Colors.surfaceLight,
  },
  removeButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeButtonText: {
    color: Colors.white,
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  actionButtonDisabled: {
    opacity: 0.4,
  },
  actionButtonText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '500',
  },
  counter: {
    color: Colors.textSecondary,
    fontSize: 13,
  },
});
