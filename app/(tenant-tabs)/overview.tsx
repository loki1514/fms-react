import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Typography, Shadows } from '@/theme/theme';
import { useTickets } from '@/hooks/useTickets';
import { useRooms } from '@/hooks/useRooms';
import { springs } from '@/animations/reanimated-presets';

// Animated Stat Card
function AnimatedStatCard({ 
  icon, 
  label, 
  value, 
  color, 
  bgColor, 
  index 
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: number;
  color: string;
  bgColor: string;
  index: number;
}) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const iconScale = useSharedValue(0);
  const valueOpacity = useSharedValue(0);
  const valueY = useSharedValue(10);

  useEffect(() => {
    const delay = index * 80;
    scale.value = withDelay(delay, withSpring(1, springs.smooth));
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, springs.smooth));
    iconScale.value = withDelay(delay + 200, withSpring(1, springs.bouncy));
    valueOpacity.value = withDelay(delay + 300, withTiming(1, { duration: 300 }));
    valueY.value = withDelay(delay + 300, withSpring(0, springs.smooth));
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const valueStyle = useAnimatedStyle(() => ({
    opacity: valueOpacity.value,
    transform: [{ translateY: valueY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.statCard,
        {
          backgroundColor: isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        },
        isDark ? Shadows.md : Shadows.glass,
        cardStyle,
      ]}
    >
      <Animated.View style={[styles.statIcon, { backgroundColor: bgColor }, iconStyle]}>
        <Ionicons name={icon} size={20} color={color} />
      </Animated.View>
      <Animated.Text style={[styles.statValue, { color: colors.textPrimary }, valueStyle]}>
        {value}
      </Animated.Text>
      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
    </Animated.View>
  );
}

// Animated Quick Action
function AnimatedQuickAction({ 
  icon, 
  label, 
  onPress, 
  index 
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  index: number;
}) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-30);
  const scale = useSharedValue(1);
  const bgColor = useSharedValue(isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)');
  const rotate = useSharedValue('0deg');
  const arrowX = useSharedValue(0);

  useEffect(() => {
    const delay = index * 60;
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateX.value = withDelay(delay, withSpring(0, springs.smooth));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: bgColor.value,
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: rotate.value }],
  }));

  const arrowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: arrowX.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springs.quick);
    bgColor.value = isDark ? 'rgba(30, 40, 50, 0.7)' : 'rgba(240, 245, 250, 0.95)';
    rotate.value = withSpring('10deg', springs.bouncy);
    arrowX.value = withSpring(5, springs.bouncy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.quick);
    bgColor.value = isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)';
    rotate.value = withSpring('0deg', springs.bouncy);
    arrowX.value = withSpring(0, springs.bouncy);
  };

  return (
    <Animated.View style={containerStyle}>
      <Pressable 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Animated.View
          style={[
            styles.quickAction,
            {
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
            isDark ? Shadows.sm : Shadows.md,
            cardStyle,
          ]}
        >
          <Animated.View style={[styles.quickActionIcon, { backgroundColor: `${Colors.primary}18` }, iconStyle]}>
            <Ionicons name={icon} size={22} color={Colors.primary} />
          </Animated.View>
          <Text style={[styles.quickActionLabel, { color: colors.textPrimary }]}>{label}</Text>
          <Animated.View style={arrowStyle}>
            <Ionicons name="chevron-forward" size={16} color={colors.textTertiary} />
          </Animated.View>
        </Animated.View>
      </Pressable>
    </Animated.View>
  );
}

export default function OverviewScreen() {
  const { user, membership } = useAuth();
  const { colors } = useTheme();
  const router = useRouter();
  const { activeTickets, completedTickets } = useTickets();
  const { upcomingBookings } = useRooms();

  const propertyName = membership?.properties?.[0]?.name || 'Your Property';
  const greeting = getGreeting();
  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Tenant';

  // Header animations
  const headerY = useSharedValue(-20);
  const headerOpacity = useSharedValue(0);
  const greetingOpacity = useSharedValue(0);
  const nameX = useSharedValue(-20);
  const nameOpacity = useSharedValue(0);
  const badgeScale = useSharedValue(0.8);
  const badgeOpacity = useSharedValue(0);
  const sectionX = useSharedValue(-20);
  const sectionOpacity = useSharedValue(0);

  useEffect(() => {
    headerY.value = withSpring(0, springs.smooth);
    headerOpacity.value = withTiming(1, { duration: 400 });
    greetingOpacity.value = withDelay(100, withTiming(1, { duration: 400 }));
    nameX.value = withDelay(200, withSpring(0, springs.smooth));
    nameOpacity.value = withDelay(200, withTiming(1, { duration: 400 }));
    badgeScale.value = withDelay(300, withSpring(1, springs.smooth));
    badgeOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    sectionX.value = withDelay(400, withSpring(0, springs.smooth));
    sectionOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const greetingStyle = useAnimatedStyle(() => ({
    opacity: greetingOpacity.value,
  }));

  const nameStyle = useAnimatedStyle(() => ({
    opacity: nameOpacity.value,
    transform: [{ translateX: nameX.value }],
  }));

  const badgeStyle = useAnimatedStyle(() => ({
    opacity: badgeOpacity.value,
    transform: [{ scale: badgeScale.value }],
  }));

  const sectionStyle = useAnimatedStyle(() => ({
    opacity: sectionOpacity.value,
    transform: [{ translateX: sectionX.value }],
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Greeting Header */}
        <Animated.View style={[styles.header, headerStyle]}>
          <Animated.Text style={[styles.greeting, { color: colors.textSecondary }, greetingStyle]}>
            {greeting}
          </Animated.Text>
          <Animated.Text style={[styles.name, { color: colors.textPrimary }, nameStyle]}>
            {displayName}
          </Animated.Text>
          <Animated.View style={[styles.propertyBadge, badgeStyle]}>
            <Ionicons name="business-outline" size={14} color={Colors.primary} />
            <Text style={[styles.propertyText, { color: Colors.primary }]}>{propertyName}</Text>
          </Animated.View>
        </Animated.View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <AnimatedStatCard
            icon="alert-circle-outline"
            label="Active"
            value={activeTickets.length}
            color={Colors.warning}
            bgColor="rgba(245, 158, 11, 0.12)"
            index={0}
          />
          <AnimatedStatCard
            icon="checkmark-circle-outline"
            label="Completed"
            value={completedTickets.length}
            color={Colors.success}
            bgColor="rgba(16, 185, 129, 0.12)"
            index={1}
          />
          <AnimatedStatCard
            icon="calendar-outline"
            label="Bookings"
            value={upcomingBookings.length}
            color={Colors.info}
            bgColor="rgba(59, 130, 246, 0.12)"
            index={2}
          />
        </View>

        {/* Quick Actions */}
        <Animated.Text style={[styles.sectionTitle, { color: colors.textPrimary }, sectionStyle]}>
          Quick Actions
        </Animated.Text>
        
        <AnimatedQuickAction
          icon="add-circle-outline"
          label="Raise a Request"
          onPress={() => router.push('/request/new')}
          index={0}
        />
        <AnimatedQuickAction
          icon="document-text-outline"
          label="View My Requests"
          onPress={() => router.push('/(tenant-tabs)/requests')}
          index={1}
        />
        <AnimatedQuickAction
          icon="calendar-outline"
          label="Book a Room"
          onPress={() => router.push('/(tenant-tabs)/rooms')}
          index={2}
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
