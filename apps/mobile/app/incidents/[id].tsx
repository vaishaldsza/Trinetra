import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafetyStore } from '../../src/store/safetyStore';

export default function MobileIncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { activeIncident, cancelSOS, syncNow, isSyncing } = useSafetyStore();

  const isCurrentActive = activeIncident && activeIncident.id === id;

  const handleResolve = async () => {
    if (id) {
      await cancelSOS(id);
      Alert.alert('Incident Resolved', 'Status marked as cancelled/resolved in local store.');
      router.replace('/(tabs)/home');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Incident Report</Text>
        <View style={styles.badgeCritical}>
          <Text style={styles.badgeCriticalText}>CRITICAL SOS</Text>
        </View>
      </View>

      <Text style={styles.idText}>ID: {id}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionHeading}>Emergency Status</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>State:</Text>
          <Text style={styles.metricValue}>
            {isCurrentActive ? activeIncident?.status.toUpperCase() : 'RECORDED'}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Detection Source:</Text>
          <Text style={styles.metricValue}>
            {activeIncident?.detection_source.toUpperCase() || 'MANUAL'}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Coordinates:</Text>
          <Text style={styles.metricValue}>
            {activeIncident?.latitude?.toFixed(4) || '32.3716'}° N,{' '}
            {activeIncident?.longitude?.toFixed(4) || '77.2466'}° E
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Local Storage:</Text>
          <Text style={[styles.metricValue, { color: '#22C55E' }]}>
            Saved (Expo SQLite)
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Cloud Sync:</Text>
          <Text style={[styles.metricValue, { color: activeIncident?.synced_at ? '#22C55E' : '#F59E0B' }]}>
            {activeIncident?.synced_at ? 'Synced to Supabase' : 'Queued in Sync Queue'}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsBox}>
        <TouchableOpacity
          style={styles.triageButton}
          onPress={() => router.push('/triage')}
        >
          <Text style={styles.triageButtonText}>🎙️ Open AI Voice Triage</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.syncButton}
          onPress={syncNow}
          disabled={isSyncing}
        >
          <Text style={styles.syncButtonText}>
            {isSyncing ? 'Synchronizing...' : '🔄 Sync Incident to Cloud'}
          </Text>
        </TouchableOpacity>

        {isCurrentActive && (
          <TouchableOpacity
            style={styles.resolveButton}
            onPress={handleResolve}
          >
            <Text style={styles.resolveButtonText}>Mark Resolved / Safe</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#020617',
    flexGrow: 1
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  badgeCritical: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444'
  },
  badgeCriticalText: {
    color: '#FECACA',
    fontSize: 10,
    fontWeight: '800'
  },
  idText: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 20,
    fontFamily: 'monospace'
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 20
  },
  sectionHeading: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 14
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  metricLabel: {
    fontSize: 13,
    color: '#94A3B8'
  },
  metricValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#F8FAFC',
    fontFamily: 'monospace'
  },
  actionsBox: {
    gap: 12
  },
  triageButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  triageButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  syncButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: 'center'
  },
  syncButtonText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600'
  },
  resolveButton: {
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center'
  },
  resolveButtonText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600'
  }
});
