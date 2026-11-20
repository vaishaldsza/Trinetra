import { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafetyStore } from '../../src/store/safetyStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { ColorTokens } from '../../src/theme/tokens';

export default function MobileIncidentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const { activeIncident, cancelSOS, syncNow, isSyncing } = useSafetyStore();

  const isCurrentActive = activeIncident && activeIncident.id === id;

  const handleResolve = async () => {
    if (id) {
      await cancelSOS(id);
      Alert.alert(t('incident_detail.incident_resolved'), t('incident_detail.incident_resolved_desc'));
      router.replace('/(tabs)/home');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('incident_detail.title')}</Text>
        <View style={styles.badgeCritical}>
          <Text style={styles.badgeCriticalText}>{t('incident_detail.critical_sos')}</Text>
        </View>
      </View>

      <Text style={styles.idText}>ID: {id}</Text>

      <View style={styles.card}>
        <Text style={styles.sectionHeading}>{t('incident_detail.section_status')}</Text>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('incident_detail.state_label')}</Text>
          <Text style={styles.metricValue}>
            {isCurrentActive ? activeIncident?.status.toUpperCase() : t('incident_detail.state_recorded')}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('incident_detail.source_label')}</Text>
          <Text style={styles.metricValue}>
            {activeIncident?.detection_source.toUpperCase() || t('incident_detail.source_manual')}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('incident_detail.coords_label')}</Text>
          <Text style={styles.metricValue}>
            {activeIncident?.latitude?.toFixed(4) || '32.3716'}° N,{' '}
            {activeIncident?.longitude?.toFixed(4) || '77.2466'}° E
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('incident_detail.storage_label')}</Text>
          <Text style={[styles.metricValue, { color: colors.success }]}>
            {t('incident_detail.storage_saved')}
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>{t('incident_detail.sync_label')}</Text>
          <Text style={[styles.metricValue, { color: activeIncident?.synced_at ? colors.success : colors.warning }]}>
            {activeIncident?.synced_at ? t('incident_detail.synced_supabase') : t('incident_detail.queued_sync')}
          </Text>
        </View>
      </View>

      {/* Action buttons */}
      <View style={styles.actionsBox}>
        <TouchableOpacity
          style={styles.triageButton}
          onPress={() => router.push('/triage')}
          accessibilityRole="button"
        >
          <Text style={styles.triageButtonText}>{t('incident_detail.open_triage')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.syncButton}
          onPress={syncNow}
          disabled={isSyncing}
          accessibilityRole="button"
        >
          <Text style={styles.syncButtonText}>
            {isSyncing ? t('common.loading') : t('incident_detail.sync_cloud')}
          </Text>
        </TouchableOpacity>

        {isCurrentActive && (
          <TouchableOpacity
            style={styles.resolveButton}
            onPress={handleResolve}
            accessibilityRole="button"
          >
            <Text style={styles.resolveButtonText}>{t('incident_detail.mark_resolved')}</Text>
          </TouchableOpacity>
        )}
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
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text
    },
    badgeCritical: {
      backgroundColor: colors.criticalBadgeBg,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 6
    },
    badgeCriticalText: {
      color: colors.criticalBadgeText,
      fontWeight: '900',
      fontSize: 10
    },
    idText: {
      color: colors.mutedText,
      fontSize: 12,
      fontFamily: 'monospace',
      marginBottom: 16
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 18,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20
    },
    sectionHeading: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 14
    },
    metricRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    metricLabel: {
      color: colors.textSecondary,
      fontSize: 13
    },
    metricValue: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600',
      fontFamily: 'monospace'
    },
    actionsBox: {
      gap: 12
    },
    triageButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center'
    },
    triageButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: '700'
    },
    syncButton: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center'
    },
    syncButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600'
    },
    resolveButton: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.danger,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center'
    },
    resolveButtonText: {
      color: colors.danger,
      fontSize: 14,
      fontWeight: '700'
    }
  });