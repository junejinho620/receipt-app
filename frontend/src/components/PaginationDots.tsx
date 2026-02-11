import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming
} from 'react-native-reanimated';
import { colors } from '../theme/colors';

interface PaginationDotsProps {
  count: number;
  activeIndex: number;
}

const Dot = ({ isActive }: { isActive: boolean }) => {
  const animatedStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(isActive ? 24 : 8, { damping: 15 }),
      backgroundColor: withTiming(isActive ? colors.primary : colors.textSecondary, { duration: 300 }),
      opacity: withTiming(isActive ? 1 : 0.5, { duration: 300 }),
    };
  });

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

export function PaginationDots({ count, activeIndex }: PaginationDotsProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: count }).map((_, index) => (
        <Dot key={index} isActive={index === activeIndex} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 10,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
