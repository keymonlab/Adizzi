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
      <View style={[styles.dot, isActive ? styles.dotActive : styles.dotResolved]} />
      <Text style={[styles.text, isActive ? styles.textActive : styles.textResolved]}>
        {isActive ? '찾는중' : '해결됨'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  active: {
    backgroundColor: Colors.primaryLight,
  },
  resolved: {
    backgroundColor: Colors.successLight,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    backgroundColor: Colors.primary,
  },
  dotResolved: {
    backgroundColor: Colors.success,
  },
  text: {
    fontSize: FontSize.xs,
    fontWeight: '700',
  },
  textActive: {
    color: Colors.primary,
  },
  textResolved: {
    color: Colors.success,
  },
});
