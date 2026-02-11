import React from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { Typography } from './ui/Typography';
import { Button } from './Button';

const { width } = Dimensions.get('window');

interface SaveReceiptModalProps {
  visible: boolean;
  onClose: () => void;
  onSignUp: () => void;
}

export function SaveReceiptModal({ visible, onClose, onSignUp }: SaveReceiptModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />

          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              <View style={styles.iconContainer}>
                <Typography variant="display" size="h1">💾</Typography>
              </View>

              <Typography variant="display" size="h2" centered style={styles.title}>
                Save to Archive
              </Typography>

              <Typography variant="regular" color={colors.textSecondary} centered style={styles.description}>
                Save your first receipt to start your archive.
              </Typography>

              <Button
                title="Create Account"
                onPress={onSignUp}
                variant="primary"
                style={styles.button}
              />

              <Button
                title="Discard"
                onPress={onClose}
                variant="ghost"
                style={styles.cancelButton}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(5, 5, 5, 0.8)',
  },
  modalContainer: {
    width: width - 48,
    maxWidth: 340,
    backgroundColor: colors.surface,
    borderRadius: layout.borderRadius.l,
    padding: layout.spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    marginBottom: layout.spacing.l,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceHighlight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  title: {
    marginBottom: layout.spacing.m,
  },
  description: {
    marginBottom: layout.spacing.xl,
    lineHeight: 24,
  },
  button: {
    width: '100%',
    marginBottom: layout.spacing.s,
  },
  cancelButton: {
    width: '100%',
  },
});
