import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';

export default function MobileLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [statusText, setStatusText] = useState<string | null>(null);

  const handleAuth = async () => {
    setLoading(true);
    setStatusText(null);

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
        setStatusText('Account registered! You can now sign in.');
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
      setStatusText(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoSignIn = () => {
    setEmail('hiker.demo@trinetra.safety');
    setPassword('DemoSafety123!');
    setStatusText('Demo credentials loaded. Navigating to Home...');
    setTimeout(() => {
      router.replace('/(tabs)/home');
    }, 400);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>{isSignUp ? 'Create Account' : 'Sign In'}</Text>
      <Text style={styles.subtext}>
        {isSignUp ? 'Register to start protected sessions' : 'Access offline safety tools and history'}
      </Text>

      {statusText && (
        <View style={styles.statusBox}>
          <Text style={styles.statusText}>{statusText}</Text>
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

      <View style={styles.demoSection}>
        <Text style={styles.demoHeader}>QUICK DEMO MODE</Text>
        <TouchableOpacity style={styles.demoButton} onPress={handleDemoSignIn}>
          <Text style={styles.demoButtonText}>Sign In as Demo Hiker</Text>
        </TouchableOpacity>
      </View>
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
    marginBottom: 24
  },
  statusBox: {
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
    marginBottom: 16
  },
  statusText: {
    color: '#FCD34D',
    fontSize: 13
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
    marginTop: 36,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 20
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
    fontSize: 14,
    fontWeight: '600'
  }
});
