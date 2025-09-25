import { Stack } from 'expo-router';
import React from 'react';

export default function HatlarStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1976D2',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 20,
        },
      }}
    >
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="ara" options={{ title: 'Hat Ara' }} />
      <Stack.Screen name="[kod]" />
    </Stack>
  );
}
