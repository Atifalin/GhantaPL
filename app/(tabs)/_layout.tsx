import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: isDark ? Colors.dark.tint : Colors.light.tint,
        tabBarInactiveTintColor: isDark ? Colors.dark.tabIconDefault : Colors.light.tabIconDefault,
        tabBarStyle: {
          backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
          borderTopColor: isDark ? '#2D2D2D' : '#e0e0e0',
        },
        headerStyle: {
          backgroundColor: isDark ? Colors.dark.background : Colors.light.background,
        },
        headerTintColor: isDark ? Colors.dark.text : Colors.light.text,
        headerShadowVisible: false,
        headerTitleStyle: {
          fontWeight: '600',
        },
        headerTitleAlign: 'center',
        headerShown: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <MaterialIcons name="home" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="players"
        options={{
          title: 'Players',
          tabBarIcon: ({ color }) => <MaterialIcons name="sports-soccer" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="auctions"
        options={{
          title: 'Auctions',
          headerShown: false,
          tabBarIcon: ({ color }) => <MaterialIcons name="gavel" size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="teams"
        options={{
          title: 'Teams',
          tabBarIcon: ({ color }) => <MaterialIcons name="group" size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}
