import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafetyStore } from '../src/store/safetyStore';
import { useTheme } from '../src/theme/ThemeContext';
import { ColorTokens } from '../src/theme/tokens';
import { formatNumber, SupportedLanguage } from '../src/i18n';

export default function SOSScreen() {
  const router = useRouter();
  const { immediate, skipCountdown } = useLocalSearchParams<{ immediate?: string; skipCountdown?: string }>();
  const shouldSkipCountdown = immediate === 'true' || skipCountdown === 'true';

  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currentLang = ((i18n.language || 'en').split('-')[0]) as SupportedLanguage;

  const { activeIncident, triggerSOS, cancelSOS, lastKnownLocation, isDemoMode } = useSafetyStore();
  const [countdown, setCountdown] = useState<number | null>(null);

  // If navigated with skipCountdown/immediate parameter, immediately trigger SOS without hold or countdown
  useEffect(() => {
    if (shouldSkipCountdown && !activeIncident) {
      triggerSOS();
    }
  }, [shouldSkipCountdown, activeIncident, triggerSOS]);

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
            { text: t('sos.openTriage'), onPress: () => router.push('/triage') },
            { text: t('sos.report'), onPress: () => router.push(`/incidents/${incident.id}`) }
          ]
        );
      });
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [countdown, triggerSOS, router, t]);

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
      Alert.alert(t('common.cancel'), 'The emergency status has been marked cancelled.');
    }
  };

  return (
    <View style={styles.container}>
      {isDemoMode && (
        <View style={styles.demoWarningBanner}>
          <Text style={styles.demoWarningText}>{t('sos.demoWarning')}</Text>
        </View>
      )}

      <Text style={styles.title}>{t('sos.title')}</Text>
      <Text style={styles.description}>{t('sos.desc')}</Text>

      {/* Countdown Active State */}
      {countdown !== null ? (
        <View style={styles.countdownContainer}>
          <Text style={styles.countdownLabel}>{t('sos.alertTriggeringIn')}</Text>
          <Text style={styles.countdownNumber}>
            {formatNumber(countdown, currentLang)}
          </Text>
          <TouchableOpacity
            style={styles.abortButton}
            onPress={handleAbortCountdown}
            accessibilityRole="button"
            accessibilityLabel={t('sos.cancelAlert')}
          >
            <Text style={styles.abortButtonText}>{t('sos.cancelAlert')}</Text>
          </TouchableOpacity>
        </View>
      ) : activeIncident ? (
        /* Active Emergency Incident State */
        <View style={styles.activeIncidentBox}>
          <Text style={styles.activeEmoji}>🚨</Text>
          <Text style={styles.activeHeading}>{t('sos.emergencyActive')}</Text>
          <Text style={styles.incidentId}>ID: {activeIncident.id}</Text>
          <Text style={styles.incidentDetails}>
            {t('sos.priority')}: {activeIncident.priority.toUpperCase()} · {t('sos.status')}: {activeIncident.status.toUpperCase()}
          </Text>
          <Text style={styles.gpsCoords}>
            GPS: {activeIncident.latitude?.toFixed(4)}° N, {activeIncident.longitude?.toFixed(4)}° E
          </Text>

          <View style={styles.actionButtonsRow}>
            <TouchableOpacity
              style={styles.triageButton}
              onPress={() => router.push('/triage')}
              accessibilityRole="button"
            >
              <Text style={styles.triageButtonText}>{t('sos.openTriage')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.detailsButton}
              onPress={() => router.push(`/incidents/${activeIncident.id}`)}
              accessibilityRole="button"
            >
              <Text style={styles.detailsButtonText}>{t('sos.report')}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cancelIncidentButton}
            onPress={handleCancelActiveIncident}
            accessibilityRole="button"
          >
            <Text style={styles.cancelIncidentText}>{t('sos.cancelEmergency')}</Text>
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
            accessibilityRole="button"
            accessibilityLabel={t('sos.holdForSos')}
          >
            <Text style={styles.sosText}>{t('sos.holdForSos')}</Text>
            <Text style={styles.sosSubtext}>
              {holdProgress > 0
                ? t('sos.holding', { percent: holdProgress })
                : t('sos.holdToActivate')}
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
            📍 {t('sos.lastKnownGps')}: {lastKnownLocation.latitude.toFixed(4)}° N, {lastKnownLocation.longitude.toFixed(4)}° E
          </Text>
        </View>
      )}

      <View style={styles.noticeBox}>
        <Text style={styles.noticeText}>{t('sos.demoNotice')}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center'
    },
    title: {
      fontSize: 26,
      fontWeight: '900',
      color: colors.danger,
      marginBottom: 8,
      letterSpacing: 1
    },
    description: {
      fontSize: 13,
      color: colors.mutedText,
      textAlign: 'center',
      marginBottom: 32,
      lineHeight: 18,
      maxWidth: 340
    },
    demoWarningBanner: {
      backgroundColor: colors.warning,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      borderRadius: 8,
      paddingVertical: 8,
      paddingHorizontal: 12,
      marginBottom: 16,
      width: '100%',
      alignItems: 'center'
    },
    demoWarningText: {
      color: '#000000',
      fontSize: 12,
      fontWeight: '800',
      textAlign: 'center'
    },
    buttonWrapper: {
      alignItems: 'center',
      width: '100%'
    },
    sosButton: {
      width: 220,
      height: 220,
      borderRadius: 110,
      backgroundColor: colors.sosButtonBg,
      borderWidth: 8,
      borderColor: colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 12
    },
    sosButtonHolding: {
      backgroundColor: '#991B1B',
      borderColor: '#F87171'
    },
    sosText: {
      color: colors.sosButtonText,
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
      backgroundColor: colors.surfaceElevated,
      borderRadius: 4,
      overflow: 'hidden',
      marginTop: 14
    },
    progressBarFill: {
      height: '100%',
      backgroundColor: colors.danger,
      borderRadius: 4
    },
    countdownContainer: {
      alignItems: 'center',
      backgroundColor: colors.fallCountdownBg,
      borderWidth: 2,
      borderColor: colors.danger,
      borderRadius: 20,
      padding: 32,
      width: '100%',
      maxWidth: 320
    },
    countdownLabel: {
      color: '#FECACA',
      fontSize: 12,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginBottom: 12
    },
    countdownNumber: {
      fontSize: 72,
      fontWeight: '900',
      color: colors.fallCountdownText,
      fontFamily: 'monospace',
      marginBottom: 20
    },
    abortButton: {
      backgroundColor: colors.danger,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.borderStrong
    },
    abortButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700'
    },
    activeIncidentBox: {
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.primary,
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
      color: colors.danger,
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: 1
    },
    incidentId: {
      color: colors.mutedText,
      fontSize: 11,
      fontFamily: 'monospace',
      marginTop: 4,
      marginBottom: 4
    },
    incidentDetails: {
      color: colors.textSecondary,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 2
    },
    gpsCoords: {
      color: colors.warning,
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
      backgroundColor: colors.primary,
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
      backgroundColor: colors.surfaceElevated,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border
    },
    detailsButtonText: {
      color: colors.text,
      fontWeight: '700',
      fontSize: 13
    },
    cancelIncidentButton: {
      paddingVertical: 8
    },
    cancelIncidentText: {
      color: colors.mutedText,
      fontSize: 12,
      textDecorationLine: 'underline'
    },
    locationTag: {
      marginTop: 20,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 8,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border
    },
    locationTagText: {
      color: colors.mutedText,
      fontSize: 11,
      fontFamily: 'monospace'
    },
    noticeBox: {
      marginTop: 20,
      padding: 12,
      backgroundColor: colors.surface,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      maxWidth: 340
    },
    noticeText: {
      color: colors.warning,
      fontSize: 11,
      lineHeight: 16,
      textAlign: 'center'
    }
  });