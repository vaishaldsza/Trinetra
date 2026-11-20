import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function ContactsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Emergency Contacts</Text>
      <Text style={styles.description}>
        Designated contacts to receive automated SMS/Voice alerts in case of emergency escalation.
      </Text>

      <View style={styles.contactCard}>
        <View style={styles.row}>
          <Text style={styles.name}>Vikram Sharma</Text>
          <Text style={styles.priority}>Priority 1</Text>
        </View>
        <Text style={styles.relation}>Sibling · +91 98765 43219</Text>
      </View>

      <TouchableOpacity style={styles.addButton}>
        <Text style={styles.buttonText}>+ Add Trusted Contact</Text>
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
  contactCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B',
    marginBottom: 16
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4
  },
  name: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF'
  },
  priority: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F97316',
    backgroundColor: '#431407',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4
  },
  relation: {
    fontSize: 13,
    color: '#94A3B8'
  },
  addButton: {
    backgroundColor: '#1E293B',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155'
  },
  buttonText: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600'
  }
});
