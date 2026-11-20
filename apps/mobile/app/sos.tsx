import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafetyStore } from '../src/store/safetyStore';

export default function SOSScreen() {
  const router = useRouter();
  const { activeIncident, triggerSOS, cancelSOS } = useSafetyStore();
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    if (countdown !== null && countdown > 0) {
      timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
    } else if (countdown === 0) {
      // Countdown expired: trigger emergency SOS immediately
      setCountdown(null);
      triggerSOS().then((incident) => {
        Alert.alert(
          'EMERGENCY INITIATED',
          `Incident #${incident.id.slice(0, 8)} saved to local SQLite. Dispatches and triage ready offline.`,
          [
            { text: 'Proceed to Triage', onPress: () => router.push('/triage') },
            { text: 'View Incident', onPress: () => router.push(`/incidents/${incident.id}`) }
          ]
        );
      });
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, triggerSOS, router]);

  const handleStartCountdown = () => {
    setCountdown(5);
  };

  const handleAbortCountdown = () => {
    setCountdown(null);
  };

  const handleCancelActiveIncident = async () => {
    if (activeIncident) {
      await cancelSOS(activeIncident.id);
      Alert.alert('Alert Cancelled', 'The emergency status has been marked cancelled.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>EMERGENCY SOS</Text>
      <Text style={styles.description}>
        Generates an idempotent client-generated incident in local SQLite.
        Escalation occurs immediately offline and never waits on cloud, network, or AI agents.
      </Text>

      {/* Countdown Active State */}
      {countdown !== null ? (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownLabel}>EMERGENCY ALERT TRIGGERING IN</Text>
          <Text style={styles.countdownNumber}>{countdown}</Text>
          <TouchableOpacity style={styles.abortButton} onPress={handleAbortCountdown}>
            <Text style={styles.abortButtonText}>✕ Cancel Alert</Text>
          </TouchableOpacity>
        </View>
      ) : activeIncident ? (
        /* Active Emergency Incident State */
        <View style={styles.activeIncidentBox}>
          <Text style={styles.activeEmoji}>🚨</Text>
          <Text style={styles.activeHeading}>EMERGENCY ACTIVE</Text>
          <Text style={styles.incidentId}>ID: {activeIncident.id}</Text>
          <Text style={styles.incidentDetails}>
            Priority: {activeIncident.priority.toUpperCase()} · Status: {activeIncident.status.toUpperCase()}
          </Text>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.triageButton}
              onPress={() => router.push('/triage')}
            >
              <Text style={styles.triageButtonText}>🎙️ Open Triage</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => router.push(`/incidents/${activeIncident.id}`)}
            >
              <Text style={styles.detailsButtonText}>Report</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cancelIncidentButton}
            onPress={handleCancelActiveIncident}
          >
            <Text style={styles.cancelIncidentText}>Cancel / Resolve Emergency</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Initial SOS Trigger Button */
        <TouchableOpacity
          style={styles.sosButton}
          onPress={handleStartCountdown}
          activeOpacity={0.8}
        >
          <Text style={styles.sosText}>ACTIVATE SOS</Text>
          <Text style={styles.sosSubtext}>5s Safety Countdown</Text>
        </TouchableOpacity>
      )}

      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>
          DEMO MODE: Automated external SMS and voice calls remain OFF by default to avoid dispatching real rescue teams during demonstrations.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#EF4444',
    marginBottom: 8,
    letterSpacing: 1
  },
  description: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 36,
    lineHeight: 18,
    maxWidth: 340
  },
  sosButton: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#DC2626',
    borderWidth: 8,
    borderColor: '#7F1D1D',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 1
  },
  sosSubtext: {
    color: '#FECACA',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600'
  },
  countdownContainer: {
    alignItems: 'center',
    backgroundColor: '#450A0A',
    borderWidth: 2,
    borderColor: '#EF4444',
    borderRadius: 20,
    padding: 32,
    width: '100%',
    maxWidth: 320
  },
  countdownLabel: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12
  },
  countdownNumber: {
    fontSize: 72,
    fontWeight: '900',
    color: '#FFFFFF',
    fontFamily: 'monospace',
    marginBottom: 20
  },
  abortButton: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F87171'
  },
  abortButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  activeIncidentBox: {
    alignItems: 'center',
    backgroundColor: '#1E1B4B',
    borderWidth: 1.5,
    borderColor: '#6366F1',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 340
  },
  activeEmoji: {
    fontSize: 36,
    marginBottom: 6
  },
  activeHeading: {
    color: '#F87171',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1
  },
  incidentId: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 4,
    marginBottom: 6
  },
  incidentDetails: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 18
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
    marginBottom: 14
  },
  triageButton: {
    flex: 2,
    backgroundColor: '#EA580C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  triageButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  detailsButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  detailsButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  cancelIncidentButton: {
    paddingVertical: 8
  },
  cancelIncidentText: {
    color: '#94A3B8',
    fontSize: 12,
    textDecorationLine: 'underline'
  },
  noticeBox: {
    marginTop: 36,
    padding: 12,
    backgroundColor: '#0F172A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    maxWidth: 340
  },
  noticeText: {
    color: '#F59E0B',
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center'
  }
});
