import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { HEALTH_DISCLAIMER } from '@trinetra/shared';
import { useSafetyStore } from '../src/store/safetyStore';
import { processPpgSignal } from '../src/lib/ppg';

export default function VitalsScreen() {
  const router = useRouter();
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
          const t = elapsedSec + i / 30;
          // Simulated red-channel finger absorption wave + mild noise
          const cardiacWave = Math.sin(2 * Math.PI * targetFreq * t);
          const baselineDrift = 0.08 * Math.sin(2 * Math.PI * 0.15 * t);
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

      if (ppgResult.bpm !== null) {
        setEstimatedBpm(ppgResult.bpm);
        setSignalQuality(ppgResult.signalQuality);

        recordVitalReading(ppgResult.bpm, ppgResult.signalQuality, true).then(() => {
          Alert.alert(
            'Measurement Complete',
            `Computed Pulse: ${ppgResult.bpm} BPM (Signal Quality: ${(ppgResult.signalQuality * 100).toFixed(0)}%).\n\nSimulated [DEMO] - Saved to local SQLite record.`,
            [{ text: 'OK' }]
          );
        });
      } else {
        setEstimatedBpm(null);
        setSignalQuality(ppgResult.signalQuality);
        Alert.alert(
          'Low Signal Quality',
          'Could not detect a stable pulse rhythm. Please ensure your finger covers the sensor and hold steady.',
          [{ text: 'OK' }]
        );
      }
    }

    return () => {
      if (timer) clearTimeout(timer);
      if (waveInterval) clearInterval(waveInterval);
    };
  }, [isMeasuring, secondsRemaining, activeIncident, recordVitalReading]);

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
      <Text style={styles.title}>Camera Vital Estimation (PPG)</Text>
      <Text style={styles.description}>
        Experimental pulse estimation using rear camera red-channel absorption analysis.
      </Text>

      {/* PPG Sensor Viewport */}
      <View style={styles.sensorCard}>
        <View style={styles.cameraFrame}>
          <View style={[styles.redLight, isMeasuring && styles.redLightPulsing]}>
            <Text style={styles.heartEmoji}>❤️</Text>
          </View>
        </View>

        <Text style={styles.instructionText}>
          {isMeasuring
            ? 'Hold phone steady. Gently cover the rear camera lens & flash.'
            : 'Place your index finger over the rear camera lens and flash, then tap Start.'}
        </Text>

        {/* Live Measurement HUD */}
        {isMeasuring ? (
          <View style={styles.measuringBox}>
            <Text style={styles.countdownNumber}>{secondsRemaining}s</Text>
            <Text style={styles.measuringLabel}>PROCESSING RED-CHANNEL PPG ABSORPTION</Text>

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

            <TouchableOpacity style={styles.abortButton} onPress={handleCancel}>
              <Text style={styles.abortText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : estimatedBpm !== null ? (
          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>COMPUTED PULSE (PPG DSP)</Text>
            <View style={styles.bpmRow}>
              <Text style={styles.resultValue}>
                {estimatedBpm} <Text style={styles.unitText}>BPM</Text>
              </Text>
              <View style={styles.demoBadge}>
                <Text style={styles.demoBadgeText}>Simulated [DEMO]</Text>
              </View>
            </View>
            <Text style={styles.qualityText}>
              Signal Quality: {((signalQuality || 0.9) * 100).toFixed(0)}% · 30s Optical DSP Duration
            </Text>

            <TouchableOpacity
              style={styles.retestButton}
              onPress={handleStartMeasurement}
            >
              <Text style={styles.retestButtonText}>Retest Vitals</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartMeasurement}
          >
            <Text style={styles.startButtonText}>Start 30s PPG Measurement</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Prominent Non-Diagnostic Alert Card */}
      <View style={styles.disclaimerCard}>
        <View style={styles.disclaimerHeader}>
          <Text style={styles.warningEmoji}>⚠️</Text>
          <Text style={styles.disclaimerHeading}>NON-DIAGNOSTIC RESEARCH ESTIMATION</Text>
        </View>
        <Text style={styles.disclaimerText}>{HEALTH_DISCLAIMER}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6
  },
  description: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20,
    lineHeight: 18
  },
  sensorCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 20
  },
  cameraFrame: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#020617',
    borderWidth: 3,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16
  },
  redLight: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#450A0A',
    alignItems: 'center',
    justifyContent: 'center'
  },
  redLightPulsing: {
    backgroundColor: '#991B1B'
  },
  heartEmoji: {
    fontSize: 32
  },
  instructionText: {
    color: '#CBD5E1',
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
    color: '#F43F5E',
    fontFamily: 'monospace'
  },
  measuringLabel: {
    color: '#FB7185',
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
    backgroundColor: '#F43F5E',
    borderRadius: 2
  },
  abortButton: {
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 16
  },
  abortText: {
    color: '#94A3B8',
    fontSize: 12,
    textDecorationLine: 'underline'
  },
  resultBox: {
    alignItems: 'center',
    width: '100%'
  },
  resultLabel: {
    color: '#94A3B8',
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
    fontSize: 54,
    fontWeight: '900',
    color: '#F43F5E'
  },
  demoBadge: {
    backgroundColor: '#78350F',
    borderColor: '#F59E0B',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  demoBadgeText: {
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800'
  },
  unitText: {
    fontSize: 18,
    color: '#94A3B8',
    fontWeight: '600'
  },
  qualityText: {
    color: '#4ADE80',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 16
  },
  retestButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155'
  },
  retestButtonText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600'
  },
  startButton: {
    backgroundColor: '#EA580C',
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
    backgroundColor: '#1E1B4B',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#F59E0B'
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
    color: '#FDE68A',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  disclaimerText: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16
  }
});
