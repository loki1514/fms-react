import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';

export interface TicketRow {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  category: string;
  property_id: string;
  organization_id: string;
  raised_by: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  raised_by_name: string | null;
  ticket_number: string | null;
  photo_before_url: string | null;
  photo_after_url: string | null;
  resolution_notes: string | null;
  rating: number | null;
  sla_deadline: string | null;
  sla_breached: boolean;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  accepted_at: string | null;
  work_started_at: string | null;
  floor_number: number | null;
  location: string | null;
}

export function useTickets() {
  const { user, membership } = useAuth();
  const [tickets, setTickets] = useState<TicketRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const propertyId = membership?.properties?.[0]?.id;

  const fetchTickets = useCallback(async () => {
    if (!user?.id || !propertyId) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('tickets')
        .select('*')
        .eq('raised_by', user.id)
        .eq('property_id', propertyId)
        .order('created_at', { ascending: false });

      if (err) throw err;
      setTickets(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, propertyId]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const activeTickets = tickets.filter(t =>
    ['open', 'in_progress', 'assigned'].includes(t.status)
  );
  const completedTickets = tickets.filter(t =>
    ['completed', 'resolved'].includes(t.status)
  );

  const submitTicket = async (data: {
    title: string;
    description: string;
    category: string;
    priority: string;
    photo_before_url?: string;
    floor_number?: number;
    location?: string;
  }) => {
    if (!user?.id || !propertyId || !membership?.org_id) {
      throw new Error('Not authenticated');
    }

    const { data: ticket, error: err } = await supabase
      .from('tickets')
      .insert({
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        photo_before_url: data.photo_before_url || null,
        floor_number: data.floor_number || null,
        location: data.location || null,
        raised_by: user.id,
        raised_by_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Tenant',
        property_id: propertyId,
        organization_id: membership.org_id,
        status: 'open',
      })
      .select()
      .single();

    if (err) throw err;
    await fetchTickets();
    return ticket;
  };

  const rateTicket = async (ticketId: string, rating: number) => {
    const { error: err } = await supabase
      .from('tickets')
      .update({ rating })
      .eq('id', ticketId);

    if (err) throw err;
    await fetchTickets();
  };

  return {
    tickets, activeTickets, completedTickets,
    loading, error, fetchTickets, submitTicket, rateTicket,
  };
}
