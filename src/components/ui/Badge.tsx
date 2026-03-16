import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, Spacing } from '../../constants/layout';

type BadgeVariant = 'filled' | 'outline';

interface BadgeProps {
  label: string;
  color?: string;
  variant?: BadgeVariant;
  style?: ViewStyle;
}

export function Badge({
  label,
  color = Colors.primary,
  variant = 'filled',
  style,
}: BadgeProps) {
  const isFilled = variant === 'filled';

  return (
    <View
      style={[
        styles.base,
        isFilled
          ? { backgroundColor: color }
          : { backgroundColor: 'transparent', borderWidth: 1, borderColor: color },
        style,
      ]}
    >
      <Text style={[styles.label, { color: isFilled ? Colors.white : color }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  label: {
    fontSize: FontSize.xs,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
});
