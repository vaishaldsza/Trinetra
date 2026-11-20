import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase, isSupabaseConfigured } from '../src/lib/supabase';

export default function MobileLoginScreen() {
  const router = useRouter();
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
      text: 'Prefilled demo email. Enter password to authenticate.',
      type: 'info'
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
      <Text style={styles.subtext}>
        {isSignUp ? 'Register to start protected sessions' : 'Access offline safety tools and history'}
      </Text>

      {/* Supabase unconfigured warning */}
      {!isSupabaseConfigured && (
        <View style={styles.warningBox}>
          <Text style={styles.warningTitle}>⚠️ Supabase not configured</Text>
          <Text style={styles.warningSubtitle}>
            Set EXPO_PUBLIC_SUPABASE_URL & EXPO_PUBLIC_SUPABASE_ANON_KEY in your environment.
          </Text>
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
          placeholder="Full Name"
          placeholderTextColor="#64748B"
          value={fullName}
          onChangeText={setFullName}
        />
      )}

      <TextInput
        style={styles.input}
        placeholder="Email Address"
        placeholderTextColor="#64748B"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#64748B"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleAuth}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setIsSignUp(!isSignUp)}
        style={styles.switchButton}
      >
        <Text style={styles.switchText}>
          {isSignUp ? 'Already registered? Sign In' : 'Need an account? Sign Up'}
        </Text>
      </TouchableOpacity>

      {/* Demo Email Prefill: Only shown when EXPO_PUBLIC_DEMO_MODE=true */}
      {isDemoMode && (
        <View style={styles.demoSection}>
          <Text style={styles.demoHeader}>DEMO MODE EMAIL PREFILL</Text>
          <TouchableOpacity style={styles.demoButton} onPress={handlePrefillEmail}>
            <Text style={styles.demoButtonText}>Prefill Demo Hiker Email</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    padding: 24,
    justifyContent: 'center'
  },
  header: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6
  },
  subtext: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 20
  },
  warningBox: {
    backgroundColor: '#451A03',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D97706',
    marginBottom: 16
  },
  warningTitle: {
    color: '#FDE68A',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 2
  },
  warningSubtitle: {
    color: '#FCD34D',
    fontSize: 11
  },
  statusBox: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#38BDF8',
    marginBottom: 16
  },
  statusBoxError: {
    backgroundColor: '#450A0A',
    borderColor: '#DC2626'
  },
  statusBoxWarning: {
    backgroundColor: '#451A03',
    borderColor: '#D97706'
  },
  statusText: {
    color: '#BAE6FD',
    fontSize: 12
  },
  statusTextError: {
    color: '#FCA5A5'
  },
  statusTextWarning: {
    color: '#FDE68A'
  },
  input: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    color: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    marginBottom: 12
  },
  primaryButton: {
    backgroundColor: '#EA580C',
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
    color: '#FB923C',
    fontSize: 13,
    textDecorationLine: 'underline'
  },
  demoSection: {
    marginTop: 32,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 16
  },
  demoHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: '#F59E0B',
    letterSpacing: 1,
    marginBottom: 10
  },
  demoButton: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#475569',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center'
  },
  demoButtonText: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600'
  }
});
