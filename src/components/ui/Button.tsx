import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
  ViewStyle,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { BorderRadius, FontSize, Shadow, Spacing } from '../../constants/layout';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<TouchableOpacityProps, 'style'> {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}

const variantStyles: Record<ButtonVariant, { container: ViewStyle; text: object }> = {
  primary: {
    container: {
      backgroundColor: Colors.primary,
      borderWidth: 0,
      ...Shadow.sm,
    },
    text: {
      color: Colors.white,
    },
  },
  secondary: {
    container: {
      backgroundColor: Colors.primaryLight,
      borderWidth: 0,
    },
    text: {
      color: Colors.primary,
    },
  },
  outline: {
    container: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: Colors.border,
    },
    text: {
      color: Colors.text,
    },
  },
  danger: {
    container: {
      backgroundColor: Colors.danger,
      borderWidth: 0,
      ...Shadow.sm,
    },
    text: {
      color: Colors.white,
    },
  },
};

const sizeStyles: Record<ButtonSize, { container: ViewStyle; text: object }> = {
  sm: {
    container: {
      paddingVertical: Spacing.xs,
      paddingHorizontal: Spacing.sm,
      borderRadius: BorderRadius.lg,
    },
    text: {
      fontSize: FontSize.sm,
    },
  },
  md: {
    container: {
      paddingVertical: Spacing.sm + 2,
      paddingHorizontal: Spacing.md,
      borderRadius: BorderRadius.lg,
    },
    text: {
      fontSize: FontSize.md,
    },
  },
  lg: {
    container: {
      paddingVertical: Spacing.md - 2,
      paddingHorizontal: Spacing.lg,
      borderRadius: BorderRadius.lg,
    },
    text: {
      fontSize: FontSize.lg,
    },
  },
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  ...rest
}: ButtonProps) {
  const vStyle = variantStyles[variant];
  const sStyle = sizeStyles[size];
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.75}
      style={[
        styles.base,
        vStyle.container,
        sStyle.container,
        isDisabled && styles.disabled,
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' || variant === 'secondary' ? Colors.primary : Colors.white}
        />
      ) : (
        <Text style={[styles.text, vStyle.text, sStyle.text]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  disabled: {
    opacity: 0.45,
  },
});
