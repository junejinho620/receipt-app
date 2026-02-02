import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../styles';

interface OnboardingSlideProps {
  icon: string;
  title: string;
  description: string;
}

export function OnboardingSlide({ icon, title, description }: OnboardingSlideProps) {
  return (
    <View style={styles.content}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: 32,
    maxWidth: '100%',
  },
  icon: {
    fontSize: 64,
    marginBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
