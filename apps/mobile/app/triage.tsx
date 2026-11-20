import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafetyStore } from '../src/store/safetyStore';
import { TriageInput, evaluateTriageRules, localTriageAssistant } from '../src/lib/triageEngine';
import { useTheme } from '../src/theme/ThemeContext';
import { ColorTokens } from '../src/theme/tokens';
import { speakTriageText, stopTriageSpeech } from '../src/lib/voiceTriage';
import { SupportedLanguage, formatNumber } from '../src/i18n';

export default function TriageScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const currentLang = (i18n.language || 'en').split('-')[0] as SupportedLanguage;

  const { activeIncident, submitTriage } = useSafetyStore();

  const [consciousness, setConsciousness] = useState<TriageInput['consciousness']>('Fully conscious');
  const [breathingDifficulty, setBreathingDifficulty] = useState<boolean>(false);
  const [bleeding, setBleeding] = useState<TriageInput['bleeding']>('Minor abrasions');
  const [injuryLocation, setInjuryLocation] = useState<string>('Right ankle and leg');
  const [mobility, setMobility] = useState<TriageInput['mobility']>('Limited / Pain on walking');
  const [painLevel, setPainLevel] = useState<number>(7);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [isVoiceGuidanceEnabled, setIsVoiceGuidanceEnabled] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const speak = async (text: string) => {
    if (!isVoiceGuidanceEnabled) return;
    await speakTriageText(text, currentLang, (notice) => {
      setVoiceNotice(notice);
    });
  };

  const handleToggleVoice = async () => {
    const next = !isVoiceGuidanceEnabled;
    setIsVoiceGuidanceEnabled(next);
    setVoiceNotice(null);
    if (next) {
      await speakTriageText(t('triage.voiceEnabledMsg'), currentLang, (notice) => {
        setVoiceNotice(notice);
      });
    } else {
      await stopTriageSpeech();
    }
  };

  const triageInput: TriageInput = useMemo(() => ({
    consciousness,
    breathingDifficulty,
    bleeding,
    injuryLocation,
    mobility,
    painLevel
  }), [consciousness, breathingDifficulty, bleeding, injuryLocation, mobility, painLevel]);

  // Real-time deterministic rule engine evaluation
  const evaluation = useMemo(() => evaluateTriageRules(triageInput), [triageInput]);

  const handleSimulateVoiceInput = async () => {
    setIsTranscribing(true);
    try {
      // Simulated local speech-to-text
      const transcript = await localTriageAssistant.transcribeAudioClip('mock-audio-buffer');
      setVoiceTranscript(transcript);
      // Auto-populate based on transcript
      setConsciousness('Fully conscious');
      setBreathingDifficulty(true);
      setPainLevel(8);
      setMobility('Immobilized');
      setInjuryLocation('Right leg and ankle');
      if (isVoiceGuidanceEnabled) {
        speak(t('triage.transcriptMsg'));
      }
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const result = await submitTriage(triageInput);
      Alert.alert(
        t('triage.triageSavedAlert'),
        `${t('triage.ruleEngineStatus')}: ${evaluation.priority.toUpperCase()}.\n\n${evaluation.recommendedAction}`,
        [
          {
            text: t('triage.viewIncidentReport'),
            onPress: () => {
              if (result.incident_id) {
                router.push(`/incidents/${result.incident_id}`);
              } else if (activeIncident) {
                router.push(`/incidents/${activeIncident.id}`);
              } else {
                router.push('/(tabs)/home');
              }
            }
          }
        ]
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const consciousnessOptions: { key: TriageInput['consciousness']; label: string }[] = [
    { key: 'Fully conscious', label: t('triage.ansFullyConscious') },
    { key: 'Dazed / Confused', label: t('triage.ansDazed') },
    { key: 'Unresponsive', label: t('triage.ansUnresponsive') }
  ];

  const bleedingOptions: { key: TriageInput['bleeding']; label: string }[] = [
    { key: 'None', label: t('triage.ansBleedingNone') },
    { key: 'Minor abrasions', label: t('triage.ansMinorAbrasions') },
    { key: 'Moderate', label: t('triage.ansBleedingModerate') },
    { key: 'Severe bleeding', label: t('triage.ansSevereBleeding') }
  ];

  const mobilityOptions: { key: TriageInput['mobility']; label: string }[] = [
    { key: 'Full mobility', label: t('triage.ansFullMobility') },
    { key: 'Limited / Pain on walking', label: t('triage.ansLimitedMobility') },
    { key: 'Immobilized', label: t('triage.ansImmobilized') }
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('triage.title')}</Text>
      <Text style={styles.description}>{t('triage.description')}</Text>

      {/* Voice notice if unavailable */}
      {voiceNotice && (
        <View style={styles.voiceNoticeBox}>
          <Text style={styles.voiceNoticeText}>{voiceNotice}</Text>
        </View>
      )}

      {/* Voice Assistant Simulation Box */}
      <View style={styles.voiceCard}>
        <View style={styles.voiceHeader}>
          <Text style={styles.voiceTitle}>{t('triage.voiceAssistantTitle')}</Text>
          <Text style={styles.demoBadge}>DEMO</Text>
        </View>

        {voiceTranscript && (
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>{t('triage.aiTranscriptLabel')}</Text>
            <Text style={styles.transcriptText}>{voiceTranscript}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.voiceButton}
          onPress={handleSimulateVoiceInput}
          disabled={isTranscribing}
          accessibilityRole="button"
        >
          {isTranscribing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.voiceButtonText}>
              {voiceTranscript ? t('triage.rerunVoiceSim') : t('triage.simulateVoiceIntake')}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Real-time Deterministic Evaluation Banner */}
      <View
        style={[
          styles.evalBanner,
          evaluation.priority === 'critical'
            ? styles.evalCritical
            : evaluation.priority === 'high'
            ? styles.evalHigh
            : styles.evalMedium
        ]}
      >
        <View style={styles.evalHeaderRow}>
          <Text style={styles.evalLabel}>{t('triage.ruleEngineStatus')}</Text>
          <Text
            style={[
              styles.evalPriority,
              evaluation.priority === 'critical' && styles.evalPriorityCritical
            ]}
          >
            {evaluation.priority.toUpperCase()}
          </Text>
        </View>

        {evaluation.criticalWarningSigns.length > 0 && (
          <View style={styles.warningList}>
            {evaluation.criticalWarningSigns.map((w, idx) => (
              <Text key={idx} style={styles.warningItem}>⚠️ {w}</Text>
            ))}
          </View>
        )}
        <Text style={styles.actionRecommendation}>{evaluation.recommendedAction}</Text>
      </View>

      {/* Structured Questions Form */}
      <View style={styles.formSection}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>{t('triage.structuredProtocol')}</Text>
          <TouchableOpacity
            style={[styles.voiceGuidancePill, isVoiceGuidanceEnabled && styles.voiceGuidancePillActive]}
            onPress={handleToggleVoice}
            accessibilityRole="button"
          >
            <Text style={styles.voiceGuidancePillText}>
              {isVoiceGuidanceEnabled ? t('triage.voiceOn') : t('triage.voiceOff')}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 1. Consciousness */}
        <View style={styles.questionBlock}>
          <View style={styles.questionHeaderRow}>
            <Text style={styles.questionTitle}>{t('triage.question1')}</Text>
            <TouchableOpacity
              style={styles.speakButton}
              onPress={() => speak(t('triage.q1_speak'))}
              accessibilityRole="button"
              accessibilityLabel="Speak Question 1"
            >
              <Text style={styles.speakButtonText}>🔊</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.optionsRow}>
            {consciousnessOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.chip,
                  consciousness === opt.key &&
                    (opt.key === 'Unresponsive' ? styles.chipActiveCritical : styles.chipActive)
                ]}
                onPress={() => setConsciousness(opt.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: consciousness === opt.key }}
              >
                <Text
                  style={[
                    styles.chipText,
                    consciousness === opt.key && styles.chipTextActive
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. Breathing */}
        <View style={styles.questionBlock}>
          <View style={styles.questionHeaderRow}>
            <Text style={styles.questionTitle}>{t('triage.question2')}</Text>
            <TouchableOpacity
              style={styles.speakButton}
              onPress={() => speak(t('triage.q2_speak'))}
              accessibilityRole="button"
              accessibilityLabel="Speak Question 2"
            >
              <Text style={styles.speakButtonText}>🔊</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.chip, !breathingDifficulty && styles.chipActive]}
              onPress={() => setBreathingDifficulty(false)}
              accessibilityRole="radio"
              accessibilityState={{ selected: !breathingDifficulty }}
            >
              <Text style={[styles.chipText, !breathingDifficulty && styles.chipTextActive]}>
                {t('triage.ansNormalBreathing')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, breathingDifficulty && styles.chipActiveCritical]}
              onPress={() => setBreathingDifficulty(true)}
              accessibilityRole="radio"
              accessibilityState={{ selected: breathingDifficulty }}
            >
              <Text style={[styles.chipText, breathingDifficulty && styles.chipTextActive]}>
                {t('triage.ansLaboredBreathing')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Bleeding */}
        <View style={styles.questionBlock}>
          <View style={styles.questionHeaderRow}>
            <Text style={styles.questionTitle}>{t('triage.question3')}</Text>
            <TouchableOpacity
              style={styles.speakButton}
              onPress={() => speak(t('triage.q3_speak'))}
              accessibilityRole="button"
              accessibilityLabel="Speak Question 3"
            >
              <Text style={styles.speakButtonText}>🔊</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.optionsRow}>
            {bleedingOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.chip,
                  bleeding === opt.key &&
                    (opt.key === 'Severe bleeding' ? styles.chipActiveCritical : styles.chipActive)
                ]}
                onPress={() => setBleeding(opt.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: bleeding === opt.key }}
              >
                <Text
                  style={[
                    styles.chipText,
                    bleeding === opt.key && styles.chipTextActive
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. Injury Location */}
        <View style={styles.questionBlock}>
          <View style={styles.questionHeaderRow}>
            <Text style={styles.questionTitle}>{t('triage.question4')}</Text>
            <TouchableOpacity
              style={styles.speakButton}
              onPress={() => speak(t('triage.q4_speak'))}
              accessibilityRole="button"
              accessibilityLabel="Speak Question 4"
            >
              <Text style={styles.speakButtonText}>🔊</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.textInput}
            value={injuryLocation}
            onChangeText={setInjuryLocation}
            placeholder={t('triage.injuryPlaceholder')}
            placeholderTextColor={colors.mutedText}
          />
        </View>

        {/* 5. Mobility */}
        <View style={styles.questionBlock}>
          <View style={styles.questionHeaderRow}>
            <Text style={styles.questionTitle}>{t('triage.question5')}</Text>
            <TouchableOpacity
              style={styles.speakButton}
              onPress={() => speak(t('triage.q5_speak'))}
              accessibilityRole="button"
              accessibilityLabel="Speak Question 5"
            >
              <Text style={styles.speakButtonText}>🔊</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.optionsRow}>
            {mobilityOptions.map((opt) => (
              <TouchableOpacity
                key={opt.key}
                style={[
                  styles.chip,
                  mobility === opt.key &&
                    (opt.key === 'Immobilized' ? styles.chipActiveCritical : styles.chipActive)
                ]}
                onPress={() => setMobility(opt.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: mobility === opt.key }}
              >
                <Text
                  style={[
                    styles.chipText,
                    mobility === opt.key && styles.chipTextActive
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 6. Pain Level (0 - 10) */}
        <View style={styles.questionBlock}>
          <View style={styles.painHeaderRow}>
            <View style={styles.questionHeaderRow}>
              <Text style={styles.questionTitle}>{t('triage.question6')}</Text>
              <TouchableOpacity
                style={styles.speakButton}
                onPress={() => speak(t('triage.q6_speak'))}
                accessibilityRole="button"
                accessibilityLabel="Speak Question 6"
              >
                <Text style={styles.speakButtonText}>🔊</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.painDisplay}>
              {formatNumber(painLevel, currentLang)} / {formatNumber(10, currentLang)}
            </Text>
          </View>
          <View style={styles.painSelector}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
              <TouchableOpacity
                key={num}
                style={[
                  styles.painButton,
                  painLevel === num && (num >= 8 ? styles.painButtonCritical : styles.painButtonActive)
                ]}
                onPress={() => setPainLevel(num)}
                accessibilityRole="button"
              >
                <Text
                  style={[
                    styles.painButtonText,
                    painLevel === num && styles.painButtonTextActive
                  ]}
                >
                  {formatNumber(num, currentLang)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={styles.submitButton}
        onPress={handleSubmit}
        disabled={isSubmitting}
        accessibilityRole="button"
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>{t('triage.submitTriage')}</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimerText}>
        {t('triage.nonDiagnosticNotice')}
      </Text>
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
    voiceNoticeBox: {
      backgroundColor: colors.surfaceElevated,
      borderLeftWidth: 3,
      borderLeftColor: colors.warning,
      padding: 10,
      borderRadius: 6,
      marginBottom: 12
    },
    voiceNoticeText: {
      color: colors.warning,
      fontSize: 12
    },
    voiceCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16
    },
    voiceHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10
    },
    voiceTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text
    },
    demoBadge: {
      fontSize: 9,
      fontWeight: 'bold',
      backgroundColor: colors.demoBannerBg,
      color: colors.demoBannerText,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 3
    },
    transcriptBox: {
      backgroundColor: colors.surfaceElevated,
      padding: 10,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 12
    },
    transcriptLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 4,
      letterSpacing: 0.5
    },
    transcriptText: {
      color: colors.text,
      fontSize: 12,
      lineHeight: 16
    },
    voiceButton: {
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center'
    },
    voiceButtonText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '700'
    },
    evalBanner: {
      borderRadius: 12,
      padding: 14,
      borderWidth: 1.5,
      marginBottom: 20
    },
    evalCritical: {
      backgroundColor: colors.criticalBadgeBg,
      borderColor: colors.danger
    },
    evalHigh: {
      backgroundColor: colors.surface,
      borderColor: colors.warning
    },
    evalMedium: {
      backgroundColor: colors.surface,
      borderColor: colors.primary
    },
    evalHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6
    },
    evalLabel: {
      color: '#FECACA',
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 0.5
    },
    evalPriority: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '900',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 4,
      backgroundColor: colors.surfaceElevated
    },
    evalPriorityCritical: {
      backgroundColor: colors.danger,
      color: colors.criticalBadgeText
    },
    warningList: {
      gap: 4,
      marginVertical: 6
    },
    warningItem: {
      color: '#FECACA',
      fontSize: 12,
      fontWeight: '600'
    },
    actionRecommendation: {
      color: '#FFFFFF',
      fontSize: 11,
      lineHeight: 15,
      marginTop: 4
    },
    formSection: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16
    },
    sectionHeading: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5
    },
    voiceGuidancePill: {
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 1,
      borderColor: colors.border
    },
    voiceGuidancePillActive: {
      backgroundColor: colors.success,
      borderColor: colors.borderStrong
    },
    voiceGuidancePillText: {
      color: '#FFFFFF',
      fontSize: 11,
      fontWeight: '700'
    },
    questionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8
    },
    speakButton: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      backgroundColor: colors.surfaceElevated,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border
    },
    speakButtonText: {
      fontSize: 14
    },
    questionBlock: {
      marginBottom: 18
    },
    questionTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8
    },
    optionsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8
    },
    chip: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 8
    },
    chipActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
    },
    chipActiveCritical: {
      backgroundColor: colors.danger,
      borderColor: colors.borderStrong
    },
    chipText: {
      color: colors.mutedText,
      fontSize: 12,
      fontWeight: '500'
    },
    chipTextActive: {
      color: '#FFFFFF',
      fontWeight: '700'
    },
    textInput: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      color: colors.text,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 13
    },
    painHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 8
    },
    painDisplay: {
      color: colors.danger,
      fontWeight: '900',
      fontSize: 14
    },
    painSelector: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 6
    },
    painButton: {
      width: 28,
      height: 32,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 6
    },
    painButtonActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary
    },
    painButtonCritical: {
      backgroundColor: colors.danger,
      borderColor: colors.borderStrong
    },
    painButtonText: {
      color: colors.mutedText,
      fontSize: 11,
      fontWeight: '700'
    },
    painButtonTextActive: {
      color: '#FFFFFF'
    },
    submitButton: {
      backgroundColor: colors.success,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      marginBottom: 16
    },
    submitButtonText: {
      color: '#FFFFFF',
      fontSize: 15,
      fontWeight: '700'
    },
    disclaimerText: {
      fontSize: 10,
      color: colors.mutedText,
      lineHeight: 14,
      textAlign: 'center'
    }
  });