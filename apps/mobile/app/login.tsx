import { useState, useMemo } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';
import { useTheme } from '../src/theme/ThemeContext';
import { ColorTokens } from '../src/theme/tokens';

export default function MobileLoginScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<{ text: string; type: 'info' | 'error' | 'warning' } | null>(null);

  const isDemoMode = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';

  const handleAuth = async () => {
    setStatusText(null);

    if (!isSupabaseConfigured) {
      setStatusText({
        text: 'Supabase is not configured. Set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to enable authentication.',
        type: 'warning'
      });
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName || email.split('@')[0],
              role: 'user'
            }
          }
        });
        if (error) throw error;
        setStatusText({ text: 'Account registered! Please sign in.', type: 'info' });
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
        router.replace('/(tabs)/home');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      setStatusText({ text: msg, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handlePrefillEmail = () => {
    setEmail('hiker.demo@trinetra.safety');
    setStatusText({
      text: t('login.prefilled_notice'),
      type: 'info'
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>
        {isSignUp ? t('login.header_signup') : t('login.header_signin')}
      </Text>
      <Text style={styles.subtext}>
        {isSignUp ? t('login.subtext_signup') : t('login.subtext_signin')}
      </Text>

      {/* Supabase unconfigured warning */}
      {!isSupabaseConfigured && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>{t('login.supabase_not_configured')}</Text>
          <Text style={styles.warningSubtitle}>{t('login.supabase_warning_desc')}</Text>
        </View>
      )}

      {statusText && (
        <View
          style={[
            styles.statusBox,
            statusText.type === 'error' && styles.statusBoxError,
            statusText.type === 'warning' && styles.statusBoxWarning
          ]}
        >
          <Text
            style={[
              styles.statusText,
              statusText.type === 'error' && styles.statusTextError,
              statusText.type === 'warning' && styles.statusTextWarning
            ]}
          >
            {statusText.text}
          </Text>
        </View>
      )}

      {isSignUp && (
        <TextInput
          style={styles.input}
          placeholder={t('login.full_name')}
          placeholderTextColor={colors.mutedText}
          value={fullName}
          onChangeText={setFullName}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder={t('login.email')}
        placeholderTextColor={colors.mutedText}
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder={t('login.password')}
        placeholderTextColor={colors.mutedText}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleAuth}
        disabled={loading}
        accessibilityRole="button"
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>
            {isSignUp ? t('login.btn_signup') : t('login.btn_signin')}
          </Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setIsSignUp(!isSignUp)}
        style={styles.switchButton}
      >
        <Text style={styles.switchText}>
          {isSignUp ? t('login.switch_to_signin') : t('login.switch_to_signup')}
        </Text>
      </TouchableOpacity>

      {/* Demo Email Prefill: Only shown when EXPO_PUBLIC_DEMO_MODE=true */}
      {isDemoMode && (
        <View style={styles.demoSection}>
          <Text style={styles.demoHeader}>{t('login.demo_prefill_header')}</Text>
          <TouchableOpacity style={styles.demoButton} onPress={handlePrefillEmail}>
            <Text style={styles.demoButtonText}>{t('login.demo_prefill_btn')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const createStyles = (colors: ColorTokens) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      padding: 24,
      justifyContent: 'center'
    },
    header: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 6
    },
    subtext: {
      fontSize: 14,
      color: colors.mutedText,
      marginBottom: 20
    },
    warningBox: {
      backgroundColor: colors.surfaceElevated,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.warning,
      marginBottom: 16
    },
    warningTitle: {
      color: colors.warning,
      fontSize: 12,
      fontWeight: '700',
      marginBottom: 2
    },
    warningSubtitle: {
      color: colors.mutedText,
      fontSize: 11
    },
    statusBox: {
      backgroundColor: colors.surfaceElevated,
      padding: 12,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: colors.primary,
      marginBottom: 16
    },
    statusBoxError: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.danger
    },
    statusBoxWarning: {
      backgroundColor: colors.surfaceElevated,
      borderColor: colors.warning
    },
    statusText: {
      color: colors.text,
      fontSize: 12
    },
    statusTextError: {
      color: colors.danger
    },
    statusTextWarning: {
      color: colors.warning
    },
    input: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      marginBottom: 12
    },
    primaryButton: {
      backgroundColor: colors.primary,
      paddingVertical: 14,
      borderRadius: 10,
      alignItems: 'center',
      marginTop: 8
    },
    primaryButtonText: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700'
    },
    switchButton: {
      marginTop: 16,
      alignItems: 'center'
    },
    switchText: {
      color: colors.primary,
      fontSize: 13,
      textDecorationLine: 'underline'
    },
    demoSection: {
      marginTop: 32,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 16
    },
    demoHeader: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.warning,
      letterSpacing: 1,
      marginBottom: 10
    },
    demoButton: {
      backgroundColor: colors.surfaceElevated,
      borderWidth: 1,
      borderColor: colors.border,
      paddingVertical: 12,
      borderRadius: 8,
      alignItems: 'center'
    },
    demoButtonText: {
      color: colors.text,
      fontSize: 13,
      fontWeight: '600'
    }
  });