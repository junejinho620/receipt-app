import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Typography } from './ui/Typography';
import { useTheme } from '../context/ThemeContext';
import { layout } from '../theme/layout';

const { width } = Dimensions.get('window');

type LogoutConfirmModalProps = {
  visible: boolean;
  onStay: () => void;
  onLeave: () => void;
};

const DELETION_ITEMS = [
  'Shredding your daily receipts...',
  'Dissolving your streak...',
  'Packing away your memories...',
  'Writing you a farewell note...',
];

export function LogoutConfirmModal({ visible, onStay, onLeave }: LogoutConfirmModalProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const progressAnim = useRef(new Animated.Value(0)).current;
  const emojiScale = useRef(new Animated.Value(0)).current;
  const emojiOpacity = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const itemOpacities = useRef(DELETION_ITEMS.map(() => new Animated.Value(0))).current;
  const buttonsOpacity = useRef(new Animated.Value(0)).current;
  const [progressDone, setProgressDone] = useState(false);

  useEffect(() => {
    if (!visible) {
      // Reset all animations when hidden
      progressAnim.setValue(0);
      emojiScale.setValue(0);
      emojiOpacity.setValue(0);
      titleOpacity.setValue(0);
      itemOpacities.forEach(a => a.setValue(0));
      buttonsOpacity.setValue(0);
      setProgressDone(false);
      return;
    }

    // 1) Emoji bounces in
    Animated.parallel([
      Animated.spring(emojiScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 7 }),
      Animated.timing(emojiOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
    ]).start();

    // 2) Title fades in after 400ms
    setTimeout(() => {
      Animated.timing(titleOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    }, 400);

    // 3) Progress bar fills to 80% over 3s
    setTimeout(() => {
      Animated.timing(progressAnim, {
        toValue: 0.8,
        duration: 3000,
        useNativeDriver: false,
      }).start(() => setProgressDone(true));
    }, 700);

    // 4) Deletion items appear one by one
    DELETION_ITEMS.forEach((_, index) => {
      setTimeout(() => {
        Animated.timing(itemOpacities[index], {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 900 + index * 700);
    });

    // 5) Buttons appear after all items
    setTimeout(() => {
      Animated.timing(buttonsOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }, 900 + DELETION_ITEMS.length * 700 + 200);
  }, [visible]);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Sad Emoji */}
          <Animated.Text
            style={[
              styles.emoji,
              { opacity: emojiOpacity, transform: [{ scale: emojiScale }] },
            ]}
          >
            😢
          </Animated.Text>

          {/* Title & Subtitle */}
          <Animated.View style={{ opacity: titleOpacity }}>
            <Typography variant="bold" size="h2" style={styles.title}>
              We thought you'd{'\n'}stay forever...
            </Typography>
            <Typography variant="medium" size="small" color={colors.textSecondary} style={styles.subtitle}>
              Closing your account
            </Typography>
          </Animated.View>

          {/* Progress Bar */}
          <View style={styles.progressTrack}>
            <Animated.View
              style={[
                styles.progressFill,
                { width: progressWidth },
              ]}
            />
          </View>

          {/* Deletion Items */}
          <View style={styles.itemsContainer}>
            {DELETION_ITEMS.map((item, index) => (
              <Animated.View key={index} style={{ opacity: itemOpacities[index] }}>
                <Typography
                  variant="regular"
                  size="small"
                  color={colors.textTertiary}
                  style={styles.item}
                >
                  {item}
                </Typography>
              </Animated.View>
            ))}
          </View>

          {/* Buttons */}
          <Animated.View style={[styles.buttonsContainer, { opacity: buttonsOpacity }]}>
            <TouchableOpacity style={styles.stayButton} onPress={onStay} activeOpacity={0.85}>
              <Typography variant="bold" color={colors.surface} size="body">
                Actually, I'll stay 🤍
              </Typography>
            </TouchableOpacity>

            {/* Leave Link */}
            <TouchableOpacity onPress={onLeave} style={styles.leaveLink}>
              <Typography variant="regular" color={colors.textTertiary} size="small">
                Continue with logout
              </Typography>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: layout.spacing.l,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 28,
    paddingVertical: 36,
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 12,
  },
  emoji: {
    fontSize: 60,
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    lineHeight: 32,
    marginBottom: 6,
    color: colors.textPrimary,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: 99,
    overflow: 'hidden',
    marginBottom: 20,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 99,
  },
  itemsContainer: {
    width: '100%',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
    gap: 8,
    minHeight: 100,
  },
  item: {
    lineHeight: 22,
  },
  buttonsContainer: {
    width: '100%',
    gap: 14,
    alignItems: 'center',
  },
  stayButton: {
    width: '100%',
    backgroundColor: colors.primary,
    borderRadius: 999,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  leaveLink: {
    paddingVertical: 8,
  },
});
