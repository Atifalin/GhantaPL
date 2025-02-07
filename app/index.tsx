import { Stack } from 'expo-router';
import { AuthProvider } from '../contexts/AuthContext';
import { UserPrefsProvider } from '../contexts/UserPrefsContext';
import OnboardingScreen from './(auth)/onboarding';

export default function App() {
  return (
    <AuthProvider>
      <UserPrefsProvider>
        <Stack.Screen options={{ headerShown: false }} />
        <OnboardingScreen />
      </UserPrefsProvider>
    </AuthProvider>
  );
}
