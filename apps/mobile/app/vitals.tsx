import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { HEALTH_DISCLAIMER } from '@trinetra/shared';

export default function VitalsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Camera Vital Estimation</Text>
      <Text style={styles.description}>
        Experimental pulse estimation using rear smartphone camera and flash red-channel signal processing.
      </Text>

      <View style={styles.readingBox}>
        <Text style={styles.readingLabel}>Estimated Pulse</Text>
        <Text style={styles.readingValue}>-- <Text style={styles.unit}>BPM</Text></Text>
        <Text style={styles.signalQuality}>Signal Quality: Idle</Text>
      </View>

      <TouchableOpacity style={styles.measureButton}>
        <Text style={styles.buttonText}>Start 30s PPG Measurement</Text>
      </TouchableOpacity>

      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerText}>{HEALTH_DISCLAIMER}</Text>
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
    color: '#FFFFFF',
    marginBottom: 6
  },
  description: {
    fontSize: 13,
    color: '#94A3B8',
    marginBottom: 24,
    lineHeight: 18
  },
  readingBox: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 20
  },
  readingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase'
  },
  readingValue: {
    fontSize: 54,
    fontWeight: '900',
    color: '#F43F5E',
    marginVertical: 8
  },
  unit: {
    fontSize: 18,
    fontWeight: '600',
    color: '#94A3B8'
  },
  signalQuality: {
    fontSize: 12,
    color: '#64748B'
  },
  measureButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 24
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  },
  disclaimerCard: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B'
  },
  disclaimerText: {
    color: '#CBD5E1',
    fontSize: 11,
    lineHeight: 16
  }
});
