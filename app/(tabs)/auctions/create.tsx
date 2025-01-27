import React from 'react';
import { Stack } from 'expo-router';
import CreateAuctionScreen from '../../../app/screens/CreateAuctionScreen';

export default function CreateAuctionModal() {
  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'modal',
          headerShown: true,
          animation: 'slide_from_bottom',
          contentStyle: {
            backgroundColor: 'transparent',
          },
        }}
      />
      <CreateAuctionScreen />
    </>
  );
}
