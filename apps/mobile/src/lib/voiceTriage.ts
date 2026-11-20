import { Platform } from 'react-native';
import * as Speech from 'expo-speech';
import i18n, { getCurrentLanguage, SupportedLanguage } from '../i18n';

export interface VoicePlaybackResult {
  success: boolean;
  fallbackNotice?: string;
}

export function getVoiceLanguageTag(lang?: SupportedLanguage): string {
  const code = lang || getCurrentLanguage();
  switch (code) {
    case 'hi':
      return 'hi-IN';
    case 'kn':
      return 'kn-IN';
    default:
      return 'en-US';
  }
}

/**
 * Speaks the text aloud in the target locale (hi-IN, kn-IN, en-US).
 * Checks available voices on the device. If the voice for that language is unavailable,
 * falls back to text gracefully, returns a notice, and never crashes.
 */
export async function speakTriageText(
  text: string,
  lang?: SupportedLanguage,
  onNotice?: (notice: string) => void
): Promise<VoicePlaybackResult> {
  const langTag = getVoiceLanguageTag(lang);

  try {
    // 1. Web speech synthesis fallback
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = langTag;
        window.speechSynthesis.speak(utterance);
        return { success: true };
      }
      const notice = i18n.t('triage.voice_unavailable');
      onNotice?.(notice);
      return {
        success: false,
        fallbackNotice: notice
      };
    }

    // 2. Native Expo Speech on iOS / Android
    const isSpeaking = await Speech.isSpeakingAsync();
    if (isSpeaking) {
      await Speech.stop();
    }

    // Check available voices on the device
    try {
      const availableVoices = await Speech.getAvailableVoicesAsync();
      if (availableVoices && availableVoices.length > 0) {
        const langPrefix = langTag.slice(0, 2).toLowerCase();
        const hasMatchingVoice = availableVoices.some(
          v => v.language && v.language.toLowerCase().startsWith(langPrefix)
        );

        if (!hasMatchingVoice) {
          // No voice installed for this language on device
          const notice = i18n.t('triage.voice_unavailable');
          onNotice?.(notice);
          return {
            success: false,
            fallbackNotice: notice
          };
        }
      }
    } catch {
      // If voice inspection fails, attempt speak with standard try/catch
    }

    Speech.speak(text, {
      language: langTag,
      rate: 0.95
    });

    return { success: true };
  } catch (err) {
    // Graceful fallback to text, never crash
    const notice = i18n.t('triage.voice_unavailable');
    onNotice?.(notice);
    return {
      success: false,
      fallbackNotice: notice
    };
  }
}

export async function stopTriageSpeech(): Promise<void> {
  try {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    } else {
      await Speech.stop();
    }
  } catch {
    // Ignored
  }
}
