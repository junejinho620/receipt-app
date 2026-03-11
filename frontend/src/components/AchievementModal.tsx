import React from 'react';
import { View, StyleSheet, TouchableOpacity, Modal, ScrollView, Animated, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Typography } from './ui/Typography';
import { useTheme } from '../context/ThemeContext';
import { layout } from '../theme/layout';
import { AVAILABLE_TITLES, getTitleDef } from '../utils/achievements';

type AchievementModalProps = {
  visible: boolean;
  unlockedTitleIds: string[];
  onClose: () => void;
};

export function AchievementModal({ visible, unlockedTitleIds, onClose }: AchievementModalProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  if (unlockedTitleIds.length === 0) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.content}>
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Image source={require('../assets/images/achievement_trophy_icon.png')} style={{ width: 44, height: 44, resizeMode: 'contain' }} />
            </View>
            <Typography variant="bold" size="h2" style={styles.titleText}>
              Achievement Unlocked!
            </Typography>
            <Typography variant="regular" size="small" color={colors.textSecondary} style={styles.subtitleText}>
              You earned {unlockedTitleIds.length === 1 ? 'a new title' : 'new titles'} for your archive.
            </Typography>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {unlockedTitleIds.map(id => {
              const def = getTitleDef(id);
              if (!def) return null;
              return (
                <View key={def.id} style={styles.achievementCard}>
                  <View style={styles.emojiBox}>
                    <Image source={def.icon} style={{ width: 28, height: 28, resizeMode: 'contain' }} />
                  </View>
                  <View style={styles.achievementInfo}>
                    <Typography variant="bold" size="body" color={colors.textPrimary}>
                      {def.name}
                    </Typography>
                    <Typography variant="regular" size="small" color={colors.textSecondary} style={{ marginTop: 4 }}>
                      {def.description}
                    </Typography>
                  </View>
                </View>
              );
            })}
          </ScrollView>

          <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.8}>
            <Typography variant="bold" size="body" color={colors.surface}>
              Awesome
            </Typography>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  content: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: layout.spacing.l,
    paddingBottom: layout.spacing.xl,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: layout.spacing.l,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: layout.spacing.m,
  },
  titleText: {
    marginBottom: layout.spacing.xs,
    textAlign: 'center',
  },
  subtitleText: {
    textAlign: 'center',
    maxWidth: '80%',
  },
  scrollArea: {
    maxHeight: 300,
    marginBottom: layout.spacing.l,
  },
  achievementCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceHighlight,
    padding: layout.spacing.m,
    borderRadius: 16,
    marginBottom: layout.spacing.s,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
  },
  emojiBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: layout.spacing.m,
  },
  achievementInfo: {
    flex: 1,
  },
  closeButton: {
    backgroundColor: colors.primary,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
  },
});
