import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Linking,
  Animated,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Typography } from '../components/ui/Typography';
import { MenuModal } from '../components/MenuModal';
import { useTheme } from '../context/ThemeContext';
import { layout } from '../theme/layout';

type AboutHelpScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'AboutHelp'>;
};

const FAQ_ITEMS = [
  {
    q: 'How does the Weekly Report work?',
    a: 'Each week, your daily logs — moods, moments, media — are woven into a private cinematic digest. It arrives quietly, without interruption.',
  },
  {
    q: 'Is my data encrypted?',
    a: 'All data travels over TLS 1.3. Your words are stored in a secured database. Your password is hashed before it ever touches a server. We do not read your logs.',
  },
  {
    q: 'How do I export my memories?',
    a: 'Head to System → Data & Privacy and tap "Print Full Receipt". A download link arrives in your inbox shortly after.',
  },
  {
    q: 'What happens when I delete my account?',
    a: 'Every trace — logs, reports, media — is permanently erased. We will ask you once more before anything disappears.',
  },
];

/** A single FAQ card that fades and slides in with a staggered delay */
function FaqCard({
  item,
  index,
  colors,
  styles,
}: {
  item: (typeof FAQ_ITEMS)[0];
  index: number;
  colors: any;
  styles: any;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(18)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 520,
        delay: 180 + index * 110,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 520,
        delay: 180 + index * 110,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <Animated.View style={[styles.faqCard, { opacity, transform: [{ translateY }] }]}>
      <Typography variant="medium" color={colors.textPrimary} style={styles.faqQ}>
        {item.q}
      </Typography>
      <Typography variant="regular" color={colors.textSecondary} style={styles.faqA}>
        {item.a}
      </Typography>
    </Animated.View>
  );
}

export function AboutHelpScreen({ navigation }: AboutHelpScreenProps) {
  const { colors } = useTheme();
  const styles = React.useMemo(() => getStyles(colors), [colors]);
  const [menuVisible, setMenuVisible] = React.useState(false);

  // Hero fade-in
  const heroOp = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(heroOp, { toValue: 1, duration: 700, delay: 60, useNativeDriver: true }).start();
  }, []);

  const handleContact = () => {
    Linking.openURL('mailto:support@receipt-app.com?subject=Support');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header — identical to DataPrivacy */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={() => setMenuVisible(true)}>
          <Feather name="menu" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        <View style={styles.headerTitle}>
          <Typography variant="bold" size="h2" color={colors.textPrimary}>System</Typography>
          <Typography variant="regular" size="small" color={colors.textSecondary}>About & Help</Typography>
        </View>

        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.navigate('Home')}>
          <Feather name="home" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero */}
        <Animated.View style={[styles.heroBlock, { opacity: heroOp }]}>
          <Typography variant="bold" size="h2" color={colors.textPrimary} style={styles.heroTitle}>
            Your memories,{'\n'}your ledger.
          </Typography>
          <Typography variant="regular" color={colors.textSecondary} style={styles.heroSub}>
            Receipt is a private daily journaling system built around the belief that reflection should feel like a ritual, not a chore.
          </Typography>
        </Animated.View>

        {/* Meta pill row */}
        <Animated.View style={[styles.pillRow, { opacity: heroOp }]}>
          <View style={styles.pill}>
            <Typography variant="medium" size="small" color={colors.textSecondary}>v 1.0.0</Typography>
          </View>
          <View style={styles.pillDivider} />
          <View style={styles.pill}>
            <Typography variant="medium" size="small" color={colors.textSecondary}>2026.02.25</Typography>
          </View>
          <View style={styles.pillDivider} />
          <View style={styles.pill}>
            <View style={styles.statusDot} />
            <Typography variant="medium" size="small" color={colors.textSecondary}>Operational</Typography>
          </View>
        </Animated.View>

        {/* Thin rule */}
        <View style={styles.rule} />

        {/* FAQ Section label */}
        <Typography variant="bold" size="small" color={colors.textSecondary} style={styles.sectionLabel}>
          COMMON QUESTIONS
        </Typography>

        {/* FAQ cards */}
        {FAQ_ITEMS.map((item, i) => (
          <FaqCard key={i} item={item} index={i} colors={colors} styles={styles} />
        ))}

        {/* Contact */}
        <View style={styles.rule} />

        <TouchableOpacity style={styles.contactCard} onPress={handleContact} activeOpacity={0.75}>
          <View>
            <Typography variant="bold" color={colors.textPrimary} style={{ marginBottom: 4 }}>
              Need a hand?
            </Typography>
            <Typography variant="regular" size="small" color={colors.textSecondary}>
              Reach our support team — we usually reply the same day.
            </Typography>
          </View>
          <Feather name="arrow-right" size={20} color={colors.primary} />
        </TouchableOpacity>

        {/* Legal */}
        <View style={styles.legalRow}>
          <TouchableOpacity onPress={() => { }}>
            <Typography variant="regular" size="small" color={colors.textSecondary} style={styles.legalLink}>
              Terms of Service
            </Typography>
          </TouchableOpacity>
          <Typography variant="regular" size="small" color={colors.textSecondary}> · </Typography>
          <TouchableOpacity onPress={() => { }}>
            <Typography variant="regular" size="small" color={colors.textSecondary} style={styles.legalLink}>
              Privacy Policy
            </Typography>
          </TouchableOpacity>
        </View>
        <Typography variant="regular" size="small" color={colors.textSecondary} style={styles.copyright}>
          © 2026 Sydnical Tech
        </Typography>

      </ScrollView>

      <MenuModal
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onLogout={() => console.log('Handled by AuthContext')}
        onNavigateToProfile={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('Profile'), 300); }}
        onNavigateToCalendar={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('Calendar'), 300); }}
        onNavigateToWeeklyReport={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('WeeklyReport'), 300); }}
        onNavigateToNotifications={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('Notifications'), 300); }}
        onNavigateToAccount={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('Account'), 300); }}
        onNavigateToDataPrivacy={() => { setMenuVisible(false); setTimeout(() => navigation.navigate('DataPrivacy'), 300); }}
      />
    </SafeAreaView>
  );
}

