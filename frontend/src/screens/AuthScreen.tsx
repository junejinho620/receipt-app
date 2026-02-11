import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/colors';
import { layout } from '../theme/layout';
import { ScreenWrapper } from '../components/ui/ScreenWrapper';
import { Typography } from '../components/ui/Typography';
import { Input } from '../components/ui/Input';
import { Button } from '../components/Button';

// Assets
const appleLogo = require('../../assets/apple-logo.png');
const googleLogo = require('../../assets/google-logo.png');

type AuthScreenProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, 'Auth'>;
};

type AuthMode = 'signup' | 'login';

export function AuthScreen({ navigation }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const isSignUp = mode === 'signup';
  const isFormValid = isSignUp
    ? email.trim() && password.trim() && name.trim()
    : email.trim() && password.trim();

  const handleSubmit = () => {
    // TODO: Implement actual authentication
    console.log(`${isSignUp ? 'Sign Up' : 'Login'} with:`, { email, password, name });
    navigation.replace('Home');
  };

  const handleSocialAuth = (provider: 'apple' | 'google') => {
    // TODO: Implement social authentication
    console.log(`Auth with ${provider}`);
    navigation.replace('Home');
  };

  return (
    <ScreenWrapper>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
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
              disabled={!isFormValid}
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
              <Image source={appleLogo} style={styles.socialIcon} resizeMode="contain" />
              <Typography variant="bold" size="small" color="#FFFFFF">Sign in with Apple</Typography>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.socialButton, {
                backgroundColor: '#FFFFFF',
                borderWidth: 1,
                borderColor: '#DADCE0', // Standard Google border color
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.2,
                shadowRadius: 1,
                elevation: 2
              }]}
              onPress={() => handleSocialAuth('google')}
              activeOpacity={0.8}
            >
              <Image source={googleLogo} style={styles.socialIcon} resizeMode="contain" />
              <Typography variant="bold" size="small" color="#3C4043">Sign in with Google</Typography>
            </TouchableOpacity>
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
    flexGrow: 1,
    padding: layout.spacing.l,
    justifyContent: 'center',
  },
  header: {
    marginBottom: layout.spacing.xl,
    alignItems: 'center', // Center align for cleaner look
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
    borderRadius: 999, // Pill shape
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
    width: 20,
    height: 20,
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
