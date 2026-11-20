import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function MobileIncidentDetailScreen() {
  const { id } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Incident Report</Text>
      <Text style={styles.idText}>ID: {id}</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Status: Emergency Initiated</Text>
        <Text style={styles.text}>Priority: CRITICAL</Text>
        <Text style={styles.text}>Sync Status: Saved Locally (SQLite)</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 20
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF'
  },
  idText: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 16,
    fontFamily: 'monospace'
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#EF4444',
    marginBottom: 8
  },
  text: {
    fontSize: 13,
    color: '#CBD5E1',
    marginBottom: 4
  }
});
