import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { Typography } from '../components/ui/Typography';
import { Input } from '../components/ui/Input';
import { Button } from '../components/Button';
import Svg, { Path } from 'react-native-svg';
import { useAuth } from '../context/AuthContext';
import api from '../api/client';

type AuthScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Auth'>;
};

type AuthMode = 'signup' | 'login';

export function AuthScreen({ navigation }: AuthScreenProps) {
  const { login } = useAuth();
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignUp = mode === 'signup';
  const isFormValid = isSignUp
    ? email.trim() && password.trim() && name.trim()
    : email.trim() && password.trim();

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setLoading(true);

    try {
      if (isSignUp) {
        // Sign Up
        const response = await api.post('/api/auth/signup', {
          email,
          username: name,
          password,
        });
        await login(response.data.data, response.data.token);
      } else {
        // Login
        const response = await api.post('/api/auth/login', {
          email,
          username: email, // Backend accepts either email or username in these fields
          password,
        });
        await login(response.data.data, response.data.token);
      }
      // AppNavigator will automatically unmount this Auth stack and mount Home stack!
    } catch (error: any) {
      console.log('Auth error:', error.response?.status);
      const statusCode = error.response?.status;
      const message = error.response?.data?.error || 'Please check your credentials and try again.';

      if (statusCode === 409) {
        // Account already exists — offer to switch to login
        Alert.alert(
          'Account Already Exists',
          message,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Sign In Instead',
              onPress: () => setMode('login'),
            },
          ]
        );
      } else {
        Alert.alert('Authentication Failed', message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = (provider: 'apple' | 'google') => {
    // TODO: Implement social authentication
    Alert.alert('Upcoming Feature', `Social Auth with ${provider} is not yet implemented.`);
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          bounces={false}
        >
          <View style={styles.topContent}>
            {/* Header */}
            <View style={styles.header}>
              <Typography variant="bold" size="small" color={colors.primary} style={styles.logo}>
                THE RECEIPT
              </Typography>
              <Typography variant="bold" size="h1" style={styles.title}>
                {isSignUp ? 'Create Account' : 'Welcome Back'}
              </Typography>
              <Typography variant="regular" color={colors.textSecondary} style={styles.subtitle}>
                {isSignUp
                  ? 'Start your daily closing ritual.'
                  : 'Sign in to access your history.'}
              </Typography>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {isSignUp && (
                <Input
                  label="Name"
                  placeholder="Your Name"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoComplete="name"
                />
              )}

              <Input
                label="Email"
                placeholder="name@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />

              <Input
                label="Password"
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete={isSignUp ? 'new-password' : 'current-password'}
              />

              {!isSignUp && (
                <TouchableOpacity style={styles.forgotPassword}>
                  <Typography variant="medium" size="small" color={colors.primary}>
                    Forgot Password?
                  </Typography>
                </TouchableOpacity>
              )}

              <Button
                title={isSignUp ? 'Get Started' : 'Sign In'}
                onPress={handleSubmit}
                disabled={!isFormValid || loading}
                loading={loading}
                style={styles.submitButton}
              />
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Typography variant="medium" size="caption" color={colors.textTertiary} style={styles.dividerText}>
                OR CONTINUE WITH
              </Typography>
              <View style={styles.dividerLine} />
            </View>

            {/* Social Login Buttons */}
            <View style={styles.socialButtons}>
              <TouchableOpacity
                style={[styles.socialButton, { backgroundColor: '#000000' }]}
                onPress={() => handleSocialAuth('apple')}
                activeOpacity={0.8}
              >
                <Svg width={24} height={24} viewBox="0 0 384 512" style={styles.socialIcon}>
                  <Path fill="#FFFFFF" d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
                </Svg>
                <Typography variant="bold" size="small" color="#FFFFFF">Sign in with Apple</Typography>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.socialButton, {
                  backgroundColor: '#FFFFFF',
                  borderWidth: 1,
                  borderColor: '#DADCE0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 0.2,
                  shadowRadius: 1,
                  elevation: 2
                }]}
                onPress={() => handleSocialAuth('google')}
                activeOpacity={0.8}
              >
                <Svg width={24} height={24} viewBox="0 0 48 48" style={styles.socialIcon}>
                  <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                  <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                  <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                  <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                </Svg>
                <Typography variant="bold" size="small" color="#3C4043">Sign in with Google</Typography>
              </TouchableOpacity>
            </View>
          </View>

          {/* Toggle Mode */}
          <View style={styles.toggleContainer}>
            <Typography variant="regular" color={colors.textSecondary}>
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            </Typography>
            <TouchableOpacity
              onPress={() => setMode(isSignUp ? 'login' : 'signup')}
            >
              <Typography variant="bold" color={colors.primary} style={styles.toggleLink}>
                {isSignUp ? ' Sign In' : ' Sign Up'}
              </Typography>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: layout.spacing.l,
    paddingTop: 80,
    paddingBottom: 40,
    minHeight: '100%',
    justifyContent: 'center',
  },
  topContent: {
    width: '100%',
  },
  header: {
    marginBottom: layout.spacing.xl,
    alignItems: 'center',
  },
  logo: {
    marginBottom: layout.spacing.m,
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    marginBottom: layout.spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: '80%',
  },
  form: {
    marginBottom: layout.spacing.xl,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: layout.spacing.m,
  },
  submitButton: {
    marginTop: layout.spacing.s,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: layout.spacing.l,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    paddingHorizontal: layout.spacing.m,
  },
  socialButtons: {
    gap: layout.spacing.m,
    marginBottom: layout.spacing.xl,
    width: '100%',
  },
  socialButton: {
    height: 50,
    borderRadius: 999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  socialIcon: {
    marginRight: 10,
  },
  toggleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: layout.spacing.l,
  },
  toggleLink: {
    marginLeft: layout.spacing.xs,
  },
});
