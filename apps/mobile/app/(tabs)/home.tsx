import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { HEALTH_DISCLAIMER } from '@trinetra/shared';

export default function HomeScreen() {
  const router = useRouter();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Critical SOS Fast-Action Banner */}
      <TouchableOpacity
        style={styles.sosBanner}
        onPress={() => router.push('/sos')}
      >
        <Text style={styles.sosEmoji}>🚨</Text>
        <View style={styles.sosTextContainer}>
          <Text style={styles.sosTitle}>EMERGENCY SOS</Text>
          <Text style={styles.sosSubtitle}>Instant alert · Bypasses cloud & AI</Text>
        </View>
        <Text style={styles.sosArrow}>→</Text>
      </TouchableOpacity>

      {/* Safety Session Status Card */}
      <View style={styles.card}>
        <View style={styles.statusRow}>
          <View style={styles.pulseDot} />
          <Text style={styles.statusLabel}>Monitoring: Standby</Text>
        </View>
        <Text style={styles.cardHeading}>Hiking Safety Session</Text>
        <Text style={styles.cardDesc}>
          Start tracking movement sensors and enable fall detection algorithms.
        </Text>
        <TouchableOpacity
          style={styles.sessionButton}
          onPress={() => router.push('/session')}
        >
          <Text style={styles.sessionButtonText}>Start Safety Session</Text>
        </TouchableOpacity>
      </View>

      {/* Grid of Key Features */}
      <Text style={styles.sectionTitle}>Safety Intelligence</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => router.push('/triage')}
        >
          <Text style={styles.gridIcon}>🎙️</Text>
          <Text style={styles.gridTitle}>AI Voice Triage</Text>
          <Text style={styles.gridSub}>Offline assessment</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => router.push('/vitals')}
        >
          <Text style={styles.gridIcon}>❤️</Text>
          <Text style={styles.gridTitle}>Vital Signs (PPG)</Text>
          <Text style={styles.gridSub}>Pulse estimation</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => router.push('/contacts')}
        >
          <Text style={styles.gridIcon}>👥</Text>
          <Text style={styles.gridTitle}>Contacts</Text>
          <Text style={styles.gridSub}>Trusted responders</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => router.push('/history')}
        >
          <Text style={styles.gridIcon}>📜</Text>
          <Text style={styles.gridTitle}>History</Text>
          <Text style={styles.gridSub}>Previous hikes</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={styles.settingsRow}
        onPress={() => router.push('/settings')}
      >
        <Text style={styles.settingsText}>⚙️ Permissions & Settings</Text>
        <Text style={styles.arrowText}>→</Text>
      </TouchableOpacity>

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>{HEALTH_DISCLAIMER}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#020617',
    flexGrow: 1
  },
  sosBanner: {
    backgroundColor: '#B91C1C',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    elevation: 6
  },
  sosEmoji: {
    fontSize: 28,
    marginRight: 12
  },
  sosTextContainer: {
    flex: 1
  },
  sosTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1
  },
  sosSubtitle: {
    color: '#FECACA',
    fontSize: 12
  },
  sosArrow: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold'
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 20
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#94A3B8',
    marginRight: 6
  },
  statusLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  cardHeading: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4
  },
  cardDesc: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14
  },
  sessionButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  sessionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16
  },
  gridCard: {
    width: '48%',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  gridIcon: {
    fontSize: 22,
    marginBottom: 6
  },
  gridTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600'
  },
  gridSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 2
  },
  settingsRow: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16
  },
  settingsText: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600'
  },
  arrowText: {
    color: '#64748B',
    fontSize: 16
  },
  disclaimerBox: {
    padding: 10,
    backgroundColor: '#1E293B',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B'
  },
  disclaimerText: {
    color: '#CBD5E1',
    fontSize: 10,
    lineHeight: 14
  }
});
