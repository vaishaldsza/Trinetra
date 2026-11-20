import { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafetyStore } from '../src/store/safetyStore';
import { useTheme } from '../src/theme/ThemeContext';
import { ColorTokens } from '../src/theme/tokens';
import { formatDate, SupportedLanguage } from '../src/i18n';

export default function HistoryScreen() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currentLang = (i18n.language || 'en').split('-')[0] as SupportedLanguage;

  const { pastSessions } = useSafetyStore();

  const calculateDuration = (startStr: string, endStr?: string | null) => {
    if (!endStr) return t('history.active');
    try {
      const diffMs = new Date(endStr).getTime() - new Date(startStr).getTime();
      const mins = Math.max(1, Math.round(diffMs / 60000));
      if (mins >= 60) {
        const hrs = Math.floor(mins / 60);
        const remMins = mins % 60;
        return `${hrs}h ${remMins}m`;
      }
      return `${mins}m`;
    } catch {
      return '--';
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('history.title')}</Text>
      <Text style={styles.description}>{t('history.description')}</Text>

      {pastSessions.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🏔️</Text>
          <Text style={styles.emptyHeading}>{t('history.empty_heading')}</Text>
          <Text style={styles.emptyText}>{t('history.empty_text')}</Text>
        </View>
      ) : (
        <View style={styles.list}>
          {pastSessions.map((session) => {
            const loc = session.start_location as { trail?: string; altitude_m?: number } | undefined;
            return (
              <View key={session.id} style={styles.sessionCard}>
                <View style={styles.row}>
                  <Text style={styles.trail}>
                    {loc?.trail || t('history.mountain_trail')}
                  </Text>
                  <Text style={styles.badge}>{t('history.completed')}</Text>
                </View>

                <Text style={styles.date}>
                  {formatDate(session.start_time, currentLang)} · {calculateDuration(session.start_time, session.end_time)}
                  {loc?.altitude_m ? ` ${t('history.altitude_m', { altitude: loc.altitude_m })}` : ''}
                </Text>

                <Text style={styles.meta}>
                  {t('history.persisted_sqlite', { id: session.id.slice(0, 8) })}
                </Text>
              </View>
            );
          })}
        </View>
      )}
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
      marginBottom: 20
    },
    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 28,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 20
    },
    emptyEmoji: {
      fontSize: 40,
      marginBottom: 10
    },
    emptyHeading: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 6
    },
    emptyText: {
      fontSize: 12,
      color: colors.mutedText,
      textAlign: 'center',
      lineHeight: 18,
      maxWidth: 260
    },
    list: {
      gap: 12
    },
    sessionCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4
    },
    trail: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text
    },
    badge: {
      fontSize: 10,
      fontWeight: 'bold',
      color: colors.success,
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border
    },
    date: {
      fontSize: 12,
      color: colors.mutedText,
      marginBottom: 4
    },
    meta: {
      fontSize: 11,
      color: colors.mutedText,
      fontFamily: 'monospace'
    }
  });