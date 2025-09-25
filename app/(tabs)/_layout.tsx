
import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTabBarVisibility } from '../../utils/TabBarVisibilityContext';

export default function TabLayout() {
  const { tabBarVisible } = useTabBarVisibility();
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          height: 60,
          backgroundColor: '#1976D2',
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          borderTopWidth: 0,
          elevation: 10,
          // tabBarVisible false ise görünmez yap
          display: tabBarVisible ? 'flex' : 'none',
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#bbdefb',
        animation: 'fade',
        headerShown: false,
        tabBarIconStyle: {
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 4,
        },
        tabBarItemStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Anasayfa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="hatlar"
        options={{
          title: 'Hatlar',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bus" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
