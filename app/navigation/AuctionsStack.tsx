import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import AuctionsListScreen from '../screens/AuctionsListScreen';
import CreateAuctionScreen from '../screens/CreateAuctionScreen';

const Stack = createStackNavigator();

export default function AuctionsStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="AuctionsList" 
        component={AuctionsListScreen}
      />
      <Stack.Screen 
        name="CreateAuction" 
        component={CreateAuctionScreen}
        options={{
          presentation: 'modal',
          headerShown: true,
          title: 'Create Auction',
          headerLeft: () => null,
          headerStyle: {
            backgroundColor: 'transparent',
          },
          headerShadowVisible: false,
          headerBlurEffect: 'regular',
          headerTitleStyle: {
            fontWeight: '600',
          },
        }}
      />
    </Stack.Navigator>
  );
}
