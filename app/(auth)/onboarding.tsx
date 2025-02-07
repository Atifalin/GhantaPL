import React, { useState } from 'react';
import { StyleSheet, View, ScrollView } from 'react-native';
import { Button, Text } from '@rneui/themed';
import { router } from 'expo-router';
import Animated, { FadeInRight, FadeOutLeft } from 'react-native-reanimated';

const OnboardingScreen = () => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      title: 'Welcome to GhantaPL',
      description: 'Your ultimate FIFA auction platform for building dream teams.',
    },
    {
      title: 'Create & Join Auctions',
      description: 'Host your own auctions or join others to bid on players.',
    },
    {
      title: 'Build Your Squad',
      description: 'Manage your team, set formations, and compete with others.',
    },
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      router.replace('/(auth)/sign-in');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View 
          entering={FadeInRight} 
          exiting={FadeOutLeft}
          key={currentStep}
          style={styles.content}
        >
          <Text h1 style={styles.title}>{steps[currentStep].title}</Text>
          <Text style={styles.description}>{steps[currentStep].description}</Text>
        </Animated.View>
      </ScrollView>
      
      <View style={styles.footer}>
        <View style={styles.dots}>
          {steps.map((_, index) => (
            <View
              key={index}
              style={[
                styles.dot,
                currentStep === index && styles.activeDot,
              ]}
            />
          ))}
        </View>
        
        <Button
          title={currentStep === steps.length - 1 ? "Get Started" : "Next"}
          onPress={handleNext}
          size="lg"
          radius="lg"
        />
        
        {currentStep < steps.length - 1 && (
          <Button
            title="Skip"
            type="clear"
            onPress={() => router.replace('/(auth)/sign-in')}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  footer: {
    padding: 20,
    paddingBottom: 80, // Increased bottom padding
    marginTop: 'auto', // Push to bottom but respect content
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ddd',
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#2089dc',
  },
});

export default OnboardingScreen;
