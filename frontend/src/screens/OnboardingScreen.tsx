import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
} from 'react-native-reanimated';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ONBOARDING_SLIDES } from '../constants/onboarding';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { PaginationDots } from '../components/PaginationDots';
import { Button } from '../components/Button';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { Typography } from '../components/ui/Typography';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<Animated.FlatList<any>>(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleScrollEnd = (e: any) => {
    const contentOffsetX = e.nativeEvent.contentOffset.x;
    const viewSize = e.nativeEvent.layoutMeasurement.width;
    const newIndex = Math.round(contentOffsetX / viewSize);
    setCurrentIndex(newIndex);
  };

  const handleSkip = () => {
    navigation.replace('InteractiveCanvas');
  };

  const handleNext = () => {
    if (currentIndex < ONBOARDING_SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      setCurrentIndex(currentIndex + 1);
    } else {
      handleSkip();
    }
  };

  const isLastSlide = currentIndex === ONBOARDING_SLIDES.length - 1;

  return (
    <ScreenWrapper>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} hitSlop={16}>
          <Typography variant="medium" size="small" color={colors.textSecondary}>Skip</Typography>
        </TouchableOpacity>
      </View>

      <Animated.FlatList
        ref={flatListRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(_, index) => `slide-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={scrollHandler}
        onMomentumScrollEnd={handleScrollEnd}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <OnboardingSlide image={item.image} title={item.title} description={item.description} />
        )}
        style={styles.list}
      />

      <View style={styles.footer}>
        <PaginationDots count={ONBOARDING_SLIDES.length} activeIndex={currentIndex} />
        <Button
          title={isLastSlide ? 'Get Started' : 'Next'}
          onPress={handleNext}
          variant="primary"
          style={styles.button}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: layout.spacing.l,
    paddingTop: layout.spacing.m,
    alignItems: 'flex-end',
    marginBottom: layout.spacing.m,
  },
  list: {
    flex: 1,
  },
  footer: {
    padding: layout.spacing.l,
    alignItems: 'center',
    marginBottom: layout.spacing.l,
  },
  button: {
    width: '100%',
    marginTop: layout.spacing.l,
  },
});
