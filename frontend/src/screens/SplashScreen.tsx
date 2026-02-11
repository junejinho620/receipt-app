import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withTiming,
  withDelay
} from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { Typography } from '../components/ui/Typography';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';

type SplashScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Splash'>;
};

export function SplashScreen({ navigation }: SplashScreenProps) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    opacity.value = withSequence(
      withTiming(1, { duration: 1000 }),
      withDelay(1000, withTiming(0, { duration: 500 }))
    );
    scale.value = withSpring(1);

    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation]);

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
