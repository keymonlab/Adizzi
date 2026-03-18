import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BorderRadius, FontSize, Spacing } from '@/constants/layout';

type OAuthProvider = 'kakao' | 'google';

interface SocialLoginButtonProps {
  provider: OAuthProvider;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}

const PROVIDER_CONFIG: Record<
  OAuthProvider,
  {
    label: string;
    icon: string;
    backgroundColor: string;
    textColor: string;
    borderColor?: string;
    indicatorColor: string;
  }
> = {
  kakao: {
    label: '카카오로 시작하기',
    icon: 'K',
    backgroundColor: '#FEE500',
    textColor: '#191919',
    indicatorColor: '#191919',
  },
  google: {
    label: '구글로 시작하기',
    icon: 'G',
    backgroundColor: '#ffffff',
    textColor: '#333333',
    borderColor: '#dadce0',
    indicatorColor: '#333333',
  },
};

export function SocialLoginButton({
  provider,
  onPress,
  loading = false,
  disabled = false,
}: SocialLoginButtonProps) {
  const config = PROVIDER_CONFIG[provider];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      testID={`login-${provider}`}
      accessibilityLabel={config.label}
      style={[
        styles.button,
        {
          backgroundColor: config.backgroundColor,
          borderColor: config.borderColor ?? 'transparent',
          borderWidth: config.borderColor ? 1 : 0,
        },
        isDisabled && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={config.indicatorColor} />
      ) : (
        <>
          <View
            style={[
              styles.iconContainer,
              { borderColor: config.textColor + '33' },
            ]}
          >
            <Text style={[styles.iconText, { color: config.textColor }]}>
              {config.icon}
            </Text>
          </View>
          <Text style={[styles.label, { color: config.textColor }]}>
            {config.label}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg,
    minHeight: 52,
    position: 'relative',
  },
  iconContainer: {
    position: 'absolute',
    left: Spacing.lg,
    width: 28,
    height: 28,
    borderRadius: BorderRadius.sm,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  label: {
    fontSize: FontSize.lg,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  disabled: {
    opacity: 0.5,
  },
});
