import { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { HEALTH_DISCLAIMER, HikingSessionStatus } from '@trinetra/shared';
import { useSafetyStore } from '../../src/store/safetyStore';

export default function HomeScreen() {
  const router = useRouter();
  const {
    initStore,
    activeSession,
    activeIncident,
    syncCounts,
    isSyncing,
    lastSyncedAt,
    syncNow,
    sessionElapsedSeconds,
    incrementElapsed
  } = useSafetyStore();

  useEffect(() => {
    initStore();
  }, [initStore]);

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
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Active Emergency Alert Banner if an Incident is Active */}
      {activeIncident && (
        <TouchableOpacity
          style={styles.activeIncidentAlert}
          onPress={() => router.push(`/incidents/${activeIncident.id}`)}
        >
          <View style={styles.alertHeaderRow}>
            <Text style={styles.alertEmoji}>🚨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>EMERGENCY ACTIVE</Text>
              <Text style={styles.alertSubtitle}>
                Status: {activeIncident.status.toUpperCase()} · Priority: {activeIncident.priority.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.alertAction}>View Report →</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Critical SOS Action Button */}
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

      {/* Offline SQLite & Sync Status Bar */}
      <View style={styles.syncBar}>
        <View style={styles.syncStatusLeft}>
          <View
            style={[
              styles.syncDot,
              isSyncing
                ? styles.syncDotSyncing
                : syncCounts.failed > 0
                ? styles.syncDotFailed
                : syncCounts.pending > 0
                ? styles.syncDotPending
                : styles.syncDotSynced
            ]}
          />
          <View>
            <Text style={styles.syncText}>
              {isSyncing
                ? 'Syncing with Supabase...'
                : syncCounts.failed > 0
                ? `${syncCounts.failed} sync failed · ${syncCounts.pending} pending`
                : syncCounts.pending > 0
                ? `${syncCounts.pending} offline updates queued in SQLite`
                : 'All changes saved locally & synced'}
            </Text>
            {lastSyncedAt && (
              <Text style={styles.syncSubtext}>Last sync: {lastSyncedAt}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.syncButton}
          onPress={syncNow}
          disabled={isSyncing}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color="#F97316" />
          ) : (
            <Text style={styles.syncButtonText}>Sync Now</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Safety Session Status Card */}
      <View style={styles.card}>
        <View style={styles.statusRow}>
          <View style={[styles.pulseDot, activeSession && styles.pulseDotActive]} />
          <Text style={styles.statusLabel}>
            Monitoring: {activeSession ? activeSession.status.toUpperCase() : 'STANDBY'}
          </Text>
        </View>

        {activeSession ? (
          <View style={styles.sessionActiveBox}>
            <Text style={styles.cardHeading}>
              {(activeSession.start_location as { trail?: string })?.trail || 'Active Mountain Trail'}
            </Text>
            <Text style={styles.timerDisplay}>{formatTimer(sessionElapsedSeconds)}</Text>
            <Text style={styles.cardDesc}>
              Movement sensors recording. Local fall detection watch active.
            </Text>
            <TouchableOpacity
              style={styles.sessionButton}
              onPress={() => router.push('/session')}
            >
              <Text style={styles.sessionButtonText}>Manage Active Session</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
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
        )}
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
        style={[styles.settingsRow, { backgroundColor: '#0F172A', borderColor: '#EA580C', borderWidth: 1 }]}
        onPress={() => router.push('/(tabs)/demo')}
      >
        <Text style={[styles.settingsText, { color: '#F97316', fontWeight: 'bold' }]}>🧪 Scripted Demo Scenarios</Text>
        <Text style={[styles.arrowText, { color: '#F97316' }]}>→</Text>
      </TouchableOpacity>

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
  activeIncidentAlert: {
    backgroundColor: '#7F1D1D',
    borderWidth: 1.5,
    borderColor: '#EF4444',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12
  },
  alertHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10
  },
  alertEmoji: {
    fontSize: 24
  },
  alertTitle: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: 0.5
  },
  alertSubtitle: {
    color: '#FCA5A5',
    fontSize: 11
  },
  alertAction: {
    color: '#FCA5A5',
    fontSize: 12,
    fontWeight: '700'
  },
  sosBanner: {
    backgroundColor: '#B91C1C',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  syncBar: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16
  },
  syncStatusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4
  },
  syncDotSynced: {
    backgroundColor: '#22C55E'
  },
  syncDotPending: {
    backgroundColor: '#F59E0B'
  },
  syncDotSyncing: {
    backgroundColor: '#38BDF8'
  },
  syncDotFailed: {
    backgroundColor: '#EF4444'
  },
  syncText: {
    color: '#E2E8F0',
    fontSize: 12,
    fontWeight: '600'
  },
  syncSubtext: {
    color: '#64748B',
    fontSize: 10
  },
  syncButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155'
  },
  syncButtonText: {
    color: '#F97316',
    fontSize: 11,
    fontWeight: '700'
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
  pulseDotActive: {
    backgroundColor: '#22C55E'
  },
  statusLabel: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase'
  },
  sessionActiveBox: {
    marginTop: 4
  },
  timerDisplay: {
    fontSize: 32,
    fontWeight: '900',
    color: '#F97316',
    marginVertical: 4,
    fontFamily: 'monospace'
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
