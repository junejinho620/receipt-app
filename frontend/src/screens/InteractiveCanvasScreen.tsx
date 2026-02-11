import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Button } from '../components/Button';
import { SaveReceiptModal } from '../components/SaveReceiptModal';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { Typography } from '../components/ui/Typography';
import { Input } from '../components/ui/Input';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';

type InteractiveCanvasScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'InteractiveCanvas'>;
};

type InputType = 'Text' | 'Photo';

export function InteractiveCanvasScreen({ navigation }: InteractiveCanvasScreenProps) {
  const [selectedInput, setSelectedInput] = useState<InputType>('Text');
  const [textContent, setTextContent] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const hasContent = selectedInput === 'Text'
    ? textContent.trim().length > 0
    : hasPhoto;

  const handlePhotoPlaceholder = () => {
    setHasPhoto(true);
  };

  const handlePrintReceipt = () => {
    setShowModal(true);
  };

  const handleSignUp = () => {
    setShowModal(false);
    navigation.navigate('Auth');
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>

          {/* Header */}
          <View style={styles.header}>
            <Typography variant="regular" size="small" color={colors.textSecondary} style={{ letterSpacing: 1 }}>
              NEW ENTRY
            </Typography>
            <Typography variant="bold" size="h2" color={colors.textPrimary}>
              Create Receipt
            </Typography>
          </View>

          <View style={styles.canvasContainer}>
            <View style={styles.receiptPaper}>
              <View style={styles.receiptHeader}>
                <Typography variant="mono" size="small" color={colors.textSecondary} centered>
                  *** START OF LOG ***
                </Typography>
                <Typography variant="bold" color={colors.textPrimary} centered style={{ marginTop: 8 }}>
                  {new Date().toLocaleDateString(undefined, {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  }).toUpperCase()}
                </Typography>
                <View style={styles.dashedLine} />
              </View>

              {selectedInput === 'Text' ? (
                <TextInput
                  placeholder="Type your thoughts..."
                  value={textContent}
                  onChangeText={setTextContent}
                  multiline
                  style={styles.receiptInput}
                  placeholderTextColor={colors.textTertiary}
                  textAlignVertical="top"
                />
              ) : (
                <TouchableOpacity onPress={handlePhotoPlaceholder} style={styles.photoPlaceholder}>
                  {hasPhoto ? (
                    <Typography size="h1">📸</Typography>
                  ) : (
                    <Typography variant="medium" color={colors.textSecondary}>Tap to Capture</Typography>
                  )}
                </TouchableOpacity>
              )}

              <View style={styles.receiptFooter}>
                <View style={styles.dashedLine} />
                <Typography variant="mono" size="small" color={colors.textSecondary} centered style={{ marginTop: 8 }}>
                  *** END OF LOG ***
                </Typography>
                <View style={styles.barcode} />
              </View>
            </View>
          </View>

          {/* Tools */}
          <View style={styles.toolsContainer}>
            <Typography variant="medium" size="small" color={colors.textSecondary} style={styles.toolsHeader}>
              INPUT SOURCE
            </Typography>
            <View style={styles.toolButtons}>
              <TouchableOpacity
                style={[styles.toolButton, selectedInput === 'Text' && styles.toolButtonActive]}
                onPress={() => setSelectedInput('Text')}
              >
                <Typography
                  variant="medium"
                  color={selectedInput === 'Text' ? colors.surface : colors.textPrimary}
                >
                  Text
                </Typography>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.toolButton, selectedInput === 'Photo' && styles.toolButtonActive]}
                onPress={() => setSelectedInput('Photo')}
              >
                <Typography
                  variant="medium"
                  color={selectedInput === 'Photo' ? colors.surface : colors.textPrimary}
                >
                  Photo
                </Typography>
              </TouchableOpacity>
            </View>
          </View>

          {/* Action */}
          <View style={styles.footer}>
            <Button
              title="Print Receipt"
              onPress={handlePrintReceipt}
              disabled={!hasContent}
              variant="primary"
              style={{ width: '100%' }}
            />
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <SaveReceiptModal
        visible={showModal}
        onClose={handleCloseModal}
        onSignUp={handleSignUp}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: layout.spacing.l,
  },
  header: {
    marginBottom: layout.spacing.l,
    alignItems: 'center',
  },
  canvasContainer: {
    alignItems: 'center',
    marginBottom: layout.spacing.xl,
  },
  receiptPaper: {
    width: '100%',
    minHeight: 300,
    backgroundColor: '#F2EFED', // Premium warm paper
    borderRadius: 6,
    padding: layout.spacing.m,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
  },
  receiptHeader: {
    marginBottom: layout.spacing.m,
  },
  dashedLine: {
    height: 1,
    borderWidth: 1,
    borderColor: colors.textTertiary,
    borderStyle: 'dashed',
    borderRadius: 1,
    marginTop: layout.spacing.s,
  },
  receiptInput: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 0,
    color: colors.textPrimary,
    fontFamily: 'Manrope_400Regular',
    fontSize: 16,
    minHeight: 200, // Match photo placeholder height
  },
  photoPlaceholder: {
    flex: 1,
    minHeight: 200,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
    borderRadius: layout.borderRadius.m,
  },
  receiptFooter: {
    marginTop: layout.spacing.m,
  },
  barcode: {
    height: 30,
    backgroundColor: colors.textSecondary,
    marginTop: layout.spacing.s,
    width: '80%',
    alignSelf: 'center',
    opacity: 0.2, // Simulate barcode look
  },
  toolsContainer: {
    marginBottom: layout.spacing.xl,
  },
  toolsHeader: {
    marginBottom: layout.spacing.s,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toolButtons: {
    flexDirection: 'row',
    gap: layout.spacing.m,
  },
  toolButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999, // Pill
    backgroundColor: colors.surface,
  },
  toolButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  footer: {
    marginTop: 'auto',
  },
});
