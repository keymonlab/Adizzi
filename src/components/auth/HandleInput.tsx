import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';
import { checkHandleAvailability } from '@/services/users.service';

const HANDLE_REGEX = /^[a-z0-9_]*$/;
const MIN_LENGTH = 3;
const MAX_LENGTH = 20;
const DEBOUNCE_MS = 300;

interface HandleInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onAvailabilityChange?: (available: boolean) => void;
  label?: string;
}

type AvailabilityState = 'idle' | 'checking' | 'available' | 'taken' | 'invalid';

export function HandleInput({
  value,
  onChangeText,
  onAvailabilityChange,
  label = '핸들',
}: HandleInputProps) {
  const [focused, setFocused] = useState(false);
  const [availability, setAvailability] = useState<AvailabilityState>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.length === 0) {
      setAvailability('idle');
      onAvailabilityChange?.(false);
      return;
    }

    if (!HANDLE_REGEX.test(value)) {
      setAvailability('invalid');
      onAvailabilityChange?.(false);
      return;
    }

    if (value.length < MIN_LENGTH) {
      setAvailability('invalid');
      onAvailabilityChange?.(false);
      return;
    }

    setAvailability('checking');

    debounceRef.current = setTimeout(async () => {
      try {
        const available = await checkHandleAvailability(value);
        setAvailability(available ? 'available' : 'taken');
        onAvailabilityChange?.(available);
      } catch {
        setAvailability('idle');
        onAvailabilityChange?.(false);
      }
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [value, onAvailabilityChange]);

  const handleChange = (text: string) => {
    const cleaned = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
    onChangeText(cleaned);
  };

  const validationError = (() => {
    if (value.length === 0) return undefined;
    if (!HANDLE_REGEX.test(value))
      return '소문자, 숫자, 밑줄(_)만 사용할 수 있어요';
    if (value.length < MIN_LENGTH)
      return `최소 ${MIN_LENGTH}자 이상이어야 해요`;
    return undefined;
  })();

  const hasBorderError =
    availability === 'taken' || availability === 'invalid';
  const hasBorderSuccess = availability === 'available';

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View
        style={[
          styles.inputRow,
          focused && styles.focused,
          hasBorderError && styles.errorBorder,
          hasBorderSuccess && styles.successBorder,
        ]}
      >
        <Text style={styles.prefix}>@</Text>
        <TextInput
          value={value}
          onChangeText={handleChange}
          placeholder="handle"
          placeholderTextColor={Colors.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          maxLength={MAX_LENGTH}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={styles.input}
        />
        <View style={styles.indicator}>
          {availability === 'checking' && (
            <ActivityIndicator size="small" color={Colors.textSecondary} />
          )}
          {availability === 'available' && (
            <Text style={styles.available}>✓</Text>
          )}
          {availability === 'taken' && (
            <Text style={styles.taken}>✕</Text>
          )}
        </View>
      </View>

      {validationError ? (
        <Text style={styles.errorText}>{validationError}</Text>
      ) : availability === 'taken' ? (
        <Text style={styles.errorText}>이미 사용 중인 핸들이에요</Text>
      ) : availability === 'available' ? (
        <Text style={styles.availableText}>사용 가능한 핸들이에요</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
  },
  focused: {
    borderColor: Colors.primary,
  },
  errorBorder: {
    borderColor: Colors.primary,
  },
  successBorder: {
    borderColor: Colors.secondary,
  },
  prefix: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginRight: 2,
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.text,
    padding: 0,
  },
  indicator: {
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  available: {
    fontSize: FontSize.md,
    color: Colors.secondary,
    fontWeight: '700',
  },
  taken: {
    fontSize: FontSize.md,
    color: Colors.primary,
    fontWeight: '700',
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.primary,
    marginTop: 2,
  },
  availableText: {
    fontSize: FontSize.xs,
    color: Colors.secondary,
    marginTop: 2,
  },
});
