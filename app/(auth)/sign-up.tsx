import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Button, Input, Text } from '@rneui/themed';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import LoadingScreen from '../../components/LoadingScreen';
import { useAuth } from '../../contexts/AuthContext';

export default function SignUpScreen() {
  const { loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return <LoadingScreen />;
  }

  async function signUpWithEmail() {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert(
        'Check your email',
        'We have sent you a confirmation link to your email address.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/sign-in'),
          },
        ]
      );
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text h1>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>
      </View>

      <View style={styles.form}>
        <Input
          label="Email"
          leftIcon={{ type: 'material', name: 'email' }}
          onChangeText={setEmail}
          value={email}
          placeholder="email@address.com"
          autoCapitalize="none"
          keyboardType="email-address"
          disabled={loading}
        />
        
        <Input
          label="Password"
          leftIcon={{ type: 'material', name: 'lock' }}
          onChangeText={setPassword}
          value={password}
          secureTextEntry
          placeholder="Password"
          autoCapitalize="none"
          disabled={loading}
        />

        <Input
          label="Confirm Password"
          leftIcon={{ type: 'material', name: 'lock' }}
          onChangeText={setConfirmPassword}
          value={confirmPassword}
          secureTextEntry
          placeholder="Confirm Password"
          autoCapitalize="none"
          disabled={loading}
        />

        <Button
          title="Sign Up"
          onPress={signUpWithEmail}
          loading={loading}
          disabled={loading}
          size="lg"
          radius="lg"
          style={styles.button}
        />

        <View style={styles.signInContainer}>
          <Text>Already have an account? </Text>
          <Button
            title="Sign In"
            type="clear"
            onPress={() => router.replace('/(auth)/sign-in')}
            disabled={loading}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    marginTop: 60,
    marginBottom: 30,
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  form: {
    gap: 10,
  },
  button: {
    marginTop: 10,
  },
  signInContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
});
