import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { HikingSessionStatus } from '@trinetra/shared';
import { useTranslation } from 'react-i18next';
import { useSafetyStore } from '../../src/store/safetyStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { ColorTokens } from '../../src/theme/tokens';

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
          accessibilityRole="button"
          accessibilityLabel={t('home.emergencyActive')}
        >
          <View style={styles.alertHeaderRow}>
            <Text style={styles.alertEmoji}>🚨</Text>
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{t('home.emergencyActive')}</Text>
              <Text style={styles.alertSubtitle}>
                {t('home.status')}: {activeIncident.status.toUpperCase()} · {t('home.priority')}: {activeIncident.priority.toUpperCase()}
              </Text>
            </View>
            <Text style={styles.alertAction}>{t('home.viewReport')}</Text>
          </View>
        </TouchableOpacity>
      )}

      {/* Critical SOS Action Button */}
      <TouchableOpacity
        style={styles.sosBanner}
        onPress={() => router.push('/sos')}
        accessibilityRole="button"
        accessibilityLabel={t('home.emergencySos')}
      >
        <Text style={styles.sosEmoji}>🚨</Text>
        <View style={styles.sosTextContainer}>
          <Text style={styles.sosTitle}>{t('home.emergencySos')}</Text>
          <Text style={styles.sosSubtitle}>{t('home.sosSubtitle')}</Text>
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
                ? t('sync.syncing')
                : syncCounts.failed > 0
                ? t('sync.syncFailed', { failed: syncCounts.failed, pending: syncCounts.pending })
                : syncCounts.pending > 0
                ? t('sync.offlineQueued', { count: syncCounts.pending })
                : t('sync.allSynced')}
            </Text>
            {lastSyncedAt && (
              <Text style={styles.syncSubtext}>{t('sync.lastSync', { time: lastSyncedAt })}</Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.syncButton}
          onPress={syncNow}
          disabled={isSyncing}
          accessibilityRole="button"
          accessibilityLabel={t('sync.syncNow')}
        >
          {isSyncing ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.syncButtonText}>{t('sync.syncNow')}</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Safety Session Status Card */}
      <View style={styles.card}>
        <View style={styles.statusRow}>
          <View style={[styles.pulseDot, activeSession && styles.pulseDotActive]} />
          <Text style={styles.statusLabel}>
            {t('home.monitoring')}: {activeSession ? activeSession.status.toUpperCase() : t('home.standby')}
          </Text>
        </View>

        {activeSession ? (
          <View style={styles.sessionActiveBox}>
            <Text style={styles.cardHeading}>
              {(activeSession.start_location as { trail?: string })?.trail || t('home.activeMountainTrail')}
            </Text>
            <Text style={styles.timerDisplay}>{formatTimer(sessionElapsedSeconds)}</Text>
            <Text style={styles.cardDesc}>
              {t('home.movementRecording')}
            </Text>
            <TouchableOpacity
              style={styles.sessionButton}
              onPress={() => router.push('/session')}
              accessibilityRole="button"
            >
              <Text style={styles.sessionButtonText}>{t('home.manageActiveSession')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            <Text style={styles.cardHeading}>{t('home.hikingSafetySession')}</Text>
            <Text style={styles.cardDesc}>
              {t('home.startTrackingDesc')}
            </Text>
            <TouchableOpacity
              style={styles.sessionButton}
              onPress={() => router.push('/session')}
              accessibilityRole="button"
            >
              <Text style={styles.sessionButtonText}>{t('home.startSafetySession')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Grid of Key Features */}
      <Text style={styles.sectionTitle}>{t('home.safetyIntelligence')}</Text>
      <View style={styles.grid}>
        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => router.push('/triage')}
          accessibilityRole="button"
        >
          <Text style={styles.gridIcon}>🎙️</Text>
          <Text style={styles.gridTitle}>{t('home.aiVoiceTriage')}</Text>
          <Text style={styles.gridSub}>{t('home.offlineAssessment')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => router.push('/vitals')}
          accessibilityRole="button"
        >
          <Text style={styles.gridIcon}>❤️</Text>
          <Text style={styles.gridTitle}>{t('home.vitalSigns')}</Text>
          <Text style={styles.gridSub}>{t('home.pulseEstimation')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => router.push('/contacts')}
          accessibilityRole="button"
        >
          <Text style={styles.gridIcon}>👥</Text>
          <Text style={styles.gridTitle}>{t('home.contacts')}</Text>
          <Text style={styles.gridSub}>{t('home.trustedResponders')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.gridCard}
          onPress={() => router.push('/history')}
          accessibilityRole="button"
        >
          <Text style={styles.gridIcon}>📜</Text>
          <Text style={styles.gridTitle}>{t('home.history')}</Text>
          <Text style={styles.gridSub}>{t('home.previousHikes')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.settingsRow, { borderColor: colors.primary, borderWidth: 1 }]}
        onPress={() => router.push('/(tabs)/demo')}
        accessibilityRole="button"
      >
        <Text style={[styles.settingsText, { color: colors.primary, fontWeight: 'bold' }]}>
          {t('home.scriptedDemoScenarios')}
        </Text>
        <Text style={[styles.arrowText, { color: colors.primary }]}>→</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.settingsRow}
        onPress={() => router.push('/settings')}
        accessibilityRole="button"
      >
        <Text style={styles.settingsText}>{t('home.permissionsSettings')}</Text>
        <Text style={styles.arrowText}>→</Text>
      </TouchableOpacity>

      <View style={styles.disclaimerBox}>
        <Text style={styles.disclaimerText}>{t('vitals.healthDisclaimer')}</Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      padding: 16,
      backgroundColor: colors.background,
      flexGrow: 1
    },
    activeIncidentAlert: {
      backgroundColor: colors.danger,
      borderWidth: 1.5,
      borderColor: colors.borderStrong,
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
      color: '#FECACA',
      fontSize: 11
    },
    alertAction: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700'
    },
    sosBanner: {
      backgroundColor: colors.sosButtonBg,
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
      color: colors.sosButtonText,
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: 1
    },
    sosSubtitle: {
      color: '#FECACA',
      fontSize: 12
    },
    sosArrow: {
      color: colors.sosButtonText,
      fontSize: 20,
      fontWeight: 'bold'
    },
    syncBar: {
      backgroundColor: colors.surface,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
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
      backgroundColor: colors.success
    },
    syncDotPending: {
      backgroundColor: colors.warning
    },
    syncDotSyncing: {
      backgroundColor: colors.primary
    },
    syncDotFailed: {
      backgroundColor: colors.danger
    },
    syncText: {
      color: colors.text,
      fontSize: 12,
      fontWeight: '600'
    },
    syncSubtext: {
      color: colors.mutedText,
      fontSize: 10
    },
    syncButton: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 6,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border
    },
    syncButtonText: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '700'
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
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
      backgroundColor: colors.mutedText,
      marginRight: 6
    },
    pulseDotActive: {
      backgroundColor: colors.success
    },
    statusLabel: {
      color: colors.mutedText,
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
      color: colors.primary,
      marginVertical: 4,
      fontFamily: 'monospace'
    },
    cardHeading: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      marginBottom: 4
    },
    cardDesc: {
      color: colors.mutedText,
      fontSize: 13,
      lineHeight: 18,
      marginBottom: 14
    },
    sessionButton: {
      backgroundColor: colors.primary,
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
      color: colors.text,
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
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border
    },
    gridIcon: {
      fontSize: 22,
      marginBottom: 6
    },
    gridTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600'
    },
    gridSub: {
      color: colors.mutedText,
      fontSize: 11,
      marginTop: 2
    },
    settingsRow: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16
    },
    settingsText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600'
    },
    arrowText: {
      color: colors.mutedText,
      fontSize: 16
    },
    disclaimerBox: {
      padding: 10,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
      borderWidth: 1,
      borderColor: colors.border
    },
    disclaimerText: {
      color: colors.mutedText,
      fontSize: 10,
      lineHeight: 14
    }
  });
