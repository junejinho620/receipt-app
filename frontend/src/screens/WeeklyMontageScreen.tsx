import React, { useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, SafeAreaView, Dimensions, ScrollView, Share } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Typography } from '../components/ui/Typography';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

const { width, height } = Dimensions.get('window');

type WeeklyMontageScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WeeklyMontage'>;
  route: RouteProp<RootStackParamList, 'WeeklyMontage'>;
};

// Dummy daily data
const DAYS = [
  { id: '1', title: 'Monday Focus', type: 'Text', preview: 'Deep work session in the morning.', location: 'Home Office' },
  { id: '2', title: 'Tuesday Coffee', type: 'Text', preview: 'Met with old friends.', location: 'Cafe Central' },
  { id: '3', title: 'Wednesday Hustle', type: 'Text', preview: 'Shipped a new feature.', location: 'The Studio' },
  { id: '4', title: 'Thursday Rest', type: 'Emoji', preview: '🧘', location: 'Living Room' },
  { id: '5', title: 'Friday Night', type: 'Text', preview: 'Dinner out.', location: 'Downtown' },
  { id: '6', title: 'Saturday Hike', type: 'Text', preview: 'A beautiful morning up in the hills.', location: 'State Park' },
  { id: '7', title: 'Sunday Prep', type: 'Text', preview: 'Settled the books and prepped for Monday.', location: 'Home Library' },
];

export function WeeklyMontageScreen({ navigation, route }: WeeklyMontageScreenProps) {
  const { title, range } = route.params;
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleScroll = (event: any) => {
    const x = event.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    setCurrentIndex(index);
  };

  const shareReceipt = async () => {
    try {
      await Share.share({
        message: `My Receipt for ${title} (${range}) - Settled the books!`,
      });
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header overlaid on top of content */}
      <View style={styles.floatingHeader}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color={colors.surface} />
        </TouchableOpacity>

        {/* Progress Bars */}
        <View style={styles.progressContainer}>
          {[...DAYS, { id: 'summary' }].map((_, index) => (
            <View key={index} style={[styles.progressBar, index <= currentIndex && styles.progressBarActive]} />
          ))}
        </View>
      </View>

      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        style={styles.scrollView}
      >
        {/* 7 Daily Slides */}
        {DAYS.map((day) => (
          <View key={day.id} style={styles.slide}>
            <View style={styles.card}>
              <Typography variant="mono" size="small" color={colors.textTertiary} style={{ marginBottom: 16 }}>
                {day.title.split(' ')[0].toUpperCase()}
              </Typography>

              {day.type === 'Emoji' ? (
                <Typography size="h1" style={{ fontSize: 80, marginBottom: 24 }}>{day.preview}</Typography>
              ) : (
                <Typography variant="bold" size="h1" color={colors.textPrimary} style={{ marginBottom: 16 }}>
                  "{day.preview}"
                </Typography>
              )}

              <View style={styles.locationRow}>
                <Feather name="map-pin" size={16} color={colors.textSecondary} style={{ marginRight: 8 }} />
                <Typography variant="regular" size="body" color={colors.textSecondary}>
                  {day.location}
                </Typography>
              </View>
            </View>
          </View>
        ))}

        {/* 8th Slide: The Montage Summary */}
        <View style={styles.slide}>
          <View style={[styles.card, styles.summaryCard]}>
            <View style={styles.summaryHeader}>
              <Typography variant="bold" size="h2" color={colors.textPrimary}>{title}</Typography>
              <Typography variant="regular" size="small" color={colors.textSecondary}>{range}</Typography>
            </View>

            <View style={styles.dashedLine} />

            <ScrollView showsVerticalScrollIndicator={false} style={styles.summaryList}>
              {DAYS.map((day) => (
                <View key={day.id} style={styles.summaryItemRow}>
                  <Typography variant="mono" size="caption" color={colors.textSecondary} style={{ width: 40 }}>
                    {day.title.split(' ')[0].slice(0, 3).toUpperCase()}
                  </Typography>
                  <View style={styles.summaryItemContent}>
                    {day.type === 'Emoji' ? (
                      <Typography>{day.preview}</Typography>
                    ) : (
                      <Typography variant="medium" size="small" color={colors.textPrimary} numberOfLines={1}>
                        {day.preview}
                      </Typography>
                    )}
                  </View>
                </View>
              ))}
            </ScrollView>

            <View style={styles.dashedLine} />
            <Typography variant="mono" size="caption" color={colors.textTertiary} centered>
              *** END OF WEEKLY LOG ***
            </Typography>

            <TouchableOpacity style={styles.shareButton} onPress={shareReceipt}>
              <Feather name="share" size={20} color={colors.surface} style={{ marginRight: 8 }} />
              <Typography variant="bold" color={colors.surface}>Share Receipt</Typography>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A14', // Immersive cinema dark background
  },
  floatingHeader: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: layout.spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    height: 3,
  },
  progressBar: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
  },
  progressBarActive: {
    backgroundColor: colors.surface,
    elevation: 2,
  },
  scrollView: {
    flex: 1,
  },
  slide: {
    width,
    height,
    justifyContent: 'center',
    padding: layout.spacing.xl,
    paddingTop: 100, // accommodate dynamic header
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: layout.spacing.xl,
    minHeight: height * 0.5,
    justifyContent: 'center',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryCard: {
    minHeight: height * 0.6,
    justifyContent: 'flex-start',
    paddingVertical: layout.spacing.xl,
  },
  summaryHeader: {
    alignItems: 'center',
    marginBottom: layout.spacing.m,
  },
  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: colors.textTertiary,
    borderStyle: 'dashed',
    marginVertical: layout.spacing.m,
  },
  summaryList: {
    flexGrow: 0,
    maxHeight: 200,
  },
  summaryItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryItemContent: {
    flex: 1,
    marginLeft: 12,
  },
  shareButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: layout.spacing.m,
    borderRadius: layout.borderRadius.m,
    marginTop: layout.spacing.l,
  }
});
