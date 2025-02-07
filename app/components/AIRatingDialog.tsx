import React from 'react';
import { View, StyleSheet, Modal, Pressable, ActivityIndicator, ScrollView } from 'react-native';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';
import { ThemedText, ThemedView } from './Themed';

interface AIRatingDialogProps {
  visible: boolean;
  onClose: () => void;
  loading: boolean;
  rating: string | null;
}

const AIRatingDialog: React.FC<AIRatingDialogProps> = ({
  visible,
  onClose,
  loading,
  rating,
}) => {
  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={20} style={StyleSheet.absoluteFill} tint="dark" />
      <View style={styles.container}>
        <View style={styles.dialog}>
          <View style={styles.header}>
            <ThemedText style={styles.title}>AI Team Analysis</ThemedText>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#666" />
            </Pressable>
          </View>
          
          <View style={styles.content}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2196f3" />
                <ThemedText style={styles.loadingText}>
                  Analyzing your team...
                </ThemedText>
              </View>
            ) : rating ? (
              <ScrollView 
                style={styles.ratingContainer}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.aiIconContainer}>
                  <MaterialIcons name="psychology" size={40} color="#2196f3" />
                </View>
                <ThemedText style={styles.ratingText}>{rating}</ThemedText>
              </ScrollView>
            ) : null}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  content: {
    padding: 20,
    minHeight: 200,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  ratingContainer: {
    maxHeight: 400,
  },
  aiIconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
});

export default AIRatingDialog; 