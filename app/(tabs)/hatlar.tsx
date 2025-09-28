import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, SafeAreaView, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

// Arka plan resmini buraya ekliyoruz
const backgroundImage = require('../../assets/images/tram_stop.jpg');

export default function HatlarScreen() {
  const router = useRouter();

  return (
    <ImageBackground source={backgroundImage} style={styles.container}>
      {/* Arka plan resminin üzerine gelen durum çubuğu metinlerini beyaz yapar */}
      <StatusBar barStyle="light-content" />

      {/* SafeAreaView, içeriğin telefon çentikleri altına girmesini engeller */}
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Hatlar</Text>
          <Text style={styles.subtitle}>Gaziantep'teki tüm otobüs ve tramvay hatlarını keşfet.</Text>
        </View>

        <View style={styles.content}>
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.8}
            onPress={() => router.push('/hatlar/ara')}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="search" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Hatları Ara</Text>
              <Text style={styles.cardDescription}>Kod veya isimle otobüs/tramvay bul</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#555" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { marginTop: 20 }]}
            activeOpacity={0.8}
            onPress={() => router.push('/durak/favori-duraklar')}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="star" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Favori Duraklarım</Text>
              <Text style={styles.cardDescription}>Kaydettiğin durakları hızlıca gör</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#555" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.card, { marginTop: 20 }]}
            activeOpacity={0.8}
            onPress={() => router.push('/durak/akilli-durak')}
          >
            <View style={styles.cardIconContainer}>
              <Ionicons name="qr-code" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.cardTextContainer}>
              <Text style={styles.cardTitle}>Akıllı Durak</Text>
              <Text style={styles.cardDescription}>Duraktaki QR kodunu okutarak gelen araçları gör</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#555" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

// Hatlar ana sayfasında header'ı gizle
HatlarScreen.options = {
  headerShown: false,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // Arka plan resminin tüm alanı kaplamasını sağlar
  },
  safeArea: {
    flex: 1,
    // Arka plan resminin üzerine hafif bir karartma ekleyerek metin okunabilirliğini artırır
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 24,
    alignItems: 'flex-start', // Metinleri sola hizala
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  subtitle: {
    fontSize: 18,
    color: '#E0E0E0',
    marginTop: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.7)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  content: {
    flex: 1,
    justifyContent: 'center', // Kartı dikeyde ortalar
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    maxWidth: 500,
    flexDirection: 'row', // İçerikleri yatayda hizalar
    alignItems: 'center',
    // "Buzlu Cam" (Frosted Glass) efekti
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 20,
    padding: 16,
    // Modern ve yumuşak bir gölge
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    // Cam efektini güçlendirmek için ince bir çerçeve
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  cardIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25, // Daire şekli için
    backgroundColor: '#1976D2', // Ana tema rengi
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardTextContainer: {
    flex: 1, // Kalan tüm boşluğu doldurur
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1A202C', // Koyu renk metin
  },
  cardDescription: {
    fontSize: 14,
    color: '#4A5568', // Daha yumuşak bir gri
    marginTop: 2,
  },
});