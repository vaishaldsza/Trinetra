import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useSafetyStore } from '../src/store/safetyStore';
import { useTheme } from '../src/theme/ThemeContext';
import { ColorTokens } from '../src/theme/tokens';
import { formatNumber, SupportedLanguage } from '../src/i18n';

export default function ContactsScreen() {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const currentLang = (i18n.language || 'en').split('-')[0] as SupportedLanguage;

  const { contacts, addContact, removeContact } = useSafetyStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const handleSaveContact = async () => {
    if (!name.trim() || !phone.trim() || !relationship.trim()) {
      Alert.alert(t('contacts.requiredFields'), t('contacts.requiredFieldsMsg'));
      return;
    }

    const result = await addContact(name.trim(), phone.trim(), relationship.trim(), contacts.length + 1);
    if (!result.success) {
      Alert.alert(t('common.error'), result.error || 'Invalid contact details');
      return;
    }

    setName('');
    setPhone('');
    setRelationship('');
    setShowAddForm(false);
  };

  const handleDelete = (id: string, contactName: string) => {
    Alert.alert(
      t('contacts.removeContactTitle'),
      t('contacts.removeContactConfirm', { name: contactName }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('contacts.remove'),
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
      <Text style={styles.title}>{t('contacts.title')}</Text>
      <Text style={styles.description}>{t('contacts.description')}</Text>

      {/* Add Contact Modal / Section */}
      {showAddForm ? (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{t('contacts.addNewContactTitle')}</Text>

          <Text style={styles.label}>{t('contacts.fullName')}</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder={t('contacts.namePlaceholder')}
            placeholderTextColor={colors.mutedText}
          />

          <Text style={styles.label}>{t('contacts.phoneNumber')}</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder={t('contacts.phonePlaceholder')}
            placeholderTextColor={colors.mutedText}
            keyboardType="phone-pad"
          />

          <Text style={styles.label}>{t('contacts.relationship')}</Text>
          <TextInput
            style={styles.input}
            value={relationship}
            onChangeText={setRelationship}
            placeholder={t('contacts.relationPlaceholder')}
            placeholderTextColor={colors.mutedText}
          />

          <View style={styles.formButtonRow}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSaveContact}>
              <Text style={styles.saveButtonText}>{t('contacts.saveContact')}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelButton} onPress={() => setShowAddForm(false)}>
              <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddForm(true)}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>{t('contacts.addTrustedContact')}</Text>
        </TouchableOpacity>
      )}

      {/* Contact List */}
      <View style={styles.list}>
        {contacts.map((contact) => (
          <View key={contact.id} style={styles.contactCard}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{contact.contact_name}</Text>
                <Text style={styles.relation}>
                  {contact.relationship} · {contact.phone_number}
                </Text>
              </View>
              <View style={styles.badgeCol}>
                <Text style={styles.priority}>
                  {t('contacts.priorityLabel', { num: formatNumber(contact.priority, currentLang) })}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(contact.id, contact.contact_name)}>
                  <Text style={styles.deleteText}>{t('contacts.remove')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      padding: 20,
      backgroundColor: colors.background,
      flexGrow: 1
    },
    title: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 6
    },
    description: {
      fontSize: 13,
      color: colors.mutedText,
      marginBottom: 20,
      lineHeight: 18
    },
    addButton: {
      backgroundColor: colors.primary,
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
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20
    },
    formTitle: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12
    },
    label: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.mutedText,
      marginBottom: 4,
      letterSpacing: 0.5
    },
    input: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
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
      backgroundColor: colors.success,
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
      backgroundColor: colors.surfaceElevated,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border
    },
    cancelButtonText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600'
    },
    list: {
      gap: 12
    },
    contactCard: {
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 16,
      borderWidth: 1,
      borderColor: colors.border
    },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    name: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 2
    },
    relation: {
      fontSize: 12,
      color: colors.mutedText
    },
    badgeCol: {
      alignItems: 'flex-end',
      gap: 6
    },
    priority: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.primary,
      backgroundColor: colors.surfaceElevated,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
      borderWidth: 1,
      borderColor: colors.border
    },
    deleteText: {
      color: colors.danger,
      fontSize: 11,
      textDecorationLine: 'underline'
    }
  });