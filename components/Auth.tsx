import React, { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Button, Input } from '@rneui/themed';
import { supabase } from '../lib/supabase';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function signInWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) Alert.alert(error.message);
    setLoading(false);
  }

  async function signUpWithEmail() {
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) Alert.alert(error.message);
    else Alert.alert('Check your email for the confirmation link!');
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Input
        label="Email"
        leftIcon={{ type: 'material', name: 'email' }}
        onChangeText={(text) => setEmail(text)}
        value={email}
        placeholder="email@address.com"
        autoCapitalize="none"
      />
      <Input
        label="Password"
        leftIcon={{ type: 'material', name: 'lock' }}
        onChangeText={(text) => setPassword(text)}
        value={password}
        secureTextEntry
        placeholder="Password"
        autoCapitalize="none"
      />
      <View style={styles.buttonContainer}>
        <Button
          title="Sign in"
          disabled={loading}
          onPress={() => signInWithEmail()}
        />
        <Button
          title="Sign up"
          disabled={loading}
          onPress={() => signUpWithEmail()}
          type="outline"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
  },
  buttonContainer: {
    gap: 8,
  },
});
