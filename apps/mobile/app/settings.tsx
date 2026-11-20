import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafetyStore } from '../src/store/safetyStore';
import { getFailedSyncItems, SyncQueueItem } from '../src/lib/db';

export default function SettingsScreen() {
  const router = useRouter();
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
      Alert.alert('Error', 'Full name is required.');
      return;
    }
    const result = await updateProfile(fullName.trim(), phone.trim());
    if (!result.success) {
      Alert.alert('Validation Error', result.error || 'Invalid profile information');
      return;
    }
    setIsEditing(false);
    Alert.alert('Profile Saved', 'Profile updated locally in SQLite and queued for cloud sync.');
  };

  const handleResetDemo = () => {
    Alert.alert(
      'Reset Demo Data',
      'This will delete all simulated demo incidents, demo vitals, and demo triage assessments from offline SQLite. Real logs will remain completely intact.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset Demo Data',
          style: 'destructive',
          onPress: async () => {
            setIsResetting(true);
            try {
              const res = await resetDemoData();
              Alert.alert('Demo Data Reset', `Successfully removed ${res.deletedCount} demo record(s) from local SQLite.`);
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Safety Preferences & Profile</Text>
      <Text style={styles.description}>Manage offline storage, emergency profile, and sensor monitoring.</Text>

      {/* User Profile Card */}
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <Text style={styles.sectionTitle}>Hiker Profile</Text>
          <TouchableOpacity onPress={() => setIsEditing(!isEditing)}>
            <Text style={styles.editLink}>{isEditing ? 'Cancel' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>

        {isEditing ? (
          <View style={styles.editBox}>
            <Text style={styles.label}>FULL NAME</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor="#64748B"
            />

            <Text style={styles.label}>EMERGENCY PHONE</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+91..."
              placeholderTextColor="#64748B"
              keyboardType="phone-pad"
            />

            <TouchableOpacity style={styles.saveButton} onPress={handleSaveProfile}>
              <Text style={styles.saveButtonText}>Save Profile to SQLite</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.profileDetails}>
            <Text style={styles.profileName}>{profile.full_name}</Text>
            <Text style={styles.profileEmail}>{profile.email}</Text>
            <Text style={styles.profilePhone}>{profile.phone || 'No phone set'}</Text>
          </View>
        )}
      </View>

      {/* Offline Storage Status Card */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Offline Storage Engine (SQLite)</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>Sync Status</Text>
          <Text style={[styles.settingValue, { color: isSyncing ? '#38BDF8' : syncCounts.failed > 0 ? '#EF4444' : syncCounts.pending > 0 ? '#F59E0B' : '#22C55E' }]}>
            {isSyncing ? 'Syncing...' : syncCounts.pending > 0 ? 'Pending' : 'Synced'}
          </Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>Pending Mutations</Text>
          <Text style={[styles.settingValue, { color: syncCounts.pending > 0 ? '#F59E0B' : '#22C55E' }]}>
            {syncCounts.pending}
          </Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>Synced Mutations</Text>
          <Text style={[styles.settingValue, { color: '#22C55E' }]}>
            {syncCounts.synced}
          </Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>Failed (8+ attempts)</Text>
          <Text style={[styles.settingValue, { color: syncCounts.failed > 0 ? '#EF4444' : '#64748B' }]}>
            {syncCounts.failed}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.manualSyncButton}
          onPress={syncNow}
          disabled={isSyncing}
        >
          <Text style={styles.manualSyncText}>
            {isSyncing ? 'Synchronizing with Cloud...' : 'Trigger Immediate Sync'}
          </Text>
        </TouchableOpacity>

        {failedItems.length > 0 && (
          <View style={styles.failedListSection}>
            <Text style={styles.failedListHeading}>Failed Sync Operations ({failedItems.length})</Text>
            {failedItems.map((item) => (
              <View key={item.id} style={styles.failedItemCard}>
                <View style={styles.failedHeaderRow}>
                  <View style={styles.failedBadge}>
                    <Text style={styles.failedBadgeText}>{item.table_name.toUpperCase()}</Text>
                  </View>
                  <Text style={styles.failedRecordId}>ID: {item.record_id.slice(0, 8)}...</Text>
                  <Text style={styles.failedAttempts}>Attempts: {item.attempts}</Text>
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
        <Text style={styles.sectionTitle}>Emergency Guardrails</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>Non-Diagnostic Label</Text>
          <Text style={styles.settingValue}>Enforced</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>Manual SOS Cloud-Bypass</Text>
          <Text style={[styles.settingValue, { color: '#22C55E' }]}>Active (Offline First)</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>Real Outbound SMS/Voice</Text>
          <Text style={[styles.settingValue, { color: '#F59E0B' }]}>Disabled (Demo Safe)</Text>
        </View>
      </View>

      {/* Demo Mode & Scenarios Card */}
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <Text style={styles.sectionTitle}>Interactive Demo Mode</Text>
          <Switch
            value={isDemoMode}
            onValueChange={() => toggleDemoMode()}
            trackColor={{ false: '#334155', true: '#F97316' }}
            thumbColor={isDemoMode ? '#FFFFFF' : '#94A3B8'}
          />
        </View>

        {isDemoMode && (
          <View style={styles.demoWarningBox}>
            <Text style={styles.demoWarningText}>⚠️ Demo Mode is ON: no real alerts will be sent.</Text>
          </View>
        )}

        <Text style={styles.demoNoteText}>
          When Demo Mode is active, all generated incidents, vitals, and triage carry <Text style={{ fontWeight: 'bold', color: '#FBBF24' }}>is_demo = true</Text>. Real outbound carrier SMS and voice calls are strictly blocked.
        </Text>

        <TouchableOpacity
          style={styles.scenarioButton}
          onPress={() => router.push('/(tabs)/demo')}
        >
          <Text style={styles.scenarioButtonText}>Open Scripted Demo Scenarios</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resetButton}
          onPress={handleResetDemo}
          disabled={isResetting}
        >
          <Text style={styles.resetButtonText}>
            {isResetting ? 'Purging Demo Data...' : 'Reset Demo Data (Deletes Demo Rows Only)'}
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
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6
  },
  description: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 20
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
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
    color: '#F97316',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  editLink: {
    color: '#F97316',
    fontSize: 13,
    fontWeight: '600'
  },
  profileDetails: {
    gap: 4
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC'
  },
  profileEmail: {
    fontSize: 13,
    color: '#94A3B8'
  },
  profilePhone: {
    fontSize: 13,
    color: '#94A3B8'
  },
  editBox: {
    marginTop: 4
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    marginBottom: 4,
    letterSpacing: 0.5
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 12
  },
  saveButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 4
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  settingItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  settingName: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '500'
  },
  settingValue: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600'
  },
  manualSyncButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 14
  },
  manualSyncText: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600'
  },
  failedListSection: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#334155'
  },
  failedListHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10
  },
  failedItemCard: {
    backgroundColor: '#1E1B2E',
    borderColor: '#7F1D1D',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 8
  },
  failedHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4
  },
  failedBadge: {
    backgroundColor: '#7F1D1D',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2
  },
  failedBadgeText: {
    color: '#FECACA',
    fontSize: 10,
    fontWeight: '800'
  },
  failedRecordId: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: 'monospace',
    flex: 1
  },
  failedAttempts: {
    color: '#F87171',
    fontSize: 10,
    fontWeight: '700'
  },
  failedErrorText: {
    color: '#FCA5A5',
    fontSize: 11,
    lineHeight: 15
  },
  demoNoteText: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 12
  },
  demoWarningBox: {
    backgroundColor: '#78350F',
    borderWidth: 1,
    borderColor: '#F59E0B',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    alignItems: 'center'
  },
  demoWarningText: {
    color: '#FEF3C7',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center'
  },
  scenarioButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10
  },
  scenarioButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  resetButton: {
    backgroundColor: '#7F1D1D',
    borderWidth: 1,
    borderColor: '#DC2626',
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center'
  },
  resetButtonText: {
    color: '#FEE2E2',
    fontSize: 12,
    fontWeight: '700'
  }
});
