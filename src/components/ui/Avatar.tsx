import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../../constants/colors';
import { FontSize } from '../../constants/layout';

type AvatarSize = 'sm' | 'md' | 'lg';

interface AvatarProps {
  uri?: string | null;
  name?: string | null;
  size?: AvatarSize;
}

const sizeMap: Record<AvatarSize, number> = {
  sm: 36,
  md: 44,
  lg: 64,
};

const fontSizeMap: Record<AvatarSize, number> = {
  sm: FontSize.sm,
  md: FontSize.md,
  lg: FontSize.xl,
};

export function Avatar({ uri, name, size = 'md' }: AvatarProps) {
  const dimension = sizeMap[size];
  const fontSize = fontSizeMap[size];
  const initial = name ? name.charAt(0).toUpperCase() : '?';

  const containerStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
  };

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, containerStyle]}
        resizeMode="cover"
      />
    );
  }

  return (
    <View style={[styles.fallback, containerStyle]}>
      <Text style={[styles.initial, { fontSize }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.surfaceLight,
  },
  fallback: {
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
