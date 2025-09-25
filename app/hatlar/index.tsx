import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const bgImage = require('../../assets/images/gaziantep.jpg');

export default function HatlarScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hatlar</Text>
      <Text style={styles.desc}>Gaziantep'teki tüm otobüs ve tramvay hatlarını keşfet.</Text>
      <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={() => router.push('/hatlar/ara')}>
        <ImageBackground source={bgImage} style={styles.cardBg} imageStyle={{ borderRadius: 18, opacity: 0.7 }}>
          <View style={styles.cardContent}>
            <Ionicons name="search" size={38} color="#1976D2" style={{ marginBottom: 8 }} />
            <Text style={styles.cardTitle}>Hatları Ara</Text>
            <Text style={styles.cardDesc}>Kod veya isimle otobüs/tramvay bul</Text>
          </View>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
}

// Hatlar ana sayfasında header'ı gizle
HatlarScreen.options = {
  headerShown: false,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    backgroundColor: '#F7FAFC',
    paddingTop: 48,
    paddingHorizontal: 18,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 8,
    marginTop: 8,
    letterSpacing: 0.2,
  },
  desc: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.85,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 18,
    overflow: 'hidden',
    marginTop: 12,
    shadowColor: '#1976D2',
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
  },
  cardBg: {
    width: '100%',
    height: 170,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.82)',
    borderRadius: 18,
    padding: 18,
    margin: 10,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 2,
  },
  cardDesc: {
    fontSize: 15,
    color: '#333',
    opacity: 0.85,
  },
});
