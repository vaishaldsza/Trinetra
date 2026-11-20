import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function HistoryScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Hiking Session History</Text>
      <Text style={styles.description}>Previous recorded trails and safety monitoring sessions.</Text>

      <View style={styles.sessionCard}>
        <View style={styles.row}>
          <Text style={styles.trail}>Rohtang Pass Ridge</Text>
          <Text style={styles.badge}>EMERGENCY</Text>
        </View>
        <Text style={styles.date}>Today · 2 hrs 14 mins · 3,978m altitude</Text>
        <Text style={styles.meta}>1 Incident recorded · Synced to Supabase</Text>
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
  sessionCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B'
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
    color: '#FFFFFF'
  },
  badge: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#F87171',
    backgroundColor: '#450A0A',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  date: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4
  },
  meta: {
    fontSize: 11,
    color: '#F59E0B'
  }
});
