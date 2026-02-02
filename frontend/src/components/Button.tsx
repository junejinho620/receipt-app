import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { colors } from '../styles';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  disabled?: boolean;
}

export function Button({ title, onPress, variant = 'primary', style, disabled = false }: ButtonProps) {
  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'secondary' && styles.secondary,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[
        styles.text,
        variant === 'secondary' && styles.secondaryText,
        disabled && styles.disabledText,
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  disabled: {
    backgroundColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  text: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryText: {
    color: colors.primary,
  },
  disabledText: {
    color: colors.textLight,
  },
});