const getStyles = (colors: any) =>
  StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: colors.background,
    },
    // ── Header (identical to DataPrivacy) ────────────────────────────────────
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
    // ── Content ──────────────────────────────────────────────────────────────
    content: {
      paddingHorizontal: layout.spacing.xl,
      paddingTop: layout.spacing.m,
      paddingBottom: layout.spacing.m,
    },
    // ── Hero ─────────────────────────────────────────────────────────────────
    heroBlock: {
      marginBottom: layout.spacing.l,
    },
    heroTitle: {
      lineHeight: 38,
      marginBottom: layout.spacing.m,
    },
    heroSub: {
      lineHeight: 24,
    },
    // ── Meta pills ────────────────────────────────────────────────────────────
    pillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: layout.spacing.s,
      gap: 8,
      flexWrap: 'wrap',
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    pillDivider: {
      width: 1,
      height: 12,
      backgroundColor: colors.border,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.primary,
    },
    // ── Section divider & label ───────────────────────────────────────────────
    rule: {
      height: 1,
      backgroundColor: colors.border,
      marginVertical: layout.spacing.l,
      opacity: 0.5,
    },
    sectionLabel: {
      letterSpacing: 1.5,
      marginBottom: layout.spacing.m,
    },
    // ── FAQ cards ─────────────────────────────────────────────────────────────
    faqCard: {
      backgroundColor: colors.surface,
      borderRadius: layout.borderRadius.l,
      padding: layout.spacing.l,
      marginBottom: layout.spacing.m,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    faqQ: {
      marginBottom: layout.spacing.s,
      lineHeight: 22,
    },
    faqA: {
      lineHeight: 22,
    },
    // ── Contact card ──────────────────────────────────────────────────────────
    contactCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderRadius: layout.borderRadius.l,
      padding: layout.spacing.l,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    // ── Legal ─────────────────────────────────────────────────────────────────
    legalRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: layout.spacing.xl,
      marginBottom: layout.spacing.xs,
    },
    legalLink: {
      textDecorationLine: 'underline',
    },
    copyright: {
      textAlign: 'center',
      opacity: 0.5,
    },
  });
