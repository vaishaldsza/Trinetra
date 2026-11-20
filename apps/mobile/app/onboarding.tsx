import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../src/theme/ThemeContext';
import { ColorTokens } from '../src/theme/tokens';
import { changeAppLanguage, SupportedLanguage } from '../src/i18n';

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const currentLang = (i18n.language || 'en').split('-')[0] as SupportedLanguage;

  const languages: { key: SupportedLanguage; label: string; native: string }[] = [
    { key: 'en', label: 'English', native: 'English' },
    { key: 'hi', label: 'Hindi', native: 'हिन्दी' },
    { key: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' }
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>{t('onboarding.header')}</Text>
      <Text style={styles.description}>{t('onboarding.description')}</Text>

      {/* First-Launch Language Selector */}
      <View style={styles.langSection}>
        <Text style={styles.langSectionTitle}>{t('onboarding.choose_language')}</Text>
        <View style={styles.langButtonRow}>
          {languages.map((item) => {
            const isSelected = currentLang === item.key;
            return (
              <TouchableOpacity
                key={item.key}
                style={[styles.langChip, isSelected && styles.langChipActive]}
                onPress={() => changeAppLanguage(item.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.langChipText, isSelected && styles.langChipTextActive]}>
                  {item.native}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('onboarding.feature1_title')}</Text>
        <Text style={styles.cardBody}>{t('onboarding.feature1_desc')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('onboarding.feature2_title')}</Text>
        <Text style={styles.cardBody}>{t('onboarding.feature2_desc')}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('onboarding.feature3_title')}</Text>
        <Text style={styles.cardBody}>{t('onboarding.feature3_desc')}</Text>
      </View>

      <TouchableOpacity
        style={styles.continueButton}
        onPress={() => router.replace('/login')}
        accessibilityRole="button"
      >
        <Text style={styles.buttonText}>{t('onboarding.continue_btn')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      padding: 24,
      backgroundColor: colors.background,
      flexGrow: 1,
      justifyContent: 'center'
    },
    header: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 8
    },
    description: {
      fontSize: 14,
      color: colors.mutedText,
      marginBottom: 20,
      lineHeight: 20
    },
    langSection: {
      marginBottom: 20,
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 14,
      borderWidth: 1,
      borderColor: colors.border
    },
    langSectionTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 10,
      textTransform: 'uppercase',
      letterSpacing: 0.5
    },
    langButtonRow: {
      flexDirection: 'row',
      gap: 8
    },
    langChip: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center'
    },
    langChipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceElevated
    },
    langChipText: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary
    },
    langChipTextActive: {
      color: colors.primary,
      fontWeight: '700'
    },
    card: {
      backgroundColor: colors.surface,
      padding: 16,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 14
    },
    cardTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary,
      marginBottom: 6
    },
    cardBody: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18
    },
    continueButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 12,
      alignItems: 'center',
      marginTop: 12
    },
    buttonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700'
    }
  });