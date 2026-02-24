import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Typography } from '../components/ui/Typography';
import { MenuModal } from '../components/MenuModal';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

type WeeklyReportScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WeeklyReport'>;
};

// Dummy Data for past weeks
const PAST_WEEKS = [
  { id: '3', title: 'Week 3', range: 'Mar 12 ~ Mar 19', totalReceipts: 6, subtitle: 'A highly productive week.' },
  { id: '2', title: 'Week 2', range: 'Mar 5 ~ Mar 11', totalReceipts: 4, subtitle: 'Settled the books mid-week.' },
  { id: '1', title: 'Week 1', range: 'Feb 26 ~ Mar 4', totalReceipts: 7, subtitle: 'A perfect streak.' },
];

export function WeeklyReportScreen({ navigation }: WeeklyReportScreenProps) {
  const [menuVisible, setMenuVisible] = useState(false);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
          <Feather name="menu" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Typography variant="bold" size="h2" color={colors.textPrimary}>The Ledger</Typography>
          <Typography variant="regular" size="small" color={colors.textSecondary}>Weekly Reports</Typography>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Home')}>
          <Feather name="home" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <View style={styles.pageIntro}>
          <View style={styles.introIcon}>
            <Feather name="layers" size={32} color={colors.textPrimary} />
          </View>
          <Typography variant="bold" size="h1" color={colors.textPrimary} style={{ marginBottom: 8 }}>
            Archive
          </Typography>
          <Typography variant="regular" size="body" color={colors.textSecondary} centered>
            Every 7 days, your receipts are stitched into a Weekly Montage. Relive your past weeks below.
          </Typography>
        </View>

        <View style={styles.weeksContainer}>
          {PAST_WEEKS.map((week) => (
            <TouchableOpacity
              key={week.id}
              style={styles.weekCard}
              onPress={() => navigation.navigate('WeeklyMontage', { weekId: week.id, title: week.title, range: week.range })}
            >
              <View style={styles.cardHeader}>
                <View>
                  <Typography variant="bold" size="h2" color={colors.textPrimary}>{week.title}</Typography>
                  <Typography variant="mono" size="small" color={colors.textTertiary} style={{ marginTop: 4 }}>
                    {week.range}
                  </Typography>
                </View>
                <View style={styles.receiptCountBadge}>
                  <Typography variant="bold" size="small" color={colors.surface}>
                    {week.totalReceipts}
                  </Typography>
                  <Feather name="file-text" size={12} color={colors.surface} style={{ marginLeft: 4 }} />
                </View>
              </View>

              <Typography variant="regular" size="small" color={colors.textSecondary} style={{ marginTop: 16 }}>
                "{week.subtitle}"
              </Typography>

              <View style={styles.cardFooter}>
                <Typography variant="medium" size="small" color={colors.primary}>Play Montage</Typography>
                <Feather name="play-circle" size={16} color={colors.primary} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

      </ScrollView>

      {/* Menu Overlay */}
      <MenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onLogout={() => console.log('Logout')}
        onNavigateToProfile={() => navigation.navigate('Profile')}
        onNavigateToCalendar={() => navigation.navigate('Calendar')}
        onNavigateToWeeklyReport={() => setMenuVisible(false)}
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
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  pageIntro: {
    alignItems: 'center',
    paddingHorizontal: layout.spacing.xl,
    paddingVertical: layout.spacing.xl,
    marginBottom: layout.spacing.m,
  },
  introIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  weeksContainer: {
    paddingHorizontal: layout.spacing.l,
    gap: layout.spacing.m,
  },
  weekCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: layout.spacing.l,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  receiptCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  }
});
