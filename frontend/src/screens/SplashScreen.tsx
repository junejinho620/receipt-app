import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../theme/colors';
import { Typography } from '../components/ui/Typography';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';

export function SplashScreen() {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 1000 }),
    );
    scale.value = withSpring(1);
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <ScreenWrapper style={styles.container}>
      <Animated.View style={[styles.content, animatedStyle]}>
        <Typography variant="bold" size="h1" color={colors.primary} style={styles.title}>
          the RECEIPT
        </Typography>
        <Typography variant="medium" size="small" color={colors.textSecondary} style={styles.subtitle}>
          MINDFUL EXPENSES
        </Typography>
      </Animated.View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    letterSpacing: 2,
    marginBottom: 8,
  },
  subtitle: {
    letterSpacing: 4,
  },
});
