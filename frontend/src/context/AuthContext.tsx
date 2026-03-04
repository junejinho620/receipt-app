import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import api from '../api/client';

export type User = {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  selectedTitle: string | null;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  login: (userData: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Silently registers the device's Expo push token with the server
async function registerPushTokenSilently() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const expoPushToken = tokenData.data;

    // Register with backend (best-effort, non-blocking)
    api.post('/api/users/push-token', { expoPushToken }).catch(() => { });
  } catch (e) {
    // Not critical — silently fail
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token and user on app startup
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        // Enforce a minimum 2s delay so the custom SplashScreen animation can finish playing
        const [token, userDataStr] = await Promise.all([
          AsyncStorage.getItem('userToken'),
          AsyncStorage.getItem('userData'),
          new Promise(resolve => setTimeout(resolve, 2000))
        ]);

        if (token && userDataStr) {
          const userData = JSON.parse(userDataStr);
          setUser(userData);
          // Re-register push token on every app launch (token may rotate)
          registerPushTokenSilently();
        }
      } catch (e) {
        console.error('Failed to load local auth state', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (userData: User, token: string) => {
    try {
      await AsyncStorage.setItem('userToken', token);
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      setUser(userData);
      // Register push token after login
      registerPushTokenSilently();
    } catch (e) {
      console.error('Failed to save auth state', e);
      throw e;
    }
  };

  const logout = async () => {
    try {
      await AsyncStorage.removeItem('userToken');
      await AsyncStorage.removeItem('userData');
      setUser(null);
    } catch (e) {
      console.error('Failed to remove auth state', e);
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      const updated = { ...user, ...data };
      setUser(updated);
      AsyncStorage.setItem('userData', JSON.stringify(updated)).catch(console.error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
