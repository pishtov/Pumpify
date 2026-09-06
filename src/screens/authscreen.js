import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '../firebase/firebase';

function friendlyError(code) {
  switch (code) {
    case 'auth/invalid-email':
      return 'That email address looks invalid.';
    case 'auth/email-already-in-use':
      return 'An account with that email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    default:
      return 'Something went wrong. Please try again.';
  }
}

export default function AuthScreen() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isSignup = mode === 'signup';

  async function handleSubmit() {
    setError('');

    if (!email || !password) {
      setError('Enter an email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isSignup) {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
      // No navigation call needed here — App.js listens for auth state
      // changes and switches to HomeScreen automatically once this resolves.
    } catch (err) {
      setError(friendlyError(err.code));
    } finally {
      setLoading(false);
    }
  }

  function toggleMode() {
    setMode(isSignup ? 'login' : 'signup');
    setError('');
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.screen}
    >
      <View style={styles.header}>
        <View style={styles.logoBar} />
        <Text style={styles.logoText}>PUMPIFY</Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>{isSignup ? 'Create account' : 'Welcome back'}</Text>
        <Text style={styles.subtitle}>
          {isSignup ? 'Start tracking your workouts.' : 'Log in to keep your streak going.'}
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#5A5A5A"
            style={styles.input}
            value={email}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Password</Text>
          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor="#5A5A5A"
            secureTextEntry
            style={styles.input}
            value={password}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          disabled={loading}
          onPress={handleSubmit}
          style={({ pressed }) => [
            styles.submitButton,
            pressed && styles.pressed,
            loading && styles.disabled,
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#0A0A0A" />
          ) : (
            <Text style={styles.submitButtonText}>{isSignup ? 'Sign up' : 'Log in'}</Text>
          )}
        </Pressable>

        <Pressable onPress={toggleMode}>
          <Text style={styles.switchText}>
            {isSignup ? 'Already have an account? ' : "Don't have an account? "}
            <Text style={styles.switchTextAccent}>{isSignup ? 'Log in' : 'Sign up'}</Text>
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 56,
    paddingHorizontal: 20,
  },

  logoBar: {
    width: 4,
    height: 20,
    borderRadius: 2,
    backgroundColor: '#CFFF3D',
  },

  logoText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.5,
    color: '#F5F5F5',
  },

  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },

  title: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F5F5F5',
    marginBottom: 6,
  },

  subtitle: {
    fontSize: 14,
    color: '#8A8A8A',
    marginBottom: 28,
  },

  field: {
    marginBottom: 16,
  },

  label: {
    fontSize: 12,
    color: '#8A8A8A',
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#161616',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#242424',
  },

  error: {
    fontSize: 13,
    color: '#FF6B5B',
    marginBottom: 12,
  },

  submitButton: {
    backgroundColor: '#CFFF3D',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },

  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0A0A0A',
  },

  disabled: {
    opacity: 0.6,
  },

  pressed: {
    opacity: 0.85,
  },

  switchText: {
    fontSize: 13,
    color: '#8A8A8A',
    textAlign: 'center',
  },

  switchTextAccent: {
    color: '#CFFF3D',
    fontWeight: '700',
  },
});