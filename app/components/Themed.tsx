import { Text, View, useColorScheme } from 'react-native';
import { Colors } from '../constants/Colors';

export function ThemedView(props: React.ComponentProps<typeof View>) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return <View style={[{ backgroundColor: colors.background }, props.style]} {...props} />;
}

export function ThemedText(props: React.ComponentProps<typeof Text>) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return <Text style={[{ color: colors.text }, props.style]} {...props} />;
}

const Themed = {
  View: ThemedView,
  Text: ThemedText,
};

export default Themed;
