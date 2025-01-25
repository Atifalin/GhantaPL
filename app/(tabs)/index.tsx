import React from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Text, Card, Button } from '@rneui/themed';
import { useAuth } from '../../contexts/AuthContext';

export default function HomeScreen() {
  const { user } = useAuth();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text h1>Welcome to GhantaPL</Text>
        <Text style={styles.subtitle}>Your FIFA Auction Platform</Text>
      </View>

      <View style={styles.content}>
        <Card>
          <Card.Title>Quick Actions</Card.Title>
          <Card.Divider />
          <Button
            title="Create Auction"
            type="outline"
            containerStyle={styles.buttonContainer}
          />
          <Button
            title="Join Auction"
            type="outline"
            containerStyle={styles.buttonContainer}
          />
          <Button
            title="View My Teams"
            type="outline"
            containerStyle={styles.buttonContainer}
          />
        </Card>

        <Card>
          <Card.Title>Active Auctions</Card.Title>
          <Card.Divider />
          <Text style={styles.emptyText}>No active auctions at the moment</Text>
        </Card>

        <Card>
          <Card.Title>My Recent Activity</Card.Title>
          <Card.Divider />
          <Text style={styles.emptyText}>No recent activity</Text>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#f9f9f9',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  content: {
    padding: 10,
  },
  buttonContainer: {
    marginVertical: 5,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
});
