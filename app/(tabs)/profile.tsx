import { View, StyleSheet, Alert } from 'react-native';
import { Text, Button, Input } from '@rneui/themed';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { router } from 'expo-router';
import { useState } from 'react';

export default function Profile() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  async function handleSignOut() {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      router.replace('/(auth)/sign-in');
    }
    setLoading(false);
  }

  async function handlePasswordReset() {
    if (!newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Password has been updated successfully');
      setNewPassword('');
      setConfirmPassword('');
      setShowChangePassword(false);
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <Text h2 style={styles.title}>Profile</Text>
      <Text style={styles.email}>{user?.email}</Text>
      
      <View style={styles.section}>
        <Button
          title={showChangePassword ? "Cancel Password Change" : "Change Password"}
          onPress={() => setShowChangePassword(!showChangePassword)}
          type="clear"
          disabled={loading}
        />

        {showChangePassword && (
          <View style={styles.passwordForm}>
            <Input
              label="New Password"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
              placeholder="Enter new password"
              disabled={loading}
              autoCapitalize="none"
            />
            <Input
              label="Confirm Password"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm new password"
              disabled={loading}
              autoCapitalize="none"
            />
            <Button
              title="Update Password"
              onPress={handlePasswordReset}
              loading={loading}
              disabled={loading}
              buttonStyle={styles.updateButton}
            />
          </View>
        )}
      </View>

      <Button
        title="Sign Out"
        onPress={handleSignOut}
        loading={loading}
        disabled={loading}
        buttonStyle={styles.signOutButton}
        titleStyle={styles.signOutText}
        type="outline"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    marginBottom: 10,
    textAlign: 'center',
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  passwordForm: {
    marginTop: 10,
  },
  updateButton: {
    backgroundColor: '#2089dc',
    marginTop: 10,
  },
  signOutButton: {
    borderColor: '#ff4444',
    paddingHorizontal: 30,
  },
  signOutText: {
    color: '#ff4444',
  },
});
