import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Platform, ScrollView, Switch, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { ThemedView, ThemedText } from '../components/Themed';
import { Colors } from '../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useToast } from '../context/ToastContext';
import { useTheme } from '../context/ThemeContext';
import { BlurView } from 'expo-blur';

export default function CreateAuctionScreen() {
  const router = useRouter();
  const [auctionName, setAuctionName] = useState('');
  const [budget, setBudget] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { theme, isDark } = useTheme();
  const { showToast } = useToast();

  const handleCreateAuction = async () => {
    if (!auctionName || !budget) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    const budgetValue = parseFloat(budget);
    if (isNaN(budgetValue) || budgetValue <= 0) {
      showToast('Please enter a valid budget', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const budgetInt = Math.round(budgetValue);

      const { data, error } = await supabase
        .from('auctions')
        .insert([
          {
            name: auctionName,
            budget_per_player: budgetInt,
            start_time: startTime.toISOString(),
            auto_start: autoStart,
            status: 'pending',
            created_by: user.id,
            host_id: user.id,
            total_players: 0,
            completed_players: 0,
            skipped_players: 0,
            no_bid_count: 0
          }
        ])
        .select()
        .single();

      if (error) throw error;

      showToast('Auction created successfully!', 'success');
      router.back();
    } catch (error: any) {
      console.error('Error creating auction:', error);
      showToast(error.message || 'Failed to create auction', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartTime(selectedDate);
    }
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <BlurView intensity={isDark ? 25 : 45} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top']}>
          <View style={[
            styles.header,
            { 
              backgroundColor: isDark ? 'rgba(26, 29, 30, 0.8)' : 'rgba(249, 249, 249, 0.8)',
              borderBottomColor: isDark ? 'rgba(45, 45, 45, 0.3)' : 'rgba(0, 0, 0, 0.1)',
            }
          ]}>
            <TouchableOpacity 
              onPress={() => router.back()}
              style={[
                styles.closeButton,
                { backgroundColor: isDark ? 'rgba(45, 45, 45, 0.5)' : 'rgba(240, 240, 240, 0.5)' }
              ]}
            >
              <MaterialIcons 
                name="close" 
                size={24} 
                color={theme.text}
              />
            </TouchableOpacity>
            <ThemedText type="title" style={styles.title}>Create Auction</ThemedText>
            <TouchableOpacity 
              onPress={handleCreateAuction}
              disabled={isLoading}
              style={[
                styles.createButton,
                { 
                  backgroundColor: theme.tint,
                  opacity: isLoading ? 0.5 : 1 
                }
              ]}
            >
              <ThemedText style={styles.createButtonText}>
                {isLoading ? 'Creating...' : 'Create'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.content}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.formGroup}>
              <ThemedText type="default" style={styles.label}>Auction Name</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isDark ? 'rgba(37, 40, 41, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: isDark ? 'rgba(45, 45, 45, 0.8)' : 'rgba(224, 224, 224, 0.8)',
                    color: theme.text
                  }
                ]}
                value={auctionName}
                onChangeText={setAuctionName}
                placeholder="Enter auction name"
                placeholderTextColor={isDark ? '#666' : '#999'}
                editable={!isLoading}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="default" style={styles.label}>Budget per Player</ThemedText>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isDark ? 'rgba(37, 40, 41, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: isDark ? 'rgba(45, 45, 45, 0.8)' : 'rgba(224, 224, 224, 0.8)',
                    color: theme.text
                  }
                ]}
                value={budget}
                onChangeText={setBudget}
                placeholder="Enter budget amount"
                keyboardType="numeric"
                placeholderTextColor={isDark ? '#666' : '#999'}
                editable={!isLoading}
              />
            </View>

            <View style={styles.formGroup}>
              <ThemedText type="default" style={styles.label}>Start Time</ThemedText>
              <TouchableOpacity
                style={[
                  styles.dateButton,
                  { 
                    backgroundColor: isDark ? 'rgba(37, 40, 41, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                    borderColor: isDark ? 'rgba(45, 45, 45, 0.8)' : 'rgba(224, 224, 224, 0.8)'
                  }
                ]}
                onPress={() => !isLoading && setShowDatePicker(true)}
                disabled={isLoading}
              >
                <ThemedText type="default" style={styles.dateButtonText}>
                  {startTime.toLocaleString()}
                </ThemedText>
                <MaterialIcons 
                  name="event" 
                  size={20} 
                  color={theme.text}
                />
              </TouchableOpacity>
            </View>

            <View style={styles.formGroup}>
              <View style={styles.switchRow}>
                <ThemedText type="default" style={styles.label}>Auto-start auction</ThemedText>
                <Switch
                  value={autoStart}
                  onValueChange={setAutoStart}
                  trackColor={{ false: isDark ? '#404040' : '#D1D1D6', true: theme.tint + '80' }}
                  thumbColor={autoStart ? theme.tint : isDark ? '#808080' : '#FFFFFF'}
                  disabled={isLoading}
                  style={{ transform: [{ scale: 0.8 }] }}
                />
              </View>
              <ThemedText type="default" style={styles.helperText}>
                Auction will automatically start at the specified time
              </ThemedText>
            </View>

            {showDatePicker && (Platform.OS === 'android' ? (
              <DateTimePicker
                value={startTime}
                mode="datetime"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            ) : (
              <View style={[
                styles.datePickerContainer,
                { backgroundColor: isDark ? 'rgba(37, 40, 41, 0.95)' : 'rgba(255, 255, 255, 0.95)' }
              ]}>
                <DateTimePicker
                  value={startTime}
                  mode="datetime"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                  textColor={theme.text}
                  display="spinner"
                />
                <TouchableOpacity
                  style={[
                    styles.datePickerDoneButton,
                    { backgroundColor: theme.tint }
                  ]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <ThemedText style={styles.datePickerDoneText}>
                    Done
                  </ThemedText>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </SafeAreaView>
      </ThemedView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 3,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    height: 48,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    height: 48,
  },
  dateButtonText: {
    fontSize: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  helperText: {
    fontSize: 14,
    marginTop: 4,
    opacity: 0.7,
  },
  datePickerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  datePicker: {
    height: 200,
  },
  datePickerDoneButton: {
    alignSelf: 'stretch',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  datePickerDoneText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
