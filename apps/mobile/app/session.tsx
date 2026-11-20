import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { HikingSessionStatus } from '@trinetra/shared';
import { useSafetyStore } from '../src/store/safetyStore';
import { useTheme } from '../src/theme/ThemeContext';
import { ColorTokens } from '../src/theme/tokens';

export default function SessionScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
          <Text style={styles.title}>{t('session.title')}</Text>
          <View style={[styles.statusBadge, activeSession && styles.statusBadgeActive]}>
            <Text style={styles.statusBadgeText}>
              {activeSession ? activeSession.status.toUpperCase() : t('session.idle')}
            </Text>
          </View>
        </View>

        {activeSession ? (
          <View style={styles.activeArea}>
            <Text style={styles.activeTrail}>
              {(activeSession.start_location as { trail?: string })?.trail || t('session.activeHikingTrail')}
            </Text>
            <Text style={styles.timerLarge}>{formatTimer(sessionElapsedSeconds)}</Text>
            <Text style={styles.sessionMeta}>
              {t('session.sessionIdOffline', { id: activeSession.id.slice(0, 8) })}
            </Text>

            <View style={styles.sensorStatusRow}>
              <View
                style={[
                  styles.sensorDot,
                  isFallDetectionActive ? styles.sensorDotActive : styles.sensorDotInactive
                ]}
              />
              <Text style={styles.sensorStatusText}>
                {isFallDetectionActive
                  ? t('session.fallDetectionActive')
                  : t('session.fallDetectionInactive')}
              </Text>
            </View>

            <View style={styles.controlRow}>
              {activeSession.status === HikingSessionStatus.ACTIVE ? (
                <TouchableOpacity
                  style={styles.pauseButton}
                  onPress={pauseSession}
                  accessibilityRole="button"
                >
                  <Text style={styles.controlButtonText}>{t('session.pauseSession')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.resumeButton}
                  onPress={resumeSession}
                  accessibilityRole="button"
                >
                  <Text style={styles.controlButtonText}>{t('session.resumeSession')}</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={styles.stopButton}
                onPress={handleStop}
                accessibilityRole="button"
              >
                <Text style={styles.controlButtonText}>{t('session.endSession')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.simulateFallButton}
              onPress={simulateFallEvent}
              accessibilityRole="button"
            >
              <Text style={styles.simulateFallText}>{t('session.simulateFallDemo')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sosQuickLink}
              onPress={() => router.push('/sos')}
              accessibilityRole="button"
            >
              <Text style={styles.sosQuickText}>{t('session.triggerSosOnSession')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.inactiveArea}>
            <Text style={styles.info}>{t('session.inactiveInfo')}</Text>

            <Text style={styles.inputLabel}>{t('session.trailInputLabel')}</Text>
            <TextInput
              style={styles.input}
              value={trailName}
              onChangeText={setTrailName}
              placeholder={t('session.trailPlaceholder')}
              placeholderTextColor={colors.mutedText}
            />

            <TouchableOpacity
              style={styles.startButton}
              onPress={handleStart}
              accessibilityRole="button"
            >
              <Text style={styles.startButtonText}>{t('session.startMonitoring')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>{t('session.offlineGuarantee')}</Text>
        <Text style={styles.tipsText}>{t('session.tip1')}</Text>
        <Text style={styles.tipsText}>{t('session.tip2')}</Text>
        <Text style={styles.tipsText}>{t('session.tip3')}</Text>
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: colors.background,
      flexGrow: 1
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 20,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.text
    },
    statusBadge: {
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border
    },
    statusBadgeActive: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.success
    },
    statusBadgeText: {
      color: colors.text,
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
      color: colors.text,
      marginBottom: 8
    },
    timerLarge: {
      fontSize: 48,
      fontWeight: '900',
      color: colors.primary,
      fontFamily: 'monospace',
      marginBottom: 6
    },
    sessionMeta: {
      fontSize: 11,
      color: colors.mutedText,
      marginBottom: 14,
      fontFamily: 'monospace'
    },
    sensorStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16,
      width: '100%'
    },
    sensorDot: {
      width: 8,
      height: 8,
      borderRadius: 4
    },
    sensorDotActive: {
      backgroundColor: colors.success
    },
    sensorDotInactive: {
      backgroundColor: colors.mutedText
    },
    sensorStatusText: {
      color: colors.textSecondary,
      fontSize: 11,
      fontWeight: '600'
    },
    simulateFallButton: {
      width: '100%',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.surfaceElevated,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      alignItems: 'center',
      marginBottom: 12
    },
    simulateFallText: {
      color: colors.primary,
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
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center'
    },
    resumeButton: {
      flex: 1,
      backgroundColor: colors.success,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center'
    },
    stopButton: {
      flex: 1,
      backgroundColor: colors.danger,
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
      backgroundColor: colors.surfaceElevated,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.danger
    },
    sosQuickText: {
      color: colors.danger,
      fontSize: 12,
      fontWeight: '700'
    },
    inactiveArea: {
      marginTop: 4
    },
    info: {
      fontSize: 13,
      color: colors.mutedText,
      lineHeight: 18,
      marginBottom: 16
    },
    inputLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.mutedText,
      marginBottom: 6,
      letterSpacing: 0.5
    },
    input: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 14,
      marginBottom: 20
    },
    startButton: {
      backgroundColor: colors.primary,
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
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    tipsTitle: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.warning,
      marginBottom: 8
    },
    tipsText: {
      fontSize: 12,
      color: colors.mutedText,
      lineHeight: 18,
      marginBottom: 4
    }
  });