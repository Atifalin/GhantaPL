import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ScrollView, useColorScheme, Pressable, Alert, Modal, TextInput, ActivityIndicator } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPrefs } from '../../contexts/UserPrefsContext';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase/client';

const EMOJIS = ["😊", "😎", "🤠", "🦁", "🐯", "🐼", "🦊", "🦄", "🐸", "🐵", "🦉", "🦋", "⚽️", "🎮", "🎨", "🎸"];

const ProfileButton = ({ title, icon, onPress, destructive }: { 
  title: string; 
  icon: string; 
  onPress?: () => void;
  destructive?: boolean;
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed 
            ? isDark ? '#2D2D2D' : '#f0f0f0'
            : 'transparent',
          borderColor: isDark ? '#2D2D2D' : '#e0e0e0',
        }
      ]}
    >
      <View style={styles.buttonContent}>
        <MaterialIcons 
          name={icon} 
          size={24} 
          color={destructive ? '#ff4444' : isDark ? Colors.dark.text : Colors.light.text} 
          style={styles.buttonIcon}
        />
        <ThemedText 
          type="default" 
          style={[
            styles.buttonText,
            destructive && { color: '#ff4444' }
          ]}
        >
          {title}
        </ThemedText>
      </View>
      <MaterialIcons 
        name="chevron-right" 
        size={24} 
        color={destructive ? '#ff4444' : isDark ? Colors.dark.text : Colors.light.text} 
      />
    </Pressable>
  );
};

