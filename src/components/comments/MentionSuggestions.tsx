import React from 'react';
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';
import type { MentionSection, MentionUser } from '@/hooks/useMentionSearch';

interface MentionSuggestionsProps {
  sections: MentionSection[];
  onSelect: (user: MentionUser) => void;
  isLoading: boolean;
  visible: boolean;
}

export function MentionSuggestions({
  sections,
  onSelect,
  isLoading,
  visible,
}: MentionSuggestionsProps) {
  if (!visible) return null;

  const hasResults = sections.some((s) => s.data.length > 0);

  if (!isLoading && !hasResults) return null;

  return (
    <View style={styles.container}>
      {isLoading && !hasResults ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={Colors.primary} />
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="always"
          renderSectionHeader={({ section }) => (
            <Text style={styles.sectionHeader}>{section.title}</Text>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.row}
              onPress={() => onSelect(item)}
              activeOpacity={0.7}
            >
              <Avatar uri={item.avatar_url} name={item.display_name ?? item.handle} size="sm" />
              <View style={styles.userInfo}>
                <Text style={styles.displayName} numberOfLines={1}>
                  {item.display_name ?? item.handle}
                </Text>
                <Text style={styles.handle} numberOfLines={1}>
                  @{item.handle}
                </Text>
              </View>
            </TouchableOpacity>
          )}
          style={styles.list}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.xs,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    overflow: 'hidden',
  },
  list: {
    maxHeight: 200,
  },
  sectionHeader: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.surface,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    minWidth: 0,
  },
  displayName: {
    fontSize: FontSize.sm,
    color: Colors.text,
    fontWeight: '500',
    flexShrink: 1,
  },
  handle: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flexShrink: 1,
  },
  loadingContainer: {
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
