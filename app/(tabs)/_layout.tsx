import { Tabs } from 'expo-router';
import React from 'react';

export default function TabLayout() {

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          height: 60,
          display: 'none',
        },
        headerStyle: {
          marginBottom: 20,
        },
        tabBarActiveTintColor: "#fff",
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Anasayfa'
        }}
      />
    </Tabs>
  );
}
