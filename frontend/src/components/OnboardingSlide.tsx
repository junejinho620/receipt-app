import React from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import { Typography } from './ui/Typography';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

interface OnboardingSlideProps {
  image: any;
  title: string;
  description: string;
}

const { width } = Dimensions.get('window');

export function OnboardingSlide({ image, title, description }: OnboardingSlideProps) {
  return (
    <View style={styles.container}>
      <View style={styles.imageWrapper}>
        <View style={styles.iconContainer}>
          <Image source={image} style={styles.image} resizeMode="contain" />
        </View>
      </View>
      <View style={styles.textContainer}>
        <Typography
          variant="bold"
          size="h1"
          color={colors.primary}
          centered
          style={styles.title}
        >
          {title.toUpperCase()}
        </Typography>
        <Typography
          variant="regular"
          size="body"
          color={colors.textSecondary}
          centered
          style={styles.description}
        >
          {description}
        </Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width,
    flex: 1,
    paddingHorizontal: layout.spacing.xl,
  },
  imageWrapper: {
    flex: 1.1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: layout.spacing.xxl,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOpacity: 0.2,
    shadowRadius: 20,
    overflow: 'hidden',
  },
  image: {
    width: '80%',
    height: '80%',
  },
  textContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: layout.spacing.m,
  },
  title: {
    letterSpacing: 1,
  },
  description: {
    paddingHorizontal: layout.spacing.m,
  },
});
