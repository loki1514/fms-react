import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Typography, Shadows } from '@/theme/theme';
import { useTickets, TicketRow } from '@/hooks/useTickets';
import { springs } from '@/animations/reanimated-presets';

const STATUS_COLORS: Record<string, string> = {
  open: Colors.warning,
  in_progress: Colors.info,
  assigned: '#8B5CF6',
  completed: Colors.success,
  resolved: Colors.success,
  cancelled: Colors.error,
  on_hold: '#6B7280',
};

const PRIORITY_COLORS: Record<string, string> = {
  low: Colors.info,
  medium: Colors.warning,
  high: '#F97316',
  critical: Colors.error,
};

// Animated Ticket Card
function AnimatedTicketCard({ 
  ticket, 
  onPress, 
  index 
}: { 
  ticket: TicketRow; 
  onPress: () => void;
  index: number;
}) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const statusColor = STATUS_COLORS[ticket.status] || Colors.info;
  const priorityColor = PRIORITY_COLORS[ticket.priority] || Colors.warning;

  // SLA progress
  let slaProgress = 0;
  if (ticket.sla_deadline && ticket.status !== 'completed') {
    const now = Date.now();
    const created = new Date(ticket.created_at).getTime();
    const deadline = new Date(ticket.sla_deadline).getTime();
    const total = deadline - created;
    const elapsed = now - created;
    slaProgress = Math.min(1, Math.max(0, elapsed / total));
  }

  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-50);
  const scale = useSharedValue(1);
  const bgColor = useSharedValue(isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)');
  const statusScale = useSharedValue(0);
  const priorityRotate = useSharedValue('-45deg');
  const priorityScale = useSharedValue(0);
  const slaWidth = useSharedValue(0);

  useEffect(() => {
    const delay = index * 50;
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateX.value = withDelay(delay, withSpring(0, springs.smooth));
    statusScale.value = withDelay(delay + 100, withSpring(1, springs.bouncy));
    priorityRotate.value = withDelay(delay + 150, withSpring('0deg', springs.bouncy));
    priorityScale.value = withDelay(delay + 150, withSpring(1, springs.bouncy));
    slaWidth.value = withDelay(delay + 300, withSpring(slaProgress * 100, springs.smooth));
  }, []);

  const cardStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
    backgroundColor: bgColor.value,
  }));

  const statusStyle = useAnimatedStyle(() => ({
    transform: [{ scale: statusScale.value }],
  }));

  const priorityStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: priorityRotate.value },
      { scale: priorityScale.value },
    ],
  }));

  const slaStyle = useAnimatedStyle(() => ({
    width: `${slaWidth.value}%`,
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springs.quick);
    bgColor.value = isDark ? 'rgba(35, 45, 55, 0.8)' : 'rgba(245, 250, 255, 0.95)';
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.quick);
    bgColor.value = isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)';
  };

  return (
    <Pressable onPress={onPress} onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View
        style={[
          styles.ticketCard,
          {
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          },
          isDark ? Shadows.md : Shadows.glass,
          cardStyle,
        ]}
      >
        <View style={styles.ticketHeader}>
          <View style={styles.ticketMeta}>
            {ticket.ticket_number && (
              <Text style={[styles.ticketNumber, { color: colors.textTertiary }]}>
                #{ticket.ticket_number}
              </Text>
            )}
            <Animated.View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }, statusStyle]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>
                {ticket.status.replace('_', ' ')}
              </Text>
            </Animated.View>
          </View>
          <Animated.View style={[styles.priorityBadge, { borderColor: priorityColor }, priorityStyle]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {ticket.priority}
            </Text>
          </Animated.View>
        </View>

        <Text style={[styles.ticketTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {ticket.title}
        </Text>

        {ticket.category && (
          <Text style={[styles.ticketCategory, { color: colors.textSecondary }]}>
            {ticket.category}
          </Text>
        )}

        {ticket.sla_deadline && ticket.status !== 'completed' && (
          <View style={styles.slaContainer}>
            <View style={[styles.slaBar, { backgroundColor: colors.border }]}>
              <Animated.View
                style={[
                  styles.slaFill,
                  {
                    backgroundColor: slaProgress > 0.8 
                      ? Colors.error 
                      : slaProgress > 0.5 
                        ? Colors.warning 
                        : Colors.success,
                  },
                  slaStyle,
                ]}
              />
            </View>
            <Text style={[styles.slaText, { color: colors.textTertiary }]}>
              {ticket.sla_breached ? 'SLA Breached' : `${Math.round(slaProgress * 100)}% elapsed`}
            </Text>
          </View>
        )}

        <View style={styles.ticketFooter}>
          <Text style={[styles.dateText, { color: colors.textTertiary }]}>
            {new Date(ticket.created_at).toLocaleDateString()}
          </Text>
          {ticket.assigned_to_name && (
            <Text style={[styles.assigneeText, { color: colors.textSecondary }]}>
              → {ticket.assigned_to_name}
            </Text>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

// Animated Filter Chip
function AnimatedFilterChip({ 
  label, 
  count,
  active, 
  onPress, 
  index 
}: { 
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
  index: number;
}) {
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const bgColor = useSharedValue('transparent');
  const borderColor = useSharedValue('rgba(150, 150, 150, 0.3)');

  useEffect(() => {
    const delay = index * 80;
    scale.value = withDelay(delay, withSpring(1, springs.smooth));
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    bgColor.value = active ? Colors.primary : 'transparent';
    borderColor.value = active ? Colors.primary : 'rgba(150, 150, 150, 0.3)';
  }, [active]);

  const chipStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
    backgroundColor: bgColor.value,
    borderColor: borderColor.value,
  }));

  const handlePress = () => {
    onPress();
    bgColor.value = withSpring(active ? 'transparent' : Colors.primary, springs.bouncy);
    borderColor.value = withSpring(active ? 'rgba(150, 150, 150, 0.3)' : Colors.primary, springs.bouncy);
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.chip, chipStyle]}>
        <Text style={[styles.chipText, { color: active ? '#fff' : 'rgba(100, 100, 100, 0.8)' }]}>
          {label}{count !== undefined ? ` (${count})` : ''}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

// Animated Empty State
function AnimatedEmptyState({ loading }: { loading: boolean }) {
  const { colors } = useTheme();

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const iconScale = useSharedValue(0);
  const iconRotate = useSharedValue('-180deg');
  const titleY = useSharedValue(20);
  const titleOpacity = useSharedValue(0);
  const subtitleOpacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, springs.smooth);
    opacity.value = withTiming(1, { duration: 400 });
    iconScale.value = withDelay(200, withSpring(1, springs.bouncy));
    iconRotate.value = withDelay(200, withSpring('0deg', springs.bouncy));
    titleY.value = withDelay(300, withSpring(0, springs.smooth));
    titleOpacity.value = withDelay(300, withTiming(1, { duration: 400 }));
    subtitleOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const iconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: iconScale.value },
      { rotate: iconRotate.value },
    ],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleY.value }],
  }));

  const subtitleStyle = useAnimatedStyle(() => ({
    opacity: subtitleOpacity.value,
  }));

  return (
    <Animated.View style={[styles.emptyState, containerStyle]}>
      <Animated.View style={[styles.emptyIcon, { backgroundColor: `${Colors.primary}15` }, iconStyle]}>
        <Ionicons name="document-text-outline" size={48} color={Colors.primary} />
      </Animated.View>
      <Animated.Text style={[styles.emptyTitle, { color: colors.textPrimary }, titleStyle]}>
        {loading ? 'Loading...' : 'No requests yet'}
      </Animated.Text>
      <Animated.Text style={[styles.emptySubtitle, { color: colors.textSecondary }, subtitleStyle]}>
        Tap the + button to raise your first service request
      </Animated.Text>
    </Animated.View>
  );
}

