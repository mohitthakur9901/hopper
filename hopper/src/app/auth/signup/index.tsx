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
import { extractErrorMessage, loginUser, registerUser } from '@/lib/api';

const AVAILABLE_ROLES = [
  { id: 'supervisor', label: 'Supervisor' },
  { id: 'manager', label: 'Manager' },
  { id: 'admin', label: 'Admin' },
];

export default function SignupScreen() {
  const theme = useTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('supervisor');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSignup = async () => {
    if (!name.trim()) {
      setErrorMessage('Please enter your full name.');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }
    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      // 1. Register user
      await registerUser({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
      });

      setSuccessMessage('Account created! Signing you in...');

      // 2. Auto-login immediately after registration
      try {
        await loginUser({
          email: email.trim().toLowerCase(),
          password,
        });
        router.replace('/');
      } catch {
        // Fallback to login screen if automatic login fails
        setTimeout(() => {
          router.replace('/auth/login');
        }, 1200);
      }
    } catch (err) {
      setErrorMessage(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
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
                Create Account
              </ThemedText>
              <ThemedText type="small" themeColor="textSecondary" style={styles.subtitle}>
                Register a new profile to begin logging inspections
              </ThemedText>
            </View>

            {/* Error Banner */}
            {errorMessage && (
              <View style={styles.errorBanner}>
                <ThemedText style={styles.errorText}>{errorMessage}</ThemedText>
              </View>
            )}

            {/* Success Banner */}
            {successMessage && (
              <View style={styles.successBanner}>
                <ThemedText style={styles.successText}>{successMessage}</ThemedText>
              </View>
            )}

            {/* Form Fields */}
            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.label}>
                  Full Name
                </ThemedText>
                <TextInput
                  value={name}
                  onChangeText={(val) => {
                    setName(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="e.g. John Doe"
                  placeholderTextColor={theme.textSecondary}
                  autoCapitalize="words"
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
                <ThemedText type="smallBold" style={styles.label}>
                  System Role
                </ThemedText>
                <View style={styles.rolesRow}>
                  {AVAILABLE_ROLES.map((r) => {
                    const isSelected = role === r.id;
                    return (
                      <Pressable
                        key={r.id}
                        onPress={() => setRole(r.id)}
                        style={({ pressed }) => [
                          styles.roleChip,
                          {
                            backgroundColor: isSelected
                              ? theme.text
                              : theme.backgroundElement,
                            borderColor: theme.backgroundSelected,
                          },
                          pressed && styles.pressed,
                        ]}>
                        <ThemedText
                          type="smallBold"
                          style={{
                            color: isSelected ? theme.background : theme.text,
                          }}>
                          {r.label}
                        </ThemedText>
                      </Pressable>
                    );
                  })}
                </View>
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
                  placeholder="At least 6 characters"
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

              <View style={styles.inputGroup}>
                <ThemedText type="smallBold" style={styles.label}>
                  Confirm Password
                </ThemedText>
                <TextInput
                  value={confirmPassword}
                  onChangeText={(val) => {
                    setConfirmPassword(val);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder="Re-enter password"
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
                onPress={handleSignup}
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
                    Create Account
                  </ThemedText>
                )}
              </Pressable>
            </View>

            {/* Footer Navigation */}
            <View style={styles.footer}>
              <ThemedText type="small" themeColor="textSecondary">
                Already have an account?{' '}
              </ThemedText>
              <Pressable onPress={() => router.push('/auth/login')}>
                <ThemedText type="linkPrimary">Sign In</ThemedText>
              </Pressable>
            </View>

            <View style={styles.skipRow}>
              <Pressable onPress={() => router.replace('/')}>
                <ThemedText type="small" themeColor="textSecondary" style={styles.skipText}>
                  Back to Home →
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
  successBanner: {
    backgroundColor: '#52c41a20',
    borderColor: '#52c41a80',
    borderWidth: 1,
    borderRadius: Spacing.two,
    padding: Spacing.three,
  },
  successText: {
    color: '#52c41a',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
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
  rolesRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  roleChip: {
    flex: 1,
    height: 40,
    borderRadius: Spacing.two,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
