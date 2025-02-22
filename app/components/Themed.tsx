import { Text, TextProps, View, ViewProps } from 'react-native';
import { useTheme } from '../context/ThemeContext';

type TextType = 'default' | 'title' | 'subtitle' | 'defaultSemiBold';

export type ThemedTextProps = TextProps & {
  type?: TextType;
};

export function ThemedText(props: ThemedTextProps) {
  const { style, type = 'default', ...otherProps } = props;
  const { theme } = useTheme();

  const getTextStyle = () => {
    const baseStyle = { color: theme.text };
    
    switch (type) {
      case 'title':
        return { ...baseStyle, fontSize: 24, fontWeight: '700' };
      case 'subtitle':
        return { ...baseStyle, fontSize: 18, fontWeight: '600' };
      case 'defaultSemiBold':
        return { ...baseStyle, fontSize: 16, fontWeight: '600' };
      default:
        return { ...baseStyle, fontSize: 16 };
    }
  };

  return <Text style={[getTextStyle(), style]} {...otherProps} />;
}

export function ThemedView(props: ViewProps) {
  const { style, ...otherProps } = props;
  const { theme } = useTheme();

  return (
    <View
      style={[{ backgroundColor: theme.background }, style]}
      {...otherProps}
    />
  );
}

const Themed = {
  View: ThemedView,
  Text: ThemedText,
};

export default Themed;
