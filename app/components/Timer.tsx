import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated, useColorScheme } from 'react-native';
import { ThemedText, ThemedView } from './Themed';
import { Colors } from '../constants/Colors';

interface TimerProps {
  duration: number;
  onComplete: () => void;
  isPaused?: boolean;
  style?: ViewStyle;
  key?: string | number;
  lastBidTime: string;  // ISO string of the last bid time
}

export default function Timer({ duration, onComplete, isPaused = false, style, lastBidTime }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState(duration);
  const timerRef = useRef<NodeJS.Timeout>();
  const progressAnim = useRef(new Animated.Value(1)).current;
  const progressAnimation = useRef<Animated.CompositeAnimation | null>(null);
  const hasCompletedRef = useRef(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  useEffect(() => {
    // Calculate how much time has passed since the last bid
    const lastBidDate = new Date(lastBidTime);
    const now = new Date();
    const elapsedSeconds = Math.floor((now.getTime() - lastBidDate.getTime()) / 1000);
    const remainingTime = Math.max(0, duration - elapsedSeconds);
    
    setTimeLeft(remainingTime);
    progressAnim.setValue(remainingTime / duration);
    startProgressAnimation(remainingTime);

    // Reset completion flag when lastBidTime changes
    hasCompletedRef.current = false;

    // If time has already elapsed, trigger completion
    if (remainingTime <= 0 && !hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete();
    }
  }, [lastBidTime, duration]);

  const startProgressAnimation = (remaining: number) => {
    if (progressAnimation.current) {
      progressAnimation.current.stop();
    }

    progressAnimation.current = Animated.timing(progressAnim, {
      toValue: 0,
      duration: remaining * 1000,
      useNativeDriver: false,
    });

    if (!isPaused) {
      progressAnimation.current.start();
    }
  };

  useEffect(() => {
    if (isPaused) {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (progressAnimation.current) {
        progressAnimation.current.stop();
      }
      return;
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prevTime) => {
        if (prevTime <= 1 && !hasCompletedRef.current) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
          }
          hasCompletedRef.current = true;
          onComplete();
          return 0;
        }
        return prevTime > 0 ? prevTime - 1 : 0;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (progressAnimation.current) {
        progressAnimation.current.stop();
      }
    };
  }, [isPaused, onComplete]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const width = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const getProgressColor = () => {
    if (timeLeft <= 5) return '#FF3B30';  // Error red
    if (timeLeft <= 10) return '#FFCC00';  // Warning yellow
    return colors.tint;  // Primary color
  };

  return (
    <ThemedView style={[styles.container, style]}>
      <View style={styles.progressContainer}>
        <Animated.View 
          style={[
            styles.progressBar,
            { 
              width,
              backgroundColor: getProgressColor(),
            }
          ]} 
        />
      </View>
      <ThemedText style={[
        styles.text, 
        isPaused && styles.pausedText,
        timeLeft <= 5 && { color: '#FF3B30' }  // Error red
      ]}>
        {isPaused ? 'PAUSED' : formatTime(timeLeft)}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  progressContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  text: {
    fontSize: 20,
    fontWeight: '700',
  },
  pausedText: {
    opacity: 0.7,
  },
});
