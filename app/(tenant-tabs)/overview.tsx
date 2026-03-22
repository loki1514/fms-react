import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Typography, Shadows } from '@/theme/theme';
import { useTickets } from '@/hooks/useTickets';
import { useRooms } from '@/hooks/useRooms';

function StatCard({ icon, label, value, color, bgColor }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | number;
  color: string;
  bgColor: string;
}) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <View style={[
      styles.statCard,
      {
        backgroundColor: isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
      },
      isDark ? Shadows.md : Shadows.glass,
    ]}>
      <View style={[styles.statIcon, { backgroundColor: bgColor }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </View>
  );
}

function QuickAction({ icon, label, onPress }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <TouchableOpacity
      style={[
        styles.quickAction,
        {
          backgroundColor: isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        },
        isDark ? Shadows.sm : Shadows.md,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.quickActionIcon, { backgroundColor: `${Colors.primary}18` }]}>
        <Ionicons name={icon} size={22} color={Colors.primary} />
      </View>
      <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>{label}</Text>
      <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
    </TouchableOpacity>
  );
}

export default function OverviewScreen() {
  const { user, membership } = useAuth();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { activeTickets, completedTickets } = useTickets();
  const { upcomingBookings } = useRooms();

  const propertyName = membership?.properties?.[0]?.name || 'Your Property';
  const greeting = getGreeting();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Tenant';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Greeting Header */}
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>{greeting}</Text>
          <Text style={[styles.name, { color: colors.textPrimary }]}>{displayName}</Text>
          <View style={styles.propertyBadge}>
            <Ionicons name="business-outline" size={14} color={Colors.primary} />
            <Text style={[styles.propertyText, { color: Colors.primary }]}>{propertyName}</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            icon="alert-circle-outline"
            label="Active"
            value={activeTickets.length}
            color={Colors.warning}
            bgColor="rgba(245, 158, 11, 0.12)"
          />
          <StatCard
            icon="checkmark-circle-outline"
            label="Completed"
            value={completedTickets.length}
            color={Colors.success}
            bgColor="rgba(16, 185, 129, 0.12)"
          />
          <StatCard
            icon="calendar-outline"
            label="Bookings"
            value={upcomingBookings.length}
            color={Colors.info}
            bgColor="rgba(59, 130, 246, 0.12)"
          />
        </View>

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Quick Actions</Text>
        <QuickAction
          icon="add-circle-outline"
          label="Raise a Request"
          onPress={() => router.push('/request/new')}
        />
        <QuickAction
          icon="document-text-outline"
          label="View My Requests"
          onPress={() => router.push('/(tenant-tabs)/requests')}
        />
        <QuickAction
          icon="calendar-outline"
          label="Book a Room"
          onPress={() => router.push('/(tenant-tabs)/rooms')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: Spacing.lg, paddingBottom: Spacing['3xl'] },
  header: { marginBottom: Spacing.lg },
  greeting: { ...Typography.bodyLarge },
  name: { ...Typography.displayMedium, marginBottom: 4 },
  propertyBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  propertyText: { ...Typography.labelMedium },
  statsRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  statCard: {
    flex: 1,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    alignItems: 'center',
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statValue: { ...Typography.metric, marginBottom: 2 },
  statLabel: { ...Typography.labelSmall },
  sectionTitle: { ...Typography.headlineMedium, marginBottom: Spacing.md },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  quickActionIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionLabel: { ...Typography.titleMedium, flex: 1 },
});
