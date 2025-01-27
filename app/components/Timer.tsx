import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { ThemedText, ThemedView } from './Themed';
import Colors from '../constants/Colors';

interface TimerProps {
  duration: number;
  onComplete: () => void;
  isPaused?: boolean;
  style?: ViewStyle;
  key?: string | number;
}

export default function Timer({ duration, onComplete, isPaused = false, style }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const timerRef = useRef<NodeJS.Timeout>();
  const progress = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setTimeLeft(duration);
    progress.setValue(1);
  }, [duration]);

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          onComplete();
          return 0;
        }
        return prevTime - 1;
      });
    }, 1000);

    // Start progress animation
    Animated.timing(progress, {
      toValue: 0,
      duration: timeLeft * 1000,
      useNativeDriver: false,
    }).start();

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isPaused, onComplete, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const width = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <ThemedView style={[styles.container, style]}>
      <View style={styles.progressContainer}>
        <Animated.View 
          style={[
            styles.progressBar,
            { 
              width,
              backgroundColor: timeLeft <= 10 ? Colors.light.error : Colors.light.primary 
            }
          ]} 
        />
      </View>
      <ThemedText style={[styles.text, isPaused && styles.pausedText]}>
        {isPaused ? 'PAUSED' : formatTime(timeLeft)}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  progressContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginBottom: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
  },
  pausedText: {
    opacity: 0.7,
  },
});
