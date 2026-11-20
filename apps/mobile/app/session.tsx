import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { HikingSessionStatus } from '@trinetra/shared';
import { useSafetyStore } from '../src/store/safetyStore';

export default function SessionScreen() {
  const router = useRouter();
  const {
    activeSession,
    startSession,
    pauseSession,
    resumeSession,
    stopSession,
    sessionElapsedSeconds,
    incrementElapsed,
    isFallDetectionActive,
    simulateFallEvent
  } = useSafetyStore();

  const [trailName, setTrailName] = useState('Rohtang Pass Ridge');

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (activeSession && activeSession.status === HikingSessionStatus.ACTIVE) {
      interval = setInterval(() => {
        incrementElapsed();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeSession, incrementElapsed]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = async () => {
    await startSession(trailName);
  };

  const handleStop = async () => {
    await stopSession();
    router.replace('/(tabs)/home');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.badgeRow}>
          <Text style={styles.title}>Hiking Safety Session</Text>
          <View style={[styles.statusBadge, activeSession && styles.statusBadgeActive]}>
            <Text style={styles.statusBadgeText}>
              {activeSession ? activeSession.status.toUpperCase() : 'IDLE'}
            </Text>
          </View>
        </View>

        {activeSession ? (
          <View style={styles.activeArea}>
            <Text style={styles.activeTrail}>
              {(activeSession.start_location as { trail?: string })?.trail || 'Active Hiking Trail'}
            </Text>
            <Text style={styles.timerLarge}>{formatTimer(sessionElapsedSeconds)}</Text>
            <Text style={styles.sessionMeta}>
              Session ID: {activeSession.id.slice(0, 8)}... (Offline SQLite)
            </Text>

            <View style={styles.sensorStatusRow}>
              <View style={[styles.sensorDot, isFallDetectionActive ? styles.sensorDotActive : styles.sensorDotInactive]} />
              <Text style={styles.sensorStatusText}>
                {isFallDetectionActive
                  ? 'Sensor Fall Detection: ACTIVE (sampling accelerometer & gyro)'
                  : 'Sensor Fall Detection: INACTIVE'}
              </Text>
            </View>

            <View style={styles.controlRow}>
              {activeSession.status === HikingSessionStatus.ACTIVE ? (
                <TouchableOpacity style={styles.pauseButton} onPress={pauseSession}>
                  <Text style={styles.controlButtonText}>⏸ Pause Session</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.resumeButton} onPress={resumeSession}>
                  <Text style={styles.controlButtonText}>▶ Resume Session</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.stopButton} onPress={handleStop}>
                <Text style={styles.controlButtonText}>⏹ End Session</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.simulateFallButton}
              onPress={simulateFallEvent}
            >
              <Text style={styles.simulateFallText}>⚡ Simulate Fall Detection Event [DEMO]</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosQuickLink}
              onPress={() => router.push('/sos')}
            >
              <Text style={styles.sosQuickText}>🚨 Trigger SOS on this Session</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inactiveArea}>
            <Text style={styles.info}>
              When active, TRINETRA monitors accelerometer motion, records GPS traces locally in SQLite, and watches for potential fall impacts.
            </Text>

            <Text style={styles.inputLabel}>TRAIL / ROUTE NAME</Text>
            <TextInput
              style={styles.input}
              value={trailName}
              onChangeText={setTrailName}
              placeholder="e.g. Rohtang Pass Ridge"
              placeholderTextColor="#64748B"
            />

            <TouchableOpacity style={styles.startButton} onPress={handleStart}>
              <Text style={styles.startButtonText}>Start Monitoring Session</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Offline Persistence Guarantee</Text>
        <Text style={styles.tipsText}>
          • Sessions are written immediately to your phone's SQLite storage.
        </Text>
        <Text style={styles.tipsText}>
          • No internet connectivity is required to start, record, or conclude a session.
        </Text>
        <Text style={styles.tipsText}>
          • Changes automatically synchronize when connection is restored.
        </Text>
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
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 20
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  statusBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155'
  },
  statusBadgeActive: {
    backgroundColor: '#14532D',
    borderColor: '#22C55E'
  },
  statusBadgeText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700'
  },
  activeArea: {
    alignItems: 'center',
    paddingVertical: 12
  },
  activeTrail: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 8
  },
  timerLarge: {
    fontSize: 48,
    fontWeight: '900',
    color: '#F97316',
    fontFamily: 'monospace',
    marginBottom: 6
  },
  sessionMeta: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 14,
    fontFamily: 'monospace'
  },
  sensorStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#020617',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16,
    width: '100%'
  },
  sensorDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  sensorDotActive: {
    backgroundColor: '#22C55E'
  },
  sensorDotInactive: {
    backgroundColor: '#64748B'
  },
  sensorStatusText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600'
  },
  simulateFallButton: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#3B1D11',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F97316',
    alignItems: 'center',
    marginBottom: 12
  },
  simulateFallText: {
    color: '#FED7AA',
    fontSize: 12,
    fontWeight: '700'
  },
  controlRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginBottom: 16
  },
  pauseButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  resumeButton: {
    flex: 1,
    backgroundColor: '#15803D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  stopButton: {
    flex: 1,
    backgroundColor: '#991B1B',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13
  },
  sosQuickLink: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#450A0A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EF4444'
  },
  sosQuickText: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700'
  },
  inactiveArea: {
    marginTop: 4
  },
  info: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 16
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 6,
    letterSpacing: 0.5
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 20
  },
  startButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  startButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  tipsCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  tipsTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 8
  },
  tipsText: {
    fontSize: 12,
    color: '#CBD5E1',
    lineHeight: 18,
    marginBottom: 4
  }
});
