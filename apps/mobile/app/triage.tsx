import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function TriageScreen() {
  const questions = [
    '1. Are you conscious and able to respond?',
    '2. Are you having difficulty breathing?',
    '3. Are you experiencing bleeding?',
    '4. Where are you injured?',
    '5. Can you move safely?',
    '6. How severe is your pain, from 0 to 10?'
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Offline AI Voice Triage</Text>
      <Text style={styles.description}>
        Deterministic structured assessment questions. Critical warning signs trigger escalation rules immediately without waiting for an LLM response.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardHeader}>Structured Triage Protocol</Text>
        {questions.map((q, idx) => (
          <View key={idx} style={styles.questionItem}>
            <Text style={styles.questionText}>{q}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.recordButton}>
        <Text style={styles.buttonText}>🎤 Start Offline Voice Assessment</Text>
      </TouchableOpacity>
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
    marginBottom: 20,
    lineHeight: 18
  },
  card: {
    backgroundColor: '#0F172A',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 20
  },
  cardHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F97316',
    marginBottom: 12,
    textTransform: 'uppercase'
  },
  questionItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B'
  },
  questionText: {
    color: '#E2E8F0',
    fontSize: 13
  },
  recordButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center'
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700'
  }
});
