import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Modal } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Typography } from '../components/ui/Typography';
import { MenuModal } from '../components/MenuModal';
import { CustomSwitch } from '../components/ui/CustomSwitch';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

type NotificationsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Notifications'>;
};

// Generate an array of time strings for the dropdown every 30 mins
const TIME_OPTIONS: string[] = [];
for (let h = 0; h < 24; h++) {
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  const hStr = hour12.toString().padStart(2, '0');
  TIME_OPTIONS.push(`${hStr}:00 ${period}`);
  TIME_OPTIONS.push(`${hStr}:30 ${period}`);
}

export function NotificationsScreen({ navigation }: NotificationsScreenProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  // Settings state
  const [dailyRitual, setDailyRitual] = useState(true);
  const [weeklyMontage, setWeeklyMontage] = useState(true);
  const [mindfulPrompts, setMindfulPrompts] = useState(false);

  // Custom Time Dropdown State
  const [ritualTime, setRitualTime] = useState('09:00 PM');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
          <Feather name="menu" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Typography variant="bold" size="h2" color={colors.textPrimary}>System</Typography>
          <Typography variant="regular" size="small" color={colors.textSecondary}>Notifications</Typography>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Home')}>
          <Feather name="home" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Typography variant="regular" size="body" color={colors.textSecondary} style={styles.description}>
          Choose how and when The Receipt should gently nudge you. Form habits, not addictions.
        </Typography>

        {/* The Daily Closing Ritual */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Typography variant="bold" size="body" color={colors.textPrimary}>The Daily Closing Ritual</Typography>
              <Typography variant="regular" size="small" color={colors.textSecondary} style={{ marginTop: 4 }}>
                A gentle nudge to settle your ledger for the day.
              </Typography>
            </View>
            <CustomSwitch value={dailyRitual} onValueChange={setDailyRitual} />
          </View>

          {dailyRitual && (
            <TouchableOpacity
              style={styles.timeSelector}
              activeOpacity={0.7}
              onPress={() => setShowTimeDropdown(true)}
            >
              <Typography variant="medium" size="small" color={colors.textSecondary}>Remind me at</Typography>
              <View style={styles.timeDisplayRow}>
                <Typography variant="bold" size="h2" color={colors.primary}>{ritualTime}</Typography>
                <Feather name="chevron-down" size={20} color={colors.primary} style={{ marginLeft: 8 }} />
              </View>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.divider} />

        {/* Weekly Montage */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Typography variant="bold" size="body" color={colors.textPrimary}>Weekly Montage</Typography>
              <Typography variant="regular" size="small" color={colors.textSecondary} style={{ marginTop: 4 }}>
                Know when your Sunday visual summary is ready.
              </Typography>
            </View>
            <CustomSwitch value={weeklyMontage} onValueChange={setWeeklyMontage} />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Mindful Nudges */}
        <View style={styles.section}>
          <View style={styles.settingRow}>
            <View style={styles.settingText}>
              <Typography variant="bold" size="body" color={colors.textPrimary}>Mindful Prompts</Typography>
              <Typography variant="regular" size="small" color={colors.textSecondary} style={{ marginTop: 4 }}>
                Occasional, quiet reminders to pause before your next expense.
              </Typography>
            </View>
            <CustomSwitch value={mindfulPrompts} onValueChange={setMindfulPrompts} />
          </View>
        </View>

      </ScrollView>

      {/* Custom Time Selection Dropdown (Modal) */}
      <Modal visible={showTimeDropdown} transparent animationType="slide">
        <View style={styles.dropdownOverlay}>
          <TouchableOpacity style={styles.dropdownBackdrop} activeOpacity={1} onPress={() => setShowTimeDropdown(false)} />
          <View style={styles.dropdownContent}>
            <View style={styles.dropdownHeader}>
              <Typography variant="bold" size="h2" color={colors.textPrimary}>Select Time</Typography>
              <TouchableOpacity onPress={() => setShowTimeDropdown(false)} style={styles.closeButton}>
                <Feather name="x" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.dropdownScroll}>
              {TIME_OPTIONS.map((time) => (
                <TouchableOpacity
                  key={time}
                  style={[
                    styles.timeOption,
                    ritualTime === time && styles.timeOptionSelected
                  ]}
                  onPress={() => {
                    setRitualTime(time);
                    setShowTimeDropdown(false);
                  }}
                >
                  <Typography
                    variant={ritualTime === time ? "bold" : "medium"}
                    color={ritualTime === time ? colors.primary : colors.textPrimary}
                    size="h2"
                  >
                    {time}
                  </Typography>
                  {ritualTime === time && (
                    <Feather name="check" size={24} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <MenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onLogout={() => console.log('Handled by Context/AppNavigator')}
        onNavigateToProfile={() => navigation.navigate('Profile')}
        onNavigateToCalendar={() => navigation.navigate('Calendar')}
        onNavigateToWeeklyReport={() => navigation.navigate('WeeklyReport')}
        onNavigateToNotifications={() => { setMenuVisible(false); }}
      />
    </SafeAreaView>
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
  description: {
    marginBottom: layout.spacing.xl,
    lineHeight: 22,
  },
  section: {
    marginBottom: 0,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingText: {
    flex: 1,
    paddingRight: layout.spacing.l,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: layout.spacing.l,
  },
  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: layout.spacing.l,
    backgroundColor: colors.surface,
    padding: layout.spacing.m,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timeDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  dropdownBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  dropdownContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  dropdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: layout.spacing.xl,
    paddingBottom: layout.spacing.m,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
  },
  dropdownScroll: {
    paddingHorizontal: layout.spacing.xl,
  },
  timeOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  timeOptionSelected: {
    // Optional indicator
  }
});
