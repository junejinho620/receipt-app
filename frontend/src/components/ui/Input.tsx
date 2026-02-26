import React, { useState } from 'react';
import { TextInput, StyleSheet, View, TextInputProps, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { layout } from '../../theme/layout';
import { Typography } from './Typography';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  style,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  return (
    <View style={styles.container}>
      {label && (
        <Typography
          variant="medium"
          size="caption"
          color={error ? colors.error : (isFocused ? colors.primary : colors.textSecondary)}
          style={styles.label}
        >
          {label.toUpperCase()}
        </Typography>
      )}
      <View style={[
        styles.inputContainer,
        isFocused && styles.inputContainerFocused,
        !!error && styles.inputContainerError
      ]}>
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={colors.textTertiary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          selectionColor={colors.primary}
          {...props}
        />
      </View>
      {error && (
        <Typography variant="regular" size="small" color={colors.error} style={styles.errorText}>
          {error}
        </Typography>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: layout.spacing.m,
  },
  label: {
    marginBottom: layout.spacing.xs,
    letterSpacing: 0.5,
  },
  inputContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: layout.borderRadius.m,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: layout.spacing.m,
  },
  inputContainerFocused: {
    borderColor: colors.primary,
    backgroundColor: colors.surfaceHighlight,
    shadowColor: colors.primary,
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  inputContainerError: {
    borderColor: colors.error,
  },
  input: {
    fontFamily: typography.families.regular,
    fontSize: typography.sizes.body,
    color: colors.textPrimary,
    flex: 1,
    height: '100%',
  },
  errorText: {
    marginTop: layout.spacing.xs,
  },
});
