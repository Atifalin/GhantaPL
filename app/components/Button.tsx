import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, TextStyle, useColorScheme, Text } from 'react-native';
import Colors from '../constants/Colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'primary' | 'secondary';
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
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme ?? 'light'];

  const getBackgroundColor = () => {
    if (disabled) {
      return isDark ? '#444' : '#ccc';
    }
    if (variant === 'primary') {
      return colors.tint;
    }
    return isDark ? '#333' : '#e0e0e0';
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        { backgroundColor: getBackgroundColor() },
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text 
        style={[
          styles.text,
          { color: variant === 'primary' || isDark ? '#FFFFFF' : '#000000' },
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
