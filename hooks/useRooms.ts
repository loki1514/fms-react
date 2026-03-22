import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface MeetingRoomRow {
  id: string;
  property_id: string;
  name: string;
  photo_url: string | null;
  location: string | null;
  capacity: number;
  size: number | null;
  amenities: string[];
  status: string;
}

export interface BookingRow {
  id: string;
  meeting_room_id: string;
  property_id: string;
  user_id: string;
  booking_date: string;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
  meeting_rooms?: MeetingRoomRow;
}

export function useRooms() {
  const { user, membership } = useAuth();
  const [rooms, setRooms] = useState<MeetingRoomRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const propertyId = membership?.properties?.[0]?.id;

  const fetchRooms = useCallback(async () => {
    if (!propertyId) return;
    setLoading(true);
    try {
      const { data, error: err } = await supabase
        .from('meeting_rooms')
        .select('*')
        .eq('property_id', propertyId)
        .eq('status', 'active')
        .is('deleted_at', null);

      if (err) throw err;
      setRooms(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  const fetchBookings = useCallback(async () => {
    if (!user?.id || !propertyId) return;
    try {
      const { data, error: err } = await supabase
        .from('meeting_room_bookings')
        .select('*, meeting_rooms(*)')
        .eq('user_id', user.id)
        .eq('property_id', propertyId)
        .neq('status', 'cancelled')
        .order('booking_date', { ascending: true })
        .order('start_time', { ascending: true });

      if (err) throw err;
      setBookings(data || []);
    } catch (err: any) {
      setError(err.message);
    }
  }, [user?.id, propertyId]);

  useEffect(() => {
    fetchRooms();
    fetchBookings();
  }, [fetchRooms, fetchBookings]);

  const createBooking = async (data: {
    meeting_room_id: string;
    booking_date: string;
    start_time: string;
    end_time: string;
  }) => {
    if (!user?.id || !propertyId) throw new Error('Not authenticated');

    // Check for conflicts
    const { data: conflicts } = await supabase
      .from('meeting_room_bookings')
      .select('id')
      .eq('meeting_room_id', data.meeting_room_id)
      .eq('booking_date', data.booking_date)
      .neq('status', 'cancelled')
      .lt('start_time', data.end_time)
      .gt('end_time', data.start_time);

    if (conflicts && conflicts.length > 0) {
      throw new Error('This time slot is already booked');
    }

    const { data: booking, error: err } = await supabase
      .from('meeting_room_bookings')
      .insert({
        meeting_room_id: data.meeting_room_id,
        property_id: propertyId,
        user_id: user.id,
        booking_date: data.booking_date,
        start_time: data.start_time,
        end_time: data.end_time,
        status: 'confirmed',
      })
      .select()
      .single();

    if (err) throw err;
    await fetchBookings();
    return booking;
  };

  const cancelBooking = async (bookingId: string) => {
    const { error: err } = await supabase
      .from('meeting_room_bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (err) throw err;
    await fetchBookings();
  };

  const upcomingBookings = bookings.filter(b => {
    const bookingDate = new Date(`${b.booking_date}T${b.end_time}`);
    return bookingDate >= new Date() && b.status === 'confirmed';
  });

  const pastBookings = bookings.filter(b => {
    const bookingDate = new Date(`${b.booking_date}T${b.end_time}`);
    return bookingDate < new Date() || b.status === 'completed';
  });

  return {
    rooms, bookings, upcomingBookings, pastBookings,
    loading, error, fetchRooms, fetchBookings,
    createBooking, cancelBooking,
  };
}
