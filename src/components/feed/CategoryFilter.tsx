import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';
import { CATEGORIES } from '@/constants/categories';
import type { Category } from '@/types/app.types';

interface CategoryFilterProps {
  selectedCategory: Category | undefined;
  onSelect: (category: Category | undefined) => void;
}

interface TabItem {
  value: Category | undefined;
  label: string;
  icon: string;
}

const ALL_TAB: TabItem = { value: undefined, label: '전체', icon: 'apps-outline' };

const TABS: TabItem[] = [
  ALL_TAB,
  ...CATEGORIES.map((c) => ({ value: c.value as Category, label: c.label, icon: c.icon })),
];

export function CategoryFilter({ selectedCategory, onSelect }: CategoryFilterProps) {
  return (
    <View style={styles.wrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.container}
      >
        {TABS.map((tab) => {
          const isActive = tab.value === selectedCategory;
          return (
            <TouchableOpacity
              key={tab.value ?? 'all'}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onSelect(tab.value)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={tab.icon as any}
                size={15}
                color={isActive ? Colors.white : Colors.textSecondary}
              />
              <Text style={[styles.label, isActive && styles.labelActive]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: Colors.background,
  },
  container: {
    paddingHorizontal: Spacing.md + 4,
    paddingVertical: Spacing.sm + 4,
    gap: Spacing.sm,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    gap: Spacing.xs,
  },
  tabActive: {
    backgroundColor: Colors.primary,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  labelActive: {
    color: Colors.white,
  },
});
