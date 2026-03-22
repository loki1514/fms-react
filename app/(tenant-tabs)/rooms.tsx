import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  RefreshControl, Modal, Alert, ScrollView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { Colors } from '@/theme/colors';
import { Spacing, Radius, Typography, Shadows } from '@/theme/theme';
import { useRooms, MeetingRoomRow } from '@/hooks/useRooms';

const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
];

function RoomCard({ room, onBook }: { room: MeetingRoomRow; onBook: () => void }) {
  const { colors, theme } = useTheme();
  const isDark = theme === 'dark';
  const amenities = Array.isArray(room.amenities) ? room.amenities : [];

  return (
    <TouchableOpacity
      style={[
        styles.roomCard,
        {
          backgroundColor: isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
        },
        isDark ? Shadows.md : Shadows.glass,
      ]}
      onPress={onBook}
      activeOpacity={0.8}
    >
      <View style={styles.roomHeader}>
        <View style={[styles.roomIcon, { backgroundColor: `${Colors.info}15` }]}>
          <Ionicons name="business-outline" size={24} color={Colors.info} />
        </View>
        <View style={styles.roomInfo}>
          <Text style={[styles.roomName, { color: colors.textPrimary }]}>{room.name}</Text>
          {room.location && (
            <Text style={[styles.roomLocation, { color: colors.textSecondary }]}>
              {room.location}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.roomDetails}>
        <View style={styles.detailChip}>
          <Ionicons name="people-outline" size={14} color={Colors.primary} />
          <Text style={[styles.detailText, { color: colors.textSecondary }]}>
            {room.capacity} people
          </Text>
        </View>
        {room.size && (
          <View style={styles.detailChip}>
            <Ionicons name="resize-outline" size={14} color={Colors.primary} />
            <Text style={[styles.detailText, { color: colors.textSecondary }]}>
              {room.size} sq ft
            </Text>
          </View>
        )}
      </View>

      {amenities.length > 0 && (
        <View style={styles.amenitiesRow}>
          {amenities.slice(0, 4).map((a: string, i: number) => (
            <View key={i} style={[styles.amenityChip, { backgroundColor: `${Colors.primary}10`, borderColor: `${Colors.primary}20` }]}>
              <Text style={[styles.amenityText, { color: Colors.primary }]}>{a}</Text>
            </View>
          ))}
        </View>
      )}

      <TouchableOpacity
        style={[styles.bookButton, { backgroundColor: Colors.primary }]}
        onPress={onBook}
        activeOpacity={0.85}
      >
        <Ionicons name="calendar-outline" size={16} color="#fff" />
        <Text style={styles.bookButtonText}>Book Now</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export default function RoomsScreen() {
  const { colors, theme } = useTheme();
  const { rooms, upcomingBookings, loading, fetchRooms, fetchBookings, createBooking, cancelBooking } = useRooms();
  const isDark = theme === 'dark';

  const [selectedRoom, setSelectedRoom] = useState<MeetingRoomRow | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedStart, setSelectedStart] = useState('');
  const [selectedEnd, setSelectedEnd] = useState('');
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [tab, setTab] = useState<'rooms' | 'mybookings'>('rooms');

  const openBookingModal = (room: MeetingRoomRow) => {
    setSelectedRoom(room);
    setSelectedStart('');
    setSelectedEnd('');
    setBookingModalVisible(true);
  };

  const handleBooking = async () => {
    if (!selectedRoom || !selectedStart || !selectedEnd) {
      Alert.alert('Required', 'Please select both start and end times.');
      return;
    }
    try {
      await createBooking({
        meeting_room_id: selectedRoom.id,
        booking_date: selectedDate,
        start_time: selectedStart,
        end_time: selectedEnd,
      });
      setBookingModalVisible(false);
      Alert.alert('Booked!', `${selectedRoom.name} booked for ${selectedStart} - ${selectedEnd}`);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    }
  };

  const handleCancel = (bookingId: string) => {
    Alert.alert('Cancel Booking', 'Are you sure?', [
      { text: 'No' },
      { text: 'Yes', style: 'destructive', onPress: () => cancelBooking(bookingId) },
    ]);
  };

  // Generate next 7 days for date picker
  const dates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i);
    return d.toISOString().split('T')[0];
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Meeting Rooms</Text>
      </View>

      {/* Tab Switcher */}
      <View style={styles.tabRow}>
        {(['rooms', 'mybookings'] as const).map(t => (
          <TouchableOpacity
            key={t}
            style={[
              styles.tabBtn,
              { borderBottomColor: tab === t ? Colors.primary : 'transparent' },
            ]}
            onPress={() => setTab(t)}
          >
            <Text style={[
              styles.tabText,
              { color: tab === t ? Colors.primary : colors.textSecondary },
            ]}>
              {t === 'rooms' ? 'Browse Rooms' : `My Bookings (${upcomingBookings.length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'rooms' ? (
        <FlatList
          data={rooms}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <RoomCard room={item} onBook={() => openBookingModal(item)} />
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchRooms} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={colors.textTertiary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {loading ? 'Loading rooms...' : 'No meeting rooms available'}
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={upcomingBookings}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <View style={[
              styles.bookingCard,
              {
                backgroundColor: isDark ? 'rgba(20, 26, 34, 0.55)' : 'rgba(255, 255, 255, 0.85)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
              },
            ]}>
              <View style={styles.bookingInfo}>
                <Text style={[styles.bookingRoom, { color: colors.textPrimary }]}>
                  {(item.meeting_rooms as any)?.name || 'Room'}
                </Text>
                <Text style={[styles.bookingDate, { color: colors.textSecondary }]}>
                  {item.booking_date} • {item.start_time} - {item.end_time}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => handleCancel(item.id)}
              >
                <Ionicons name="close-circle-outline" size={24} color={Colors.error} />
              </TouchableOpacity>
            </View>
          )}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchBookings} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No upcoming bookings
              </Text>
            </View>
          }
        />
      )}

      {/* Booking Modal */}
      <Modal visible={bookingModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[
            styles.modalContent,
            { backgroundColor: isDark ? '#121A1D' : '#FFFFFF' },
          ]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>
                Book {selectedRoom?.name}
              </Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                <Ionicons name="close" size={24} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {/* Date Strip */}
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Select Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateStrip}>
              {dates.map(date => {
                const d = new Date(date);
                const isSelected = date === selectedDate;
                return (
                  <TouchableOpacity
                    key={date}
                    style={[
                      styles.dateChip,
                      {
                        backgroundColor: isSelected ? Colors.primary : 'transparent',
                        borderColor: isSelected ? Colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => setSelectedDate(date)}
                  >
                    <Text style={[styles.dateDayName, { color: isSelected ? '#fff' : colors.textSecondary }]}>
                      {d.toLocaleDateString('en', { weekday: 'short' })}
                    </Text>
                    <Text style={[styles.dateDayNum, { color: isSelected ? '#fff' : colors.textPrimary }]}>
                      {d.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Time Slots */}
            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>Start Time</Text>
            <View style={styles.slotGrid}>
              {TIME_SLOTS.map(slot => (
                <TouchableOpacity
                  key={`start-${slot}`}
                  style={[
                    styles.slotChip,
                    {
                      backgroundColor: selectedStart === slot ? Colors.primary : 'transparent',
                      borderColor: selectedStart === slot ? Colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setSelectedStart(slot);
                    // Auto-select next slot as end
                    const idx = TIME_SLOTS.indexOf(slot);
                    if (idx < TIME_SLOTS.length - 1) setSelectedEnd(TIME_SLOTS[idx + 1]);
                  }}
                >
                  <Text style={{ color: selectedStart === slot ? '#fff' : colors.textPrimary, fontSize: 12 }}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.modalLabel, { color: colors.textSecondary }]}>End Time</Text>
            <View style={styles.slotGrid}>
              {TIME_SLOTS.filter(s => s > selectedStart).map(slot => (
                <TouchableOpacity
                  key={`end-${slot}`}
                  style={[
                    styles.slotChip,
                    {
                      backgroundColor: selectedEnd === slot ? Colors.success : 'transparent',
                      borderColor: selectedEnd === slot ? Colors.success : colors.border,
                    },
                  ]}
                  onPress={() => setSelectedEnd(slot)}
                >
                  <Text style={{ color: selectedEnd === slot ? '#fff' : colors.textPrimary, fontSize: 12 }}>
                    {slot}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[styles.confirmBtn, { backgroundColor: Colors.primary }]}
              onPress={handleBooking}
              activeOpacity={0.85}
            >
              <Text style={styles.confirmBtnText}>Confirm Booking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  title: { ...Typography.displayMedium },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  tabBtn: {
    flex: 1,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 2,
  },
  tabText: { ...Typography.labelLarge },
  list: { padding: Spacing.lg },
  roomCard: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  roomHeader: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.sm },
  roomIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roomInfo: { flex: 1 },
  roomName: { ...Typography.titleLarge },
  roomLocation: { ...Typography.bodySmall },
  roomDetails: { flexDirection: 'row', gap: Spacing.md, marginBottom: Spacing.sm },
  detailChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  detailText: { ...Typography.labelSmall },
  amenitiesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: Spacing.sm },
  amenityChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  amenityText: { ...Typography.labelSmall },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  bookButtonText: { color: '#fff', ...Typography.labelLarge, fontWeight: '600' },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  bookingInfo: { flex: 1 },
  bookingRoom: { ...Typography.titleMedium },
  bookingDate: { ...Typography.bodySmall, marginTop: 2 },
  cancelBtn: { padding: 4 },
  emptyState: {
    paddingTop: 80,
    alignItems: 'center',
    gap: Spacing.md,
  },
  emptyText: { ...Typography.bodyMedium },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    padding: Spacing.lg,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  modalTitle: { ...Typography.headlineMedium },
  modalLabel: { ...Typography.labelMedium, marginBottom: 6, marginTop: Spacing.sm },
  dateStrip: { marginBottom: Spacing.sm },
  dateChip: {
    width: 52,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginRight: 8,
  },
  dateDayName: { ...Typography.labelSmall },
  dateDayNum: { ...Typography.titleMedium },
  slotGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  slotChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  confirmBtn: {
    paddingVertical: 16,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  confirmBtnText: { color: '#fff', ...Typography.titleMedium, fontWeight: '600' },
});
