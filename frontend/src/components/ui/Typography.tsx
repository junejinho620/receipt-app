import React from 'react';
import { Text, TextStyle, StyleSheet, TextProps } from 'react-native';
import { typography } from '../../theme/typography';
import { useTheme } from '../../context/ThemeContext';

interface TypographyProps extends TextProps {
  variant?: keyof typeof typography.families;
  size?: keyof typeof typography.sizes;
  color?: string;
  centered?: boolean;
}

export const Typography: React.FC<TypographyProps> = ({
  children,
  variant = 'regular',
  size = 'body',
  color,
  centered = false,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const textColor = color || colors.textPrimary;

  const textStyle: TextStyle = {
    fontFamily: typography.families[variant],
    fontSize: typography.sizes?.[size] ?? typography.sizes?.body ?? 16,
    // @ts-ignore
    lineHeight: typography.lineHeights?.[size] ?? typography.lineHeights?.body ?? 24,
    color: textColor,
    textAlign: centered ? 'center' : 'left',
  };

  return (
    <Text style={[textStyle, style]} {...props}>
      {children}
    </Text>
  );
};
