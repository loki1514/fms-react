import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

const isSSR = Platform.OS === 'web' && typeof window === 'undefined';

const mockStorage = {
  getItem: (key: string) => Promise.resolve(null),
  setItem: (key: string, value: string) => Promise.resolve(),
  removeItem: (key: string) => Promise.resolve(),
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: isSSR ? mockStorage as any : AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
