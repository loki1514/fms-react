// app/(tenant-tabs)/dashboard.tsx - Main Tenant Dashboard ( ported from tenantdashboard.tsx )
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable, Modal, TextInput,
  ActivityIndicator, Dimensions, Image, StatusBar, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Typography, Shadows } from '@/theme/theme';
import { springs } from '@/animations/reanimated-presets';
import { TicketCreateModal } from '@/components/modals';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Types
type Tab = 'overview' | 'requests' | 'create_request' | 'visitors' | 'room_booking' | 'settings' | 'profile';

interface Property {
  id: string;
  name: string;
  code: string;
  address: string;
  organization_id: string;
}

interface Ticket {
  id: string;
  ticket_number: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  photo_before_url?: string;
  raised_by?: string;
  sla_paused?: boolean;
  assignee?: { full_name: string };
}

// Sidebar Item Component
function SidebarItem({ 
  icon, 
  label, 
  active, 
  onPress, 
  index 
}: { 
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active: boolean;
  onPress: () => void;
  index: number;
}) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * 50;
    scale.value = withDelay(delay, withSpring(1, springs.smooth));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable 
        onPress={onPress}
        style={({ pressed }) => [
          styles.sidebarItem,
          active && styles.sidebarItemActive,
          pressed && styles.sidebarItemPressed,
        ]}
      >
        <Ionicons 
          name={icon} 
          size={20} 
          color={active ? '#fff' : 'rgba(100, 100, 100, 0.8)'} 
        />
        <Text style={[
          styles.sidebarItemText,
          active && styles.sidebarItemTextActive,
        ]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// Quick Action Button
function QuickActionButton({ onPress, index }: { onPress: () => void; index: number }) {
  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  useEffect(() => {
    const delay = index * 80;
    scale.value = withDelay(delay, withSpring(1, springs.bouncy));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable 
        onPress={onPress}
        style={({ pressed }) => [
          styles.quickActionBtn,
          pressed && { transform: [{ scale: 0.98 }] },
        ]}
      >
        <View style={styles.quickActionIcon}>
          <Ionicons name="add" size={20} color={Colors.primary} />
        </View>
        <Text style={styles.quickActionText}>NEW REQUEST</Text>
      </Pressable>
    </Animated.View>
  );
}

// Dashboard Card Component
function DashboardCard({ 
  title, 
  description, 
  icon, 
  onPress, 
  badge,
  index,
  variant = 'default'
}: { 
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  badge?: string;
  index: number;
  variant?: 'default' | 'secondary' | 'dark';
}) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const pressScale = useSharedValue(1);

  useEffect(() => {
    const delay = index * 100;
    scale.value = withDelay(delay, withSpring(1, springs.smooth));
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, springs.smooth));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
      { scale: pressScale.value },
    ],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    pressScale.value = withSpring(0.98, springs.quick);
  };

  const handlePressOut = () => {
    pressScale.value = withSpring(1, springs.quick);
  };

  const bgColors = {
    default: isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)',
    secondary: isDark ? 'rgba(30, 40, 50, 0.6)' : 'rgba(245, 250, 255, 0.9)',
    dark: isDark ? 'rgba(10, 15, 20, 0.7)' : 'rgba(30, 40, 50, 0.9)',
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.dashboardCard,
          { 
            backgroundColor: bgColors[variant],
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          },
          isDark ? Shadows.lg : Shadows.glass,
        ]}
      >
        {badge && (
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>{badge}</Text>
          </View>
        )}
        
        <View style={[
          styles.cardIconContainer,
          variant === 'secondary' && { backgroundColor: `${Colors.primary}20` },
          variant === 'dark' && { backgroundColor: 'rgba(255,255,255,0.1)' },
        ]}>
          <Ionicons 
            name={icon} 
            size={28} 
            color={variant === 'dark' ? '#fff' : variant === 'secondary' ? Colors.primary : Colors.textSecondary} 
          />
        </View>
        
        <Text style={[
          styles.cardTitle,
          variant === 'dark' && { color: '#fff' },
        ]}>
          {title}
        </Text>
        
        <Text style={[
          styles.cardDescription,
          variant === 'dark' && { color: 'rgba(255,255,255,0.7)' },
        ]}>
          {description}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

