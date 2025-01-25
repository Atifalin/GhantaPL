import React, { useState } from 'react';
import { StyleSheet, View, Alert } from 'react-native';
import { Button, Input, Text } from '@rneui/themed';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import LoadingScreen from '../../components/LoadingScreen';
import { useAuth } from '../../contexts/AuthContext';

export default function SignInScreen() {
  const { loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (authLoading) {
    return <LoadingScreen />;
  }

  async function signInWithEmail() {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      Alert.alert('Error', error.message);
    }
    setLoading(false);
  }

  async function resetPassword() {
    if (!email) {
      Alert.alert('Please enter your email address');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'ghantapl://reset-password',
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Check your email',
        'We have sent you a password reset link to your email address.');
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text h1>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>
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

        <Button
          title="Sign In"
          onPress={signInWithEmail}
          loading={loading}
          disabled={loading}
          size="lg"
          radius="lg"
          style={styles.button}
        />

        <Button
          title="Forgot Password?"
          type="clear"
          onPress={resetPassword}
          disabled={loading}
        />

        <View style={styles.signUpContainer}>
          <Text>Don't have an account? </Text>
          <Button
            title="Sign Up"
            type="clear"
            onPress={() => router.push('/(auth)/sign-up')}
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
  signUpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
});
