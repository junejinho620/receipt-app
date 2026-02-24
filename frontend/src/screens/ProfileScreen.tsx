import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Modal } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/Button';
import { Card } from '../components/ui/Card';
import { MenuModal } from '../components/MenuModal';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

const AVAILABLE_TITLES = [
  "Steadfast Auditor",
  "Early Bird",
  "First Ledger",
  "Receipt Master"
];

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState(AVAILABLE_TITLES[0]);
  const [showAchievements, setShowAchievements] = useState(false);

  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
          <Feather name="menu" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Typography variant="bold" size="h2" color={colors.textPrimary}>junejinho</Typography>
          <Typography variant="regular" size="small" color={colors.textSecondary}>{selectedTitle}</Typography>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Home')}>
          <Feather name="home" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Avatar Placeholder */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity style={styles.avatarCircle} onPress={handlePickImage} activeOpacity={0.8}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Typography size="h1" style={{ fontSize: 64 }}>😎</Typography>
            )}
            <View style={styles.editBadge}>
              <Feather name="camera" size={14} color={colors.surface} />
            </View>
          </TouchableOpacity>
        </View>

        {/* Level & Progress Card */}
        <Card style={styles.progressCard}>
          <Typography variant="regular" size="body" color={colors.textSecondary} style={styles.progressText}>
            You have settled your first couple of ledgers. Keep up the momentum and build the habit.
          </Typography>

          <View style={styles.divider} />

          <View style={styles.levelRow}>
            <View style={styles.levelBadge}>
              <Feather name="award" size={16} color={colors.surface} />
            </View>
            <Typography variant="bold" color={colors.textPrimary} style={{ marginLeft: 8, marginRight: 16 }}>Lv. 2</Typography>

            <View style={styles.progressBarContainer}>
              <View style={[styles.progressBarFill, { width: '22%' }]} />
            </View>

            <Typography variant="bold" color={colors.primary} style={{ marginLeft: 16 }}>22%</Typography>
          </View>
        </Card>

        {/* Action Card */}
        <Card style={styles.actionCard} variant="elevated">
          <View style={styles.actionRow}>
            <View style={styles.actionIconPlaceholder}>
              <Feather name="users" size={24} color={colors.primary} />
            </View>
            <View style={styles.actionTexts}>
              <Typography variant="bold" size="body" color={colors.textPrimary}>
                Accountability partners
              </Typography>
              <Typography variant="regular" size="small" color={colors.textSecondary} style={{ marginTop: 4 }}>
                Invite friends and share your daily receipt streak to stay on track.
              </Typography>
            </View>
          </View>
          <Button
            title="Invite friends"
            onPress={() => { }}
            variant="primary"
            style={styles.actionButton}
          />
        </Card>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          {/* Full Width Stat */}
          <Card style={styles.statCardFull}>
            <View style={styles.statRow}>
              <Feather name="calendar" size={20} color={colors.primary} style={{ marginRight: 12 }} />
              <View>
                <Typography variant="bold" size="h2" color={colors.textPrimary}>3/20</Typography>
                <Typography variant="regular" size="small" color={colors.textSecondary}>Ledgers settled this month</Typography>
              </View>
            </View>
          </Card>

          {/* Half Width Stats */}
          <View style={styles.halfStatsRow}>
            <Card style={styles.statCardHalf}>
              <View style={styles.statRowSmall}>
                <Typography size="body" style={{ marginRight: 8 }}>🔥</Typography>
                <Typography variant="bold" size="h2" color={colors.textPrimary}>1</Typography>
              </View>
              <Typography variant="regular" size="small" color={colors.textSecondary} style={{ marginTop: 4 }}>Daily streak</Typography>
            </Card>

            <TouchableOpacity
              style={styles.statCardHalf}
              onPress={() => setShowAchievements(true)}
              activeOpacity={0.7}
            >
              <View style={styles.statRowSmall}>
                <Typography size="body" style={{ marginRight: 8 }}>🏆</Typography>
                <Typography variant="bold" size="h2" color={colors.textPrimary}>{AVAILABLE_TITLES.length}</Typography>
              </View>
              <Typography variant="regular" size="small" color={colors.textSecondary} style={{ marginTop: 4 }}>Achievements</Typography>
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      {/* Menu Overlay */}
      <MenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onLogout={() => console.log('Logout')}
        onNavigateToCalendar={() => navigation.navigate('Calendar')}
      />

      {/* Achievements Modal */}
      <Modal visible={showAchievements} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowAchievements(false)} />
          <View style={styles.modalContent}>
            <Typography variant="bold" size="h2" style={{ marginBottom: 16 }}>Your Titles</Typography>
            <Typography variant="regular" size="small" color={colors.textSecondary} style={{ marginBottom: 24 }}>
              Select a title to display on your profile.
            </Typography>

            {AVAILABLE_TITLES.map((title) => (
              <TouchableOpacity
                key={title}
                style={[
                  styles.titleOption,
                  selectedTitle === title && styles.titleOptionSelected
                ]}
                onPress={() => {
                  setSelectedTitle(title);
                  setShowAchievements(false);
                }}
              >
                <Typography
                  variant={selectedTitle === title ? "bold" : "medium"}
                  color={selectedTitle === title ? colors.surface : colors.textPrimary}
                >
                  {title}
                </Typography>
                {selectedTitle === title && (
                  <Feather name="check-circle" size={20} color={colors.surface} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.l,
    paddingVertical: layout.spacing.m,
  },
  headerTitle: {
    alignItems: 'center',
  },
  iconButton: {
    padding: layout.spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContent: {
    padding: layout.spacing.m,
    paddingTop: layout.spacing.xs,
    paddingBottom: layout.spacing.m,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: -30,
    zIndex: 2,
  },
  avatarCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#E8E1F8', // Soft purple matching reference
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.background,
  },
  progressCard: {
    paddingTop: 45, // Leave room for avatar
    zIndex: 1,
  },
  progressText: {
    textAlign: 'center',
    paddingHorizontal: layout.spacing.s,
    marginBottom: layout.spacing.xs,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: layout.spacing.l,
  },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  levelBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#9ca3af',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  actionCard: {
    marginTop: layout.spacing.s,
    backgroundColor: colors.surfaceHighlight, // Slightly tinted like the reference
    padding: layout.spacing.m,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.m,
  },
  actionIconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  actionTexts: {
    flex: 1,
  },
  actionButton: {
    width: '100%',
  },
  statsGrid: {
    marginTop: layout.spacing.s,
    gap: 12,
  },
  statCardFull: {
    padding: layout.spacing.l,
  },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  halfStatsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statRowSmall: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E8E1F8',
  },
  statCardHalf: {
    flex: 1,
    padding: layout.spacing.l,
    borderRadius: layout.borderRadius.m,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: layout.spacing.xl,
    paddingBottom: 48,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  titleOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  titleOptionSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  }
});
