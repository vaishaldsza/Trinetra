import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafetyStore } from '../src/store/safetyStore';

export default function SOSScreen() {
  const router = useRouter();
  const { activeIncident, triggerSOS, cancelSOS, lastKnownLocation } = useSafetyStore();
  const [countdown, setCountdown] = useState<number | null>(null);

  // Hold-to-confirm (~2s hold) state
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const holdIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartTimeRef = useRef<number | null>(null);

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
          `Incident #${incident.id.slice(0, 8)} saved in local SQLite. Last-known GPS coords attached: ${incident.latitude?.toFixed(4)}, ${incident.longitude?.toFixed(4)}. Dispatches ready offline.`,
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

  const handlePressIn = () => {
    if (countdown !== null || activeIncident) return;
    holdStartTimeRef.current = Date.now();
    setHoldProgress(0);

    holdIntervalRef.current = setInterval(() => {
      if (!holdStartTimeRef.current) return;
      const elapsed = Date.now() - holdStartTimeRef.current;
      const progress = Math.min(100, Math.round((elapsed / 2000) * 100));
      setHoldProgress(progress);

      if (elapsed >= 2000) {
        // Hold satisfied: clear interval and initiate 5-second countdown
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        holdStartTimeRef.current = null;
        setHoldProgress(0);
        setCountdown(5);
      }
    }, 50);
  };

  const handlePressOut = () => {
    if (holdIntervalRef.current) {
      clearInterval(holdIntervalRef.current);
      holdIntervalRef.current = null;
    }
    holdStartTimeRef.current = null;
    setHoldProgress(0);
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
        Escalation occurs immediately offline and attaches last-known GPS coordinates without waiting on cloud or AI.
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
          <Text style={styles.gpsCoords}>
            GPS: {activeIncident.latitude?.toFixed(4)}° N, {activeIncident.longitude?.toFixed(4)}° E
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
        /* Hold-to-Confirm (~2s Hold) Button */
        <View style={styles.buttonWrapper}>
          <TouchableOpacity
            style={[styles.sosButton, holdProgress > 0 && styles.sosButtonHolding]}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            activeOpacity={0.85}
          >
            <Text style={styles.sosText}>HOLD FOR SOS</Text>
            <Text style={styles.sosSubtext}>
              {holdProgress > 0 ? `Holding... ${holdProgress}%` : 'Hold 2s to Activate'}
            </Text>
          </TouchableOpacity>

          {/* Hold Progress Bar */}
          {holdProgress > 0 && (
            <View style={styles.progressBarBackground}>
              <View style={[styles.progressBarFill, { width: `${holdProgress}%` }]} />
            </View>
          )}
        </View>
      )}

      {lastKnownLocation && (
        <View style={styles.locationTag}>
          <Text style={styles.locationTagText}>
            📍 Last-Known GPS: {lastKnownLocation.latitude.toFixed(4)}° N, {lastKnownLocation.longitude.toFixed(4)}° E
          </Text>
        </View>
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
    marginBottom: 32,
    lineHeight: 18,
    maxWidth: 340
  },
  buttonWrapper: {
    alignItems: 'center',
    width: '100%'
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
  sosButtonHolding: {
    backgroundColor: '#B91C1C',
    borderColor: '#F87171'
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1
  },
  sosSubtext: {
    color: '#FECACA',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600'
  },
  progressBarBackground: {
    width: 220,
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    overflow: 'hidden',
    marginTop: 14
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 4
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
    marginBottom: 4
  },
  incidentDetails: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 2
  },
  gpsCoords: {
    color: '#F59E0B',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 16
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
  locationTag: {
    marginTop: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155'
  },
  locationTagText: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: 'monospace'
  },
  noticeBox: {
    marginTop: 20,
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
