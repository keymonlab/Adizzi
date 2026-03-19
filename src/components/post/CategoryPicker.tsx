import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { CATEGORIES } from '@/constants/categories';
import type { Category } from '@/types/app.types';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize } from '@/constants/layout';

interface CategoryPickerProps {
  selected: Category | undefined;
  onSelect: (category: Category) => void;
}

export function CategoryPicker({ selected, onSelect }: CategoryPickerProps): React.ReactElement {
  return (
    <View style={styles.container}>
      {CATEGORIES.map((cat) => {
        const isSelected = selected === cat.value;
        return (
          <TouchableOpacity
            key={cat.value}
            style={[styles.chip, isSelected && styles.chipSelected]}
            onPress={() => onSelect(cat.value)}
            activeOpacity={0.7}
            testID={`pick-category-${cat.value}`}
            accessibilityLabel={cat.label}
          >
            <Ionicons
              name={cat.icon as any}
              size={16}
              color={isSelected ? Colors.textOnPrimary : Colors.textSecondary}
            />
            <Text style={[styles.label, isSelected && styles.labelSelected]}>{cat.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  label: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  labelSelected: {
    color: Colors.textOnPrimary,
    fontWeight: '600',
  },
});