// Ticket Card Component
function TicketCard({ 
  ticket, 
  onPress, 
  onEdit, 
  onDelete,
  index 
}: { 
  ticket: Ticket;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  index: number;
}) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';

  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-30);
  const scale = useSharedValue(1);

  useEffect(() => {
    const delay = index * 60;
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
    translateX.value = withDelay(delay, withSpring(0, springs.smooth));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { scale: scale.value },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, springs.quick);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, springs.quick);
  };

  const statusColors: Record<string, string> = {
    open: Colors.warning,
    in_progress: Colors.info,
    resolved: Colors.success,
    closed: Colors.success,
    waitlist: '#8B5CF6',
  };

  const statusColor = statusColors[ticket.status] || Colors.textSecondary;

  return (
    <Animated.View style={animatedStyle}>
      <Pressable 
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.ticketCard,
          { 
            backgroundColor: isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
          },
          isDark ? Shadows.md : Shadows.glass,
        ]}
      >
        <View style={styles.ticketHeader}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}20` }]}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {ticket.status.replace('_', ' ').toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.ticketNumber, { color: colors.textTertiary }]}>
            #{ticket.ticket_number}
          </Text>
        </View>

        <Text style={[styles.ticketTitle, { color: colors.textPrimary }]} numberOfLines={2}>
          {ticket.title}
        </Text>

        {ticket.assignee?.full_name && (
          <Text style={[styles.assigneeText, { color: colors.textSecondary }]}>
            → {ticket.assignee.full_name}
          </Text>
        )}

        <View style={styles.ticketFooter}>
          <Text style={[styles.ticketDate, { color: colors.textTertiary }]}>
            {new Date(ticket.created_at).toLocaleDateString()}
          </Text>
          
          {(onEdit || onDelete) && (
            <View style={styles.ticketActions}>
              {onEdit && (
                <Pressable onPress={(e) => { e.stopPropagation(); onEdit(); }} style={styles.actionBtn}>
                  <Ionicons name="pencil" size={16} color={Colors.primary} />
                </Pressable>
              )}
              {onDelete && (
                <Pressable onPress={(e) => { e.stopPropagation(); onDelete(); }} style={styles.actionBtn}>
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </Pressable>
              )}
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

// Edit Modal Component
function EditTicketModal({ 
  visible, 
  ticket, 
  onClose, 
  onSave 
}: { 
  visible: boolean;
  ticket: Ticket | null;
  onClose: () => void;
  onSave: (title: string, description: string) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { colors } = useTheme();

  useEffect(() => {
    if (ticket) {
      setTitle(ticket.title);
      setDescription(ticket.description || '');
    }
  }, [ticket]);

  const handleSave = async () => {
    if (!title.trim()) return;
    setIsSaving(true);
    await onSave(title, description);
    setIsSaving(false);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Edit Request</Text>
            <Pressable onPress={onClose} style={styles.modalCloseBtn}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
          </View>

          <View style={styles.modalBody}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Title</Text>
            <TextInput
              style={[styles.input, {
                backgroundColor: colors.surfaceElevated,
                color: colors.textPrimary,
                borderColor: colors.border,
              }]}
              value={title}
              onChangeText={setTitle}
              placeholder="Brief title of the issue"
              placeholderTextColor={colors.textTertiary}
            />

            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea, {
                backgroundColor: colors.surfaceElevated,
                color: colors.textPrimary,
                borderColor: colors.border,
              }]}
              value={description}
              onChangeText={setDescription}
              placeholder="Detailed description..."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.modalFooter}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable 
              onPress={handleSave} 
              disabled={isSaving}
              style={[styles.saveBtn, isSaving && { opacity: 0.7 }]}
            >
              {isSaving ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save Changes</Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Sign Out Modal
function SignOutModal({ 
  visible, 
  onClose, 
  onConfirm 
}: { 
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { colors } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
          <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>Sign Out?</Text>
          <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
            Are you sure you want to sign out?
          </Text>
          
          <View style={styles.modalFooter}>
            <Pressable onPress={onClose} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </Pressable>
            <Pressable onPress={onConfirm} style={styles.signOutBtn}>
              <Text style={styles.signOutBtnText}>Sign Out</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// Main Dashboard Component
export default function TenantDashboard() {
  const { user, signOut } = useAuth();
  const { colors, theme } = useTheme();
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [property, setProperty] = useState<Property | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTickets, setActiveTickets] = useState<Ticket[]>([]);
  const [completedTickets, setCompletedTickets] = useState<Ticket[]>([]);
  const [isFetchingTickets, setIsFetchingTickets] = useState(false);
  const [showSignOutModal, setShowSignOutModal] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch property
  useEffect(() => {
    const fetchProperty = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        // Get user's membership to find property
        const { data: membership } = await supabase
          .from('memberships')
          .select('properties:property_id(*)')
          .eq('user_id', user.id)
          .maybeSingle();

        if (membership?.properties) {
          setProperty(membership.properties);
        }
      } catch (err) {
        console.error('Error fetching property:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProperty();
  }, [user?.id]);

  // Fetch tickets
  const fetchTickets = useCallback(async () => {
    if (!user?.id || !property?.id) return;
    
    setIsFetchingTickets(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*, assignee:assigned_to(full_name)')
        .eq('property_id', property.id)
        .eq('raised_by', user.id)
        .order('created_at', { ascending: false });

      if (!error && data) {
        const active = data.filter((t: any) => !['resolved', 'closed'].includes(t.status));
        const completed = data.filter((t: any) => ['resolved', 'closed'].includes(t.status));
        setActiveTickets(active);
        setCompletedTickets(completed);
      }
    } catch (err) {
      console.error('Error fetching tickets:', err);
    } finally {
      setIsFetchingTickets(false);
    }
  }, [user?.id, property?.id]);

  useEffect(() => {
    if (property?.id && user?.id) {
      fetchTickets();
    }
  }, [property?.id, user?.id, fetchTickets]);

  // Handle ticket update
  const handleUpdateTicket = async (title: string, description: string) => {
    if (!editingTicket) return;
    
    try {
      const { error } = await supabase
        .from('tickets')
        .update({ title, description })
        .eq('id', editingTicket.id);

      if (!error) {
        setEditingTicket(null);
        fetchTickets();
      } else {
        alert('Failed to update ticket');
      }
    } catch (err) {
      console.error('Update error:', err);
      alert('Failed to update ticket');
    }
  };

  // Handle ticket delete
  const handleDeleteTicket = async (ticketId: string) => {
    try {
      const { error } = await supabase
        .from('tickets')
        .delete()
        .eq('id', ticketId);

      if (!error) {
        fetchTickets();
      } else {
        alert('Failed to delete ticket');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete ticket');
    }
  };

  // Tab content components
  const OverviewTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Animated.View 
        entering={{ opacity: 0, translateY: 20 }}
        style={styles.welcomeSection}
      >
        <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>
          Welcome to AUTOPILOT, {user?.user_metadata?.full_name?.split(' ')[0] || 'Member'}
        </Text>
        <Text style={[styles.welcomeDate, { color: colors.textSecondary }]}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </Text>
      </Animated.View>

      <View style={styles.cardsGrid}>
        <DashboardCard
          title="Helpdesk & Ticketing"
          description="Report issues, track requests & get support instantly."
          icon="chatbubble-outline"
          onPress={() => setActiveTab('requests')}
          badge={`${activeTickets.length} Active`}
          index={0}
          variant="default"
        />
        <DashboardCard
          title="Visitor Management"
          description="Secure building access & visitor check-in system."
          icon="people-outline"
          onPress={() => setActiveTab('visitors')}
          index={1}
          variant="secondary"
        />
        <DashboardCard
          title="Meeting Rooms"
          description="Reserve meeting spaces & conference rooms with ease."
          icon="calendar-outline"
          onPress={() => setActiveTab('room_booking')}
          index={2}
          variant="dark"
        />
      </View>
    </ScrollView>
  );

  const RequestsTab = () => {
    const displayedTickets = filter === 'active' 
      ? activeTickets 
      : filter === 'completed' 
        ? completedTickets 
        : [...activeTickets, ...completedTickets];

    return (
      <View style={styles.tabContent}>
        <View style={styles.requestsHeader}>
          <View>
            <Text style={[styles.requestsTitle, { color: colors.textPrimary }]}>
              Support Requests
            </Text>
            <Text style={[styles.requestsSubtitle, { color: colors.textSecondary }]}>
              Track and manage your facility assistance tickets.
            </Text>
          </View>
          
          <Pressable 
            onPress={() => setShowCreateModal(true)}
            style={styles.newRequestBtn}
          >
            <Ionicons name="add" size={18} color="#fff" />
            <Text style={styles.newRequestBtnText}>New Request</Text>
          </Pressable>
        </View>

        <View style={styles.filterRow}>
          {(['all', 'active', 'completed'] as const).map((f) => (
            <Pressable
              key={f}
              onPress={() => setFilter(f)}
              style={[
                styles.filterChip,
                filter === f && styles.filterChipActive,
              ]}
            >
              <Text style={[
                styles.filterChipText,
                filter === f && styles.filterChipTextActive,
              ]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
                {f === 'active' && activeTickets.length > 0 && ` (${activeTickets.length})`}
                {f === 'completed' && completedTickets.length > 0 && ` (${completedTickets.length})`}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {isFetchingTickets ? (
            <ActivityIndicator color={Colors.primary} style={styles.loader} />
          ) : displayedTickets.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="document-text-outline" size={32} color={Colors.textTertiary} />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
                No {filter} requests
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
                Tap "New Request" to create your first ticket.
              </Text>
            </View>
          ) : (
            <View style={styles.ticketsList}>
              {displayedTickets.map((ticket, index) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onPress={() => router.push(`/request/${ticket.id}`)}
                  onEdit={['resolved', 'closed'].includes(ticket.status) ? undefined : () => setEditingTicket(ticket)}
                  onDelete={() => handleDeleteTicket(ticket.id)}
                  index={index}
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const ProfileTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.profileCard, { backgroundColor: colors.surfaceElevated }]}>
        <View style={styles.profileHeader}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {user?.user_metadata?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </Text>
          </View>
          <View style={styles.profileBadge}>
            <Text style={styles.profileBadgeText}>Registered Tenant</Text>
          </View>
        </View>

        <View style={styles.profileFields}>
          <View style={styles.profileField}>
            <Text style={[styles.profileFieldLabel, { color: colors.textTertiary }]}>Full Name</Text>
            <Text style={[styles.profileFieldValue, { color: colors.textPrimary }]}>
              {user?.user_metadata?.full_name || 'Not Set'}
            </Text>
          </View>
          <View style={styles.profileField}>
            <Text style={[styles.profileFieldLabel, { color: colors.textTertiary }]}>Email</Text>
            <Text style={[styles.profileFieldValue, { color: colors.textPrimary }]}>
              {user?.email || 'Not Set'}
            </Text>
          </View>
          <View style={styles.profileField}>
            <Text style={[styles.profileFieldLabel, { color: colors.textTertiary }]}>Property</Text>
            <Text style={[styles.profileFieldValue, { color: colors.textPrimary }]}>
              {property?.name || 'Not Set'}
            </Text>
          </View>
        </View>

        <Pressable 
          onPress={() => setActiveTab('settings')}
          style={styles.editProfileBtn}
        >
          <Text style={styles.editProfileBtnText}>Edit Profile</Text>
        </Pressable>
      </View>

      <Pressable 
        onPress={() => setShowSignOutModal(true)}
        style={styles.signOutBtn}
      >
        <Ionicons name="log-out-outline" size={20} color={Colors.error} />
        <Text style={styles.signOutBtnText}>Sign Out</Text>
      </Pressable>
    </ScrollView>
  );

  const ComingSoonTab = ({ title, icon }: { title: string; icon: keyof typeof Ionicons.glyphMap }) => (
    <View style={styles.comingSoonContainer}>
      <View style={styles.comingSoonIcon}>
        <Ionicons name={icon} size={40} color={Colors.primary} />
      </View>
      <Text style={[styles.comingSoonTitle, { color: colors.textPrimary }]}>
        {title}
      </Text>
      <Text style={[styles.comingSoonSubtitle, { color: colors.textSecondary }]}>
        Coming soon to mobile.
      </Text>
    </View>
  );

  // Render sidebar content
  const renderSidebar = () => (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <View style={styles.sidebarLogo}>
          <Text style={styles.sidebarLogoText}>
            {property?.name?.substring(0, 1) || 'T'}
          </Text>
        </View>
        <View>
          <Text style={styles.sidebarTitle} numberOfLines={1}>
            {property?.name || 'Tenant Portal'}
          </Text>
          <Text style={styles.sidebarSubtitle}>Tenant Portal</Text>
        </View>
      </View>

      <QuickActionButton 
        onPress={() => { setSidebarOpen(false); setShowCreateModal(true); }}
        index={0}
      />

      <ScrollView showsVerticalScrollIndicator={false} style={styles.sidebarNav}>
        <Text style={styles.sidebarSection}>Core Operations</Text>
        <SidebarItem
          icon="grid-outline"
          label="Dashboard"
          active={activeTab === 'overview'}
          onPress={() => { setActiveTab('overview'); setSidebarOpen(false); }}
          index={0}
        />
        <SidebarItem
          icon="ticket-outline"
          label="My Requests"
          active={activeTab === 'requests'}
          onPress={() => { setActiveTab('requests'); setSidebarOpen(false); }}
          index={1}
        />

        <Text style={styles.sidebarSection}>Management Hub</Text>
        <SidebarItem
          icon="people-outline"
          label="Visitors"
          active={activeTab === 'visitors'}
          onPress={() => { setActiveTab('visitors'); setSidebarOpen(false); }}
          index={2}
        />
        <SidebarItem
          icon="calendar-outline"
          label="Meeting Rooms"
          active={activeTab === 'room_booking'}
          onPress={() => { setActiveTab('room_booking'); setSidebarOpen(false); }}
          index={3}
        />

        <Text style={styles.sidebarSection}>System & Personal</Text>
        <SidebarItem
          icon="settings-outline"
          label="Settings"
          active={activeTab === 'settings'}
          onPress={() => { setActiveTab('settings'); setSidebarOpen(false); }}
          index={4}
        />
        <SidebarItem
          icon="person-outline"
          label="Profile"
          active={activeTab === 'profile'}
          onPress={() => { setActiveTab('profile'); setSidebarOpen(false); }}
          index={5}
        />
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <View style={styles.userInfo}>
          <View style={styles.userAvatar}>
            <Text style={styles.userAvatarText}>
              {user?.email?.[0].toUpperCase() || 'T'}
            </Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName} numberOfLines={1}>
              {user?.user_metadata?.full_name || 'Tenant'}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {user?.email}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={Colors.primary} style={styles.mainLoader} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={theme === 'dark' ? 'light-content' : 'dark-content'} />
      
      {/* Mobile Sidebar Modal */}
      <Modal
        visible={sidebarOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSidebarOpen(false)}
      >
        <Pressable style={styles.sidebarOverlay} onPress={() => setSidebarOpen(false)}>
          <View style={styles.sidebarContainer} onStartShouldSetResponder={() => true}>
            {renderSidebar()}
          </View>
        </Pressable>
      </Modal>

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={() => setSidebarOpen(true)} style={styles.menuBtn}>
            <Ionicons name="menu" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>
            {activeTab === 'overview' && 'Dashboard'}
            {activeTab === 'requests' && 'My Requests'}
            {activeTab === 'visitors' && 'Visitors'}
            {activeTab === 'room_booking' && 'Meeting Rooms'}
            {activeTab === 'settings' && 'Settings'}
            {activeTab === 'profile' && 'Profile'}
          </Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Tab Content */}
        {activeTab === 'overview' && <OverviewTab />}
        {activeTab === 'requests' && <RequestsTab />}
        {activeTab === 'visitors' && <ComingSoonTab title="Visitor Management" icon="people-outline" />}
        {activeTab === 'room_booking' && <ComingSoonTab title="Meeting Rooms" icon="calendar-outline" />}
        {activeTab === 'settings' && <ComingSoonTab title="Settings" icon="settings-outline" />}
        {activeTab === 'profile' && <ProfileTab />}
      </View>

      {/* Modals */}
      <SignOutModal
        visible={showSignOutModal}
        onClose={() => setShowSignOutModal(false)}
        onConfirm={signOut}
      />

      <EditTicketModal
        visible={!!editingTicket}
        ticket={editingTicket}
        onClose={() => setEditingTicket(null)}
        onSave={handleUpdateTicket}
      />

      <TicketCreateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        propertyId={property?.id}
        organizationId={property?.organization_id}
        onSuccess={(ticket) => {
          fetchTickets();
          setActiveTab('requests');
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  mainLoader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Sidebar
  sidebarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sidebarContainer: {
    width: 280,
    height: '100%',
    backgroundColor: '#fff',
  },
  sidebar: {
    flex: 1,
    backgroundColor: '#fff',
  },
  sidebarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  sidebarLogo: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarLogoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  sidebarTitle: {
    ...Typography.titleMedium,
    fontWeight: '600',
    maxWidth: 180,
  },
  sidebarSubtitle: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
  },
  quickActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    margin: Spacing.lg,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: `${Colors.primary}30`,
    backgroundColor: '#fff',
  },
  quickActionIcon: {
    width: 32,
    height: 32,
    borderRadius: Radius.md,
    backgroundColor: `${Colors.primary}20`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickActionText: {
    ...Typography.labelSmall,
    fontWeight: '800',
    letterSpacing: 1,
    color: Colors.textPrimary,
  },
  sidebarNav: {
    flex: 1,
    paddingHorizontal: Spacing.md,
  },
  sidebarSection: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
    marginLeft: Spacing.md,
  },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.xs,
  },
  sidebarItemActive: {
    backgroundColor: Colors.primary,
  },
  sidebarItemPressed: {
    opacity: 0.8,
  },
  sidebarItemText: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  sidebarItemTextActive: {
    color: '#fff',
  },
  sidebarFooter: {
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...Typography.labelMedium,
    fontWeight: '600',
  },
  userEmail: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
  },

  // Main Content
  mainContent: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  menuBtn: {
    padding: Spacing.xs,
  },
  headerTitle: {
    ...Typography.headlineMedium,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },

  // Tab Content
  tabContent: {
    flex: 1,
    padding: Spacing.lg,
  },

  // Overview Tab
  welcomeSection: {
    marginBottom: Spacing.xl,
  },
  welcomeTitle: {
    ...Typography.displaySmall,
    marginBottom: Spacing.xs,
  },
  welcomeDate: {
    ...Typography.bodyLarge,
  },
  cardsGrid: {
    gap: Spacing.lg,
  },
  dashboardCard: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: Spacing.xl,
    minHeight: 180,
  },
  cardBadge: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  cardBadgeText: {
    ...Typography.labelSmall,
    color: Colors.textTertiary,
    fontWeight: '700',
  },
  cardIconContainer: {
    width: 56,
    height: 56,
    borderRadius: Radius.xl,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cardTitle: {
    ...Typography.headlineMedium,
    marginBottom: Spacing.sm,
  },
  cardDescription: {
    ...Typography.bodyMedium,
    color: Colors.textSecondary,
  },

  // Requests Tab
  requestsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  requestsTitle: {
    ...Typography.headlineMedium,
  },
  requestsSubtitle: {
    ...Typography.bodyMedium,
    marginTop: Spacing.xs,
  },
  newRequestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.lg,
  },
  newRequestBtnText: {
    color: '#fff',
    ...Typography.labelMedium,
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: 'rgba(150,150,150,0.3)',
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.labelSmall,
  },
  filterChipTextActive: {
    color: '#fff',
  },
  loader: {
    marginTop: Spacing['2xl'],
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: Spacing['3xl'],
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(0,0,0,0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    ...Typography.headlineMedium,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.bodyMedium,
  },
  ticketsList: {
    gap: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  ticketCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
  },
  ticketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    ...Typography.labelSmall,
    fontWeight: '700',
  },
  ticketNumber: {
    ...Typography.labelSmall,
  },
  ticketTitle: {
    ...Typography.titleMedium,
    marginBottom: Spacing.xs,
  },
  assigneeText: {
    ...Typography.bodySmall,
    marginBottom: Spacing.sm,
  },
  ticketFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ticketDate: {
    ...Typography.labelSmall,
  },
  ticketActions: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  actionBtn: {
    padding: Spacing.xs,
  },

  // Profile Tab
  profileCard: {
    borderRadius: Radius['2xl'],
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  profileAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  profileAvatarText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '800',
  },
  profileBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  profileBadgeText: {
    color: '#fff',
    ...Typography.labelSmall,
    fontWeight: '800',
    letterSpacing: 1,
  },
  profileFields: {
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  profileField: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  profileFieldLabel: {
    ...Typography.labelSmall,
    fontWeight: '800',
    letterSpacing: 1,
  },
  profileFieldValue: {
    ...Typography.bodyMedium,
    fontWeight: '600',
  },
  editProfileBtn: {
    backgroundColor: Colors.textPrimary,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    alignItems: 'center',
  },
  editProfileBtnText: {
    color: '#fff',
    ...Typography.labelMedium,
    fontWeight: '800',
    letterSpacing: 1,
  },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
    backgroundColor: 'rgba(239,68,68,0.1)',
  },
  signOutBtnText: {
    color: Colors.error,
    ...Typography.labelMedium,
    fontWeight: '700',
  },

  // Coming Soon
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  comingSoonIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  comingSoonTitle: {
    ...Typography.headlineLarge,
    marginBottom: Spacing.sm,
  },
  comingSoonSubtitle: {
    ...Typography.bodyLarge,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    ...Shadows.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.headlineMedium,
  },
  modalSubtitle: {
    ...Typography.bodyMedium,
    marginBottom: Spacing.lg,
  },
  modalCloseBtn: {
    padding: Spacing.xs,
  },
  modalBody: {
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.labelMedium,
    marginBottom: Spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: Radius.lg,
    padding: Spacing.md,
    ...Typography.bodyMedium,
  },
  textArea: {
    minHeight: 100,
    paddingTop: Spacing.md,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: Spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  cancelBtnText: {
    color: Colors.textSecondary,
    ...Typography.labelMedium,
    fontWeight: '600',
  },
  saveBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  saveBtnText: {
    color: '#fff',
    ...Typography.labelMedium,
    fontWeight: '700',
  },
  signOutBtnModal: {
    backgroundColor: Colors.error,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  signOutBtnTextModal: {
    color: '#fff',
    ...Typography.labelMedium,
    fontWeight: '700',
  },
});
