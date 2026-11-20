import { Stack } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { DEMO_BANNER_LABEL } from '@trinetra/shared';

export default function RootLayout() {
  const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Demo Mode Top Indicator: Only displayed when EXPO_PUBLIC_DEMO_MODE=true */}
      {isDemoMode && (
        <View style={styles.demoBanner}>
          <Text style={styles.demoBadge}>{DEMO_BANNER_LABEL}</Text>
          <Text style={styles.demoText}>TRINETRA SAFETY · OFFLINE SIMULATION</Text>
        </View>
      )}

      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#F8FAFC',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#020617' }
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ title: 'Welcome to TRINETRA', headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Authentication' }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="session" options={{ title: 'Hiking Safety Session' }} />
        <Stack.Screen name="sos" options={{ title: 'EMERGENCY SOS', headerStyle: { backgroundColor: '#B91C1C' } }} />
        <Stack.Screen name="triage" options={{ title: 'AI Voice Triage' }} />
        <Stack.Screen name="vitals" options={{ title: 'Vital Estimation' }} />
        <Stack.Screen name="incidents/[id]" options={{ title: 'Incident Report' }} />
        <Stack.Screen name="contacts" options={{ title: 'Emergency Contacts' }} />
        <Stack.Screen name="history" options={{ title: 'Session History' }} />
        <Stack.Screen name="settings" options={{ title: 'Safety Preferences' }} />
      </Stack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617'
  },
  demoBanner: {
    backgroundColor: '#F59E0B',
    paddingVertical: 4,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  demoBadge: {
    backgroundColor: '#0F172A',
    color: '#FBBF24',
    fontSize: 9,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3
  },
  demoText: {
    color: '#0F172A',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 0.5
  }
});
