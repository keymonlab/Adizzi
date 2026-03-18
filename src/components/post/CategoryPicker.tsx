import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CATEGORIES } from '@/constants/categories';
import type { Category } from '@/types/app.types';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';

interface CategoryPickerProps {
  selected: Category | undefined;
  onSelect: (category: Category) => void;
}

export function CategoryPicker({ selected, onSelect }: CategoryPickerProps): React.ReactElement {
  return (
    <View style={styles.grid}>
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.value;
        return (
          <TouchableOpacity
            key={cat.value}
            style={[styles.card, isSelected && styles.cardSelected]}
            onPress={() => onSelect(cat.value)}
            activeOpacity={0.7}
            testID={`pick-category-${cat.value}`}
            accessibilityLabel={cat.label}
          >
            <Ionicons name={cat.icon as any} size={22} color={isSelected ? Colors.primary : Colors.textSecondary} />
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{cat.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  card: {
    flex: 1,
    minWidth: '28%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    gap: 4,
  },
  cardSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  icon: {
    fontSize: 22,
  },
  label: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  labelSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
});