const EmojiPicker = ({ visible, onClose, onSelect }: { 
  visible: boolean; 
  onClose: () => void; 
  onSelect: (emoji: string) => void;
}) => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[
          styles.emojiContainer,
          { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }
        ]}>
          <View style={styles.emojiHeader}>
            <ThemedText type="subtitle">Select Your Avatar</ThemedText>
            <Pressable onPress={onClose}>
              <MaterialIcons 
                name="close" 
                size={24} 
                color={isDark ? Colors.dark.text : Colors.light.text} 
              />
            </Pressable>
          </View>
          <View style={styles.emojiGrid}>
            {EMOJIS.map((emoji, index) => (
              <Pressable
                key={index}
                onPress={() => {
                  onSelect(emoji);
                  onClose();
                }}
                style={({ pressed }) => [
                  styles.emojiButton,
                  {
                    backgroundColor: pressed 
                      ? isDark ? '#2D2D2D' : '#f0f0f0'
                      : 'transparent',
                  }
                ]}
              >
                <ThemedText style={styles.emoji}>{emoji}</ThemedText>
              </Pressable>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default function ProfileModal() {
  const { signOut, user } = useAuth();
  const { preferences, updatePreferences } = useUserPrefs();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [profileLoading, setProfileLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (data) {
        setUsername(data.username || '');
        setDisplayName(data.display_name || '');
        if (data.avatar_emoji) {
          updatePreferences({ ...preferences, avatar: data.avatar_emoji });
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdateProfile = async (newAvatar?: string) => {
    if (!username || !displayName) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setSavingProfile(true);
    try {
      // First update preferences if we have a new avatar
      if (newAvatar) {
        await updatePreferences({ ...preferences, avatar: newAvatar });
      }

      // Then update the profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user?.id,
          username,
          display_name: displayName,
          avatar_emoji: newAvatar || preferences.avatar,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/(auth)/onboarding');
    } catch (error) {
      Alert.alert('Error', 'Failed to sign out. Please try again.');
    }
  };

  const handleClose = () => {
    router.back();
  };

  const handlePasswordReset = async () => {
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
  };

  const handleSelectEmoji = (emoji: string) => {
    updatePreferences({ avatar: emoji });
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <ThemedText type="title">Profile</ThemedText>
        <Pressable onPress={handleClose}>
          <MaterialIcons 
            name="close" 
            size={24} 
            color={isDark ? Colors.dark.text : Colors.light.text} 
          />
        </Pressable>
      </View>

      <ScrollView style={styles.content}>
        {profileLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? Colors.dark.tint : Colors.light.tint} />
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <View style={styles.formGroup}>
                <ThemedText type="default" style={styles.label}>Username</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: isDark ? '#2D2D2D' : '#f5f5f5',
                      color: isDark ? Colors.dark.text : Colors.light.text,
                    }
                  ]}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  placeholderTextColor={isDark ? '#888' : '#999'}
                />
              </View>

              <View style={styles.formGroup}>
                <ThemedText type="default" style={styles.label}>Display Name</ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    { 
                      backgroundColor: isDark ? '#2D2D2D' : '#f5f5f5',
                      color: isDark ? Colors.dark.text : Colors.light.text,
                    }
                  ]}
                  value={displayName}
                  onChangeText={setDisplayName}
                  placeholder="Enter display name"
                  placeholderTextColor={isDark ? '#888' : '#999'}
                />
              </View>

              <Pressable
                style={[
                  styles.saveButton,
                  savingProfile && styles.saveButtonDisabled
                ]}
                onPress={handleUpdateProfile}
                disabled={savingProfile}
              >
                {savingProfile ? (
                  <ActivityIndicator color="white" size="small" />
                ) : (
                  <ThemedText style={styles.saveButtonText}>Save Profile</ThemedText>
                )}
              </Pressable>
            </View>

            <View style={styles.section}>
              <ProfileButton
                title="Change Avatar"
                icon="face"
                onPress={() => setShowEmojiPicker(true)}
              />
              <ProfileButton
                title="Change Password"
                icon="lock"
                onPress={() => setShowChangePassword(true)}
              />
              {showChangePassword && (
                <View style={styles.passwordForm}>
                  <ThemedView style={styles.inputContainer}>
                    <ThemedText type="default" style={styles.label}>New Password</ThemedText>
                    <ThemedText 
                      style={[
                        styles.input,
                        { 
                          backgroundColor: isDark ? '#2D2D2D' : '#fff',
                          borderColor: isDark ? '#3D3D3D' : '#e0e0e0',
                          color: isDark ? Colors.dark.text : Colors.light.text
                        }
                      ]} 
                      secureTextEntry 
                      value={newPassword} 
                      onChangeText={setNewPassword} 
                      placeholder="Enter new password" 
                      autoCapitalize="none"
                    />
                  </ThemedView>
                  <ThemedView style={styles.inputContainer}>
                    <ThemedText type="default" style={styles.label}>Confirm Password</ThemedText>
                    <ThemedText 
                      style={[
                        styles.input,
                        { 
                          backgroundColor: isDark ? '#2D2D2D' : '#fff',
                          borderColor: isDark ? '#3D3D3D' : '#e0e0e0',
                          color: isDark ? Colors.dark.text : Colors.light.text
                        }
                      ]} 
                      secureTextEntry 
                      value={confirmPassword} 
                      onChangeText={setConfirmPassword} 
                      placeholder="Confirm new password" 
                      autoCapitalize="none"
                    />
                  </ThemedView>
                  <ProfileButton 
                    title="Update Password" 
                    icon="check" 
                    onPress={handlePasswordReset}
                  />
                </View>
              )}
              <ProfileButton
                title="Sign Out"
                icon="logout"
                onPress={handleSignOut}
                destructive
              />
            </View>
          </>
        )}
      </ScrollView>

      <EmojiPicker
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={async (emoji) => {
          await handleUpdateProfile(emoji);
          setShowEmojiPicker(false);
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '600',
  },
  input: {
    height: 48,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  saveButton: {
    backgroundColor: Colors.light.tint,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  buttonIcon: {
    marginRight: 12,
  },
  buttonText: {
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  emojiContainer: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  emojiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  emojiButton: {
    width: '23%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    margin: '1%',
  },
  emoji: {
    fontSize: 32,
    textAlign: 'center',
    lineHeight: 44,
  },
  passwordForm: {
    marginTop: 8,
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 12,
  },
});
