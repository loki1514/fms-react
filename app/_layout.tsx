import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/hooks/useAuth';
import { ThemeProvider } from '@/context/ThemeContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StatusBar style="auto" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="landing" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tenant-tabs)" />
          <Stack.Screen name="request" />
          <Stack.Screen name="room" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
