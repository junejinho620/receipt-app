import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCameraPermissions } from 'expo-camera';
import { useMediaLibraryPermissions } from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { RootStackParamList } from '../navigation/AppNavigator';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { Typography } from '../components/ui/Typography';
import { Button } from '../components/Button';
import { layout } from '../theme/layout';
import { colors } from '../theme/colors';

type PermissionsScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Permissions'>;
};

export function PermissionsScreen({ navigation }: PermissionsScreenProps) {
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [mediaPermission, requestMediaPermission] = useMediaLibraryPermissions();

  const handleAllowPermissions = async () => {
    // Request Camera permission
    if (!cameraPermission?.granted) {
      await requestCameraPermission();
    }

    // Request Media Library permission
    if (!mediaPermission?.granted) {
      await requestMediaPermission();
    }

    // Request Notifications permission
    await Notifications.requestPermissionsAsync();

    // Move to Home screen after responding to permission prompts
    navigation.replace('Home');
  };


  return (
    <ScreenWrapper>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Typography variant="bold" size="h1" style={styles.title} centered>
            Almost ready
          </Typography>
          <Typography variant="regular" size="body" color={colors.textSecondary} style={styles.description} centered>
            Allow access to camera and notifications to get started!
          </Typography>
        </View>

        <View style={styles.content}>
          <View style={styles.permissionItem}>
            <View style={styles.permissionIcon}>
              <Typography variant="bold" size="h2">📷</Typography>
            </View>
            <View style={styles.permissionTexts}>
              <Typography variant="bold" size="body">Camera</Typography>
              <Typography variant="regular" size="small" color={colors.textSecondary}>
                To quickly scan and digitize your physical receipts.
              </Typography>
            </View>
          </View>

          <View style={styles.permissionItem}>
            <View style={styles.permissionIcon}>
              <Typography variant="bold" size="h2">🖼️</Typography>
            </View>
            <View style={styles.permissionTexts}>
              <Typography variant="bold" size="body">Photos</Typography>
              <Typography variant="regular" size="small" color={colors.textSecondary}>
                To attach memories and images to your daily log.
              </Typography>
            </View>
          </View>

          <View style={styles.permissionItem}>
            <View style={styles.permissionIcon}>
              <Typography variant="bold" size="h2">🔔</Typography>
            </View>
            <View style={styles.permissionTexts}>
              <Typography variant="bold" size="body">Notifications</Typography>
              <Typography variant="regular" size="small" color={colors.textSecondary}>
                To remind you to complete your daily closing ritual.
              </Typography>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            title="Allow Access"
            onPress={handleAllowPermissions}
            style={styles.button}
          />
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: layout.spacing.l,
    paddingTop: 80,
    paddingBottom: 80,
  },
  header: {
    marginBottom: layout.spacing.xl,
  },
  content: {
    gap: layout.spacing.l,
    marginBottom: layout.spacing.xl,
  },
  title: {
    marginBottom: layout.spacing.s,
  },
  description: {
    marginBottom: layout.spacing.xl,
    paddingHorizontal: layout.spacing.m,
  },
  permissionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.spacing.m,
    backgroundColor: colors.surfaceHighlight,
    borderRadius: layout.borderRadius.m,
    borderWidth: 1,
    borderColor: colors.border,
  },
  permissionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: layout.spacing.m,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  permissionTexts: {
    flex: 1,
  },
  footer: {
    width: '100%',
    gap: layout.spacing.m,
    marginTop: 'auto',
  },
  button: {
    width: '100%',
  }
});
