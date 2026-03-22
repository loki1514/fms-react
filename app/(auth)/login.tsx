import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Typography, Shadows } from '@/theme/theme';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { theme, colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await signIn(email.trim(), password);
      router.replace('/(tenant-tabs)/overview');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.inner}>
        {/* Logo / Brand */}
        <View style={styles.brandSection}>
          <View style={[styles.logoCircle, { backgroundColor: Colors.primary }]}>
            <Text style={styles.logoText}>FE</Text>
          </View>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Foundever
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Tenant Portal
          </Text>
        </View>

        {/* Login Card */}
        <View style={[
          styles.card,
          {
            backgroundColor: isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          },
          isDark ? Shadows.lg : Shadows.glass,
        ]}>
          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Email</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: colors.surfaceElevated,
              color: colors.textPrimary,
              borderColor: colors.border,
            }]}
            placeholder="you@company.com"
            placeholderTextColor={colors.textTertiary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Password</Text>
          <TextInput
            style={[styles.input, {
              backgroundColor: colors.surfaceElevated,
              color: colors.textPrimary,
              borderColor: colors.border,
            }]}
            placeholder="••••••••"
            placeholderTextColor={colors.textTertiary}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.loginButton, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          Contact your property admin for access
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing['2xl'],
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.5,
  },
  title: {
    ...Typography.displayMedium,
    marginBottom: 4,
  },
  subtitle: {
    ...Typography.bodyLarge,
  },
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  errorBanner: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: Radius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.error,
    ...Typography.bodySmall,
    textAlign: 'center',
  },
  inputLabel: {
    ...Typography.labelMedium,
    marginBottom: 6,
    marginLeft: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    ...Typography.bodyMedium,
    marginBottom: Spacing.md,
  },
  loginButton: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  loginButtonText: {
    color: '#FFFFFF',
    ...Typography.titleMedium,
    fontWeight: '600',
  },
  footerText: {
    ...Typography.bodySmall,
    textAlign: 'center',
  },
});
