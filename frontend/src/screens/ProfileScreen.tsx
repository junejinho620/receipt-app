import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Image, Modal, ActivityIndicator, Alert, TextInput } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/Button';
import { Card } from '../components/ui/Card';
import { MenuModal } from '../components/MenuModal';
import { useTheme } from '../context/ThemeContext';
import { layout } from '../theme/layout';
import api, { uploadFile } from '../api/client';
import { getLocalISODate } from '../utils/date';
import { useAuth } from '../context/AuthContext';
import { AVAILABLE_TITLES, TitleDef } from '../utils/achievements';

type ProfileScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Profile'>;
};

type ProfileData = {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;      // Flat field from Prisma — not nested under profile
  selectedTitle?: string;
  stats: {
    currentStreak: number;
    longestStreak: number;
    totalEntries: number;
    totalXp?: number;
  };
  achievements?: { titleId: string }[];
  level: number;
  levelProgress: number;
};

export function ProfileScreen({ navigation }: ProfileScreenProps) {
  const [menuVisible, setMenuVisible] = useState(false);
  const { colors } = useTheme();
  const { updateUser } = useAuth();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const [showAchievements, setShowAchievements] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Username modal editing
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [usernameInput, setUsernameInput] = useState('');
  const [savingUsername, setSavingUsername] = useState(false);

  const openUsernameModal = () => {
    setUsernameInput(profileData?.username ?? '');
    setShowUsernameModal(true);
  };

  const saveUsername = async () => {
    const trimmed = usernameInput.trim();
    if (!trimmed || trimmed === profileData?.username) {
      setShowUsernameModal(false);
      return;
    }
    if (trimmed.length < 3 || trimmed.length > 30) {
      Alert.alert('Invalid Username', 'Must be between 3 and 30 characters.');
      return;
    }
    setSavingUsername(true);
    try {
      const res = await api.put('/api/users/profile', { username: trimmed });
      // Update both local profile data and the global AuthContext user
      const newUsername = res.data.data?.username ?? trimmed;
      setProfileData(prev => prev ? { ...prev, username: newUsername } : prev);
      updateUser({ username: newUsername });
      setShowUsernameModal(false);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Could not update username.';
      Alert.alert('Error', msg);
    } finally {
      setSavingUsername(false);
    }
  };

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const localDate = getLocalISODate(new Date());
      const res = await api.get(`/api/users/profile?localDate=${localDate}`);
      const data: ProfileData = res.data.data;
      setProfileData(data);
      if (data.avatarUrl) {
        setProfileImage(data.avatarUrl);
      }
      setSelectedTitle(data.selectedTitle || "");
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const asset = result.assets[0];
      const localUri = asset.uri;
      setProfileImage(localUri); // show instantly while uploading

      try {
        const uploadedUrl = await uploadFile(localUri);

        // Update database with the clean uploaded URL instead of heavy base64
        await api.put('/api/users/avatar', { avatarDataUrl: uploadedUrl });
        updateUser({ avatarUrl: uploadedUrl }); // sync to AuthContext
      } catch (err) {
        Alert.alert('Upload Error', 'Could not save your avatar. Please try again.');
        console.error('Avatar upload error', err);
      }
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
          <Feather name="menu" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <TouchableOpacity
            onPress={openUsernameModal}
            style={styles.usernameRow}
            activeOpacity={0.7}
          >
            <Typography variant="bold" size="h2" color={colors.textPrimary}>
              {profileData?.username ?? '—'}
            </Typography>
            <Feather name="edit-2" size={13} color={colors.textTertiary} style={{ marginLeft: 6 }} />
          </TouchableOpacity>
          <Typography variant="regular" size="small" color={colors.textSecondary}>
            {selectedTitle ? (AVAILABLE_TITLES.find(t => t.id === selectedTitle)?.name ?? 'Auditor in Training') : 'Auditor in Training'}
          </Typography>
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
            {loading
              ? 'Loading your ledger status...'
              : profileData && profileData.stats.totalEntries < 10
                ? 'You are just getting started. Keep going and build the habit!'
                : profileData && profileData.stats.totalEntries < 50
                  ? 'A solid start! Keep settling your books consistently.'
                  : 'You are an experienced ledger keeper. Impressive discipline!'}
          </Typography>

          <View style={styles.divider} />

          {loading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.levelRow}>
              <View style={styles.levelBadge}>
                <Feather name="award" size={16} color={colors.surface} />
              </View>
              <Typography variant="bold" color={colors.textPrimary} style={{ marginLeft: 8, marginRight: 16 }}>
                Lv. {profileData?.level ?? 1}
              </Typography>

              <View style={styles.progressBarContainer}>
                <View style={[styles.progressBarFill, { width: `${Math.round((profileData?.levelProgress ?? 0) * 100)}%` as any }]} />
              </View>

              <Typography variant="bold" color={colors.primary} style={{ marginLeft: 16 }}>
                {Math.round((profileData?.levelProgress ?? 0) * 100)}%
              </Typography>
            </View>
          )}
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
            title="View Social Feed"
            onPress={() => navigation.navigate('Social')}
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
                {loading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Typography variant="bold" size="h2" color={colors.textPrimary}>
                    {profileData?.stats.totalEntries ?? 0}
                  </Typography>
                )}
                <Typography variant="regular" size="small" color={colors.textSecondary}>Ledgers settled this month</Typography>
              </View>
            </View>
          </Card>

          {/* Half Width Stats */}
          <View style={styles.halfStatsRow}>
            <Card style={styles.statCardHalf}>
              <View style={styles.statRowSmall}>
                <Typography size="body" style={{ marginRight: 8 }}>🔥</Typography>
                {loading ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Typography variant="bold" size="h2" color={colors.textPrimary}>
                    {profileData?.stats.currentStreak ?? 0}
                  </Typography>
                )}
              </View>
              <Typography variant="regular" size="small" color={colors.textSecondary} style={{ marginTop: 4 }}>Day streak</Typography>
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
        onNavigateToWeeklyReport={() => navigation.navigate('WeeklyReport')}
        onNavigateToNotifications={() => navigation.navigate('Notifications')}
        onNavigateToAccount={() => navigation.navigate('Account')}
        onNavigateToDataPrivacy={() => navigation.navigate('DataPrivacy')}
        onNavigateToAboutHelp={() => navigation.navigate('AboutHelp')}
        onNavigateToSocial={() => navigation.navigate('Social')}
        onNavigateToProfile={() => console.log('Already on Profile')}
      />

      {/* Username Edit Modal */}
      <Modal visible={showUsernameModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={styles.modalBackdrop}
            activeOpacity={1}
            onPress={() => setShowUsernameModal(false)}
          />
          <View style={styles.modalContent}>
            <Typography variant="bold" size="h2" style={{ marginBottom: 6 }}>Edit Username</Typography>
            <Typography variant="regular" size="small" color={colors.textSecondary} style={{ marginBottom: 24 }}>
              Must be 3–30 characters. Other users cannot share your handle.
            </Typography>
            <TextInput
              style={[
                styles.usernameInput,
                { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceHighlight }
              ]}
              value={usernameInput}
              onChangeText={setUsernameInput}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={saveUsername}
              maxLength={30}
              autoFocus
              placeholder="New username"
              placeholderTextColor={colors.textTertiary}
            />
            <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
              <TouchableOpacity
                style={[styles.modalCancelBtn]}
                onPress={() => setShowUsernameModal(false)}
              >
                <Typography variant="bold" size="body" color={colors.textSecondary}>Cancel</Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: colors.primary }]}
                onPress={saveUsername}
                disabled={savingUsername}
              >
                {savingUsername ? (
                  <ActivityIndicator size="small" color={colors.surface} />
                ) : (
                  <Typography variant="bold" size="body" color={colors.surface}>Save</Typography>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Achievements Modal */}
      <Modal visible={showAchievements} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowAchievements(false)} />
          <View style={styles.modalContent}>
            <Typography variant="bold" size="h2" style={{ marginBottom: 16 }}>Your Titles</Typography>
            <Typography variant="regular" size="small" color={colors.textSecondary} style={{ marginBottom: 24 }}>
              Select a title to display on your profile.
            </Typography>

            <ScrollView style={styles.modalScrollArea} showsVerticalScrollIndicator={false}>
              {AVAILABLE_TITLES.map((def: TitleDef) => {
                const isUnlocked = profileData?.achievements?.some(a => a.titleId === def.id);
                return (
                  <TouchableOpacity
                    key={def.id}
                    disabled={!isUnlocked}
                    style={[
                      styles.titleOption,
                      selectedTitle === def.id && styles.titleOptionSelected,
                      !isUnlocked && { opacity: 0.5 }
                    ]}
                    onPress={async () => {
                      try {
                        await api.put('/api/users/profile', { selectedTitle: def.id });
                        setSelectedTitle(def.id);
                        setShowAchievements(false);
                      } catch (err) {
                        Alert.alert('Error', 'Could not equip title.');
                      }
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {!isUnlocked && <Feather name="lock" size={14} color={colors.textSecondary} style={{ marginRight: 8 }} />}
                        <Typography size="body" style={{ marginRight: 6 }}>{def.emoji}</Typography>
                        <Typography
                          variant={selectedTitle === def.id ? "bold" : "bold"}
                          color={selectedTitle === def.id ? colors.surface : colors.textPrimary}
                        >
                          {def.name}
                        </Typography>
                      </View>
                      <Typography
                        variant="regular"
                        size="small"
                        color={selectedTitle === def.id ? 'rgba(255,255,255,0.8)' : colors.textSecondary}
                        style={{ marginTop: 4, marginLeft: !isUnlocked ? 22 : 0 }}
                      >
                        {def.description}
                      </Typography>
                    </View>

                    {selectedTitle === def.id && (
                      <Feather name="check-circle" size={20} color={colors.surface} />
                    )}
                  </TouchableOpacity>
                )
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView >
  );
}

const getStyles = (colors: any) => StyleSheet.create({
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
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  usernameInput: {
    fontFamily: 'DMSans-Bold',
    fontSize: 16,
    borderWidth: 1.5,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  modalSaveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
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
    width: '100%',
    maxHeight: '90%',
    borderRadius: layout.borderRadius.l,
    padding: layout.spacing.l,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  modalScrollArea: {
    maxHeight: '80%',
    paddingRight: 8,
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
