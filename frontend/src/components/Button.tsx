import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Typography } from './ui/Typography';
import { layout } from '../theme/layout';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  style?: ViewStyle;
  disabled?: boolean;
  loading?: boolean;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  style,
  disabled = false,
  loading = false
}: ButtonProps) {
  const { colors } = useTheme();

  const getBackgroundColor = () => {
    if (disabled) return colors.surfaceHighlight;
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.secondary;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      default: return colors.primary;
    }
  };

  const getTextColor = () => {
    if (disabled) return colors.textSecondary;
    switch (variant) {
      case 'primary': return colors.background;
      case 'secondary': return colors.textPrimary;
      case 'outline': return colors.primary;
      case 'ghost': return colors.textPrimary;
      default: return colors.background;
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'small': return 36;
      case 'medium': return 48;
      case 'large': return 56;
      default: return 48;
    }
  };

  const styles = React.useMemo(() => getStyles(colors), [colors]);

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          height: getHeight(),
          borderColor: variant === 'outline' ? colors.primary : 'transparent',
          borderWidth: variant === 'outline' ? 1 : 0,
        },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      <Typography
        variant="bold"
        size={size === 'small' ? 'small' : 'body'}
        color={getTextColor()}
        style={[styles.text, { letterSpacing: 0.5 }]}
      >
        {loading ? 'Processing...' : title}
      </Typography>
    </TouchableOpacity>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  container: {
    paddingHorizontal: layout.spacing.xl,
    borderRadius: 999, // Pill shape
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...Platform.select({
      ios: {
        shadowColor: colors.secondary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    // textTransform handled in props if needed, but 'uppercase' removed for calmer vibe
  },
});
