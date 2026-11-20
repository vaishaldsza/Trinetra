import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { DEMO_SCENARIOS, DemoScenarioDefinition, DemoScenarioStep } from '@trinetra/shared';
import { useSafetyStore } from '../../src/store/safetyStore';

export default function MobileDemoScreen() {
  const router = useRouter();
  const {
    triggerSOS,
    submitTriage,
    recordVitalReading,
    resetDemoData,
    toggleSimulatedOffline,
    syncNow,
    syncCounts,
    isDemoMode,
    activeIncident
  } = useSafetyStore();

  const [activeScenario, setActiveScenario] = useState<DemoScenarioDefinition | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isExecutingStep, setIsExecutingStep] = useState(false);
  const [stepOutput, setStepOutput] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const startScenario = (scenario: DemoScenarioDefinition) => {
    setActiveScenario(scenario);
    setCurrentStepIndex(0);
    setStepOutput(null);
  };

  const executeCurrentStepAction = async (step: DemoScenarioStep, scenarioId: string) => {
    setIsExecutingStep(true);
    try {
      if (scenarioId === 'hiking_fall') {
        if (step.stepNumber === 3) {
          // Trigger SOS via fall detection path
          const inc = await triggerSOS(
            'fall' as any,
            'fall_detected' as any
          );
          setStepOutput(`Incident created in SQLite: #${inc.id.slice(0, 8)} (detection_source: fall, is_demo: true)`);
        } else if (step.stepNumber === 4) {
          // Submit structured triage
          const tri = await submitTriage({
            consciousness: 'Fully conscious',
            breathingDifficulty: false,
            bleeding: 'Minor abrasions',
            injuryLocation: 'Right ankle / suspected fracture',
            mobility: 'Immobilized',
            painLevel: 8
          });
          setStepOutput(`Triage recorded: Consciousness=Fully conscious, Pain=8/10, Summary="${tri.assessment_summary.slice(0, 50)}..."`);
        }
      } else if (scenarioId === 'critical_emergency') {
        if (step.stepNumber === 3) {
          // Critical triage escalates instantly
          const tri = await submitTriage({
            consciousness: 'Unresponsive',
            breathingDifficulty: true,
            bleeding: 'Severe bleeding',
            injuryLocation: 'Head trauma / unresponsive',
            mobility: 'Immobilized',
            painLevel: 10
          });
          setStepOutput(`Critical Escalation Triggered! Priority escalated immediately to CRITICAL.`);
        } else if (step.stepNumber === 4) {
          // Log PPG Vitals estimate (44 bpm simulated value, non-diagnostic)
          const vital = await recordVitalReading(44, 0.88, true);
          setStepOutput(`Optical PPG reading saved: ${vital.heart_rate_estimate} BPM (simulated value, non-diagnostic [DEMO])`);
        }
      } else if (scenarioId === 'remote_trail') {
        if (step.stepNumber === 1) {
          toggleSimulatedOffline(true);
          setStepOutput(`Simulated network: DISCONNECTED. Cloud calls will be suppressed locally.`);
        } else if (step.stepNumber === 2) {
          const inc = await triggerSOS('manual' as any, 'manual_sos' as any);
          await submitTriage({
            consciousness: 'Fully conscious',
            breathingDifficulty: false,
            bleeding: 'None',
            injuryLocation: 'Lost orientation / nightfall',
            mobility: 'Limited / Pain on walking',
            painLevel: 2
          });
          setStepOutput(`Distress saved to local SQLite while offline: #${inc.id.slice(0, 8)}.`);
        } else if (step.stepNumber === 4) {
          toggleSimulatedOffline(false);
          setStepOutput(`Simulated network: RECONNECTED. Automatic sync primed.`);
        } else if (step.stepNumber === 5) {
          await syncNow();
          setStepOutput(`Sync cycle processed. Mutations queued for cloud sync: ${syncCounts.pending} pending, ${syncCounts.synced} synced.`);
        }
      } else if (scenarioId === 'rescue_coordination') {
        if (step.stepNumber === 5) {
          setStepOutput(`[DEMO GUARD ACTIVE] External Twilio SMS and ElevenLabs voice delivery completely intercepted and marked SIMULATED. 0 external charges.`);
        }
      }
    } catch (err: unknown) {
      setStepOutput(err instanceof Error ? err.message : 'Step executed with mock simulation.');
    } finally {
      setIsExecutingStep(false);
    }
  };

  const handleNextStep = async () => {
    if (!activeScenario) return;
    const nextIdx = currentStepIndex + 1;
    if (nextIdx < activeScenario.steps.length) {
      setCurrentStepIndex(nextIdx);
      await executeCurrentStepAction(activeScenario.steps[nextIdx], activeScenario.id);
    }
  };

  const handleResetDemoData = () => {
    Alert.alert(
      'Reset Demo Data',
      'This will delete all demo incidents, demo vitals, and demo triage records from local SQLite. Real hiker logs remain untouched.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Demo Data',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              const res = await resetDemoData();
              Alert.alert('Success', `Purged ${res.deletedCount} demo record(s) from local SQLite.`);
              setActiveScenario(null);
              setStepOutput(null);
            } catch (err: unknown) {
              Alert.alert('Error', err instanceof Error ? err.message : 'Failed to reset demo data');
            } finally {
              setIsResetting(false);
            }
          }
        }
      ]
    );
  };

  const currentStep = activeScenario ? activeScenario.steps[currentStepIndex] : null;
  const isLastStep = activeScenario ? currentStepIndex === activeScenario.steps.length - 1 : false;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBadgeRow}>
          <Text style={styles.headerBadge}>OFFLINE SIMULATOR</Text>
          <Text style={styles.demoPill}>[DEMO MODE]</Text>
        </View>
        <Text style={styles.title}>Emergency Scenarios</Text>
        <Text style={styles.subtitle}>
          One-tap scripted walkthroughs demonstrating offline fall detection, voice triage, network severance recovery, and SAR coordination.
        </Text>
      </View>

      {/* Active Scenario Player */}
      {activeScenario && currentStep && (
        <View style={styles.playerCard}>
          <View style={styles.playerHeader}>
            <Text style={styles.playerTitle}>{activeScenario.title}</Text>
            <TouchableOpacity onPress={() => setActiveScenario(null)}>
              <Text style={styles.playerClose}>Exit</Text>
            </TouchableOpacity>
          </View>

          {/* Progress Indicator */}
          <View style={styles.progressRow}>
            {activeScenario.steps.map((s, idx) => (
              <View
                key={s.stepNumber}
                style={[
                  styles.progressSegment,
                  idx <= currentStepIndex ? styles.progressSegmentActive : styles.progressSegmentInactive
                ]}
              />
            ))}
          </View>

          {/* Step Detail */}
          <View style={styles.stepBox}>
            <View style={styles.stepHeaderRow}>
              <Text style={styles.stepNumberBadge}>
                STEP {currentStep.stepNumber} OF {activeScenario.steps.length}
              </Text>
              {currentStep.dataBadge && (
                <Text style={styles.dataBadge}>{currentStep.dataBadge}</Text>
              )}
            </View>

            <Text style={styles.stepTitle}>{currentStep.title}</Text>
            <Text style={styles.stepNarration}>{currentStep.narration}</Text>

            {/* Action performed */}
            <View style={styles.actionBox}>
              <Text style={styles.actionLabel}>ACTION:</Text>
              <Text style={styles.actionText}>{currentStep.simulatedAction}</Text>
            </View>

            {/* Step Output Message */}
            {stepOutput && (
              <View style={styles.outputBox}>
                <Text style={styles.outputLabel}>LOCAL OUTPUT [DEMO]:</Text>
                <Text style={styles.outputText}>{stepOutput}</Text>
              </View>
            )}

            {/* Payload summary if available */}
            {currentStep.payloadSummary && (
              <View style={styles.payloadBox}>
                <Text style={styles.payloadLabel}>PAYLOAD [DEMO]:</Text>
                <Text style={styles.payloadCode}>
                  {JSON.stringify(currentStep.payloadSummary, null, 2)}
                </Text>
              </View>
            )}
          </View>

          {/* Step Controls */}
          <View style={styles.controlsRow}>
            {!isLastStep ? (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={handleNextStep}
                disabled={isExecutingStep}
              >
                {isExecutingStep ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.nextButtonText}>Next Step →</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.completedBox}>
                <Text style={styles.completedText}>✓ Scenario Completed Successfully</Text>
                <TouchableOpacity
                  style={styles.completedCloseBtn}
                  onPress={() => setActiveScenario(null)}
                >
                  <Text style={styles.completedCloseBtnText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      )}

      {/* Scenario Selection Cards */}
      <Text style={styles.sectionHeading}>Available Scripted Scenarios</Text>

      <View style={styles.scenarioList}>
        {DEMO_SCENARIOS.map((sc, index) => {
          const isActive = activeScenario?.id === sc.id;
          return (
            <TouchableOpacity
              key={sc.id}
              style={[styles.scenarioCard, isActive && styles.scenarioCardActive]}
              onPress={() => startScenario(sc)}
            >
              <View style={styles.scenarioCardHeader}>
                <View style={styles.scenarioNumberCircle}>
                  <Text style={styles.scenarioNumberText}>{index + 1}</Text>
                </View>
                <View style={styles.scenarioCardTitleBox}>
                  <Text style={styles.scenarioCardTitle}>{sc.title}</Text>
                  <Text style={styles.scenarioCardSubtitle}>{sc.subtitle}</Text>
                </View>
              </View>

              <View style={styles.scenarioCardFooter}>
                <Text style={styles.stepsCount}>{sc.steps.length} Steps · ~{sc.estimatedDurationSec}s Walkthrough</Text>
                <Text style={styles.tapToRun}>Tap to Run →</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Reset Demo Data Action */}
      <View style={styles.resetCard}>
        <Text style={styles.resetCardTitle}>Reset Demo Data</Text>
        <Text style={styles.resetCardDesc}>
          Purges simulated incidents, demo vitals, and mock triage assessments from offline SQLite without removing real hiking sessions or personal safety profiles.
        </Text>
        <TouchableOpacity
          style={styles.resetCardButton}
          onPress={handleResetDemoData}
          disabled={isResetting}
        >
          <Text style={styles.resetCardButtonText}>
            {isResetting ? 'Purging SQLite Rows...' : 'Reset Demo Data (Deletes Demo Rows Only)'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#020617',
    flexGrow: 1
  },
  header: {
    marginBottom: 20
  },
  headerBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  headerBadge: {
    backgroundColor: '#EA580C',
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    letterSpacing: 0.5
  },
  demoPill: {
    backgroundColor: '#334155',
    color: '#FBBF24',
    fontSize: 10,
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18
  },
  playerCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: '#EA580C',
    marginBottom: 24,
    shadowColor: '#EA580C',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4
  },
  playerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  playerTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    flex: 1
  },
  playerClose: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 4
  },
  progressRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2
  },
  progressSegmentActive: {
    backgroundColor: '#EA580C'
  },
  progressSegmentInactive: {
    backgroundColor: '#334155'
  },
  stepBox: {
    backgroundColor: '#020617',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 14
  },
  stepHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
    gap: 6
  },
  stepNumberBadge: {
    color: '#EA580C',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5
  },
  dataBadge: {
    backgroundColor: '#1E293B',
    color: '#38BDF8',
    fontSize: 9,
    fontFamily: 'monospace',
    fontWeight: '700',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  stepTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 6
  },
  stepNarration: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 12
  },
  actionBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8
  },
  actionLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2
  },
  actionText: {
    color: '#E2E8F0',
    fontSize: 11
  },
  outputBox: {
    backgroundColor: '#064E3B',
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    borderColor: '#059669',
    marginBottom: 8
  },
  outputLabel: {
    color: '#6EE7B7',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2
  },
  outputText: {
    color: '#ECFDF5',
    fontSize: 11
  },
  payloadBox: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 8
  },
  payloadLabel: {
    color: '#F59E0B',
    fontSize: 9,
    fontWeight: '800',
    marginBottom: 2
  },
  payloadCode: {
    color: '#FDE68A',
    fontSize: 10,
    fontFamily: 'monospace'
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  nextButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 8
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  completedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 4
  },
  completedText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '800'
  },
  completedCloseBtn: {
    backgroundColor: '#334155',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6
  },
  completedCloseBtnText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700'
  },
  sectionHeading: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12
  },
  scenarioList: {
    gap: 12,
    marginBottom: 24
  },
  scenarioCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  scenarioCardActive: {
    borderColor: '#EA580C',
    backgroundColor: '#1E293B'
  },
  scenarioCardHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10
  },
  scenarioNumberCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EA580C',
    alignItems: 'center',
    justifyContent: 'center'
  },
  scenarioNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900'
  },
  scenarioCardTitleBox: {
    flex: 1
  },
  scenarioCardTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2
  },
  scenarioCardSubtitle: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16
  },
  scenarioCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
    paddingTop: 10
  },
  stepsCount: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600'
  },
  tapToRun: {
    color: '#EA580C',
    fontSize: 11,
    fontWeight: '700'
  },
  resetCard: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#7F1D1D'
  },
  resetCardTitle: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4
  },
  resetCardDesc: {
    color: '#94A3B8',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 12
  },
  resetCardButton: {
    backgroundColor: '#7F1D1D',
    borderWidth: 1,
    borderColor: '#DC2626',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center'
  },
  resetCardButtonText: {
    color: '#FEE2E2',
    fontSize: 12,
    fontWeight: '700'
  }
});
