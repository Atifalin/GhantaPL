import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Text } from '@rneui/themed';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#2089dc" />
      <Text style={styles.text}>Loading...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  text: {
    marginTop: 10,
    color: '#666',
  },
});
