import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { extractErrorMessage, loginUser } from '@/lib/api';

const DEMO_ACCOUNTS = [
  { label: 'Admin', email: 'admin@hopperaudit.com', pass: 'admin123' },
  { label: 'Supervisor', email: 'raj@hopperaudit.com', pass: 'supervisor123' },
  { label: 'Manager', email: 'manager@hopperaudit.com', pass: 'manager123' },
];

export default function LoginScreen() {
  const theme = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      await loginUser({
        email: email.trim().toLowerCase(),
        password,
      });

      // Navigate to main application
      router.replace('/');
    } catch (err) {
      setErrorMessage(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setErrorMessage(null);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardView}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            {/* Header Brand */}
            <View style={styles.header}>
              <View style={[styles.badge, { backgroundColor: theme.backgroundElement }]}>
                <ThemedText style={styles.badgeText}>🗑️ HOPPER AUDIT</ThemedText>
              </View>
              <ThemedText type="subtitle" style={styles.title}>
                Welcome Back
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
                Sign in to manage waste-load inspections & AI detections
              </ThemedText>
            </View>

            {/* Error Banner */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.label}>
                  Email Address
                </ThemedText>
                <TextInput
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="name@hopperaudit.com"
                  placeholderTextColor={theme.textSecondary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                />
              </View>

              <View style={styles.inputGroup}>
                <View style={styles.passwordLabelRow}>
                  <ThemedText type="smallBold" style={styles.label}>
                    Password
                  </ThemedText>
                  <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                    <ThemedText type="small" themeColor="textSecondary">
                      {showPassword ? 'Hide' : 'Show'}
                    </ThemedText>
                  </Pressable>
                </View>
                <TextInput
                  value={password}
                  onChangeText={(val) => {
                    setPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="••••••••"
                  placeholderTextColor={theme.textSecondary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.backgroundSelected,
                    },
                  ]}
                />
              </View>

              {/* Submit Button */}
              <Pressable
                onPress={handleLogin}
                disabled={loading}
                style={({ pressed }) => [
                  styles.submitBtn,
                  { backgroundColor: theme.text },
                  pressed && styles.pressed,
                  loading && styles.disabledBtn,
                ]}>
                {loading ? (
                  <ActivityIndicator color={theme.background} />
                ) : (
                  <ThemedText
                    type="smallBold"
                    style={[styles.submitText, { color: theme.background }]}>
                    Sign In
                  </ThemedText>
                )}
              </Pressable>
            </View>

            {/* Demo Accounts Quick-Fill */}
            <View style={styles.demoSection}>
              <ThemedText type="small" themeColor="textSecondary" style={styles.demoTitle}>
                Quick Demo Accounts:
              </ThemedText>
              <View style={styles.demoPillsRow}>
                {DEMO_ACCOUNTS.map((acc) => (
                  <Pressable
                    key={acc.label}
                    onPress={() => fillDemo(acc.email, acc.pass)}
                    style={({ pressed }) => [
                      styles.demoPill,
                      { backgroundColor: theme.backgroundElement },
                      pressed && styles.pressed,
                    ]}>
                    <ThemedText type="small">{acc.label}</ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Footer Navigation */}
            <View style={styles.footer}>
              <ThemedText type="small" themeColor="textSecondary">
                Don’t have an account?{' '}
              </ThemedText>
              <Pressable onPress={() => router.push('/auth/signup')}>
                <ThemedText type="linkPrimary">Sign Up</ThemedText>
              </Pressable>
            </View>

            <View style={styles.skipRow}>
              <Pressable onPress={() => router.replace('/')}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.skipText}>
                  Continue to App as Guest →
                </ThemedText>
              </Pressable>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.five,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.four,
  },
  header: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.three,
  },
  badge: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
    marginBottom: Spacing.one,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  title: {
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    maxWidth: 320,
  },
  errorBanner: {
    backgroundColor: '#ff4d4f20',
    borderColor: '#ff4d4f80',
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  errorText: {
    color: '#ff4d4f',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
  form: {
    gap: Spacing.three,
    marginTop: Spacing.two,
  },
  inputGroup: {
    gap: Spacing.one,
  },
  label: {
    marginBottom: Spacing.half,
  },
  passwordLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  input: {
    height: 48,
    borderRadius: Spacing.two,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
  },
  submitBtn: {
    height: 48,
    borderRadius: Spacing.two,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  submitText: {
    fontSize: 15,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  pressed: {
    opacity: 0.7,
  },
  demoSection: {
    alignItems: 'center',
    gap: Spacing.two,
    marginTop: Spacing.two,
  },
  demoTitle: {
    fontSize: 12,
  },
  demoPillsRow: {
    flexDirection: 'row',
    gap: Spacing.two,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  demoPill: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.one,
    borderRadius: Spacing.three,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.three,
  },
  skipRow: {
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  skipText: {
    textDecorationLine: 'underline',
  },
});
