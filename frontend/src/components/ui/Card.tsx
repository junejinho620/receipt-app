import React from 'react';
import { View, StyleSheet, ViewStyle, Pressable } from 'react-native';
import { colors } from '../../theme/colors';
import { layout } from '../../theme/layout';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  variant?: 'default' | 'outlined' | 'elevated';
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  variant = 'default'
}) => {
  const Container = onPress ? Pressable : View;

  const getStyle = () => {
    switch (variant) {
      case 'outlined':
        return styles.outlined;
      case 'elevated':
        return styles.elevated;
      default:
        return styles.default;
    }
  };

  return (
    <Container
      style={[styles.container, getStyle(), style]}
      onPress={onPress}
      {...(onPress ? { android_ripple: { color: colors.primary } } : {})}
    >
      {children}
    </Container>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 24, // Softer, larger radius
    padding: layout.spacing.m,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  default: {
    backgroundColor: colors.surface,
    // Subtle shadow for depth
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    backgroundColor: colors.surface,
    shadowColor: colors.secondary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 24,
    elevation: 8,
  },
});
