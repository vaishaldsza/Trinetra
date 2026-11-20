import { useState, useEffect, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafetyStore } from '../src/store/safetyStore';
import { processPpgSignal } from '../src/lib/ppg';
import { useTheme } from '../src/theme/ThemeContext';
import { ColorTokens } from '../src/theme/tokens';
import { formatBpm, formatNumber, SupportedLanguage } from '../src/i18n';

export default function VitalsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currentLang = (i18n.language || 'en').split('-')[0] as SupportedLanguage;

  const { activeIncident, recordVitalReading } = useSafetyStore();

  const [isMeasuring, setIsMeasuring] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(30);
  const [estimatedBpm, setEstimatedBpm] = useState<number | null>(null);
  const [signalQuality, setSignalQuality] = useState<number | null>(null);
  const [pulseWavePhase, setPulseWavePhase] = useState(0);

  // Optical intensity sample buffer (30 Hz standard camera frame rate)
  const opticalBufferRef = useRef<number[]>([]);

  // 30-second measurement cycle
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;
    let waveInterval: NodeJS.Timeout | null = null;

    if (isMeasuring && secondsRemaining > 0) {
      timer = setTimeout(() => {
        // Collect 30 samples per second into the optical buffer
        const elapsedSec = 30 - secondsRemaining;
        const targetBpm = activeIncident ? 108 : 72;
        const targetFreq = targetBpm / 60; // 1.8 Hz or 1.2 Hz

        for (let i = 0; i < 30; i++) {
          const tVal = elapsedSec + i / 30;
          // Simulated red-channel finger absorption wave + mild noise
          const cardiacWave = Math.sin(2 * Math.PI * targetFreq * tVal);
          const baselineDrift = 0.08 * Math.sin(2 * Math.PI * 0.15 * tVal);
          const noise = 0.04 * (Math.random() - 0.5);
          opticalBufferRef.current.push(cardiacWave + baselineDrift + noise);
        }

        setSecondsRemaining(secondsRemaining - 1);
      }, 1000);

      waveInterval = setInterval(() => {
        setPulseWavePhase(p => (p + 1) % 10);
      }, 150);
    } else if (isMeasuring && secondsRemaining === 0) {
      // Completed 30s measurement: process pure PPG DSP pipeline
      setIsMeasuring(false);
      const ppgResult = processPpgSignal(opticalBufferRef.current, 30);

      const computedBpm = ppgResult.bpm;
      if (computedBpm !== null) {
        setEstimatedBpm(computedBpm);
        setSignalQuality(ppgResult.signalQuality);

        recordVitalReading(computedBpm, ppgResult.signalQuality, true).then(() => {
          Alert.alert(
            t('vitals.measurementComplete'),
            t('vitals.computedPulseAlert', {
              bpm: formatNumber(computedBpm, currentLang),
              quality: formatNumber(Math.round(ppgResult.signalQuality * 100), currentLang)
            }),
            [{ text: t('common.ok') }]
          );
        });
      } else {
        setEstimatedBpm(null);
        setSignalQuality(ppgResult.signalQuality);
        Alert.alert(
          t('vitals.lowSignalQuality'),
          t('vitals.lowSignalDesc'),
          [{ text: t('common.ok') }]
        );
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (waveInterval) clearInterval(waveInterval);
    };
  }, [isMeasuring, secondsRemaining, activeIncident, recordVitalReading, t, currentLang]);

  const handleStartMeasurement = () => {
    opticalBufferRef.current = [];
    setEstimatedBpm(null);
    setSignalQuality(null);
    setSecondsRemaining(30);
    setIsMeasuring(true);
  };

  const handleCancel = () => {
    opticalBufferRef.current = [];
    setIsMeasuring(false);
    setSecondsRemaining(30);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('vitals.title')}</Text>
      <Text style={styles.description}>{t('vitals.description')}</Text>

      {/* PPG Sensor Viewport */}
      <View style={styles.sensorCard}>
        <View style={styles.cameraFrame}>
          <View style={[styles.redLight, isMeasuring && styles.redLightPulsing]}>
            <Text style={styles.heartEmoji}>❤️</Text>
          </View>
        </View>

        <Text style={styles.instructionText}>
          {isMeasuring
            ? t('vitals.holdSteadyInstruction')
            : t('vitals.placeFingerInstruction')}
        </Text>

        {/* Live Measurement HUD */}
        {isMeasuring ? (
          <View style={styles.measuringBox}>
            <Text style={styles.countdownNumber}>
              {formatNumber(secondsRemaining, currentLang)}s
            </Text>
            <Text style={styles.measuringLabel}>{t('vitals.processingAbsorption')}</Text>

            {/* Simulated Live PPG Waveform Bars */}
            <View style={styles.waveformContainer}>
              {[2, 4, 7, 12, 18, 14, 8, 4, 3, 5, 8, 15, 19, 13, 6, 3, 2, 6, 11, 17].map((height, idx) => (
                <View
                  key={idx}
                  style={[
                    styles.waveformBar,
                    {
                      height: isMeasuring ? Math.max(6, (height + pulseWavePhase) % 24) : 4
                    }
                  ]}
                />
              ))}
            </View>

            <TouchableOpacity
              style={styles.abortButton}
              onPress={handleCancel}
              accessibilityRole="button"
            >
              <Text style={styles.abortText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        ) : estimatedBpm !== null ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>{t('vitals.computedPulse')}</Text>
            <View style={styles.bpmRow}>
              <Text style={styles.resultValue}>
                {formatBpm(estimatedBpm, currentLang)}
              </Text>
              <View style={styles.demoBadge}>
                <Text style={styles.demoBadgeText}>{t('vitals.simulatedDemo')}</Text>
              </View>
            </View>
            <Text style={styles.qualityText}>
              {t('vitals.signalQualityText', {
                quality: formatNumber(Math.round((signalQuality || 0.9) * 100), currentLang)
              })}
            </Text>

            <TouchableOpacity
              style={styles.retestButton}
              onPress={handleStartMeasurement}
              accessibilityRole="button"
            >
              <Text style={styles.retestButtonText}>{t('vitals.retest')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartMeasurement}
            accessibilityRole="button"
          >
            <Text style={styles.startButtonText}>{t('vitals.startMeasurement')}</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Prominent Non-Diagnostic Alert Card */}
      <View style={styles.disclaimerCard}>
        <View style={styles.disclaimerHeader}>
          <Text style={styles.warningEmoji}>⚠️</Text>
          <Text style={styles.disclaimerHeading}>{t('vitals.nonDiagnosticHeading')}</Text>
        </View>
        <Text style={styles.disclaimerText}>{t('vitals.healthDisclaimer')}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 20
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 6
    },
    description: {
      fontSize: 13,
      color: colors.mutedText,
      marginBottom: 20,
      lineHeight: 18
    },
    sensorCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20
    },
    cameraFrame: {
      width: 110,
      height: 110,
      borderRadius: 55,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 3,
      borderColor: colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16
    },
    redLight: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.surfaceElevated,
      alignItems: 'center',
      justifyContent: 'center'
    },
    redLightPulsing: {
      backgroundColor: colors.danger
    },
    heartEmoji: {
      fontSize: 32
    },
    instructionText: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
      lineHeight: 18,
      marginBottom: 20,
      maxWidth: 280
    },
    measuringBox: {
      alignItems: 'center',
      width: '100%'
    },
    countdownNumber: {
      fontSize: 42,
      fontWeight: '900',
      color: colors.danger,
      fontFamily: 'monospace'
    },
    measuringLabel: {
      color: colors.danger,
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 0.5,
      marginVertical: 8
    },
    waveformContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      height: 28,
      gap: 4,
      marginVertical: 12
    },
    waveformBar: {
      width: 4,
      backgroundColor: colors.danger,
      borderRadius: 2
    },
    abortButton: {
      marginTop: 12,
      paddingVertical: 6,
      paddingHorizontal: 16
    },
    abortText: {
      color: colors.mutedText,
      fontSize: 12,
      textDecorationLine: 'underline'
    },
    resultBox: {
      alignItems: 'center',
      width: '100%'
    },
    resultLabel: {
      color: colors.mutedText,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5
    },
    bpmRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginVertical: 4
    },
    resultValue: {
      fontSize: 42,
      fontWeight: '900',
      color: colors.danger
    },
    demoBadge: {
      backgroundColor: colors.demoBannerBg,
      borderColor: colors.borderStrong,
      borderWidth: 1,
      borderRadius: 6,
      paddingHorizontal: 8,
      paddingVertical: 4
    },
    demoBadgeText: {
      color: colors.demoBannerText,
      fontSize: 11,
      fontWeight: '800'
    },
    qualityText: {
      color: colors.success,
      fontSize: 12,
      fontWeight: '600',
      marginBottom: 16
    },
    retestButton: {
      backgroundColor: colors.surfaceElevated,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border
    },
    retestButtonText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600'
    },
    startButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      paddingHorizontal: 28,
      borderRadius: 10,
      width: '100%',
      alignItems: 'center'
    },
    startButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700'
    },
    disclaimerCard: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.warning
    },
    disclaimerHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 6
    },
    warningEmoji: {
      fontSize: 16
    },
    disclaimerHeading: {
      color: colors.warning,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.5
    },
    disclaimerText: {
      color: colors.mutedText,
      fontSize: 11,
      lineHeight: 16
    }
  });