import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle, useColorScheme, Text } from 'react-native';
import { Colors } from '../constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary' | 'warning';
}

export default function Button({ 
  title, 
  onPress, 
  disabled, 
  style, 
  textStyle,
  variant = 'primary' 
}: ButtonProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getBackgroundColor = () => {
    if (disabled) return '#ccc';
    switch (variant) {
      case 'primary':
        return colors.tint;
      case 'secondary':
        return 'transparent';
      case 'warning':
        return '#FF3B30';
      default:
        return colors.tint;
    }
  };

  const getTextColor = () => {
    if (disabled) return '#666';
    switch (variant) {
      case 'primary':
      case 'warning':
        return '#fff';
      case 'secondary':
        return colors.text;
      default:
        return '#fff';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.text },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text 
        style={[
          styles.text,
          { color: getTextColor() },
          textStyle,
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
