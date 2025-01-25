import React, { useState } from 'react';
import { StyleSheet, View, ScrollView, useColorScheme, Pressable, Alert, Modal } from 'react-native';
import { useAuth } from '../../contexts/AuthContext';
import { useUserPrefs } from '../../contexts/UserPrefsContext';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';

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

  const handleSignOut = async () => {
    await signOut();
    router.push('/(tabs)');
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
    <View 
      style={[
        styles.container,
        { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }
      ]}
    >
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <Pressable 
            onPress={() => setShowEmojiPicker(true)}
            style={[
              styles.avatarContainer,
              { backgroundColor: isDark ? '#2D2D2D' : '#f0f0f0' }
            ]}
          >
            <ThemedText style={styles.avatarEmoji}>{preferences.avatar}</ThemedText>
          </Pressable>
          <ThemedText type="title" style={styles.name}>{user?.email}</ThemedText>
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Account</ThemedText>
          <ProfileButton 
            title="Change Avatar" 
            icon="face" 
            onPress={() => setShowEmojiPicker(true)}
          />
          <ProfileButton 
            title={showChangePassword ? "Cancel Password Change" : "Change Password"}
            icon="lock"
            onPress={() => setShowChangePassword(!showChangePassword)}
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
          <ProfileButton title="Notifications" icon="notifications" />
          <ProfileButton title="Privacy" icon="shield" />
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Preferences</ThemedText>
          <ProfileButton title="Language" icon="language" />
          <ProfileButton title="Display" icon="palette" />
        </View>

        <View style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Other</ThemedText>
          <ProfileButton title="Help" icon="help" />
          <ProfileButton title="About" icon="info" />
          <ProfileButton 
            title="Sign Out" 
            icon="logout" 
            onPress={handleSignOut}
            destructive
          />
        </View>
      </ScrollView>

      <Pressable
        onPress={handleClose}
        style={({ pressed }) => [
          styles.closeButton,
          {
            backgroundColor: pressed 
              ? isDark ? '#2D2D2D' : '#f0f0f0'
              : isDark ? '#252829' : '#fff',
            borderColor: isDark ? '#2D2D2D' : '#e0e0e0',
          }
        ]}
      >
        <MaterialIcons 
          name="close" 
          size={24} 
          color={isDark ? Colors.dark.text : Colors.light.text} 
        />
      </Pressable>

      <EmojiPicker 
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleSelectEmoji}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  avatarEmoji: {
    fontSize: 36,
    textAlign: 'center',
    lineHeight: 80,
  },
  name: {
    fontSize: 20,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
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
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
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
  label: {
    marginBottom: 8,
    opacity: 0.7,
  },
  input: {
    fontSize: 16,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
  },
});
