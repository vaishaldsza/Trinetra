import { useState, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import { useSafetyStore } from '../../src/store/safetyStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { ColorTokens } from '../../src/theme/tokens';

export default function MobileDemoScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

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
          const inc = await triggerSOS('fall' as any, 'fall_detected' as any);
          setStepOutput(`Incident created in SQLite: #${inc.id.slice(0, 8)} (detection_source: fall, is_demo: true)`);
        } else if (step.stepNumber === 4) {
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
          await submitTriage({
            consciousness: 'Unresponsive',
            breathingDifficulty: true,
            bleeding: 'Severe bleeding',
            injuryLocation: 'Head trauma / unresponsive',
            mobility: 'Immobilized',
            painLevel: 10
          });
          setStepOutput(`Critical Escalation Triggered! Priority escalated immediately to CRITICAL.`);
        } else if (step.stepNumber === 4) {
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
      t('settings.reset_demo_btn'),
      t('settings.reset_demo_confirm_desc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.reset_demo_btn'),
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              const res = await resetDemoData();
              Alert.alert(t('common.success'), t('settings.reset_demo_success', { count: res.deletedCount }));
              setActiveScenario(null);
              setStepOutput(null);
            } catch (err: unknown) {
              Alert.alert(t('common.error'), err instanceof Error ? err.message : 'Failed to reset demo data');
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
          <Text style={styles.demoPill}>[{t('common.demo_badge')}]</Text>
        </View>
        <Text style={styles.title}>{t('demo.title')}</Text>
        <Text style={styles.subtitle}>{t('demo.subtitle')}</Text>
      </View>

      {/* Active Scenario Player */}
      {activeScenario && currentStep && (
        <View style={styles.playerCard}>
          <View style={styles.playerHeader}>
            <Text style={styles.playerTitle}>{activeScenario.title}</Text>
            <TouchableOpacity onPress={() => setActiveScenario(null)}>
              <Text style={styles.playerClose}>{t('common.close')}</Text>
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
                {t('demo.scenario_step', { current: currentStep.stepNumber, total: activeScenario.steps.length })}
              </Text>
              {currentStep.dataBadge && (
                <Text style={styles.dataBadge}>{currentStep.dataBadge}</Text>
              )}
            </View>

            <Text style={styles.stepTitle}>{currentStep.title}</Text>
            <Text style={styles.stepNarration}>{currentStep.narration}</Text>

            {/* Action performed */}
            <View style={styles.actionBox}>
              <Text style={styles.actionLabel}>{t('demo.action_label').toUpperCase()}:</Text>
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
                <Text style={styles.payloadLabel}>{t('demo.payload_label').toUpperCase()} [DEMO]:</Text>
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
                accessibilityRole="button"
              >
                {isExecutingStep ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.nextButtonText}>{t('demo.next_step')}</Text>
                )}
              </TouchableOpacity>
            ) : (
              <View style={styles.completedBox}>
                <Text style={styles.completedText}>✓ Scenario Completed Successfully</Text>
                <TouchableOpacity
                  style={styles.completedCloseBtn}
                  onPress={() => setActiveScenario(null)}
                  accessibilityRole="button"
                >
                  <Text style={styles.completedCloseBtnText}>{t('common.ok')}</Text>
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
              accessibilityRole="button"
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
        <Text style={styles.resetCardTitle}>{t('settings.reset_demo_btn')}</Text>
        <Text style={styles.resetCardDesc}>{t('settings.demo_mode_desc')}</Text>
        <TouchableOpacity
          style={styles.resetCardButton}
          onPress={handleResetDemoData}
          disabled={isResetting}
          accessibilityRole="button"
        >
          <Text style={styles.resetCardButtonText}>
            {isResetting ? 'Purging SQLite Rows...' : t('settings.reset_demo_btn')}
          </Text>
        </TouchableOpacity>
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
      backgroundColor: colors.primary,
      color: '#FFFFFF',
      fontSize: 10,
      fontWeight: '900',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      letterSpacing: 0.5
    },
    demoPill: {
      backgroundColor: colors.surfaceElevated,
      color: colors.primary,
      fontSize: 10,
      fontWeight: '700',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 4
    },
    subtitle: {
      fontSize: 12,
      color: colors.mutedText,
      lineHeight: 18
    },
    playerCard: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      borderWidth: 2,
      borderColor: colors.primary,
      marginBottom: 24,
      elevation: 4
    },
    playerHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12
    },
    playerTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
      flex: 1
    },
    playerClose: {
      color: colors.mutedText,
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
      backgroundColor: colors.primary
    },
    progressSegmentInactive: {
      backgroundColor: colors.surfaceElevated
    },
    stepBox: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border,
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
      color: colors.primary,
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.5
    },
    dataBadge: {
      backgroundColor: colors.surface,
      color: colors.primary,
      fontSize: 9,
      fontFamily: 'monospace',
      fontWeight: '700',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4
    },
    stepTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
      marginBottom: 6
    },
    stepNarration: {
      color: colors.textSecondary,
      fontSize: 13,
      lineHeight: 19,
      marginBottom: 12
    },
    actionBox: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 8,
      marginBottom: 8
    },
    actionLabel: {
      color: colors.mutedText,
      fontSize: 9,
      fontWeight: '800',
      marginBottom: 2
    },
    actionText: {
      color: colors.text,
      fontSize: 11
    },
    outputBox: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 8,
      borderWidth: 1,
      borderColor: colors.success,
      marginBottom: 8
    },
    outputLabel: {
      color: colors.success,
      fontSize: 9,
      fontWeight: '800',
      marginBottom: 2
    },
    outputText: {
      color: colors.text,
      fontSize: 11
    },
    payloadBox: {
      backgroundColor: colors.surface,
      borderRadius: 8,
      padding: 8
    },
    payloadLabel: {
      color: colors.warning,
      fontSize: 9,
      fontWeight: '800',
      marginBottom: 2
    },
    payloadCode: {
      color: colors.textSecondary,
      fontSize: 10,
      fontFamily: 'monospace'
    },
    controlsRow: {
      flexDirection: 'row',
      justifyContent: 'flex-end'
    },
    nextButton: {
      backgroundColor: colors.primary,
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
      color: colors.success,
      fontSize: 12,
      fontWeight: '800'
    },
    completedCloseBtn: {
      backgroundColor: colors.surfaceElevated,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 6
    },
    completedCloseBtnText: {
      color: colors.text,
      fontSize: 11,
      fontWeight: '700'
    },
    sectionHeading: {
      color: colors.text,
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
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border
    },
    scenarioCardActive: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceElevated
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
      backgroundColor: colors.primary,
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
      color: colors.text,
      fontSize: 14,
      fontWeight: '700',
      marginBottom: 2
    },
    scenarioCardSubtitle: {
      color: colors.mutedText,
      fontSize: 11,
      lineHeight: 16
    },
    scenarioCardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 10
    },
    stepsCount: {
      color: colors.mutedText,
      fontSize: 10,
      fontWeight: '600'
    },
    tapToRun: {
      color: colors.primary,
      fontSize: 11,
      fontWeight: '700'
    },
    resetCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.borderStrong
    },
    resetCardTitle: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '800',
      marginBottom: 4
    },
    resetCardDesc: {
      color: colors.mutedText,
      fontSize: 11,
      lineHeight: 16,
      marginBottom: 12
    },
    resetCardButton: {
      backgroundColor: colors.danger,
      borderRadius: 8,
      paddingVertical: 10,
      alignItems: 'center'
    },
    resetCardButtonText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '700'
    }
  });