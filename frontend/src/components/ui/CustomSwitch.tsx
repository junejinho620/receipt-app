import React, { useEffect } from 'react';
import { TouchableWithoutFeedback, StyleSheet, ViewStyle } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolateColor,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { colors } from '../../theme/colors';

interface CustomSwitchProps {
  value: boolean;
  onValueChange: (val: boolean) => void;
  style?: ViewStyle;
}

export function CustomSwitch({ value, onValueChange, style }: CustomSwitchProps) {
  // 0 means off, 1 means on
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, {
      mass: 0.8,
      damping: 15,
      stiffness: 120,
    });
  }, [value]);

  const toggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onValueChange(!value);
  };

  const trackStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      progress.value,
      [0, 1],
      ['#E5E5EA', colors.primary] // Light gray to deep green
    );
    return { backgroundColor };
  });

  const thumbStyle = useAnimatedStyle(() => {
    const translateX = progress.value * 24; // 50 (width) - 22 (thumb) - 4 (padding)
    return {
      transform: [{ translateX }],
    };
  });

  return (
    <TouchableWithoutFeedback onPress={toggle}>
      <Animated.View style={[styles.track, trackStyle, style]}>
        <Animated.View style={[styles.thumb, thumbStyle]} />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  track: {
    width: 50,
    height: 30,
    borderRadius: 16,
    padding: 3,
    justifyContent: 'center',
    // Inner shadow simulation for the track to make it feel physical
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  thumb: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
