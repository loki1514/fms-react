/**
 * Ticket / Service Request types
 */

export type TicketStatus = 'open' | 'in_progress' | 'on_hold' | 'completed' | 'cancelled';
export type TicketPriority = 'low' | 'medium' | 'high' | 'critical';

export interface Ticket {
  id: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: string;
  subcategory?: string;
  property_id: string;
  tenant_id: string;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
  sla_deadline?: string;
  photo_urls?: string[];
  resolution_notes?: string;
  resolution_photo_urls?: string[];
  rating?: number;
  rating_comment?: string;
}
