import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useSafetyStore } from '../src/store/safetyStore';

export default function ContactsScreen() {
  const { contacts, addContact, removeContact } = useSafetyStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const handleSaveContact = async () => {
    if (!name.trim() || !phone.trim() || !relationship.trim()) {
      Alert.alert('Required Fields', 'Please fill in name, phone number, and relationship.');
      return;
    }

    await addContact(name.trim(), phone.trim(), relationship.trim(), contacts.length + 1);
    setName('');
    setPhone('');
    setRelationship('');
    setShowAddForm(false);
  };

  const handleDelete = (id: string, contactName: string) => {
    Alert.alert(
      'Remove Contact',
      `Are you sure you want to remove ${contactName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            await removeContact(id);
          }
        }
      ]
    );
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Emergency Contacts</Text>
      <Text style={styles.description}>
        Contacts stored locally in SQLite to receive automated alerts during an emergency.
      </Text>

      {/* Add Contact Modal / Section */}
      {showAddForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Add New Trusted Contact</Text>

          <Text style={styles.label}>FULL NAME</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="e.g. Vikram Sharma"
            placeholderTextColor="#64748B"
          />

          <Text style={styles.label}>PHONE NUMBER</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="e.g. +91 98765 43219"
            placeholderTextColor="#64748B"
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>RELATIONSHIP</Text>
          <TextInput
            style={styles.input}
            value={relationship}
            onChangeText={setRelationship}
            placeholder="e.g. Sibling, Parent, Mountain Guide"
            placeholderTextColor="#64748B"
          />

          <View style={styles.formButtonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveContact}>
              <Text style={styles.saveButtonText}>Save Contact</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddForm(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity style={styles.addButton} onPress={() => setShowAddForm(true)}>
          <Text style={styles.buttonText}>+ Add Trusted Contact</Text>
        </TouchableOpacity>
      )}

      {/* Contact List */}
      <View style={styles.list}>
        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            <View style={styles.row}>
              <View>
                <Text style={styles.name}>{contact.contact_name}</Text>
                <Text style={styles.relation}>
                  {contact.relationship} · {contact.phone_number}
                </Text>
              </View>
              <View style={styles.badgeCol}>
                <Text style={styles.priority}>Priority {contact.priority}</Text>
                <TouchableOpacity onPress={() => handleDelete(contact.id, contact.contact_name)}>
                  <Text style={styles.deleteText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
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
    marginBottom: 20,
    lineHeight: 18
  },
  addButton: {
    backgroundColor: '#EA580C',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 20
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700'
  },
  formCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
    marginBottom: 20
  },
  formTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12
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
  formButtonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 6
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#15803D',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700'
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  cancelButtonText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600'
  },
  list: {
    gap: 12
  },
  contactCard: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1E293B'
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 2
  },
  relation: {
    fontSize: 12,
    color: '#94A3B8'
  },
  badgeCol: {
    alignItems: 'flex-end',
    gap: 6
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
  deleteText: {
    color: '#EF4444',
    fontSize: 11,
    textDecorationLine: 'underline'
  }
});
