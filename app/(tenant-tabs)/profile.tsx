import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Typography, Shadows } from '@/theme/theme';

function ProfileRow({ icon, label, value, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value?: string;
  onPress?: () => void;
}) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <TouchableOpacity
      style={[
        styles.profileRow,
        {
          backgroundColor: isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        },
      ]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Ionicons name={icon} size={20} color={Colors.primary} />
      <View style={styles.profileRowText}>
        <Text style={[styles.rowLabel, { color: colors.textSecondary }]}>{label}</Text>
        {value ? <Text style={[styles.rowValue, { color: colors.textPrimary }]}>{value}</Text> : null}
      </View>
      {onPress ? <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} /> : null}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, membership, signOut } = useAuth();
  const { colors, theme, toggleTheme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Tenant';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={[styles.avatar, { backgroundColor: Colors.primary }]}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.displayName, { color: colors.textPrimary }]}>{displayName}</Text>
          <Text style={[styles.email, { color: colors.textSecondary }]}>{user?.email}</Text>
        </View>

        {/* Profile Rows */}
        <View style={styles.section}>
          <ProfileRow
            icon="business-outline"
            label="Organization"
            value={membership?.org_name || '—'}
          />
          <ProfileRow
            icon="location-outline"
            label="Property"
            value={membership?.properties?.[0]?.name || '—'}
          />
          <ProfileRow
            icon="shield-outline"
            label="Role"
            value={membership?.properties?.[0]?.role || '—'}
          />
        </View>

        <View style={styles.section}>
          <ProfileRow
            icon={isDark ? 'sunny-outline' : 'moon-outline'}
            label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            onPress={toggleTheme}
          />
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          style={[styles.signOutButton, { borderColor: Colors.error }]}
          onPress={handleSignOut}
          activeOpacity={0.7}
        >
          <Ionicons name="log-out-outline" size={20} color={Colors.error} />
          <Text style={[styles.signOutText, { color: Colors.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: Spacing.lg },
  avatarSection: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '600',
  },
  displayName: { ...Typography.headlineLarge, marginBottom: 4 },
  email: { ...Typography.bodyMedium },
  section: {
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  profileRowText: { flex: 1 },
  rowLabel: { ...Typography.labelSmall },
  rowValue: { ...Typography.titleMedium },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginTop: Spacing.lg,
  },
  signOutText: { ...Typography.titleMedium, fontWeight: '600' },
});
