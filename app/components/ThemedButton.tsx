import React from 'react';
import { Pressable, StyleSheet, PressableProps, ViewStyle, TextStyle, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { ThemedText } from './Themed';

interface ThemedButtonProps extends PressableProps {
  title: string;
  icon?: React.ReactNode;
  variant?: 'primary' | 'secondary';
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export function ThemedButton({ 
  title, 
  icon, 
  variant = 'primary',
  style,
  textStyle,
  ...props 
}: ThemedButtonProps) {
  const { theme, isDark } = useTheme();
  
  return (
    <Pressable
      {...props}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: pressed 
            ? isDark ? '#2D2D2D' : '#f0f0f0'
            : variant === 'primary' 
              ? theme.tint
              : isDark ? '#252829' : '#fff',
        },
        style
      ]}
    >
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <ThemedText 
        style={[
          styles.text,
          {
            color: variant === 'primary' ? '#fff' : theme.text
          },
          textStyle
        ]}
      >
        {title}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
  },
  iconContainer: {
    marginRight: 8,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 