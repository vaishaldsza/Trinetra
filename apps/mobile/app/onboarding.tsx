import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';

export default function OnboardingScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Outdoor Safety Preparedness</Text>
      <Text style={styles.description}>
        TRINETRA keeps you connected and monitored when hiking off-grid. Essential protection works completely offline.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🛡️ Offline-First Fall Detection</Text>
        <Text style={styles.cardBody}>
          Monitors accelerometer & gyroscope sensors to identify sudden impact patterns without requiring internet connectivity.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎙️ Voice Triage Assessment</Text>
        <Text style={styles.cardBody}>
          Structured emergency questioning evaluates consciousness, bleeding, and pain to summarize critical warning signs.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>❤️ Camera PPG Heart Rate</Text>
        <Text style={styles.cardBody}>
          Experimental non-diagnostic pulse estimation directly using your camera flash and sensor.
        </Text>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => router.replace('/login')}
      >
        <Text style={styles.buttonText}>Continue to Sign In</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#0F172A',
    flexGrow: 1,
    justifyContent: 'center'
  },
  header: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8
  },
  description: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 24,
    lineHeight: 20
  },
  card: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 16
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F97316',
    marginBottom: 6
  },
  cardBody: {
    fontSize: 13,
    color: '#CBD5E1',
    lineHeight: 18
  },
  continueButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  }
});
