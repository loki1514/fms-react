/**
 * Core types — shared between MST and Tenant apps
 */

export type UserRole = 'org_admin' | 'property_admin' | 'mst' | 'tenant';

export interface UserMembership {
  org_id: string | null;
  org_name: string | null;
  org_role: string | null;
  properties: PropertyMembership[];
}

export interface PropertyMembership {
  id: string;
  name: string;
  code: string;
  role: UserRole;
}
