export const Colors = {
  // Backgrounds (warm cream tones from Figma)
  background: '#FFF8F0',
  surface: '#FFFFFF',
  surfaceLight: '#FFF0E6',

  // Primary palette (warm orange -- from YUMQUICK design system)
  primary: '#FF6B35',
  primaryLight: '#FFF0E8',
  primaryDark: '#E55A2B',

  // Secondary palette (deep coral accent)
  secondary: '#E23744',
  secondaryLight: '#FFE8EA',

  // Semantic
  warning: '#FFAD0D',
  warningLight: '#FFF6DE',
  success: '#34C759',
  successLight: '#EAFFF0',
  danger: '#E23744',
  dangerLight: '#FFE8EA',

  // Text
  text: '#1E1E2D',
  textSecondary: '#8E8EA9',
  textMuted: '#B0B0C3',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',

  // Borders & Dividers
  border: '#F0EFF5',
  borderFocused: '#FF6B35',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.4)',

  // Notification type colors
  notification: {
    newPost: '#FF6B35',
    mention: '#5B7FFF',
    claim: '#FFAD0D',
    comment: '#8E8EA9',
    resolved: '#34C759',
  },

  // Post status
  status: {
    active: '#FF6B35',
    resolved: '#34C759',
  },
} as const;
