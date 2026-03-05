import React, { useCallback } from 'react';
import { View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { AppNavigator } from './src/navigation/AppNavigator';
import { AuthProvider } from './src/context/AuthContext';
import { ThemeProvider } from './src/context/ThemeContext';
import { customFonts } from './src/theme/typography';

import * as Notifications from 'expo-notifications';
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'https://bd42a6d8ffe5dcae6e8ebd6e3ee3b4dc@o4510988395085824.ingest.us.sentry.io/4510988406620160',
  debug: false,
});

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

function App() {
  const [fontsLoaded] = useFonts(customFonts);

  React.useEffect(() => {
    // Clear badge count on app open
    Notifications.setBadgeCountAsync(0);

    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('User tapped notification:', response.notification.request.content.title);
      Notifications.setBadgeCountAsync(0);
    });

    return () => subscription.remove();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaProvider onLayout={onLayoutRootView}>
      <ThemeProvider>
        <AuthProvider>
          <AppNavigator />
        </AuthProvider>
      </ThemeProvider>
      <StatusBar style="light" />
    </SafeAreaProvider>
  );
}

export default Sentry.wrap(App);
