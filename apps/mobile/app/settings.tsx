import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function SettingsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Safety Preferences</Text>
      <Text style={styles.description}>Manage motion sensors, permissions, and emergency escalation.</Text>

      <View style={styles.card}>
        <View style={styles.settingItem}>
          <Text style={styles.settingName}>Motion Sensor Monitoring</Text>
          <Text style={styles.settingValue}>Enabled</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingName}>Confirmation Countdown</Text>
          <Text style={styles.settingValue}>30 seconds</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingName}>Offline SQLite Persistence</Text>
          <Text style={styles.settingValue}>Active</Text>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingName}>Demo Mode Guard</Text>
          <Text style={[styles.settingValue, { color: '#F59E0B' }]}>Active (No real SMS)</Text>
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
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  settingItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  settingName: {
    fontSize: 14,
    color: '#E2E8F0',
    fontWeight: '500'
  },
  settingValue: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600'
  }
});
