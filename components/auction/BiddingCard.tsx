import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { ThemedText, ThemedView } from '../Themed';
import { Colors } from '../../constants/Colors';
import PlayerCard from '../PlayerCard';
import Timer from '../Timer';
import Button from '../Button';
import { Player } from '../../types/player';

interface BiddingCardProps {
  player: Player & { wasSkippedBefore?: boolean; skipCount?: number };
  currentBid: number;
  isPaused: boolean;
  userBudget: number;
  onBid: (amount: number) => void;
  onTimerComplete: () => void;
  isHost: boolean;
  noBidCount: number;
  totalParticipants: number;
  lastBidTime: string;
}

export default function BiddingCard({ 
  player, 
  currentBid, 
  isPaused,
  userBudget,
  onBid,
  onTimerComplete,
  isHost,
  noBidCount,
  totalParticipants,
  lastBidTime
}: BiddingCardProps) {
  const colorScheme = useColorScheme();
  const baseColors = Colors[colorScheme ?? 'light'];
  const colors = {
    ...baseColors,
    warning: '#FFCC00',
    error: '#FF3B30',
    border: colorScheme === 'dark' ? '#404040' : '#E5E5EA'
  };
  const isDark = colorScheme === 'dark';
} 