import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { InteractiveCanvasScreen } from '../screens/InteractiveCanvasScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { PermissionsScreen } from '../screens/PermissionsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { CalendarScreen } from '../screens/CalendarScreen';

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  InteractiveCanvas: undefined;
  Auth: undefined;
  Permissions: undefined;
  Home: undefined;
  Profile: undefined;
  Calendar: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Splash"
        screenOptions={{
          headerShown: false,
        }}
      >
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="InteractiveCanvas" component={InteractiveCanvasScreen} />
        <Stack.Screen name="Auth" component={AuthScreen} />
        <Stack.Screen name="Permissions" component={PermissionsScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="Calendar" component={CalendarScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
