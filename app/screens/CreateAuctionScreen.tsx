import React, { useState } from 'react';
import { View, StyleSheet, TextInput, TouchableOpacity, Platform, ActivityIndicator, ScrollView, Switch, Alert, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { ThemedView } from '../../components/ThemedView';
import { ThemedText } from '../../components/ThemedText';
import { Colors } from '../../constants/Colors';
import { supabase } from '../../lib/supabase';
import { useToast } from '../context/ToastContext';

export default function CreateAuctionScreen() {
  const router = useRouter();
  const [auctionName, setAuctionName] = useState('');
  const [budget, setBudget] = useState('');
  const [startTime, setStartTime] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [autoStart, setAutoStart] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { showToast } = useToast();

  const handleCreateAuction = async () => {
    if (!auctionName || !budget) {
      showToast('Please fill in all fields', 'error');
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('auctions')
        .insert([
          {
            name: auctionName,
            budget_per_player: parseFloat(budget),
            start_time: startTime.toISOString(),
            auto_start: autoStart,
            status: 'pending',
            created_by: user.id,
            host_id: user.id
          }
        ]);

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
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={[
          styles.header,
          { backgroundColor: isDark ? '#1A1D1E' : '#f9f9f9' }
        ]}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={styles.closeButton}
          >
            <MaterialIcons 
              name="close" 
              size={24} 
              color={isDark ? Colors.dark.text : Colors.light.text} 
            />
          </TouchableOpacity>
          <ThemedText type="title" style={styles.title}>Create Auction</ThemedText>
          <TouchableOpacity 
            onPress={handleCreateAuction}
            disabled={isLoading}
            style={[
              styles.createButton,
              { opacity: isLoading ? 0.5 : 1 }
            ]}
          >
            <ThemedText style={{ color: isDark ? Colors.dark.tint : Colors.light.tint }}>
              {isLoading ? 'Creating...' : 'Create'}
            </ThemedText>
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={[
            styles.content,
            { backgroundColor: isDark ? Colors.dark.background : Colors.light.background }
          ]}
        >
          <View style={styles.formGroup}>
            <ThemedText type="default" style={styles.label}>Auction Name</ThemedText>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isDark ? '#252829' : '#fff',
                  borderColor: isDark ? '#2D2D2D' : '#e0e0e0',
                  color: isDark ? Colors.dark.text : Colors.light.text
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
                  backgroundColor: isDark ? '#252829' : '#fff',
                  borderColor: isDark ? '#2D2D2D' : '#e0e0e0',
                  color: isDark ? Colors.dark.text : Colors.light.text
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
                  backgroundColor: isDark ? '#252829' : '#fff',
                  borderColor: isDark ? '#2D2D2D' : '#e0e0e0'
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
                color={isDark ? Colors.dark.text : Colors.light.text} 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.formGroup}>
            <View style={styles.switchRow}>
              <ThemedText type="default" style={styles.label}>Auto-start auction</ThemedText>
              <Switch
                value={autoStart}
                onValueChange={setAutoStart}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={autoStart ? '#2196F3' : '#f4f3f4'}
                disabled={isLoading}
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
              is24Hour={true}
              onChange={handleDateChange}
              minimumDate={new Date()}
            />
          ) : (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={startTime}
                mode="datetime"
                is24Hour={true}
                onChange={handleDateChange}
                minimumDate={new Date()}
                textColor={isDark ? Colors.dark.text : Colors.light.text}
              />
              <TouchableOpacity
                style={styles.datePickerDoneButton}
                onPress={() => setShowDatePicker(false)}
              >
                <ThemedText type="default" style={styles.datePickerDoneText}>
                  Done
                </ThemedText>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderBottomColor: '#2D2D2D',
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    height: 44,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    height: 44,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
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
    backgroundColor: Platform.OS === 'ios' ? '#00000066' : 'transparent',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
  },
  datePickerDoneButton: {
    alignSelf: 'flex-end',
    padding: 16,
  },
  datePickerDoneText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
