import React, { useState } from 'react';
import { Alert, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { SocialLoginButton } from '@/components/auth/SocialLoginButton';
import { Colors } from '@/constants/colors';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';
import { useAuth } from '@/hooks/useAuth';
import { OAuthProvider } from '@/services/auth.service';

export default function LoginScreen() {
  const { signIn, signInWithEmail } = useAuth();
  const [loadingProvider, setLoadingProvider] = useState<OAuthProvider | null>(null);
  const [devLoading, setDevLoading] = useState(false);

  async function handleSignIn(provider: OAuthProvider) {
    if (loadingProvider) return;
    setLoadingProvider(provider);
    try {
      await signIn(provider);
    } catch (err) {
      const message = err instanceof Error ? err.message : '로그인에 실패했습니다.';
      Alert.alert('로그인 오류', message);
    } finally {
      setLoadingProvider(null);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Logo / Hero */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>mampa</Text>
          </View>
          <Text style={styles.tagline}>우리 동네 분실물 찾기</Text>
          <Text style={styles.description}>
            소중한 물건을 잃어버렸거나{'\n'}찾으셨나요? 이웃과 함께 찾아요.
          </Text>
        </View>

        {/* Social Login Buttons */}
        <View style={styles.buttonSection}>
          <SocialLoginButton
            provider="kakao"
            onPress={() => handleSignIn('kakao')}
            loading={loadingProvider === 'kakao'}
            disabled={loadingProvider !== null && loadingProvider !== 'kakao'}
          />
          <SocialLoginButton
            provider="google"
            onPress={() => handleSignIn('google')}
            loading={loadingProvider === 'google'}
            disabled={loadingProvider !== null && loadingProvider !== 'google'}
          />
        </View>

        {/* Dev Login */}
        {__DEV__ && (
          <Pressable
            style={[styles.devButton, devLoading && styles.devButtonDisabled]}
            onPress={async () => {
              if (devLoading) return;
              setDevLoading(true);
              try {
                console.log('[Dev Login] Attempting sign in...');
                await signInWithEmail('test@mampa.dev', 'testpass1234');
                console.log('[Dev Login] Sign in successful');
                router.replace('/');
              } catch (err) {
                const message = err instanceof Error ? err.message : '로그인 실패';
                console.error('[Dev Login] Error:', message);
                Alert.alert('Dev Login Error', message);
              } finally {
                setDevLoading(false);
              }
            }}
          >
            <Text style={styles.devButtonText}>
              {devLoading ? '로그인 중...' : '🔧 Dev Login (test@mampa.dev)'}
            </Text>
          </Pressable>
        )}

        {/* Footer */}
        <Text style={styles.termsText}>
          로그인하면 이용약관에 동의하게 됩니다
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    paddingVertical: Spacing.xl,
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  logoContainer: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.sm,
  },
  logoText: {
    color: Colors.white,
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    color: Colors.text,
    fontSize: FontSize.xxl,
    fontWeight: '700',
    textAlign: 'center',
  },
  description: {
    color: Colors.textMuted,
    fontSize: FontSize.md,
    textAlign: 'center',
    lineHeight: 22,
  },
  buttonSection: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  termsText: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    textAlign: 'center',
  },
  devButton: {
    backgroundColor: Colors.surfaceLight,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.md,
    alignItems: 'center' as const,
  },
  devButtonDisabled: {
    opacity: 0.5,
  },
  devButtonText: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    fontWeight: '600' as const,
  },
});
