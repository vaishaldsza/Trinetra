import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';

export default function SessionScreen() {
  const [isActive, setIsActive] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Hiking Safety Session</Text>
        <Text style={styles.status}>
          Status: <Text style={{ color: isActive ? '#22C55E' : '#94A3B8' }}>{isActive ? 'ACTIVE' : 'IDLE'}</Text>
        </Text>
        <Text style={styles.info}>
          When active, TRINETRA monitors accelerometer motion, records GPS traces locally in SQLite, and watches for potential fall impacts.
        </Text>

        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: isActive ? '#B91C1C' : '#EA580C' }]}
          onPress={() => setIsActive(!isActive)}
        >
          <Text style={styles.buttonText}>{isActive ? 'Stop Session' : 'Start Monitoring'}</Text>
        </TouchableOpacity>
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
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8
  },
  status: {
    fontSize: 14,
    fontWeight: '700',
    color: '#CBD5E1',
    marginBottom: 12
  },
  info: {
    fontSize: 13,
    color: '#94A3B8',
    lineHeight: 18,
    marginBottom: 20
  },
  toggleButton: {
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700'
  }
});
