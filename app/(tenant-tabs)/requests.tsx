import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Typography, Shadows } from '@/theme/theme';
import { useTickets, TicketRow } from '@/hooks/useTickets';

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

function TicketCard({ ticket, onPress }: { ticket: TicketRow; onPress: () => void }) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const statusColor = STATUS_COLORS[ticket.status] || Colors.info;
  const priorityColor = PRIORITY_COLORS[ticket.priority] || Colors.warning;

  // SLA progress calculation
  let slaProgress = 0;
  if (ticket.sla_deadline && ticket.status !== 'completed') {
    const now = Date.now();
    const created = new Date(ticket.created_at).getTime();
    const deadline = new Date(ticket.sla_deadline).getTime();
    const total = deadline - created;
    const elapsed = now - created;
    slaProgress = Math.min(1, Math.max(0, elapsed / total));
  }

  return (
    <TouchableOpacity
      style={[
        styles.ticketCard,
        {
          backgroundColor: isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        },
        isDark ? Shadows.md : Shadows.glass,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.ticketHeader}>
        <View style={styles.ticketMeta}>
          {ticket.ticket_number && (
            <Text style={[styles.ticketNumber, { color: colors.textTertiary }]}>
              #{ticket.ticket_number}
            </Text>
          )}
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {ticket.status.replace('_', ' ')}
            </Text>
          </View>
        </View>
        <View style={[styles.priorityBadge, { borderColor: priorityColor }]}>
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {ticket.priority}
          </Text>
        </View>
      </View>

      <Text style={[styles.ticketTitle, { color: colors.textPrimary }]} numberOfLines={2}>
        {ticket.title}
      </Text>

      {ticket.category && (
        <Text style={[styles.ticketCategory, { color: colors.textSecondary }]}>
          {ticket.category}
        </Text>
      )}

      {/* SLA Progress Bar */}
      {ticket.sla_deadline && ticket.status !== 'completed' && (
        <View style={styles.slaContainer}>
          <View style={[styles.slaBar, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.slaFill,
                {
                  width: `${slaProgress * 100}%`,
                  backgroundColor: slaProgress > 0.8 ? Colors.error : slaProgress > 0.5 ? Colors.warning : Colors.success,
                },
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
    </TouchableOpacity>
  );
}

function RatingStars({ rating, onRate }: { rating: number | null; onRate?: (r: number) => void }) {
  return (
    <View style={styles.starsRow}>
      {[1, 2, 3, 4, 5].map(star => (
        <TouchableOpacity
          key={star}
          onPress={() => onRate?.(star)}
          disabled={!onRate}
        >
          <Ionicons
            name={star <= (rating || 0) ? 'star' : 'star-outline'}
            size={20}
            color={star <= (rating || 0) ? '#FBBF24' : '#9CA3AF'}
          />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function RequestsScreen() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const { activeTickets, completedTickets, loading, fetchTickets, rateTicket } = useTickets();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const isDark = theme === 'dark';

  const displayTickets = filter === 'active'
    ? activeTickets
    : filter === 'completed'
      ? completedTickets
      : [...activeTickets, ...completedTickets];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>My Requests</Text>
        <TouchableOpacity
          style={[styles.newButton, { backgroundColor: Colors.primary }]}
          onPress={() => router.push('/request/new')}
          activeOpacity={0.85}
        >
          <Ionicons name="add" size={20} color="#fff" />
          <Text style={styles.newButtonText}>New</Text>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filters}>
        {(['all', 'active', 'completed'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.chip,
              {
                backgroundColor: filter === f ? Colors.primary : 'transparent',
                borderColor: filter === f ? Colors.primary : colors.border,
              },
            ]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.chipText,
              { color: filter === f ? '#fff' : colors.textSecondary },
            ]}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              {f === 'active' ? ` (${activeTickets.length})` : f === 'completed' ? ` (${completedTickets.length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Ticket List */}
      <FlatList
        data={displayTickets}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TicketCard
            ticket={item}
            onPress={() => router.push(`/request/${item.id}`)}
          />
        )}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={fetchTickets} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: `${Colors.primary}15` }]}>
              <Ionicons name="document-text-outline" size={48} color={Colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              {loading ? 'Loading...' : 'No requests yet'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Tap the + button to raise your first service request
            </Text>
          </View>
        }
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
  starsRow: { flexDirection: 'row', gap: 2 },
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
