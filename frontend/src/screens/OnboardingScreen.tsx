import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  FlatList,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Animated,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ONBOARDING_SLIDES } from '../constants/onboarding';
import { OnboardingSlide } from '../components/OnboardingSlide';
import { PaginationDots } from '../components/PaginationDots';
import { Button } from '../components/Button';
import { colors } from '../styles';

type OnboardingScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Onboarding'>;
};

export function OnboardingScreen({ navigation }: OnboardingScreenProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const listRef = useRef<FlatList>(null);
  const { width } = useWindowDimensions();
  const scrollX = useRef(new Animated.Value(0)).current;

  const handleSkip = () => {
    navigation.replace('InteractiveCanvas');
  };

  const handleNext = () => {
    if (currentPage < ONBOARDING_SLIDES.length - 1) {
      listRef.current?.scrollToIndex({ index: currentPage + 1, animated: true });
    }
  };

  const handleGetStarted = () => {
    navigation.replace('InteractiveCanvas');
  };

  const isLastSlide = currentPage === ONBOARDING_SLIDES.length - 1;

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentPage(nextIndex);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Skip Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
          <Text style={styles.skipText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Slides */}
      <Animated.FlatList
        ref={listRef}
        data={ONBOARDING_SLIDES}
        keyExtractor={(_, index) => `onboarding-slide-${index}`}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        style={styles.pagerView}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
        renderItem={({ item, index }) => {
          const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.6, 1, 0.6],
            extrapolate: 'clamp',
          });
          const scale = scrollX.interpolate({
            inputRange,
            outputRange: [0.98, 1, 0.98],
            extrapolate: 'clamp',
          });
          const translateY = scrollX.interpolate({
            inputRange,
            outputRange: [6, 0, 6],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View style={[styles.page, { width, opacity, transform: [{ scale }, { translateY }] }]}>
              <OnboardingSlide icon={item.icon} title={item.title} description={item.description} />
            </Animated.View>
          );
        }}
      />

      {/* Footer with Pagination Dots and Button */}
      <View style={styles.footer}>
        <PaginationDots count={ONBOARDING_SLIDES.length} activeIndex={currentPage} />
        <Button
          title={isLastSlide ? 'Get Started' : 'Next'}
          onPress={isLastSlide ? handleGetStarted : handleNext}
          variant="primary"
          style={styles.button}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    alignItems: 'flex-end',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  pagerView: {
    flex: 1,
  },
  page: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 24,
    alignItems: 'center',
  },
  button: {
    width: '100%',
  },
});
