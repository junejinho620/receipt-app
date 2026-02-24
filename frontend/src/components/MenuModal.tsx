import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Typography } from './ui/Typography';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

type MenuModalProps = {
  visible: boolean;
  onClose: () => void;
  onLogout: () => void;
  onNavigateToProfile?: () => void;
  onNavigateToCalendar?: () => void;
};

export function MenuModal({ visible, onClose, onLogout, onNavigateToProfile, onNavigateToCalendar }: MenuModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
        <View style={styles.drawer}>
          <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
              <Typography variant="bold" size="h2" color={colors.textPrimary}>Menu</Typography>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Feather name="x" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

              {/* Profile */}
              <View style={styles.section}>
                <Typography variant="bold" size="small" color={colors.textSecondary} style={styles.sectionTitle}>
                  IDENTITY
                </Typography>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onClose();
                    onNavigateToProfile?.();
                  }}
                >
                  <Feather name="user" size={20} color={colors.textPrimary} style={styles.menuIcon} />
                  <Typography variant="medium" color={colors.textPrimary}>Profile & Stats</Typography>
                </TouchableOpacity>
              </View>

              {/* Archive */}
              <View style={styles.section}>
                <Typography variant="bold" size="small" color={colors.textSecondary} style={styles.sectionTitle}>
                  THE LEDGER
                </Typography>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    onClose();
                    onNavigateToCalendar?.();
                  }}
                >
                  <Feather name="calendar" size={20} color={colors.textPrimary} style={styles.menuIcon} />
                  <Typography variant="medium" color={colors.textPrimary}>Calendar View</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Feather name="bar-chart-2" size={20} color={colors.textPrimary} style={styles.menuIcon} />
                  <Typography variant="medium" color={colors.textPrimary}>Weekly Report</Typography>
                </TouchableOpacity>
              </View>

              {/* Settings */}
              <View style={styles.section}>
                <Typography variant="bold" size="small" color={colors.textSecondary} style={styles.sectionTitle}>
                  SYSTEM
                </Typography>
                <TouchableOpacity style={styles.menuItem}>
                  <Feather name="bell" size={20} color={colors.textPrimary} style={styles.menuIcon} />
                  <Typography variant="medium" color={colors.textPrimary}>Notifications</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Feather name="settings" size={20} color={colors.textPrimary} style={styles.menuIcon} />
                  <Typography variant="medium" color={colors.textPrimary}>Account Management</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Feather name="shield" size={20} color={colors.textPrimary} style={styles.menuIcon} />
                  <Typography variant="medium" color={colors.textPrimary}>Data & Privacy</Typography>
                </TouchableOpacity>
                <TouchableOpacity style={styles.menuItem}>
                  <Feather name="help-circle" size={20} color={colors.textPrimary} style={styles.menuIcon} />
                  <Typography variant="medium" color={colors.textPrimary}>About & Help</Typography>
                </TouchableOpacity>
              </View>

            </ScrollView>

            <View style={styles.footer}>
              <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
                <Feather name="log-out" size={20} color={colors.error || '#D9534F'} style={styles.menuIcon} />
                <Typography variant="bold" color={colors.error || '#D9534F'}>Settle & Log Out</Typography>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    width: '80%',
    maxWidth: 320,
    height: '100%',
    backgroundColor: '#F8F6F4',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: layout.spacing.l,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    padding: layout.spacing.s,
    marginRight: -layout.spacing.s,
  },
  scrollContent: {
    paddingVertical: layout.spacing.m,
  },
  section: {
    marginBottom: layout.spacing.xl,
  },
  sectionTitle: {
    paddingHorizontal: layout.spacing.l,
    marginBottom: layout.spacing.s,
    letterSpacing: 0.5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: layout.spacing.l,
  },
  menuIcon: {
    marginRight: 16,
    width: 24,
    textAlign: 'center',
  },
  footer: {
    padding: layout.spacing.l,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingBottom: 40,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: layout.spacing.s,
  }
});
