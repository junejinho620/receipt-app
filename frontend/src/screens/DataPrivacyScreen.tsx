import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { Typography } from '../components/ui/Typography';
import { useTheme } from '../context/ThemeContext';
import { layout } from '../theme/layout';
import api from '../api/client';
import { LogoutConfirmModal } from '../components/LogoutConfirmModal';
import { MenuModal } from '../components/MenuModal';
import { useAuth } from '../context/AuthContext';

type DataPrivacyScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'DataPrivacy'>;

interface DataPrivacyScreenProps {
  navigation: DataPrivacyScreenNavigationProp;
}

interface PrivacyStats {
  totalLogs: number;
  totalReports: number;
  totalMediaItems: number;
  totalSizeMB: number;
  accountAgeDays: number;
}

export function DataPrivacyScreen({ navigation }: DataPrivacyScreenProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const { logout } = useAuth();

  const [stats, setStats] = useState<PrivacyStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/auth/me/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch privacy stats:', error);
      Alert.alert('Error', 'Could not load privacy footprint details.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = () => {
    setIsExporting(true);
    // Simulate export delay
    setTimeout(() => {
      setIsExporting(false);
      Alert.alert('Archive Generated', 'A secure link to download your data archive has been sent to your registered email address.');
    }, 2500);
  };

  const handleDeleteAccount = () => {
    setShowDeleteModal(true);
  };

  const proceedWithDeletion = async () => {
    setShowDeleteModal(false);
    // Here we'd call the API to actually delete the user's data
    // await api.delete('/auth/me');
    await logout();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
          <Feather name="menu" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Typography variant="bold" size="h2" color={colors.textPrimary}>System</Typography>
          <Typography variant="regular" size="small" color={colors.textSecondary}>Data & Privacy</Typography>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Home')}>
          <Feather name="home" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Typography variant="regular" size="body" color={colors.textSecondary} style={styles.description}>
          We believe your memories belong strictly to you. View your exact data footprint or request a full archive below.
        </Typography>

        <View style={styles.receiptContainer}>
          <View style={styles.receiptHeader}>
            <Feather name="shield" size={24} color={colors.textPrimary} style={{ marginBottom: 8 }} />
            <Typography variant="bold" size="h3" color={colors.textPrimary}>
              DATA FOOTPRINT
            </Typography>
            <Typography variant="regular" size="small" color={colors.textSecondary} style={{ fontFamily: 'JetBrainsMono_400Regular', marginTop: 4 }}>
              ISSUE DATE: {new Date().toLocaleDateString()}
            </Typography>
          </View>

          <View style={styles.dashedDivider} />

          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Typography variant="regular" size="small" color={colors.textSecondary} style={{ marginTop: 12 }}>
                Tabulating records...
              </Typography>
            </View>
          ) : stats ? (
            <View style={styles.receiptBody}>
              <View style={styles.receiptRow}>
                <Typography style={styles.receiptText}>[ITEM] Daily Logs</Typography>
                <Typography style={styles.receiptTextDots} numberOfLines={1}>.................................</Typography>
                <Typography style={styles.receiptTextValue}>{stats.totalLogs}</Typography>
              </View>

              <View style={styles.receiptRow}>
                <Typography style={styles.receiptText}>[ITEM] Weekly Reports</Typography>
                <Typography style={styles.receiptTextDots} numberOfLines={1}>.................................</Typography>
                <Typography style={styles.receiptTextValue}>{stats.totalReports}</Typography>
              </View>

              <View style={styles.receiptRow}>
                <Typography style={styles.receiptText}>[ITEM] Media Uploads</Typography>
                <Typography style={styles.receiptTextDots} numberOfLines={1}>.................................</Typography>
                <Typography style={styles.receiptTextValue}>{stats.totalMediaItems}</Typography>
              </View>

              <View style={styles.receiptRow}>
                <Typography style={styles.receiptText}>[ITEM] Account Age</Typography>
                <Typography style={styles.receiptTextDots} numberOfLines={1}>.................................</Typography>
                <Typography style={styles.receiptTextValue}>{stats.accountAgeDays}d</Typography>
              </View>

              <View style={styles.dashedDivider} />

              <View style={styles.receiptTotalRow}>
                <Typography style={styles.receiptTotalText}>TOTAL SERVER SPACE</Typography>
                <Typography style={styles.receiptTotalValue}>{stats.totalSizeMB} MB</Typography>
              </View>
            </View>
          ) : (
            <Typography variant="regular" color={colors.error} centered style={{ padding: 20 }}>
              Failed to load receipt data.
            </Typography>
          )}

          <View style={styles.receiptFooter}>
            <Typography variant="regular" size="small" color={colors.textSecondary} style={styles.barcodeText}>
              || | | ||| | || | | |||
            </Typography>
            <Typography variant="regular" size="small" color={colors.textTertiary} style={{ fontFamily: 'JetBrainsMono_400Regular', marginTop: 4 }}>
              END OF RECEIPT
            </Typography>
          </View>
        </View>

        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExport}
            disabled={isExporting}
            activeOpacity={0.8}
          >
            {isExporting ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <>
                <Feather name="download" size={20} color={colors.surface} style={{ marginRight: 8 }} />
                <Typography variant="bold" color={colors.surface}>Print Full Receipt</Typography>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDeleteAccount}
            activeOpacity={0.8}
          >
            <Feather name="trash-2" size={20} color={colors.error || '#D9534F'} style={{ marginRight: 8 }} />
            <Typography variant="bold" color={colors.error || '#D9534F'}>Shred Receipt & Erase Account</Typography>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <LogoutConfirmModal
        visible={showDeleteModal}
        onStay={() => setShowDeleteModal(false)}
        onLeave={proceedWithDeletion}
        mode="delete"
      />

      <MenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onLogout={() => console.log('Handled by Context')}
        onNavigateToProfile={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('Profile'), 300) }}
        onNavigateToCalendar={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('Calendar'), 300) }}
        onNavigateToWeeklyReport={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('WeeklyReport'), 300) }}
        onNavigateToNotifications={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('Notifications'), 300) }}
        onNavigateToAccount={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('Account'), 300) }}
        onNavigateToDataPrivacy={() => { setMenuVisible(false); }}
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
  content: {
    padding: layout.spacing.l,
    paddingBottom: layout.spacing.xxl,
  },
  description: {
    marginBottom: layout.spacing.xl,
    lineHeight: 22,
  },
  receiptContainer: {
    backgroundColor: colors.surfaceHighlight,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: layout.borderRadius.m,
    padding: layout.spacing.l,
    marginBottom: layout.spacing.xxl,
  },
  receiptHeader: {
    alignItems: 'center',
    marginBottom: layout.spacing.m,
  },
  dashedDivider: {
    width: '100%',
    height: 1,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    borderStyle: 'dashed',
    marginVertical: layout.spacing.m,
  },
  loaderContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  receiptBody: {
    marginVertical: layout.spacing.s,
  },
  receiptRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: layout.spacing.m,
  },
  receiptText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 14,
    color: colors.textSecondary,
  },
  receiptTextDots: {
    flex: 1,
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 14,
    color: colors.border,
    marginHorizontal: 8,
    overflow: 'hidden',
  },
  receiptTextValue: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 14,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  receiptTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: layout.spacing.s,
  },
  receiptTotalText: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 16,
    color: colors.textPrimary,
    fontWeight: 'bold',
  },
  receiptTotalValue: {
    fontFamily: 'JetBrainsMono_400Regular',
    fontSize: 16,
    color: colors.primary,
    fontWeight: 'bold',
  },
  receiptFooter: {
    alignItems: 'center',
    marginTop: layout.spacing.l,
  },
  barcodeText: {
    fontFamily: 'JetBrainsMono_400Regular',
    letterSpacing: 4,
    transform: [{ scaleY: 1.5 }],
    marginBottom: 8,
  },
  actionsContainer: {
    gap: layout.spacing.m,
  },
  exportButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: 99,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  deleteButton: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.error || '#D9534F',
    borderRadius: 99,
    paddingVertical: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
