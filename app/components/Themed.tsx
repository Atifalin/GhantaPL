import { Text, View, useColorScheme } from 'react-native';
import Colors from '../constants/Colors';

export function ThemedView(props: React.ComponentProps<typeof View>) {
  const colorScheme = useColorScheme();
  const backgroundColor = colorScheme === 'dark' ? Colors.dark.background : Colors.light.background;

  return <View style={[{ backgroundColor }, props.style]} {...props} />;
}

export function ThemedText(props: React.ComponentProps<typeof Text>) {
  const colorScheme = useColorScheme();
  const color = colorScheme === 'dark' ? Colors.dark.text : Colors.light.text;

  return <Text style={[{ color }, props.style]} {...props} />;
}

const Themed = {
  View: ThemedView,
  Text: ThemedText,
};

export default Themed;
