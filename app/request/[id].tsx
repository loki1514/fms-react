import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  RefreshControl, Image, Alert, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Typography, Shadows } from '@/theme/theme';
import { supabase } from '@/lib/supabase';
import { TicketRow } from '@/hooks/useTickets';

const STATUS_COLORS: Record<string, string> = {
  open: Colors.warning,
  in_progress: Colors.info,
  assigned: '#8B5CF6',
  completed: Colors.success,
  resolved: Colors.success,
  cancelled: Colors.error,
};

const PRIORITY_COLORS: Record<string, string> = {
  low: Colors.info,
  medium: Colors.warning,
  high: '#F97316',
  critical: Colors.error,
};

interface Comment {
  id: string;
  comment: string;
  created_at: string;
  is_internal: boolean;
  user_id: string;
}

export default function TicketDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, theme } = useTheme();
  const router = useRouter();
  const isDark = theme === 'dark';

  const [ticket, setTicket] = useState<TicketRow | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingSubmitting, setRatingSubmitting] = useState(false);

  const fetchTicket = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setTicket(data);

      // Fetch comments (non-internal only)
      const { data: commentData } = await supabase
        .from('ticket_comments')
        .select('*')
        .eq('ticket_id', id)
        .eq('is_internal', false)
        .order('created_at', { ascending: true });

      setComments(commentData || []);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  const handleRate = async (rating: number) => {
    if (!ticket) return;
    setRatingSubmitting(true);
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ rating })
        .eq('id', ticket.id);

      if (error) throw error;
      setTicket({ ...ticket, rating });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setRatingSubmitting(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!ticket) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textPrimary, textAlign: 'center', marginTop: 40 }}>
          Ticket not found
        </Text>
      </SafeAreaView>
    );
  }

  const statusColor = STATUS_COLORS[ticket.status] || Colors.info;
  const priorityColor = PRIORITY_COLORS[ticket.priority] || Colors.warning;
  const isCompleted = ['completed', 'resolved'].includes(ticket.status);

  // SLA progress
  let slaProgress = 0;
  if (ticket.sla_deadline && !isCompleted) {
    const now = Date.now();
    const created = new Date(ticket.created_at).getTime();
    const deadline = new Date(ticket.sla_deadline).getTime();
    slaProgress = Math.min(1, Math.max(0, (now - created) / (deadline - created)));
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.textPrimary }]} numberOfLines={1}>
          {ticket.ticket_number ? `#${ticket.ticket_number}` : 'Ticket Detail'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchTicket} />}
      >
        {/* Status + Priority Row */}
        <View style={styles.badgeRow}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {ticket.status.replace('_', ' ')}
            </Text>
          </View>
          <View style={[styles.priorityBadge, { borderColor: priorityColor }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {ticket.priority}
            </Text>
          </View>
        </View>

        {/* Title + Description */}
        <Text style={[styles.ticketTitle, { color: colors.textPrimary }]}>{ticket.title}</Text>
        {ticket.description && (
          <Text style={[styles.ticketDesc, { color: colors.textSecondary }]}>{ticket.description}</Text>
        )}

        {/* Info Grid */}
        <View style={[
          styles.infoCard,
          {
            backgroundColor: isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          },
        ]}>
          <InfoRow icon="pricetag-outline" label="Category" value={ticket.category || '—'} colors={colors} />
          <InfoRow icon="calendar-outline" label="Created" value={new Date(ticket.created_at).toLocaleString()} colors={colors} />
          {ticket.assigned_to_name && (
            <InfoRow icon="person-outline" label="Assigned To" value={ticket.assigned_to_name} colors={colors} />
          )}
          {ticket.location && (
            <InfoRow icon="location-outline" label="Location" value={ticket.location} colors={colors} />
          )}
          {ticket.floor_number != null && (
            <InfoRow icon="layers-outline" label="Floor" value={`Floor ${ticket.floor_number}`} colors={colors} />
          )}
          {ticket.resolved_at && (
            <InfoRow icon="checkmark-done-outline" label="Resolved" value={new Date(ticket.resolved_at).toLocaleString()} colors={colors} />
          )}
        </View>

        {/* SLA Progress */}
        {ticket.sla_deadline && !isCompleted && (
          <View style={[styles.slaCard, {
            backgroundColor: isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          }]}>
            <Text style={[styles.slaTitle, { color: colors.textPrimary }]}>SLA Progress</Text>
            <View style={[styles.slaBar, { backgroundColor: colors.border }]}>
              <View style={[styles.slaFill, {
                width: `${slaProgress * 100}%`,
                backgroundColor: slaProgress > 0.8 ? Colors.error : slaProgress > 0.5 ? Colors.warning : Colors.success,
              }]} />
            </View>
            <View style={styles.slaLabels}>
              <Text style={[styles.slaLabel, { color: colors.textTertiary }]}>
                {ticket.sla_breached ? '⚠ SLA Breached' : `${Math.round(slaProgress * 100)}% elapsed`}
              </Text>
              <Text style={[styles.slaLabel, { color: colors.textTertiary }]}>
                Due: {new Date(ticket.sla_deadline).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Before/After Photos */}
        {(ticket.photo_before_url || ticket.photo_after_url) && (
          <View style={styles.photoSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Photos</Text>
            <View style={styles.photoRow}>
              {ticket.photo_before_url && (
                <View style={styles.photoCol}>
                  <Text style={[styles.photoLabel, { color: colors.textSecondary }]}>Before</Text>
                  <Image source={{ uri: ticket.photo_before_url }} style={styles.photo} />
                </View>
              )}
              {ticket.photo_after_url && (
                <View style={styles.photoCol}>
                  <Text style={[styles.photoLabel, { color: colors.textSecondary }]}>After</Text>
                  <Image source={{ uri: ticket.photo_after_url }} style={styles.photo} />
                </View>
              )}
            </View>
          </View>
        )}

        {/* Resolution Notes */}
        {ticket.resolution_notes && (
          <View style={[styles.resolutionCard, {
            backgroundColor: `${Colors.success}10`,
            borderColor: `${Colors.success}30`,
          }]}>
            <View style={styles.resolutionHeader}>
              <Ionicons name="checkmark-circle" size={18} color={Colors.success} />
              <Text style={[styles.resolutionTitle, { color: Colors.success }]}>Resolution</Text>
            </View>
            <Text style={[styles.resolutionText, { color: colors.textPrimary }]}>
              {ticket.resolution_notes}
            </Text>
          </View>
        )}

        {/* Rating (for completed tickets) */}
        {isCompleted && (
          <View style={[styles.ratingCard, {
            backgroundColor: isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          }]}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              {ticket.rating ? 'Your Rating' : 'Rate this resolution'}
            </Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map(star => (
                <TouchableOpacity
                  key={star}
                  onPress={() => !ticket.rating && handleRate(star)}
                  disabled={!!ticket.rating || ratingSubmitting}
                >
                  <Ionicons
                    name={star <= (ticket.rating || 0) ? 'star' : 'star-outline'}
                    size={32}
                    color={star <= (ticket.rating || 0) ? '#FBBF24' : '#9CA3AF'}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Comments */}
        {comments.length > 0 && (
          <View style={styles.commentsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Updates</Text>
            {comments.map((c) => (
              <View key={c.id} style={[styles.commentCard, {
                backgroundColor: isDark ? 'rgba(20, 26, 34, 0.4)' : 'rgba(0, 0, 0, 0.02)',
                borderColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
              }]}>
                <Text style={[styles.commentText, { color: colors.textPrimary }]}>{c.comment}</Text>
                <Text style={[styles.commentDate, { color: colors.textTertiary }]}>
                  {new Date(c.created_at).toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ icon, label, value, colors }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  colors: any;
}) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoLeft}>
        <Ionicons name={icon} size={16} color={colors.textTertiary} />
        <Text style={[styles.infoLabel, { color: colors.textTertiary }]}>{label}</Text>
      </View>
      <Text style={[styles.infoValue, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { ...Typography.headlineMedium, flex: 1, textAlign: 'center' },
  content: { padding: Spacing.lg, paddingBottom: Spacing['3xl'] },
  badgeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { ...Typography.labelMedium, textTransform: 'capitalize' },
  priorityBadge: {
    borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: Radius.full,
  },
  priorityText: { ...Typography.labelMedium, textTransform: 'capitalize' },
  ticketTitle: { ...Typography.displayMedium, marginBottom: 8 },
  ticketDesc: { ...Typography.bodyLarge, marginBottom: Spacing.lg, lineHeight: 24 },
  infoCard: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 0.5, borderBottomColor: 'rgba(128,128,128,0.1)',
  },
  infoLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoLabel: { ...Typography.labelMedium },
  infoValue: { ...Typography.bodyMedium, fontWeight: '500' },
  slaCard: { borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md },
  slaTitle: { ...Typography.titleMedium, marginBottom: 8 },
  slaBar: { height: 6, borderRadius: 3, overflow: 'hidden' },
  slaFill: { height: '100%', borderRadius: 3 },
  slaLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  slaLabel: { ...Typography.labelSmall },
  photoSection: { marginBottom: Spacing.md },
  sectionTitle: { ...Typography.titleLarge, marginBottom: Spacing.sm },
  photoRow: { flexDirection: 'row', gap: Spacing.md },
  photoCol: { flex: 1 },
  photoLabel: { ...Typography.labelMedium, marginBottom: 4 },
  photo: { width: '100%', height: 160, borderRadius: Radius.md },
  resolutionCard: {
    borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md, marginBottom: Spacing.md,
  },
  resolutionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  resolutionTitle: { ...Typography.titleMedium },
  resolutionText: { ...Typography.bodyMedium, lineHeight: 22 },
  ratingCard: {
    borderRadius: Radius.lg, borderWidth: 1, padding: Spacing.md,
    marginBottom: Spacing.md, alignItems: 'center',
  },
  starsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  commentsSection: { marginBottom: Spacing.lg },
  commentCard: {
    borderRadius: Radius.md, borderWidth: 1, padding: Spacing.sm, marginBottom: Spacing.sm,
  },
  commentText: { ...Typography.bodyMedium, marginBottom: 4 },
  commentDate: { ...Typography.labelSmall },
});
