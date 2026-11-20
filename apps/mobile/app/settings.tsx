import { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafetyStore } from '../src/store/safetyStore';
import { getFailedSyncItems, SyncQueueItem } from '../src/lib/db';
import { useTheme } from '../src/theme/ThemeContext';
import { ColorTokens, ThemePreference } from '../src/theme/tokens';
import { changeAppLanguage, SupportedLanguage } from '../src/i18n';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors, themePreference, setThemePreference } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    profile,
    updateProfile,
    syncCounts,
    syncNow,
    isSyncing,
    isDemoMode,
    toggleDemoMode,
    resetDemoData
  } = useSafetyStore();

  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone || '');
  const [isEditing, setIsEditing] = useState(false);
  const [failedItems, setFailedItems] = useState<SyncQueueItem[]>([]);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    getFailedSyncItems().then(setFailedItems).catch(() => {});
  }, [syncCounts, isSyncing]);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert(t('common.error'), 'Full name is required.');
      return;
    }
    const result = await updateProfile(fullName.trim(), phone.trim());
    if (!result.success) {
      Alert.alert(t('common.error'), result.error || 'Invalid profile information');
      return;
    }
    setIsEditing(false);
    Alert.alert('Profile Saved', 'Profile updated locally in SQLite and queued for cloud sync.');
  };

  const handleResetDemo = () => {
    Alert.alert(
      t('demo.resetTitle'),
      t('demo.resetConfirmDesc'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('settings.resetDemoData'),
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              const res = await resetDemoData();
              Alert.alert(t('demo.resetSuccessTitle'), t('demo.resetSuccessDesc', { count: res.deletedCount }));
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

  const themeOptions: { key: ThemePreference; label: string; icon: string }[] = [
    { key: 'light', label: t('settings.themeLight'), icon: '☀️' },
    { key: 'dark', label: t('settings.themeDark'), icon: '🌙' },
    { key: 'system', label: t('settings.themeSystem'), icon: '📱' }
  ];

  const languageOptions: { key: SupportedLanguage; label: string; sub: string }[] = [
    { key: 'en', label: 'English', sub: 'English (US/UK)' },
    { key: 'hi', label: 'हिन्दी', sub: 'Hindi' },
    { key: 'kn', label: 'ಕನ್ನಡ', sub: 'Kannada' }
  ];

  const currentLang = (i18n.language || 'en').split('-')[0] as SupportedLanguage;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t('settings.title')}</Text>
      <Text style={styles.description}>{t('settings.description')}</Text>

      {/* Theme Selection Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('settings.theme')}</Text>
        <View style={styles.optionRow}>
          {themeOptions.map((opt) => {
            const isSelected = themePreference === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.choiceButton, isSelected && styles.choiceButtonActive]}
                onPress={() => setThemePreference(opt.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={styles.choiceIcon}>{opt.icon}</Text>
                <Text style={[styles.choiceLabel, isSelected && styles.choiceLabelActive]}>
                  {opt.label}
                </Text>
                {isSelected && <Text style={styles.checkMark}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Language Selection Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
        <View style={styles.langList}>
          {languageOptions.map((opt) => {
            const isSelected = currentLang === opt.key;
            return (
              <TouchableOpacity
                key={opt.key}
                style={[styles.langItem, isSelected && styles.langItemActive]}
                onPress={() => changeAppLanguage(opt.key)}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
              >
                <View>
                  <Text style={[styles.langMainText, isSelected && styles.langMainTextActive]}>
                    {opt.label}
                  </Text>
                  <Text style={styles.langSubText}>{opt.sub}</Text>
                </View>
                <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                  {isSelected && <View style={styles.radioInner} />}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* User Profile Card */}
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <Text style={styles.sectionTitle}>{t('settings.hikerProfile')}</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editLink}>
              {isEditing ? t('settings.cancel') : t('settings.edit')}
            </Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View style={styles.editBox}>
            <Text style={styles.label}>{t('settings.fullName')}</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor={colors.mutedText}
            />

            <Text style={styles.label}>{t('settings.emergencyPhone')}</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91..."
              placeholderTextColor={colors.mutedText}
              keyboardType="phone-pad"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>{t('settings.saveProfile')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{profile.full_name}</Text>
            <Text style={styles.profileEmail}>{profile.email}</Text>
            <Text style={styles.profilePhone}>{profile.phone || t('settings.noPhoneSet')}</Text>
          </View>
        )}
      </View>

      {/* Offline Storage Status Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('settings.offlineStorage')}</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>{t('settings.syncStatus')}</Text>
          <Text
            style={[
              styles.settingValue,
              {
                color: isSyncing
                  ? colors.primary
                  : syncCounts.failed > 0
                  ? colors.danger
                  : syncCounts.pending > 0
                  ? colors.warning
                  : colors.success
              }
            ]}
          >
            {isSyncing
              ? t('settings.syncing')
              : syncCounts.pending > 0
              ? t('settings.pending')
              : t('settings.synced')}
          </Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>{t('settings.pendingMutations')}</Text>
          <Text
            style={[
              styles.settingValue,
              { color: syncCounts.pending > 0 ? colors.warning : colors.success }
            ]}
          >
            {syncCounts.pending}
          </Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>{t('settings.syncedMutations')}</Text>
          <Text style={[styles.settingValue, { color: colors.success }]}>
            {syncCounts.synced}
          </Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>{t('settings.failedAttempts')}</Text>
          <Text
            style={[
              styles.settingValue,
              { color: syncCounts.failed > 0 ? colors.danger : colors.mutedText }
            ]}
          >
            {syncCounts.failed}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.manualSyncButton}
          onPress={syncNow}
          disabled={isSyncing}
        >
          <Text style={styles.manualSyncText}>
            {isSyncing ? t('settings.syncingCloud') : t('settings.triggerSync')}
          </Text>
        </TouchableOpacity>

        {failedItems.length > 0 && (
          <View style={styles.failedListSection}>
            <Text style={styles.failedListHeading}>
              {t('settings.failedOps', { count: failedItems.length })}
            </Text>
            {failedItems.map((item) => (
              <View key={item.id} style={styles.failedItemCard}>
                <View style={styles.failedHeaderRow}>
                  <View style={styles.failedBadge}>
                    <Text style={styles.failedBadgeText}>{item.table_name.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.failedRecordId}>ID: {item.record_id.slice(0, 8)}...</Text>
                  <Text style={styles.failedAttempts}>
                    {t('settings.attempts', { count: item.attempts })}
                  </Text>
                </View>
                <Text style={styles.failedErrorText}>
                  {item.error_message || 'Supabase error during mutation upsert'}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Safety System Guardrails */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>{t('settings.guardrails')}</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>{t('settings.nonDiagnostic')}</Text>
          <Text style={styles.settingValue}>{t('settings.enforced')}</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>{t('settings.manualSosBypass')}</Text>
          <Text style={[styles.settingValue, { color: colors.success }]}>
            {t('settings.activeOffline')}
          </Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>{t('settings.realSmsVoice')}</Text>
          <Text style={[styles.settingValue, { color: colors.warning }]}>
            {t('settings.disabledDemoSafe')}
          </Text>
        </View>
      </View>

      {/* Demo Mode & Scenarios Card */}
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <Text style={styles.sectionTitle}>{t('settings.demoMode')}</Text>
          <Switch
            value={isDemoMode}
            onValueChange={() => toggleDemoMode()}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={isDemoMode ? '#FFFFFF' : colors.mutedText}
          />
        </View>

        {isDemoMode && (
          <View style={styles.demoWarningBox}>
            <Text style={styles.demoWarningText}>{t('settings.demoWarning')}</Text>
          </View>
        )}

        <Text style={styles.demoNoteText}>{t('settings.demoExplanation')}</Text>

        <TouchableOpacity
          style={styles.scenarioButton}
          onPress={() => router.push('/(tabs)/demo')}
        >
          <Text style={styles.scenarioButtonText}>{t('settings.openDemoScenarios')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetDemo}
          disabled={isResetting}
        >
          <Text style={styles.resetButtonText}>
            {isResetting ? t('settings.purgingDemo') : t('settings.resetDemoData')}
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
    card: {
      backgroundColor: colors.surface,
      borderRadius: 14,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 16
    },
    profileHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.primary,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: 12
    },
    optionRow: {
      flexDirection: 'row',
      gap: 8
    },
    choiceButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      paddingHorizontal: 8,
      borderRadius: 8,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border
    },
    choiceButtonActive: {
      borderColor: colors.primary,
      backgroundColor: colors.surfaceElevated
    },
    choiceIcon: {
      fontSize: 14
    },
    choiceLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.textSecondary
    },
    choiceLabelActive: {
      color: colors.primary,
      fontWeight: '700'
    },
    checkMark: {
      color: colors.primary,
      fontWeight: '900',
      fontSize: 12
    },
    langList: {
      gap: 8
    },
    langItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 8,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border
    },
    langItemActive: {
      borderColor: colors.primary
    },
    langMainText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text
    },
    langMainTextActive: {
      color: colors.primary,
      fontWeight: '700'
    },
    langSubText: {
      fontSize: 11,
      color: colors.mutedText,
      marginTop: 2
    },
    radioCircle: {
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      borderColor: colors.borderStrong,
      alignItems: 'center',
      justifyContent: 'center'
    },
    radioCircleActive: {
      borderColor: colors.primary
    },
    radioInner: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: colors.primary
    },
    editLink: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '600'
    },
    profileDetails: {
      gap: 4
    },
    profileName: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text
    },
    profileEmail: {
      fontSize: 13,
      color: colors.mutedText
    },
    profilePhone: {
      fontSize: 13,
      color: colors.mutedText
    },
    editBox: {
      gap: 8
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.mutedText,
      textTransform: 'uppercase'
    },
    input: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: 8,
      padding: 10,
      color: colors.text,
      borderWidth: 1,
      borderColor: colors.border,
      fontSize: 14
    },
    saveButton: {
      backgroundColor: colors.primary,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      marginTop: 4
    },
    saveButtonText: {
      color: '#FFFFFF',
      fontWeight: '700',
      fontSize: 13
    },
    settingItem: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 8,
      borderBottomWidth: 1,
      borderBottomColor: colors.border
    },
    settingName: {
      fontSize: 13,
      color: colors.textSecondary
    },
    settingValue: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text
    },
    manualSyncButton: {
      marginTop: 12,
      paddingVertical: 10,
      borderRadius: 8,
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.borderStrong,
      alignItems: 'center'
    },
    manualSyncText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 12
    },
    failedListSection: {
      marginTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12
    },
    failedListHeading: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.danger,
      marginBottom: 8
    },
    failedItemCard: {
      backgroundColor: colors.surfaceElevated,
      borderRadius: 6,
      padding: 8,
      marginBottom: 6,
      borderLeftWidth: 3,
      borderLeftColor: colors.danger
    },
    failedHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 4
    },
    failedBadge: {
      backgroundColor: colors.danger,
      paddingHorizontal: 5,
      paddingVertical: 2,
      borderRadius: 4
    },
    failedBadgeText: {
      color: '#FFFFFF',
      fontSize: 9,
      fontWeight: '800'
    },
    failedRecordId: {
      color: colors.mutedText,
      fontSize: 10
    },
    failedAttempts: {
      color: colors.warning,
      fontSize: 10,
      marginLeft: 'auto'
    },
    failedErrorText: {
      color: colors.textSecondary,
      fontSize: 11
    },
    demoWarningBox: {
      backgroundColor: colors.warning,
      borderRadius: 8,
      padding: 10,
      marginBottom: 10
    },
    demoWarningText: {
      color: '#000000',
      fontWeight: '800',
      fontSize: 12
    },
    demoNoteText: {
      fontSize: 12,
      color: colors.mutedText,
      lineHeight: 17,
      marginBottom: 12
    },
    scenarioButton: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.primary,
      borderWidth: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 8
    },
    scenarioButtonText: {
      color: colors.primary,
      fontWeight: '700',
      fontSize: 13
    },
    resetButton: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.danger,
      borderWidth: 1,
      paddingVertical: 10,
      borderRadius: 8,
      alignItems: 'center'
    },
    resetButtonText: {
      color: colors.danger,
      fontWeight: '700',
      fontSize: 12
    }
  });