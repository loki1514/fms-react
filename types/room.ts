/**
 * Meeting room / booking types
 */

export interface MeetingRoom {
  id: string;
  name: string;
  property_id: string;
  capacity: number;
  amenities: string[];
  photo_url?: string;
  floor?: string;
  is_active: boolean;
}

export interface TimeSlot {
  start_time: string; // HH:mm
  end_time: string;   // HH:mm
  is_available: boolean;
}

export interface Booking {
  id: string;
  room_id: string;
  user_id: string;
  date: string;        // YYYY-MM-DD
  start_time: string;  // HH:mm
  end_time: string;    // HH:mm
  title?: string;
  status: 'confirmed' | 'cancelled';
  created_at: string;
  room?: MeetingRoom;
}
