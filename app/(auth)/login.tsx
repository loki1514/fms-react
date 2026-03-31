import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Typography, Shadows } from '@/theme/theme';
import { springs } from '@/animations/reanimated-presets';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { theme, colors } = useTheme();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Animation values
  const logoScale = useSharedValue(0);
  const logoRotate = useSharedValue('-180deg');
  const titleOpacity = useSharedValue(0);
  const titleX = useSharedValue(-20);
  const subtitleOpacity = useSharedValue(0);
  const cardY = useSharedValue(50);
  const cardOpacity = useSharedValue(0);
  const footerOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(1);

  useEffect(() => {
    // Staggered entrance animations
    logoScale.value = withDelay(200, withSpring(1, springs.bouncy));
    logoRotate.value = withDelay(200, withSpring('0deg', springs.bouncy));
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    titleX.value = withDelay(300, withSpring(0, springs.smooth));
    subtitleOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
    cardY.value = withDelay(250, withSpring(0, springs.smooth));
    cardOpacity.value = withDelay(250, withTiming(1, { duration: 400 }));
    footerOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: logoScale.value },
      { rotate: logoRotate.value },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateX: titleX.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: cardOpacity.value,
    transform: [{ translateY: cardY.value }],
  }));

  const footerStyle = useAnimatedStyle(() => ({
    opacity: footerOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

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

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95, springs.bouncy);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, springs.bouncy);
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
          <Animated.View style={[styles.logoCircle, { backgroundColor: Colors.primary }, logoStyle]}>
            <Text style={styles.logoText}>FE</Text>
          </Animated.View>
          <Animated.Text style={[styles.title, { color: colors.textPrimary }, titleStyle]}>
            Foundever
          </Animated.Text>
          <Animated.Text style={[styles.subtitle, { color: colors.textSecondary }, subtitleStyle]}>
            Tenant Portal
          </Animated.Text>
        </View>

        {/* Login Card */}
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
            isDark ? Shadows.lg : Shadows.glass,
            cardStyle,
          ]}
        >
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
            autoFocus
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

          <Pressable
            onPress={handleLogin}
            disabled={loading}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
          >
            <Animated.View
              style={[
                styles.loginButton,
                { backgroundColor: loading ? `${Colors.primary}80` : Colors.primary },
                buttonStyle,
              ]}
            >
              {loading ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </Animated.View>
          </Pressable>
        </Animated.View>

        <Animated.Text style={[styles.footerText, { color: colors.textTertiary }, footerStyle]}>
          Contact your property admin for access
        </Animated.Text>
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
