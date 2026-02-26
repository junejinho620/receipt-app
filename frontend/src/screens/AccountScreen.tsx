import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, TextInput } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Typography } from '../components/ui/Typography';
import { MenuModal } from '../components/MenuModal';
import { useTheme } from '../context/ThemeContext';
import { layout } from '../theme/layout';
import { useAuth } from '../context/AuthContext';

type AccountScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Account'>;
};

export function AccountScreen({ navigation }: AccountScreenProps) {
  const { user } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const { themeName, colors, setThemeName, appearance, setAppearance } = useTheme();
  const styles = getStyles(colors);



  // Passport (Identity) State
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState(user?.email || 'user@example.com');
  const [password, setPassword] = useState('password123'); // Faux password for UI
  // const [themeMode, setThemeMode] = useState<'Light' | 'Dark' | 'System'>('System'); // Removed as appearance from useTheme is used

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
          <Feather name="menu" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Typography variant="bold" size="h2" color={colors.textPrimary}>System</Typography>
          <Typography variant="regular" size="small" color={colors.textSecondary}>Account Management</Typography>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Home')}>
          <Feather name="home" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* The Passport (Identity Card) */}
        <Typography variant="bold" size="h2" color={colors.textPrimary} style={{ marginBottom: layout.spacing.m }}>
          Identity
        </Typography>

        <View style={styles.passportCard}>
          <View style={styles.passportHeader}>
            <View>
              <Typography variant="medium" size="small" color={colors.textSecondary}>CREDENTIALS</Typography>
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setIsEditing(!isEditing)}
            >
              <Typography variant="bold" size="small" color={isEditing ? colors.primary : colors.textSecondary}>
                {isEditing ? 'Save' : 'Edit'}
              </Typography>
            </TouchableOpacity>
          </View>

          <View style={styles.passportDivider} />

          <View style={styles.passportRow}>
            <Typography variant="medium" size="small" color={colors.textSecondary} style={styles.passportLabel}>EMAIL</Typography>
            {isEditing ? (
              <TextInput
                style={styles.passportInput}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            ) : (
              <Typography variant="bold" size="body" color={colors.textPrimary}>{email}</Typography>
            )}
          </View>

          <View style={styles.passportRow}>
            <Typography variant="medium" size="small" color={colors.textSecondary} style={styles.passportLabel}>PASSWORD</Typography>
            {isEditing ? (
              <TextInput
                style={styles.passportInput}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            ) : (
              <Typography variant="bold" size="body" color={colors.textPrimary}>••••••••</Typography>
            )}
          </View>
        </View>

        {/* The Swatches (Aesthetics) */}
        <Typography variant="bold" size="h2" color={colors.textPrimary} style={{ marginTop: layout.spacing.xl, marginBottom: layout.spacing.m }}>
          Aesthetics
        </Typography>

        <View style={styles.modeToggleContainer}>
          {(['light', 'system', 'dark'] as const).map((mode) => {
            const isActive = appearance === mode;
            const label = mode.charAt(0).toUpperCase() + mode.slice(1);
            return (
              <TouchableOpacity
                key={mode}
                style={[styles.modePill, isActive && styles.modePillActive]}
                onPress={() => setAppearance(mode)}
              >
                <Typography
                  variant={isActive ? "bold" : "medium"}
                  size="small"
                  color={isActive ? colors.surface : colors.textSecondary}
                >
                  {label}
                </Typography>
              </TouchableOpacity>
            );
          })}
        </View>

        <Typography variant="regular" size="small" color={colors.textSecondary} style={{ marginTop: layout.spacing.l, marginBottom: layout.spacing.m }}>
          THEME PALETTE
        </Typography>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.swatchList}>

          {/* Theme 1: Sage */}
          <TouchableOpacity
            style={[styles.swatchCard, themeName === 'Sage' && styles.swatchCardActive]}
            onPress={() => setThemeName('Sage')}
            activeOpacity={0.8}
          >
            <View style={styles.swatchColors}>
              <View style={[styles.colorDot, { backgroundColor: '#F8F6F4' }]} />
              <View style={[styles.colorDot, { backgroundColor: '#E0DECA' }]} />
              <View style={[styles.colorDot, { backgroundColor: '#2D4A3E' }]} />
            </View>
            <Typography variant="bold" size="small" color={colors.textPrimary} style={{ marginTop: 12 }}>Sage</Typography>
            {themeName === 'Sage' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          {/* Theme 2: Cyber-Noir */}
          <TouchableOpacity
            style={[styles.swatchCard, themeName === 'Cyber-Noir' && styles.swatchCardActive]}
            onPress={() => setThemeName('Cyber-Noir')}
            activeOpacity={0.8}
          >
            <View style={styles.swatchColors}>
              <View style={[styles.colorDot, { backgroundColor: '#0A0A0A' }]} />
              <View style={[styles.colorDot, { backgroundColor: '#1A1A1A' }]} />
              <View style={[styles.colorDot, { backgroundColor: '#FF3366', borderWidth: 0 }]} />
            </View>
            <Typography variant="medium" size="small" color={colors.textSecondary} style={{ marginTop: 12 }}>Cyber-Noir</Typography>
            {themeName === 'Cyber-Noir' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

          {/* Theme 3: Desert Monolith */}
          <TouchableOpacity
            style={[styles.swatchCard, themeName === 'Monolith' && styles.swatchCardActive]}
            onPress={() => setThemeName('Monolith')}
            activeOpacity={0.8}
          >
            <View style={styles.swatchColors}>
              <View style={[styles.colorDot, { backgroundColor: '#F4ECE4' }]} />
              <View style={[styles.colorDot, { backgroundColor: '#D4B8A3' }]} />
              <View style={[styles.colorDot, { backgroundColor: '#8B5A2B', borderWidth: 0 }]} />
            </View>
            <Typography variant="medium" size="small" color={colors.textSecondary} style={{ marginTop: 12 }}>Monolith</Typography>
            {themeName === 'Monolith' && <View style={styles.activeIndicator} />}
          </TouchableOpacity>

        </ScrollView>

      </ScrollView>

      <MenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onLogout={() => console.log('Handled by Context')}
        onNavigateToProfile={() => navigation.navigate('Profile')}
        onNavigateToCalendar={() => navigation.navigate('Calendar')}
        onNavigateToWeeklyReport={() => navigation.navigate('WeeklyReport')}
        onNavigateToNotifications={() => navigation.navigate('Notifications')}
        onNavigateToAccount={() => { setMenuVisible(false); }}
        onNavigateToDataPrivacy={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('DataPrivacy'), 300); }}
        onNavigateToAboutHelp={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('AboutHelp'), 300); }}
      />
    </SafeAreaView>
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
    borderRadius: 24,
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContent: {
    padding: layout.spacing.l,
    paddingBottom: layout.spacing.xl,
  },

  // Passport Styles
  passportCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: layout.spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 4,
  },
  passportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  editButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  passportDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: layout.spacing.m,
  },
  passportRow: {
    marginBottom: layout.spacing.m,
  },
  passportLabel: {
    marginBottom: 4,
    letterSpacing: 1,
  },
  passportInput: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: colors.primary,
    borderBottomWidth: 1,
    borderBottomColor: colors.primary,
    paddingVertical: 4,
  },

  // Swatch Styles
  modeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.border,
    borderRadius: 100,
    padding: 4,
  },
  modePill: {
    flex: 1,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 100,
  },
  modePillActive: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  swatchList: {
    paddingRight: layout.spacing.xl,
  },
  swatchCard: {
    width: 120,
    height: 140,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: layout.spacing.m,
    marginRight: layout.spacing.m,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'flex-start',
  },
  swatchCardActive: {
    borderColor: colors.primary,
    borderWidth: 2,
  },
  swatchColors: {
    flexDirection: 'row',
    marginTop: 8,
  },
  colorDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: -6,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  activeIndicator: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  }
});
