import {
  IncidentPriority,
  TriageAssessment
} from '@trinetra/shared';

export interface TriageInput {
  consciousness: 'Fully conscious' | 'Dazed / Confused' | 'Unresponsive';
  breathingDifficulty: boolean;
  bleeding: 'None' | 'Minor abrasions' | 'Moderate' | 'Severe bleeding';
  injuryLocation: string;
  mobility: 'Full mobility' | 'Limited / Pain on walking' | 'Immobilized';
  painLevel: number; // 0 - 10
  additionalNotes?: string;
}

export interface RuleEngineResult {
  priority: IncidentPriority;
  criticalWarningSigns: string[];
  recommendedAction: string;
  summaryText: string;
}

/**
 * Deterministic Emergency Triage Rule Engine
 * 
 * Evaluates physiological and trauma indicators immediately on-device.
 * Guarantees that critical life-threatening conditions escalate without waiting on external LLMs or networks.
 */
export function evaluateTriageRules(input: TriageInput): RuleEngineResult {
  const warningSigns: string[] = [];
  let priority = IncidentPriority.LOW;

  // 1. Consciousness Evaluation
  if (input.consciousness === 'Unresponsive') {
    priority = IncidentPriority.CRITICAL;
    warningSigns.push('Unconsciousness / unresponsiveness');
  } else if (input.consciousness === 'Dazed / Confused') {
    priority = IncidentPriority.CRITICAL;
    warningSigns.push('Altered mental state / possible concussion');
  }

  // 2. Respiratory Evaluation
  if (input.breathingDifficulty) {
    priority = IncidentPriority.CRITICAL;
    warningSigns.push('Acute breathing difficulty / hypoxia risk');
  }

  // 3. Bleeding & Circulation
  if (input.bleeding === 'Severe bleeding') {
    priority = IncidentPriority.CRITICAL;
    warningSigns.push('Severe hemorrhaging risk');
  } else if (input.bleeding === 'Moderate' && priority !== IncidentPriority.CRITICAL) {
    priority = IncidentPriority.HIGH;
    warningSigns.push('Significant blood loss observed');
  }

  // 4. Mobility & Musculoskeletal
  if (input.mobility === 'Immobilized' && priority !== IncidentPriority.CRITICAL) {
    priority = IncidentPriority.HIGH;
    warningSigns.push('Hiker immobilized / suspected fracture or spinal risk');
  }

  // 5. Pain Level (0 - 10)
  if (input.painLevel >= 8) {
    if (priority !== IncidentPriority.CRITICAL) priority = IncidentPriority.HIGH;
    warningSigns.push(`Severe pain intensity (${input.painLevel}/10)`);
  } else if (input.painLevel >= 5 && priority === IncidentPriority.LOW) {
    priority = IncidentPriority.MEDIUM;
  }

  let recommendedAction = 'Continue observation and maintain safe location.';
  if (priority === IncidentPriority.CRITICAL) {
    recommendedAction = 'IMMEDIATE RESCUE DISPATCH REQUIRED: Keep patient stationary, maintain airway, apply direct pressure to wounds.';
  } else if (priority === IncidentPriority.HIGH) {
    recommendedAction = 'URGENT MEDICAL ASSISTANCE: Do not attempt to walk on injured limbs, stay insulated from cold ground.';
  } else if (priority === IncidentPriority.MEDIUM) {
    recommendedAction = 'FIRST AID SUPPORT: Rest, hydrate, and prepare extraction if symptoms deteriorate.';
  }

  const summaryText = `[DEMO] Triage assessment completed. Consciousness: ${input.consciousness}. Breathing difficulty: ${
    input.breathingDifficulty ? 'YES' : 'NO'
  }. Bleeding: ${input.bleeding}. Injury: ${input.injuryLocation || 'Unspecified'}. Mobility: ${
    input.mobility
  }. Pain: ${input.painLevel}/10. Priority: ${priority.toUpperCase()}.`;

  return {
    priority,
    criticalWarningSigns: warningSigns,
    recommendedAction,
    summaryText
  };
}

/**
 * Local AI Assistant Interface
 * 
 * TODO(integration): Local Qwen model family runtime / ZETIC SDK integration
 * Connect local on-device small language model when runtime dependencies are approved.
 */
export interface LocalTriageAssistant {
  generateStructuredSummary(input: TriageInput): Promise<string>;
  transcribeAudioClip(audioBase64: string): Promise<string>;
}

export class MockLocalTriageAssistant implements LocalTriageAssistant {
  async generateStructuredSummary(input: TriageInput): Promise<string> {
    // Simulated local SLM output (Non-diagnostic)
    const ruleEvaluation = evaluateTriageRules(input);
    return `[DEMO LOCAL-AI]: ${ruleEvaluation.summaryText} Primary escalation pathway: ${ruleEvaluation.recommendedAction}`;
  }

  async transcribeAudioClip(_audioBase64: string): Promise<string> {
    // Simulated offline voice transcription
    return '[DEMO STT]: Hiker reported falling down a rocky incline, experiencing severe leg pain and difficulty breathing.';
  }
}

export const localTriageAssistant = new MockLocalTriageAssistant();

/**
 * Environmental Audio Intelligence Interface
 * 
 * TODO(integration): YAMNet audio classification model integration
 * Connect TensorFlow Lite YAMNet model for permission-based sound detection.
 */
export interface AudioDistressClassifier {
  classifyAudioBuffer(samples: Float32Array): Promise<{ category: string; confidence: number }>;
}

export class MockAudioDistressClassifier implements AudioDistressClassifier {
  async classifyAudioBuffer(_samples: Float32Array): Promise<{ category: string; confidence: number }> {
    // Simulated YAMNet classification
    return { category: 'Human distress sound / cry for help', confidence: 0.84 };
  }
}

export const audioDistressClassifier = new MockAudioDistressClassifier();
