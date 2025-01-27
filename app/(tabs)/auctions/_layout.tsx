import { Stack } from 'expo-router';

export default function AuctionsLayout() {
  return (
    <Stack screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="index"
        options={{
          title: 'Auctions',
        }}
      />
      <Stack.Screen
        name="create"
        options={{
          presentation: 'modal',
          title: 'Create Auction',
        }}
      />
    </Stack>
  );
}
