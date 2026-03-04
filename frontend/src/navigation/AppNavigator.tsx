import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet } from 'react-native';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { InteractiveCanvasScreen } from '../screens/InteractiveCanvasScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PermissionsScreen } from '../screens/PermissionsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { WeeklyReportScreen } from '../screens/WeeklyReportScreen';
import { WeeklyMontageScreen } from '../screens/WeeklyMontageScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { AccountScreen } from '../screens/AccountScreen';
import { DataPrivacyScreen } from '../screens/DataPrivacyScreen';
import { AboutHelpScreen } from '../screens/AboutHelpScreen';
import { SocialScreen } from '../screens/SocialScreen';
import { useAuth } from '../context/AuthContext';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { OfflineBanner } from '../components/OfflineBanner';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  InteractiveCanvas: undefined;
  Auth: undefined;
  Permissions: undefined;
  Home: undefined;
  Profile: undefined;
  Calendar: undefined;
  WeeklyReport: undefined;
  Account: undefined;
  Notifications: undefined;
  DataPrivacy: undefined;
  AboutHelp: undefined;
  Social: undefined;
  WeeklyMontage: { weekId: string; title: string; range: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  const { user, isLoading } = useAuth();

  return (
    <ErrorBoundary>
      <View style={styles.root}>
        <NavigationContainer>
          <Stack.Navigator
            screenOptions={{
              headerShown: false,
              animation: 'fade',
            }}
          >
            {isLoading ? (
              <Stack.Screen name="Splash" component={SplashScreen} />
            ) : user ? (
              <>
                <Stack.Screen name="Home" component={HomeScreen} />
                <Stack.Screen name="Profile" component={ProfileScreen} />
                <Stack.Screen name="Calendar" component={CalendarScreen} />
                <Stack.Screen name="WeeklyReport" component={WeeklyReportScreen} />
                <Stack.Screen name="Account" component={AccountScreen} />
                <Stack.Screen name="Notifications" component={NotificationsScreen} />
                <Stack.Screen name="DataPrivacy" component={DataPrivacyScreen} />
                <Stack.Screen name="AboutHelp" component={AboutHelpScreen} />
                <Stack.Screen name="Social" component={SocialScreen} />
                <Stack.Screen name="WeeklyMontage" component={WeeklyMontageScreen} />
                <Stack.Screen name="InteractiveCanvas" component={InteractiveCanvasScreen} />
              </>
            ) : (
              <>
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Auth" component={AuthScreen} />
                <Stack.Screen name="Permissions" component={PermissionsScreen} />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
        <OfflineBanner />
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
