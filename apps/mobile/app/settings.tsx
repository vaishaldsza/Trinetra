import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { useSafetyStore } from '../src/store/safetyStore';

export default function SettingsScreen() {
  const { profile, updateProfile, pendingSyncCount, syncNow, isSyncing } = useSafetyStore();
  const [fullName, setFullName] = useState(profile.full_name);
  const [phone, setPhone] = useState(profile.phone || '');
  const [isEditing, setIsEditing] = useState(false);

  const handleSaveProfile = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Full name is required.');
      return;
    }
    await updateProfile(fullName.trim(), phone.trim());
    setIsEditing(false);
    Alert.alert('Profile Saved', 'Profile updated locally in SQLite and queued for cloud sync.');
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
        <Text style={styles.sectionTitle}>Offline Storage Engine</Text>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>Local Database</Text>
          <Text style={[styles.settingValue, { color: '#22C55E' }]}>Expo SQLite (Active)</Text>
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingName}>Pending Sync Mutations</Text>
          <Text style={[styles.settingValue, { color: pendingSyncCount > 0 ? '#F59E0B' : '#22C55E' }]}>
            {pendingSyncCount} {pendingSyncCount === 1 ? 'item' : 'items'}
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
  }
});
