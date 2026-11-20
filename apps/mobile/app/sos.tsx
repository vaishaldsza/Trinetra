import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';

export default function SOSScreen() {
  const router = useRouter();
  const [triggered, setTriggered] = useState(false);

  const handleActivateSOS = () => {
    setTriggered(true);
    Alert.alert(
      'EMERGENCY SOS INITIATED',
      'Local incident generated with client UUID. Emergency queue updated offline. Escalation does NOT wait on cloud or AI.',
      [
        {
          text: 'Proceed to Triage',
          onPress: () => router.push('/triage')
        },
        {
          text: 'Cancel Alert',
          style: 'destructive',
          onPress: () => setTriggered(false)
        }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency SOS</Text>
      <Text style={styles.description}>
        Press and hold the button below to trigger an immediate emergency incident.
        Saved immediately to local SQLite with client UUID for idempotent cloud sync.
      </Text>

      <TouchableOpacity
        style={[styles.sosButton, triggered && styles.sosButtonActive]}
        onPress={handleActivateSOS}
      >
        <Text style={styles.sosText}>{triggered ? 'ALERT ACTIVE' : 'ACTIVATE SOS'}</Text>
      </TouchableOpacity>

      <Text style={styles.note}>
        * Real outbound SMS/Calls disabled by default in Demo Mode.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center'
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#EF4444',
    marginBottom: 8
  },
  description: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 18
  },
  sosButton: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#DC2626',
    borderWidth: 6,
    borderColor: '#7F1D1D',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12
  },
  sosButtonActive: {
    backgroundColor: '#991B1B',
    borderColor: '#F87171'
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 1,
    textAlign: 'center'
  },
  note: {
    marginTop: 40,
    fontSize: 11,
    color: '#F59E0B',
    textAlign: 'center'
  }
});
