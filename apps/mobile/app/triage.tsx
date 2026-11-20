import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import { useSafetyStore } from '../src/store/safetyStore';
import { TriageInput, evaluateTriageRules, localTriageAssistant } from '../src/lib/triageEngine';

export default function TriageScreen() {
  const router = useRouter();
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

  const speakText = async (text: string) => {
    if (!isVoiceGuidanceEnabled) return;
    try {
      if (Platform.OS === 'web') {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(text);
          window.speechSynthesis.speak(utterance);
        }
        return;
      }
      const speaking = await Speech.isSpeakingAsync();
      if (speaking) {
        await Speech.stop();
      }
      Speech.speak(text, {
        language: 'en-US',
        rate: 0.95
      });
    } catch {
      // Gracefully ignored if speech engine is unavailable
    }
  };

  const handleToggleVoice = () => {
    const next = !isVoiceGuidanceEnabled;
    setIsVoiceGuidanceEnabled(next);
    if (next) {
      speakText('Voice guidance enabled. Tap your answers below to complete emergency assessment.');
    } else {
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        } else {
          Speech.stop();
        }
      } catch {}
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
      // Simulated local speech-to-text (TODO(integration): Local Qwen / ZETIC runtime)
      const transcript = await localTriageAssistant.transcribeAudioClip('mock-audio-buffer');
      setVoiceTranscript(transcript);
      // Auto-populate based on transcript
      setConsciousness('Fully conscious');
      setBreathingDifficulty(true);
      setPainLevel(8);
      setMobility('Immobilized');
      setInjuryLocation('Right leg and ankle');
      if (isVoiceGuidanceEnabled) {
        speakText('Transcript received. Critical warning signs detected. Review assessment below.');
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
        'Triage Assessment Recorded',
        `Structured assessment saved to local SQLite. Priority: ${evaluation.priority.toUpperCase()}.\n\nEscalation: ${evaluation.recommendedAction}`,
        [
          {
            text: 'View Incident Report',
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Offline AI Voice Triage</Text>
      <Text style={styles.description}>
        Deterministic structured emergency questioning. Critical warning signs trigger immediate escalation rules without waiting for an external LLM response.
      </Text>

      {/* Voice Assistant Simulation Box */}
      <View style={styles.voiceCard}>
        <View style={styles.voiceHeader}>
          <Text style={styles.voiceTitle}>🎙️ Local Voice Assistant (Offline)</Text>
          <Text style={styles.demoBadge}>DEMO</Text>
        </View>

        {voiceTranscript && (
          <View style={styles.transcriptBox}>
            <Text style={styles.transcriptLabel}>AI AUDIO TRANSCRIPT:</Text>
            <Text style={styles.transcriptText}>{voiceTranscript}</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.voiceButton}
          onPress={handleSimulateVoiceInput}
          disabled={isTranscribing}
        >
          {isTranscribing ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.voiceButtonText}>
              {voiceTranscript ? 'Re-run Voice Audio Simulation' : 'Simulate Voice Triage Audio Intake'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Real-time Deterministic Evaluation Banner */}
      <View style={[
        styles.evalBanner,
        evaluation.priority === 'critical' ? styles.evalCritical :
        evaluation.priority === 'high' ? styles.evalHigh : styles.evalMedium
      ]}>
        <View style={styles.evalHeaderRow}>
          <Text style={styles.evalLabel}>DETERMINISTIC RULE ENGINE STATUS:</Text>
          <Text style={styles.evalPriority}>{evaluation.priority.toUpperCase()}</Text>
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
          <Text style={styles.sectionHeading}>Structured Assessment Protocol</Text>
          <TouchableOpacity
            style={[styles.voiceGuidancePill, isVoiceGuidanceEnabled && styles.voiceGuidancePillActive]}
            onPress={handleToggleVoice}
          >
            <Text style={styles.voiceGuidancePillText}>
              {isVoiceGuidanceEnabled ? '🔊 Voice: ON' : '🔈 Voice: OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* 1. Consciousness */}
        <View style={styles.questionBlock}>
          <View style={styles.questionHeaderRow}>
            <Text style={styles.questionTitle}>1. Are you conscious and able to respond?</Text>
            <TouchableOpacity
              style={styles.speakButton}
              onPress={() => speakText('Question 1. Are you conscious and able to respond? Select fully conscious, dazed or unresponsive.')}
            >
              <Text style={styles.speakButtonText}>🔊</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.optionsRow}>
            {(['Fully conscious', 'Dazed / Confused', 'Unresponsive'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[styles.chip, consciousness === opt && styles.chipActive]}
                onPress={() => setConsciousness(opt)}
              >
                <Text style={[styles.chipText, consciousness === opt && styles.chipTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 2. Breathing */}
        <View style={styles.questionBlock}>
          <View style={styles.questionHeaderRow}>
            <Text style={styles.questionTitle}>2. Are you experiencing breathing difficulty?</Text>
            <TouchableOpacity
              style={styles.speakButton}
              onPress={() => speakText('Question 2. Are you experiencing breathing difficulty? Select normal breathing or labored shortness.')}
            >
              <Text style={styles.speakButtonText}>🔊</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.chip, !breathingDifficulty && styles.chipActive]}
              onPress={() => setBreathingDifficulty(false)}
            >
              <Text style={[styles.chipText, !breathingDifficulty && styles.chipTextActive]}>Normal breathing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.chip, breathingDifficulty && styles.chipActiveCritical]}
              onPress={() => setBreathingDifficulty(true)}
            >
              <Text style={[styles.chipText, breathingDifficulty && styles.chipTextActive]}>Labored / Shortness</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 3. Bleeding */}
        <View style={styles.questionBlock}>
          <View style={styles.questionHeaderRow}>
            <Text style={styles.questionTitle}>3. Are you experiencing visible bleeding?</Text>
            <TouchableOpacity
              style={styles.speakButton}
              onPress={() => speakText('Question 3. Are you experiencing visible bleeding? Select none, minor abrasions, moderate, or severe bleeding.')}
            >
              <Text style={styles.speakButtonText}>🔊</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.optionsRow}>
            {(['None', 'Minor abrasions', 'Moderate', 'Severe bleeding'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.chip,
                  bleeding === opt && (opt === 'Severe bleeding' ? styles.chipActiveCritical : styles.chipActive)
                ]}
                onPress={() => setBleeding(opt)}
              >
                <Text style={[styles.chipText, bleeding === opt && styles.chipTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 4. Injury Location */}
        <View style={styles.questionBlock}>
          <View style={styles.questionHeaderRow}>
            <Text style={styles.questionTitle}>4. Where are you injured?</Text>
            <TouchableOpacity
              style={styles.speakButton}
              onPress={() => speakText('Question 4. Where are you injured? Enter the affected body areas.')}
            >
              <Text style={styles.speakButtonText}>🔊</Text>
            </TouchableOpacity>
          </View>
          <TextInput
            style={styles.textInput}
            value={injuryLocation}
            onChangeText={setInjuryLocation}
            placeholder="e.g. Right knee, chest, head"
            placeholderTextColor="#64748B"
          />
        </View>

        {/* 5. Mobility */}
        <View style={styles.questionBlock}>
          <View style={styles.questionHeaderRow}>
            <Text style={styles.questionTitle}>5. Can you move and walk safely?</Text>
            <TouchableOpacity
              style={styles.speakButton}
              onPress={() => speakText('Question 5. Can you move and walk safely? Select full mobility, limited pain on walking, or immobilized.')}
            >
              <Text style={styles.speakButtonText}>🔊</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.optionsRow}>
            {(['Full mobility', 'Limited / Pain on walking', 'Immobilized'] as const).map((opt) => (
              <TouchableOpacity
                key={opt}
                style={[
                  styles.chip,
                  mobility === opt && (opt === 'Immobilized' ? styles.chipActiveCritical : styles.chipActive)
                ]}
                onPress={() => setMobility(opt)}
              >
                <Text style={[styles.chipText, mobility === opt && styles.chipTextActive]}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 6. Pain Level (0 - 10) */}
        <View style={styles.questionBlock}>
          <View style={styles.painHeaderRow}>
            <View style={styles.questionHeaderRow}>
              <Text style={styles.questionTitle}>6. How severe is your pain (0 to 10)?</Text>
              <TouchableOpacity
                style={styles.speakButton}
                onPress={() => speakText('Question 6. How severe is your pain on a scale from 0 to 10?')}
              >
                <Text style={styles.speakButtonText}>🔊</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.painDisplay}>{painLevel} / 10</Text>
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
              >
                <Text style={[styles.painButtonText, painLevel === num && styles.painButtonTextActive]}>
                  {num}
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
      >
        {isSubmitting ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.submitButtonText}>Submit Structured Triage Report</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.disclaimerText}>
        NON-DIAGNOSTIC NOTICE: The offline AI triage assistant provides structured rule-based emergency prioritizing. It does not replace certified clinical or diagnostic medical evaluations.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#020617',
    flexGrow: 1
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
  voiceCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
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
    color: '#F8FAFC'
  },
  demoBadge: {
    fontSize: 9,
    fontWeight: 'bold',
    backgroundColor: '#F59E0B',
    color: '#0F172A',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3
  },
  transcriptBox: {
    backgroundColor: '#020617',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 12
  },
  transcriptLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 4,
    letterSpacing: 0.5
  },
  transcriptText: {
    color: '#E2E8F0',
    fontSize: 12,
    lineHeight: 16
  },
  voiceButton: {
    backgroundColor: '#EA580C',
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
    backgroundColor: '#450A0A',
    borderColor: '#EF4444'
  },
  evalHigh: {
    backgroundColor: '#431407',
    borderColor: '#F97316'
  },
  evalMedium: {
    backgroundColor: '#1E1B4B',
    borderColor: '#6366F1'
  },
  evalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6
  },
  evalLabel: {
    color: '#FCA5A5',
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
    backgroundColor: '#7F1D1D'
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
    color: '#E2E8F0',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4
  },
  formSection: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
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
    color: '#F97316',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  voiceGuidancePill: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#334155'
  },
  voiceGuidancePillActive: {
    backgroundColor: '#15803D',
    borderColor: '#22C55E'
  },
  voiceGuidancePillText: {
    color: '#F8FAFC',
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
    backgroundColor: '#1E293B',
    borderRadius: 4
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
    color: '#F8FAFC',
    marginBottom: 8
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8
  },
  chip: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8
  },
  chipActive: {
    backgroundColor: '#EA580C',
    borderColor: '#FB923C'
  },
  chipActiveCritical: {
    backgroundColor: '#DC2626',
    borderColor: '#F87171'
  },
  chipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '500'
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700'
  },
  textInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 8,
    color: '#FFFFFF',
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
    color: '#F43F5E',
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
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6
  },
  painButtonActive: {
    backgroundColor: '#EA580C',
    borderColor: '#F97316'
  },
  painButtonCritical: {
    backgroundColor: '#DC2626',
    borderColor: '#EF4444'
  },
  painButtonText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700'
  },
  painButtonTextActive: {
    color: '#FFFFFF'
  },
  submitButton: {
    backgroundColor: '#15803D',
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
    color: '#64748B',
    lineHeight: 14,
    textAlign: 'center'
  }
});
