import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MentionSuggestions } from './MentionSuggestions';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';
import { useCreateComment } from '@/hooks/useComments';
import { useMentionSearch, type MentionUser } from '@/hooks/useMentionSearch';
import { useAuth } from '@/hooks/useAuth';
import { replaceMentionsWithIds } from '@/utils/mention';

interface CommentInputProps {
  postId: string;
}

function detectMentionQuery(text: string, cursorPosition: number): string | null {
  const beforeCursor = text.substring(0, cursorPosition);
  const match = beforeCursor.match(/@(\w*)$/);
  return match ? match[1] : null;
}

export function CommentInput({ postId }: CommentInputProps) {
  const [text, setText] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  // Map handle -> user id for tracked mentions
  const [handleToId, setHandleToId] = useState<Record<string, string>>({});

  const inputRef = useRef<TextInput>(null);
  const { user, profile } = useAuth();
  const { mutateAsync: createComment, isPending } = useCreateComment();

  const mentionQuery = detectMentionQuery(text, cursorPosition);
  const isMentionActive = mentionQuery !== null;

  const { sections, isLoading: isMentionLoading } = useMentionSearch(
    mentionQuery ?? '',
    user?.id ?? '',
    profile?.neighborhood_id ?? ''
  );

  const handleSelectMention = (mentionUser: MentionUser) => {
    // Find the @query before cursor and replace it with @handle
    const beforeCursor = text.substring(0, cursorPosition);
    const afterCursor = text.substring(cursorPosition);
    const replaced = beforeCursor.replace(/@(\w*)$/, `@${mentionUser.handle} `);
    const newText = replaced + afterCursor;
    setText(newText);
    setCursorPosition(replaced.length);

    // Track mention
    setHandleToId((prev) => ({
      ...prev,
      [mentionUser.handle]: mentionUser.id,
    }));

    inputRef.current?.focus();
  };

  const handleSubmit = async () => {
    const trimmed = text.trim();
    if (!trimmed || isPending) return;

    const mentionIds = replaceMentionsWithIds(trimmed, handleToId);

    try {
      await createComment({
        post_id: postId,
        content: trimmed,
        mentions: mentionIds,
      });
      setText('');
      setCursorPosition(0);
      setHandleToId({});
    } catch (err) {
      console.error('Failed to create comment:', err);
    }
  };

  const hasContent = text.trim().length > 0;

  return (
    <View style={styles.wrapper}>
      {/* Mention suggestions float above input */}
      <MentionSuggestions
        sections={sections}
        onSelect={handleSelectMention}
        isLoading={isMentionLoading}
        visible={isMentionActive}
      />

      <View style={styles.inputRow}>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={text}
          onChangeText={(val) => {
            setText(val);
          }}
          onSelectionChange={(e) => {
            setCursorPosition(e.nativeEvent.selection.end);
          }}
          placeholder="댓글을 입력하세요..."
          placeholderTextColor={Colors.textMuted}
          multiline
          maxLength={500}
          returnKeyType="default"
          blurOnSubmit={false}
        />

        <TouchableOpacity
          style={[styles.sendBtn, hasContent && styles.sendBtnActive]}
          onPress={handleSubmit}
          disabled={!hasContent || isPending}
          activeOpacity={0.7}
        >
          {isPending ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Text style={[styles.sendBtnText, hasContent && styles.sendBtnTextActive]}>
              등록
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.text,
  },
  sendBtn: {
    height: 40,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sendBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  sendBtnTextActive: {
    color: Colors.white,
  },
});
