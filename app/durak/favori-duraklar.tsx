import React, { useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  StatusBar, 
  FlatList, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface FavoriteStop {
  id: string;
  name: string;
  busStopName: string;
  busStopCode: string;
}

// Önceki sayfadaki tema renklerini aynen kullanıyoruz
const themeColors = {
  primary: '#1976D2',
  secondary: '#43A047',
  background: '#F0F4F8',
  cardBackground: '#FFFFFF',
  textPrimary: '#2D3748',
  textSecondary: '#718096',
  accent: '#FFC107',
  error: '#D32F2F',
};

export default function FavoriDuraklarScreen() {
  const [favoriteStops, setFavoriteStops] = useState<FavoriteStop[]>([]);
  const router = useRouter();

  const loadFavoriteStops = async () => {
    try {
      const storedFavorites = await AsyncStorage.getItem('favoriteStops');
      if (storedFavorites) {
        setFavoriteStops(JSON.parse(storedFavorites));
      } else {
        setFavoriteStops([]); // Favori yoksa listeyi boşalt
      }
    } catch (e) {
      console.error('Favori duraklar yüklenirken hata oluştu', e);
    }
  };

  // Sayfa her açıldığında favorileri yeniden yükle
  useFocusEffect(
    useCallback(() => {
      loadFavoriteStops();
    }, [])
  );

  const removeFavoriteStop = async (stopId: string) => {
    Alert.alert(
      'Favoriyi Kaldır',
      'Bu durağı favorilerinden kaldırmak istediğine emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          onPress: async () => {
            try {
              const updatedFavorites = favoriteStops.filter(stop => stop.id !== stopId);
              await AsyncStorage.setItem('favoriteStops', JSON.stringify(updatedFavorites));
              setFavoriteStops(updatedFavorites);
              // alert yerine daha modern bir bildirim sistemi kullanılabilir, şimdilik kalıyor.
            } catch (e) {
              console.error('Favori durak kaldırılırken hata oluştu', e);
            }
          },
          style: 'destructive'
        },
      ],
      { cancelable: true }
    );
  };

  const renderItem = ({ item }: { item: FavoriteStop }) => (
    <TouchableOpacity 
      style={styles.card}
      onPress={() => router.push(`/durak/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.cardIconContainer}>
        <MaterialCommunityIcons name="bus-stop" size={24} color={themeColors.primary} />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.cardSubtitle} numberOfLines={1}>
          {item.busStopName}
          {item.busStopCode ? ` (${item.busStopCode})` : ''}
        </Text>
      </View>
      <TouchableOpacity onPress={() => removeFavoriteStop(item.id)} style={styles.removeButton}>
        <MaterialCommunityIcons name="trash-can-outline" size={26} color={themeColors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
  
  const renderEmptyComponent = () => (
    <View style={styles.emptyContent}>
      <MaterialCommunityIcons name="star-off-outline" size={80} color={themeColors.textSecondary} style={{ opacity: 0.5 }}/>
      <Text style={styles.emptyTitle}>Henüz Favori Durağınız Yok</Text>
      <Text style={styles.emptySubtitle}>
        Bir durağı favorilerinize eklemek için durak detay sayfasındaki yıldız ikonuna dokunun.
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      <Stack.Screen 
        options={{ 
          title: 'Favori Duraklarım',
          headerStyle: { backgroundColor: themeColors.primary },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: 'bold' },
        }} 
      />
      <FlatList
        data={favoriteStops}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmptyComponent}
        ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  listContent: {
    padding: 20,
    flexGrow: 1, // Listenin boşken de alanı doldurmasını sağlar
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: themeColors.cardBackground,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  cardIconContainer: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${themeColors.primary}20`, // %20 opacity
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: themeColors.textPrimary,
  },
  cardSubtitle: {
    fontSize: 14,
    color: themeColors.textSecondary,
    marginTop: 4,
  },
  removeButton: {
    marginLeft: 15,
    padding: 8, // Dokunma alanını genişlet
    borderRadius: 30,
  },
  emptyContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: themeColors.textPrimary,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    color: themeColors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 24,
  },
});