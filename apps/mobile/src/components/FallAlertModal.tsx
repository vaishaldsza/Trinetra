import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Vibration } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafetyStore } from '../store/safetyStore';
import { useTheme } from '../theme/ThemeContext';

export function FallAlertModal() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useTheme();
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
      <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(2, 6, 23, 0.92)' : 'rgba(15, 23, 42, 0.75)' }]}>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.danger }]}>
          <View style={[styles.headerBadge, { backgroundColor: colors.dangerSurface }]}>
            <Text style={[styles.badgeLabel, { color: colors.dangerText }]}>
              {t('fall.badge')}
            </Text>
          </View>

          <Text style={styles.icon}>⚠️</Text>
          <Text style={[styles.title, { color: colors.text }]}>{t('fall.title')}</Text>
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            {t('fall.description')}
          </Text>

          {/* High-Contrast Countdown Box for outdoor sunlight visibility */}
          <View style={[styles.countdownContainer, { backgroundColor: colors.fallCountdownBg }]}>
            <Text style={[styles.countdownNumber, { color: colors.fallCountdownText }]}>
              {fallCountdownSeconds ?? 30}
            </Text>
            <Text style={[styles.countdownLabel, { color: colors.fallCountdownText }]}>
              {t('fall.countdown_label')}
            </Text>
          </View>

          <Text style={[styles.helperText, { color: colors.mutedText }]}>
            {t('fall.helper_text')}
          </Text>

          <View style={styles.buttonStack}>
            <TouchableOpacity
              style={[styles.sosButton, { backgroundColor: colors.sosButtonBg }]}
              onPress={handleConfirm}
              activeOpacity={0.8}
            >
              <Text style={[styles.sosButtonText, { color: colors.sosButtonText }]}>
                🚨 {t('fall.confirm_sos_btn')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.dismissButton, { backgroundColor: colors.surfaceSecondary, borderColor: colors.border }]}
              onPress={handleDismiss}
              activeOpacity={0.8}
            >
              <Text style={[styles.dismissButtonText, { color: colors.text }]}>
                ✓ {t('fall.false_alarm_btn')}
              </Text>
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  card: {
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
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    marginBottom: 12
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  icon: {
    fontSize: 44,
    marginBottom: 8
  },
  title: {
    fontSize: 20,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: 0.5,
    marginBottom: 8
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 16
  },
  countdownContainer: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    width: '100%'
  },
  countdownNumber: {
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 52
  },
  countdownLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    marginTop: 2
  },
  helperText: {
    fontSize: 11,
    lineHeight: 15,
    textAlign: 'center',
    marginBottom: 20
  },
  buttonStack: {
    width: '100%',
    gap: 10
  },
  sosButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4
  },
  sosButtonText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5
  },
  dismissButton: {
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  dismissButtonText: {
    fontSize: 13,
    fontWeight: '700'
  }
});
