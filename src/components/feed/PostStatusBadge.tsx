import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { FontSize, BorderRadius, Spacing } from '@/constants/layout';

interface PostStatusBadgeProps {
  status: 'active' | 'resolved';
}

export function PostStatusBadge({ status }: PostStatusBadgeProps) {
  const isActive = status === 'active';

  return (
    <View style={[styles.badge, isActive ? styles.active : styles.resolved]}>
      <Text style={styles.text}>{isActive ? '찾는중' : '해결됨'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  active: {
    backgroundColor: Colors.primaryLight,
  },
  resolved: {
    backgroundColor: Colors.successLight,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.status.active,
  },
});
