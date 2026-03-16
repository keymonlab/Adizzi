export const Colors = {
  // Backgrounds
  background: '#F5F5F5',
  surface: '#FFFFFF',
  surfaceLight: '#F0F0F0',

  // Primary palette (warm teal -- community/trust feel)
  primary: '#2E7D6F',
  primaryLight: '#E8F5E9',
  primaryDark: '#1B5E4F',

  // Secondary palette (coral accent)
  secondary: '#FF6B6B',
  secondaryLight: '#FFE8E8',

  // Semantic
  warning: '#F9A825',
  warningLight: '#FFF8E1',
  success: '#27AE60',
  successLight: '#E8F5E9',
  danger: '#D32F2F',
  dangerLight: '#FFEBEE',

  // Text
  text: '#1A1A2E',
  textSecondary: '#6B7280',
  textMuted: '#6B7280',
  textOnPrimary: '#FFFFFF',
  textOnDark: '#FFFFFF',

  // Borders & Dividers
  border: '#E5E7EB',
  borderFocused: '#2E7D6F',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0, 0, 0, 0.5)',

  // Notification type colors
  notification: {
    newPost: '#2E7D6F',
    mention: '#3B82F6',
    claim: '#F9A825',
    comment: '#6B7280',
    resolved: '#27AE60',
  },

  // Post status
  status: {
    active: '#2E7D6F',
    resolved: '#27AE60',
  },
} as const;
