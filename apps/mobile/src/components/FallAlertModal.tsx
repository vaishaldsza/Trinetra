import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { DEMO_BANNER_LABEL } from '@trinetra/shared';
import { useSafetyStore } from '../store/safetyStore';

export function FallAlertModal() {
  const router = useRouter();
  const {
    showFallAlertModal,
    fallCountdownSeconds,
    decrementFallCountdown,
    dismissFallAlert,
    confirmFallSOS
  } = useSafetyStore();

  const isHandlingExpiryRef = useRef(false);

  useEffect(() => {
    if (!showFallAlertModal) {
      isHandlingExpiryRef.current = false;
      return;
    }

    // Start repeating vibration pattern [500ms vibrate, 500ms pause]
    const VIBRATION_PATTERN = [500, 500];
    try {
      Vibration.vibrate(VIBRATION_PATTERN, true);
    } catch {
      // Gracefully handled if Vibration is unavailable (e.g. web)
    }

    const interval = setInterval(async () => {
      const current = useSafetyStore.getState().fallCountdownSeconds;
      if (current !== null && current <= 1 && !isHandlingExpiryRef.current) {
        isHandlingExpiryRef.current = true;
        clearInterval(interval);
        try {
          Vibration.cancel();
        } catch {}
        const incident = await confirmFallSOS();
        router.push(`/incidents/${incident.id}`);
      } else {
        decrementFallCountdown();
      }
    }, 1000);

    return () => {
      clearInterval(interval);
      try {
        Vibration.cancel();
      } catch {}
    };
  }, [showFallAlertModal, decrementFallCountdown, confirmFallSOS, router]);

  if (!showFallAlertModal) return null;

  const handleConfirm = async () => {
    try {
      Vibration.cancel();
    } catch {}
    const incident = await confirmFallSOS();
    // Confirmed fall skips secondary countdown and routes straight to active incident
    router.push(`/incidents/${incident.id}`);
  };

  const handleDismiss = () => {
    try {
      Vibration.cancel();
    } catch {}
    dismissFallAlert();
  };

  return (
    <Modal
      visible={showFallAlertModal}
      transparent
      animationType="fade"
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.headerBadge}>
            <Text style={styles.badgeLabel}>{DEMO_BANNER_LABEL} SENSOR MONITOR</Text>
          </View>

          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>POTENTIAL FALL DETECTED</Text>
          <Text style={styles.description}>
            Rapid acceleration followed by impact and immobility was detected on your device.
          </Text>

          <View style={styles.countdownContainer}>
            <Text style={styles.countdownNumber}>{fallCountdownSeconds ?? 30}</Text>
            <Text style={styles.countdownLabel}>SECONDS UNTIL AUTOMATIC SOS</Text>
          </View>

          <Text style={styles.helperText}>
            If you do not respond, emergency escalation will dispatch alerts to your emergency contacts.
          </Text>

          <View style={styles.buttonStack}>
            <TouchableOpacity
              style={styles.sosButton}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={styles.sosButtonText}>🚨 I NEED HELP (TRIGGER SOS)</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dismissButton}
              onPress={handleDismiss}
              activeOpacity={0.8}
            >
              <Text style={styles.dismissButtonText}>✓ I AM OK (CANCEL ALERT)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
    backgroundColor: '#0F172A',
    borderColor: '#DC2626',
    borderWidth: 2,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10
  },
  headerBadge: {
    backgroundColor: '#7F1D1D',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 12
  },
  badgeLabel: {
    color: '#FECACA',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  icon: {
    fontSize: 44,
    marginBottom: 8
  },
  title: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  description: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16
  },
  countdownContainer: {
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    width: '100%',
    marginBottom: 12
  },
  countdownNumber: {
    color: '#EF4444',
    fontSize: 48,
    fontWeight: '900',
    fontFamily: 'monospace'
  },
  countdownLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginTop: 2
  },
  helperText: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 16
  },
  buttonStack: {
    width: '100%',
    gap: 10
  },
  sosButton: {
    backgroundColor: '#B91C1C',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  sosButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5
  },
  dismissButton: {
    backgroundColor: '#1E293B',
    borderColor: '#334155',
    borderWidth: 1,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  dismissButtonText: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 13
  }
});
