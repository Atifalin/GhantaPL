import React from 'react';
import { Stack } from 'expo-router';
import AuctionsListScreen from '../../screens/AuctionsListScreen';

export default function AuctionsScreen() {
  return (
    <>
      <Stack.Screen 
        options={{
          title: 'Auctions',
          headerShown: true,
        }} 
      />
      <AuctionsListScreen />
    </>
  );
}