export default function RequestsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { activeTickets, completedTickets, loading, fetchTickets } = useTickets();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const displayTickets = filter === 'active'
    ? activeTickets
    : filter === 'completed'
      ? completedTickets
      : [...activeTickets, ...completedTickets];

  // Header animations
  const headerY = useSharedValue(-20);
  const headerOpacity = useSharedValue(0);
  const buttonScale = useSharedValue(0);
  const buttonRotate = useSharedValue('90deg');
  const filtersOpacity = useSharedValue(0);

  useEffect(() => {
    headerY.value = withSpring(0, springs.smooth);
    headerOpacity.value = withTiming(1, { duration: 400 });
    buttonScale.value = withDelay(200, withSpring(1, springs.bouncy));
    buttonRotate.value = withDelay(200, withSpring('0deg', springs.bouncy));
    filtersOpacity.value = withDelay(150, withTiming(1, { duration: 400 }));
  }, []);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerY.value }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: buttonScale.value },
      { rotate: buttonRotate.value },
    ],
  }));

  const filtersStyle = useAnimatedStyle(() => ({
    opacity: filtersOpacity.value,
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <Animated.View style={[styles.header, headerStyle]}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Requests</Text>
        <Animated.View style={buttonStyle}>
          <Pressable
            style={[styles.newButton, { backgroundColor: Colors.primary }]}
            onPress={() => router.push('/request/new')}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.newButtonText}>New</Text>
          </Pressable>
        </Animated.View>
      </Animated.View>

      {/* Filter Chips */}
      <Animated.View style={[styles.filters, filtersStyle]}>
        <AnimatedFilterChip
          label="All"
          active={filter === 'all'}
          onPress={() => setFilter('all')}
          index={0}
        />
        <AnimatedFilterChip
          label="Active"
          count={activeTickets.length}
          active={filter === 'active'}
          onPress={() => setFilter('active')}
          index={1}
        />
        <AnimatedFilterChip
          label="Completed"
          count={completedTickets.length}
          active={filter === 'completed'}
          onPress={() => setFilter('completed')}
          index={2}
        />
      </Animated.View>

      {/* Ticket List */}
      <FlatList
        data={displayTickets}
        keyExtractor={item => item.id}
        renderItem={({ item, index }) => (
          <AnimatedTicketCard
            ticket={item}
            onPress={() => router.push(`/request/${item.id}`)}
            index={index}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl 
            refreshing={loading} 
            onRefresh={fetchTickets}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={<AnimatedEmptyState loading={loading} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { ...Typography.displayMedium },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.md,
  },
  newButtonText: { color: '#fff', ...Typography.labelLarge, fontWeight: '600' },
  filters: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  chipText: { ...Typography.labelMedium },
  list: { padding: Spacing.lg, paddingTop: 0 },
  ticketCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  ticketMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticketNumber: { ...Typography.labelSmall },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { ...Typography.labelSmall, textTransform: 'capitalize' },
  priorityBadge: {
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
  },
  priorityText: { ...Typography.labelSmall, textTransform: 'capitalize' },
  ticketTitle: { ...Typography.titleMedium, marginBottom: 4 },
  ticketCategory: { ...Typography.bodySmall, marginBottom: 8 },
  slaContainer: { marginBottom: 8 },
  slaBar: { height: 4, borderRadius: 2, overflow: 'hidden' },
  slaFill: { height: '100%', borderRadius: 2 },
  slaText: { ...Typography.labelSmall, marginTop: 2 },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: { ...Typography.labelSmall },
  assigneeText: { ...Typography.labelSmall },
  emptyState: {
    paddingTop: 80,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: { ...Typography.headlineMedium, marginBottom: Spacing.sm },
  emptySubtitle: { ...Typography.bodyMedium, textAlign: 'center' },
});
