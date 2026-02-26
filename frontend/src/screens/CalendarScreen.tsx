import React, { useState, useMemo } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Feather } from '@expo/vector-icons';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Typography } from '../components/ui/Typography';
import { MenuModal } from '../components/MenuModal';
import { useTheme } from '../context/ThemeContext';
import { layout } from '../theme/layout';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

const { width } = Dimensions.get('window');

type CalendarScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Calendar'>;
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const FULL_WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function CalendarScreen({ navigation }: CalendarScreenProps) {
  const { user, logout } = useAuth();
  const [menuVisible, setMenuVisible] = useState(false);
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);

  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());

  const defaultDateStr = `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`;
  const [selectedDate, setSelectedDate] = useState<string>(defaultDateStr);
  const [logs, setLogs] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (!user) return;
    const fetchMonthlyLogs = async () => {
      setIsLoading(true);
      try {
        const yyyy = currentYear.toString();
        const mm = (currentMonth + 1).toString().padStart(2, '0');
        const response = await api.get(`/api/logs/${user.id}/month/${yyyy}-${mm}`);

        if (response.data.data) {
          const fetchedLogs = response.data.data;
          const logsDict: Record<string, any> = {};
          fetchedLogs.forEach((log: any) => {
            let dateStr = log.date;
            if (dateStr.includes('T')) {
              dateStr = dateStr.split('T')[0];
            }
            logsDict[dateStr] = {
              id: log.id,
              title: log.title || 'Untitled Book',
              time: new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              location: log.location || 'Unknown Location',
              preview: log.inputType === 'Text' ? log.content : `[${log.inputType} Entry]`,
            };
          });
          setLogs(logsDict);
        }
      } catch (err) {
        console.error('Failed to fetch monthly calendar dots:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMonthlyLogs();
  }, [currentYear, currentMonth, user]);

  const days = useMemo(() => {
    const arr = [];
    const firstDay = new Date(currentYear, currentMonth, 1).getDay(); // 0 for Sunday
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

    // Empty slots for padding
    for (let i = 0; i < firstDay; i++) {
      arr.push(null);
    }

    // Actual days
    for (let i = 1; i <= daysInMonth; i++) {
      const paddedMonth = (currentMonth + 1).toString().padStart(2, '0');
      const paddedDay = i.toString().padStart(2, '0');
      arr.push({ day: i, dateString: `${currentYear}-${paddedMonth}-${paddedDay}` });
    }
    return arr;
  }, [currentYear, currentMonth]);

  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(y => y - 1);
    } else {
      setCurrentMonth(m => m - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(y => y + 1);
    } else {
      setCurrentMonth(m => m + 1);
    }
  };

  const resetToToday = () => {
    setCurrentYear(today.getFullYear());
    setCurrentMonth(today.getMonth());
    setSelectedDate(defaultDateStr);
  };

  const selectedLog = selectedDate ? logs[selectedDate] : null;

  // Format the detailed Header String (e.g., "Tuesday, 23 January 2023")
  let displayFullDate = '';
  if (selectedDate) {
    const [y, m, d] = selectedDate.split('-');
    const dateObj = new Date(parseInt(y), parseInt(m) - 1, parseInt(d));
    displayFullDate = `${FULL_WEEKDAYS[dateObj.getDay()]}, ${parseInt(d)} ${MONTH_NAMES[parseInt(m) - 1]} ${y}`;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
          <Feather name="menu" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Typography variant="bold" size="h2" color={colors.textPrimary}>The Ledger</Typography>
          <Typography variant="regular" size="small" color={colors.textSecondary}>Calendar View</Typography>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Home')}>
          <Feather name="home" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Calendar Nav */}
        <View style={styles.monthSelector}>
          <TouchableOpacity style={styles.navButton} onPress={goToPrevMonth}>
            <Feather name="chevron-left" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={resetToToday}>
            <Typography variant="bold" size="body" color={colors.textPrimary}>
              {MONTH_NAMES[currentMonth]} {currentYear}
            </Typography>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={goToNextMonth}>
            <Feather name="chevron-right" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Weekdays */}
        <View style={styles.weekdaysRow}>
          {WEEKDAYS.map((day) => (
            <Typography key={day} variant="regular" size="caption" color={colors.textSecondary} style={styles.weekdayText}>
              {day}
            </Typography>
          ))}
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarGrid}>
          {days.map((item, index) => {
            if (!item) {
              return <View key={`empty-${index}`} style={styles.dayCell} />;
            }

            const isSelected = selectedDate === item.dateString;
            const hasLog = !!logs[item.dateString];

            return (
              <TouchableOpacity
                key={item.day}
                style={[
                  styles.dayCell,
                  isSelected && styles.dayCellSelected
                ]}
                onPress={() => setSelectedDate(item.dateString)}
              >
                <Typography
                  variant={isSelected ? "bold" : "regular"}
                  color={isSelected ? colors.surface : colors.textPrimary}
                  style={styles.dayText}
                >
                  {item.day}
                </Typography>
                {/* Single Dot Indicator */}
                <View style={styles.dotsRow}>
                  {hasLog && (
                    <View style={[
                      styles.dot,
                      { backgroundColor: isSelected ? colors.surface : colors.primary }
                    ]} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Logs Container */}
        {selectedDate && (
          <View style={styles.logsContainer}>
            <View style={styles.logsDarkHeader}>
              <View style={styles.logsHeaderDot} />
              <Typography variant="bold" color={colors.surface}>
                {displayFullDate}
              </Typography>
            </View>

            <View style={styles.logsBody}>
              {selectedLog ? (
                <View style={styles.logCard}>
                  <Typography variant="bold" size="h2" color={colors.textPrimary} style={{ marginBottom: 12 }}>
                    {selectedLog.title}
                  </Typography>
                  <Typography variant="regular" size="body" color={colors.textSecondary} style={{ marginBottom: 16 }}>
                    "{selectedLog.preview}"
                  </Typography>
                  <View style={styles.logMeta}>
                    <Feather name="clock" size={14} color={colors.textTertiary} style={{ marginRight: 6 }} />
                    <Typography variant="regular" size="small" color={colors.textSecondary}>{selectedLog.time}</Typography>

                    <View style={styles.metaDivider} />

                    <Feather name="map-pin" size={14} color={colors.textTertiary} style={{ marginRight: 6 }} />
                    <Typography variant="regular" size="small" color={colors.textSecondary}>{selectedLog.location}</Typography>
                  </View>
                </View>
              ) : (
                <View style={styles.emptyStateContainer}>
                  <View style={styles.emptyStateCircle}>
                    <Feather name="feather" size={32} color={colors.textTertiary} />
                  </View>
                  <Typography variant="bold" size="body" color={colors.textSecondary} centered>
                    Oops! You have not logged this day.
                  </Typography>
                  <Typography variant="regular" size="small" color={colors.textTertiary} centered style={{ marginTop: 8 }}>
                    There are no receipts filed for this date in the ledger.
                  </Typography>
                </View>
              )}
            </View>
          </View>
        )}

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
        onNavigateToCalendar={() => { setMenuVisible(false); }}
        onNavigateToWeeklyReport={() => navigation.navigate('WeeklyReport')}
        onNavigateToNotifications={() => navigation.navigate('Notifications')}
        onNavigateToAccount={() => navigation.navigate('Account')}
        onNavigateToDataPrivacy={() => navigation.navigate('DataPrivacy')}
        onNavigateToAboutHelp={() => navigation.navigate('AboutHelp')}
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
  monthSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.xl,
    paddingVertical: layout.spacing.l,
  },
  navButton: {
    padding: 8,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: layout.spacing.l,
    marginBottom: layout.spacing.m,
  },
  weekdayText: {
    width: width / 7 - 10,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: layout.spacing.m,
  },
  dayCell: {
    width: (width - 2 * layout.spacing.m) / 7,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 28, // fully rounded like iOS
  },
  dayCellSelected: {
    backgroundColor: colors.textPrimary, // Fits the noir theme natively 
  },
  dayText: {
    marginBottom: 4,
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    height: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  logsContainer: {
    marginTop: layout.spacing.xl,
    marginHorizontal: layout.spacing.l,
    backgroundColor: colors.surface,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  logsDarkHeader: {
    backgroundColor: colors.textPrimary,
    padding: layout.spacing.l,
    flexDirection: 'row',
    alignItems: 'center',
  },
  logsHeaderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginRight: 12,
  },
  logsBody: {
    backgroundColor: colors.surface,
    padding: layout.spacing.l,
    paddingTop: layout.spacing.xl,
  },
  logCard: {
    paddingBottom: layout.spacing.m,
  },
  logMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaDivider: {
    width: 1,
    height: 12,
    backgroundColor: colors.border,
    marginHorizontal: 12,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
  },
  emptyStateCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  }
});
