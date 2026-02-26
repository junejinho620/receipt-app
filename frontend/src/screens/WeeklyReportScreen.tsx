import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Typography } from '../components/ui/Typography';
import { MenuModal } from '../components/MenuModal';
import { useTheme } from '../context/ThemeContext';
import { layout } from '../theme/layout';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

type WeeklyReportScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'WeeklyReport'>;
};

export function WeeklyReportScreen({ navigation }: WeeklyReportScreenProps) {
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const [reports, setReports] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (!user) return;
    const fetchReports = async () => {
      setIsLoading(true);
      try {
        const response = await api.get(`/api/reports/${user.id}`);
        if (response.data.data) {
          const mapped = response.data.data.map((r: any) => ({
            id: r.id,
            title: r.weekLabel,
            range: r.dateRange,
            totalReceipts: r.totalReceipts,
            subtitle: r.subtitle
          }));
          setReports(mapped);
        }
      } catch (error) {
        console.error('Failed to fetch reports', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchReports();
  }, [user]);

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
          {reports.map((week) => (
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
        onLogout={() => {
          setMenuVisible(false);
          logout();
        }}
        onNavigateToProfile={() => navigation.navigate('Profile')}
        onNavigateToCalendar={() => navigation.navigate('Calendar')}
        onNavigateToWeeklyReport={() => setMenuVisible(false)}
        onNavigateToNotifications={() => navigation.navigate('Notifications')}
        onNavigateToAccount={() => navigation.navigate('Account')}
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
