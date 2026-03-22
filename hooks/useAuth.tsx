import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';
import { UserMembership } from '@/types';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  membership: UserMembership | null;
  isMembershipLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshMembership: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const membershipCache = new Map<string, { data: UserMembership; timestamp: number }>();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [membership, setMembership] = useState<UserMembership | null>(null);
  const [isMembershipLoading, setIsMembershipLoading] = useState(false);
  const fetchingRef = useRef(false);

  const fetchMembership = useCallback(async (userId: string) => {
    if (fetchingRef.current) return;

    const cached = membershipCache.get(userId);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      setMembership(cached.data);
      return;
    }

    fetchingRef.current = true;
    setIsMembershipLoading(true);

    try {
      const { data: orgData } = await supabase
        .from('organization_memberships')
        .select(`
          role,
          organization:organizations (
            id,
            name
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();

      const { data: propData } = await supabase
        .from('property_memberships')
        .select(`
          role,
          property:properties (
            id,
            name,
            code
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      const membershipData: UserMembership = {
        org_id: (orgData?.organization as any)?.id || null,
        org_name: (orgData?.organization as any)?.name || null,
        org_role: orgData?.role || null,
        properties: (propData || []).map((p: any) => ({
          id: p.property?.id,
          name: p.property?.name,
          code: p.property?.code,
          role: p.role,
        })).filter((p: any) => p.id),
      };

      membershipCache.set(userId, { data: membershipData, timestamp: Date.now() });
      setMembership(membershipData);
    } catch (err) {
      console.error('Membership fetch error:', err);
    } finally {
      fetchingRef.current = false;
      setIsMembershipLoading(false);
    }
  }, []);

  const refreshMembership = useCallback(async () => {
    if (user?.id) {
      membershipCache.delete(user.id);
      await fetchMembership(user.id);
    }
  }, [user?.id, fetchMembership]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchMembership(session.user.id);
      }
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session?.user) {
        fetchMembership(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        setMembership(null);
        if (user?.id) membershipCache.delete(user.id);
      }

      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [fetchMembership]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    if (user?.id) membershipCache.delete(user.id);
    await supabase.auth.signOut();
  }, [user?.id]);

  const value = useMemo(() => ({
    user, session, isLoading, membership, isMembershipLoading,
    signIn, signOut, refreshMembership,
  }), [user, session, isLoading, membership, isMembershipLoading, signIn, signOut, refreshMembership]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
