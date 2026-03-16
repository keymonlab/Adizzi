import React, { useCallback, useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { Colors } from '@/constants/colors';
import { FontSize, Spacing } from '@/constants/layout';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { HandleInput } from '@/components/auth/HandleInput';
import { updateProfile } from '@/services/users.service';

function deriveHandleSuggestion(email: string | undefined): string {
  if (!email) return '';
  const prefix = email.split('@')[0] ?? '';
  // Strip characters not allowed in handles
  return prefix.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20);
}

export default function OnboardingScreen() {
  const { user, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [handleAvailable, setHandleAvailable] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-suggest handle from email on mount
  useEffect(() => {
    const suggestion = deriveHandleSuggestion(user?.email);
    if (suggestion) setHandle(suggestion);
  }, [user?.email]);

  const isFormValid =
    displayName.trim().length > 0 &&
    handle.length >= 3 &&
    handleAvailable;

  const handleAvailabilityChange = useCallback((available: boolean) => {
    setHandleAvailable(available);
  }, []);

  const handleSubmit = async () => {
    if (!user || !isFormValid) return;
    setLoading(true);
    setError(null);
    try {
      await updateProfile(user.id, {
        display_name: displayName.trim(),
        handle,
      });
      await refreshProfile();
      router.replace('/(auth)/verify-location');
    } catch (err) {
      setError('프로필 저장 중 오류가 발생했어요. 다시 시도해 주세요.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>프로필 설정</Text>
            <Text style={styles.subtitle}>
              동네 이웃들에게 보여질 이름과 핸들을 설정하세요
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              label="표시 이름"
              placeholder="홍길동"
              value={displayName}
              onChangeText={setDisplayName}
              maxLength={30}
              autoCorrect={false}
            />

            <HandleInput
              label="핸들"
              value={handle}
              onChangeText={setHandle}
              onAvailabilityChange={handleAvailabilityChange}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </View>

          <Button
            title="시작하기"
            onPress={handleSubmit}
            disabled={!isFormValid}
            loading={loading}
            size="lg"
            style={styles.button}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl * 2,
    paddingBottom: Spacing.xl,
  },
  header: {
    marginBottom: Spacing.xl,
  },
  title: {
    fontSize: FontSize.title,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    lineHeight: FontSize.md * 1.6,
  },
  form: {
    gap: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  errorText: {
    fontSize: FontSize.sm,
    color: Colors.primary,
    textAlign: 'center',
  },
  button: {
    marginTop: 'auto' as never,
  },
});
