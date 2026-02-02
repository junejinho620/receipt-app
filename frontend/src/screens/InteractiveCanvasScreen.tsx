import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { Button } from '../components/Button';
import { colors } from '../styles';

type InteractiveCanvasScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'InteractiveCanvas'>;
};

type InputType = 'Text' | 'Photo';

export function InteractiveCanvasScreen({ navigation }: InteractiveCanvasScreenProps) {
  const [selectedInput, setSelectedInput] = useState<InputType>('Text');
  const [textContent, setTextContent] = useState('');
  const [hasPhoto, setHasPhoto] = useState(false);

  // Validation - button enabled when content exists
  const hasContent = selectedInput === 'Text'
    ? textContent.trim().length > 0
    : hasPhoto;

  const getPromptText = () => {
    return selectedInput === 'Text'
      ? 'If today were a song title, it would be...'
      : 'Capture the view directly in front of you right now...';
  };

  const handlePhotoPlaceholder = () => {
    // Just toggle hasPhoto state for MVP (placeholder functionality)
    setHasPhoto(true);
  };

  const handlePrintReceipt = () => {
    // TODO: Navigate to Sign Up page when built
    // For now, navigate to Home with a console note
    console.log('TODO: Navigate to Sign Up page');
    console.log('Message to show: "Save your first receipt to start your archive."');
    navigation.replace('Home');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Content Area - Centered like onboarding slides */}
      <View style={styles.content}>
        <View style={styles.contentInner}>
          {/* Header - Dynamic Prompt */}
          <View style={styles.header}>
            <Text style={styles.promptText}>{getPromptText()}</Text>
          </View>

          {/* Input Type Switcher (Text | Photo) */}
          <View style={styles.inputTypeSwitcher}>
            <TouchableOpacity
              style={[
                styles.inputTypeButton,
                selectedInput === 'Text' && styles.inputTypeButtonActive,
              ]}
              onPress={() => setSelectedInput('Text')}
            >
              <Text
                style={[
                  styles.inputTypeButtonText,
                  selectedInput === 'Text' && styles.inputTypeButtonTextActive,
                ]}
              >
                Text
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.inputTypeButton,
                selectedInput === 'Photo' && styles.inputTypeButtonActive,
              ]}
              onPress={() => setSelectedInput('Photo')}
            >
              <Text
                style={[
                  styles.inputTypeButtonText,
                  selectedInput === 'Photo' && styles.inputTypeButtonTextActive,
                ]}
              >
                Photo
              </Text>
            </TouchableOpacity>
          </View>

          {/* Drop Zone - Conditional based on selected input type */}
          {selectedInput === 'Text' ? (
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Type here..."
                placeholderTextColor={colors.textSecondary}
                multiline
                value={textContent}
                onChangeText={setTextContent}
              />
            </View>
          ) : (
            <TouchableOpacity
              style={styles.uploadArea}
              onPress={handlePhotoPlaceholder}
            >
              {!hasPhoto ? (
                <>
                  <View style={styles.uploadIcon}>
                    <Text style={styles.uploadArrow}>↑</Text>
                  </View>
                  <Text style={styles.uploadText}>Drop your photo here</Text>
                  <Text style={styles.uploadSubtext}>or click to browse</Text>
                </>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderIcon}>📸</Text>
                  <Text style={styles.photoPlaceholderText}>Photo selected</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Footer with CTA Button - Fixed at bottom like onboarding */}
      <View style={styles.footer}>
        <Button
          title="Print My First Receipt"
          onPress={handlePrintReceipt}
          variant="primary"
          style={styles.button}
          disabled={!hasContent}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  contentInner: {
    alignItems: 'center',
    paddingHorizontal: 8,
    maxWidth: '100%',
  },
  header: {
    marginBottom: 32,
    width: '100%',
  },
  promptText: {
    fontSize: 26,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
  },
  inputTypeSwitcher: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 24,
    width: '100%',
  },
  inputTypeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputTypeButtonActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  inputTypeButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  inputTypeButtonTextActive: {
    color: colors.buttonText,
  },
  textInputContainer: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    minHeight: 180,
    width: '100%',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    textAlignVertical: 'top',
  },
  uploadArea: {
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: colors.borderDashed,
    borderRadius: 12,
    paddingVertical: 48,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  uploadArrow: {
    fontSize: 24,
    color: colors.textSecondary,
  },
  uploadText: {
    fontSize: 15,
    fontWeight: '500',
    color: colors.text,
    marginBottom: 4,
  },
  uploadSubtext: {
    fontSize: 14,
    color: colors.textLight,
  },
  photoPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  photoPlaceholderIcon: {
    fontSize: 48,
  },
  photoPlaceholderText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 48,
    gap: 24,
    alignItems: 'center',
  },
  button: {
    width: '100%',
  },
});
