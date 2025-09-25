import React, { useEffect, useState, useLayoutEffect } from 'react';
import { 
  View, 
  Text, 
  ActivityIndicator, 
  StyleSheet, 
  FlatList, 
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Görsel zenginlik katmak için ikonları import ediyoruz
import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons'; 

// Tema renklerini bir obje olarak tanımlayalım, yönetmesi daha kolay olur.
const themeColors = {
  primary: '#1976D2',    // Ana Mavi
  secondary: '#43A047',  // Ana Yeşil
  background: '#F0F4F8', // Daha yumuşak bir arka plan
  cardBackground: '#FFFFFF',
  textPrimary: '#2D3748',
  textSecondary: '#718096',
  accent: '#FFC107',     // Plaka gibi alanlar için dikkat çekici bir renk
  error: '#D32F2F',
};

interface FavoriteStop {
  id: string;
  name: string;
  busStopName: string;
  busStopCode: string;
}

export default function DurakDetayScreen() {
  const { stopId } = useLocalSearchParams();
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [favoriteName, setFavoriteName] = useState('');
  const [isFavorite, setIsFavorite] = useState(false);

  // Favori durumunu kontrol eden fonksiyon
  const checkFavoriteStatus = async () => {
    try {
      const existingFavorites = await AsyncStorage.getItem('favoriteStops');
      const favorites: FavoriteStop[] = existingFavorites ? JSON.parse(existingFavorites) : [];
      const isCurrentlyFavorite = favorites.some(fav => fav.id === stopId);
      setIsFavorite(isCurrentlyFavorite);
    } catch (e) {
      console.error('Favori durumu kontrol edilirken hata oluştu', e);
    }
  };

  // Favori durakları kaldırma fonksiyonu
  const removeFavoriteStop = async () => {
    Alert.alert(
      'Favoriyi Kaldır',
      'Bu durağı favorilerinden kaldırmak istediğine emin misin?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Kaldır',
          onPress: async () => {
            try {
              const existingFavorites = await AsyncStorage.getItem('favoriteStops');
              let favorites: FavoriteStop[] = existingFavorites ? JSON.parse(existingFavorites) : [];
              favorites = favorites.filter(fav => fav.id !== stopId);
              await AsyncStorage.setItem('favoriteStops', JSON.stringify(favorites));
              setIsFavorite(false);
              alert('Favori durak kaldırıldı!');
            } catch (e) {
              console.error('Favori durak kaldırılırken hata oluştu', e);
              alert('Kaldırma başarısız oldu.');
            }
          },
        },
      ],
      { cancelable: true }
    );
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      title: data?.stopInfo?.busStopName || 'Durak Detayı',
      headerRight: () => (
        <TouchableOpacity 
          onPress={() => {
            if (isFavorite) {
              removeFavoriteStop();
            } else {
              setModalVisible(true);
            }
          }}
          style={{ marginRight: 15 }}
        >
          <FontAwesome name={isFavorite ? "star" : "star-o"} size={24} color="white" />
        </TouchableOpacity>
      ),
    });
  }, [data, navigation, isFavorite]);

  useEffect(() => {
    if (!stopId) return;
    setLoading(true);
    setError(null);
    checkFavoriteStatus();
    fetch(
      `https://service.kentkart.com/rl1/web/nearest/bus?region=028&lang=tr&authType=4&accuracy=0&lat=0&lng=0&busStopId=${stopId}`,
      {
        credentials: 'omit',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:143.0) Gecko/20100101 Firefox/143.0',
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'tr-TR,tr;q=0.8,en-US;q=0.5,en;q=0.3',
          'Content-Type': 'application/json',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'cross-site',
          Priority: 'u=0',
        },
        referrer: 'https://online.gaziantepkart.com.tr/',
        method: 'GET',
        mode: 'cors',
      }
    )
      .then((res) => res.json())
      .then((json) => {
        setData(json);
        setLoading(false);
      })
      .catch(() => {
        setError('Veri alınamadı.');
        setLoading(false);
      });
  }, [stopId]);

  const saveFavoriteStop = async () => {
    if (!favoriteName.trim()) {
      Alert.alert('Hata', 'Favori durak adı boş olamaz.');
      return;
    }

    try {
      const existingFavorites = await AsyncStorage.getItem('favoriteStops');
      const favorites: FavoriteStop[] = existingFavorites ? JSON.parse(existingFavorites) : [];
      
      if (favorites.some(fav => fav.id === stopId)) {
        Alert.alert('Hata', 'Bu durak zaten favorilerinizde kayıtlı.');
        setModalVisible(false);
        setFavoriteName('');
        return;
      }

      const newFavorite = {
        id: stopId as string,
        name: favoriteName.trim(),
        busStopName: data.stopInfo.busStopName,
        busStopCode: data.stopInfo.busStopid,
      };

      favorites.push(newFavorite);
      await AsyncStorage.setItem('favoriteStops', JSON.stringify(favorites));
      setModalVisible(false);
      setFavoriteName('');
      setIsFavorite(true);
      alert('Favori durak kaydedildi!');
    } catch (e) {
      console.error('Favori durak kaydedilirken hata oluştu', e);
      alert('Kaydetme başarısız oldu.');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={themeColors.primary} />
        <Text style={styles.loadingText}>Yükleniyor...</Text>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.center}>
        <MaterialCommunityIcons name="bus-stop-uncovered" size={64} color={themeColors.error} />
        <Text style={styles.errorText}>{error || 'Durak bulunamadı.'}</Text>
      </View>
    );
  }

  const { stopInfo, busList = [], routeList = [] } = data;

  // Yaklaşan otobüsler için render item fonksiyonu
  const renderBusItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardIconContainer}>
        <FontAwesome name="bus" size={24} color={themeColors.primary} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTitleContainer}>
          <View style={[styles.routeBadge, { backgroundColor: item.routeColor ? `#${item.routeColor}` : themeColors.primary }]}>
            <Text style={[styles.routeBadgeText, { color: item.routeTextColor ? `#${item.routeTextColor}` : '#FFFFFF' }]}>{item.displayRouteCode}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{item.headSign}</Text>
          {item.disabledPerson === '1' && (
            <FontAwesome name="wheelchair" size={18} color={themeColors.textPrimary} style={{ marginLeft: 8 }} />
          )}
        </View>
        <View style={styles.plateContainer}>
          <MaterialCommunityIcons name="card-account-details-outline" size={16} color={themeColors.textSecondary} />
          <Text style={styles.plateText}>{item.plate}</Text>
        </View>
      </View>
      <View style={styles.cardRightContent}>
        <Text style={styles.timeText}>{item.timeDiff}</Text>
        <Text style={styles.timeLabel}>dk</Text>
      </View>
    </View>
  );

  // Durağa uğrayan hatlar için render item fonksiyonu
  const renderRouteItem = ({ item }: { item: any }) => (
    <View style={styles.card}>
       <View style={[styles.cardIconContainer, { backgroundColor: `${themeColors.secondary}20` }]}>
        <MaterialCommunityIcons name="routes" size={24} color={themeColors.secondary} />
      </View>
      <View style={styles.cardContent}>
        <View style={styles.cardTitleContainer}>
            <View style={[styles.routeBadge, { backgroundColor: item.routeColor ? `#${item.routeColor}` : themeColors.secondary }]}>
                <Text style={[styles.routeBadgeText, { color: item.routeTextColor ? `#${item.routeTextColor}` : '#FFFFFF' }]}>{item.displayRouteCode}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{item.headSign}</Text>
        </View>
      </View>
      <View style={styles.cardRightContentMinimal}>
        <Text style={styles.nextTripText}>Sonraki Varış: {item.nextTripArrivalTime || '-'}</Text>
      </View>
    </View>
  );

  // Bilgi bulunamadığında gösterilecek component
  const renderEmptyState = (message: string) => (
      <View style={styles.emptyStateContainer}>
        <MaterialCommunityIcons name="information-outline" size={32} color={themeColors.textSecondary} />
        <Text style={styles.emptyStateText}>{message}</Text>
      </View>
  );

  return (
    <SafeAreaView style={styles.fullContainer}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Durak Başlığı ve ID'si */}
        <View style={styles.header}>
          <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">{stopInfo.busStopName}</Text>
          <View style={styles.stopCodeBadge}>
            <Text style={styles.subtitle}>Durak No: {stopInfo.busStopid}</Text>
          </View>
        </View>

        {/* Bölüm Başlıkları ve Listeler */}
        <Text style={styles.sectionTitle}>Durağa Yaklaşan Araçlar</Text>
        <FlatList
          data={busList}
          keyExtractor={(item) => `bus-${item.busId}-${item.plate}`}
          renderItem={renderBusItem}
          ListEmptyComponent={() => renderEmptyState("Şu anda durağa yaklaşan araç bulunmuyor.")}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />

        <Text style={styles.sectionTitle}>Bu Duraktan Geçen Hatlar</Text>
        <FlatList
          data={routeList}
          keyExtractor={(item, index) => `route-${item.routeCode}-${index}`}
          renderItem={renderRouteItem}
          ListEmptyComponent={() => renderEmptyState("Bu duraktan geçen hat bilgisi bulunamadı.")}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />

        {/* Favori Durak Ekle Modal'ı */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={isModalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              <Text style={styles.modalTitle}>Favori Durak Adı</Text>
              <TextInput
                style={styles.input}
                onChangeText={setFavoriteName}
                value={favoriteName}
                placeholder="Örn: Evimin Önündeki Durak"
                placeholderTextColor="#999"
              />
              <View style={styles.modalButtonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.buttonClose]}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.textStyle}>İptal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.buttonSave]}
                  onPress={saveFavoriteStop}
                >
                  <Text style={styles.textStyle}>Kaydet</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
    backgroundColor: themeColors.background,
  },
  container: {
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: themeColors.background,
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: themeColors.textSecondary,
  },
  errorText: {
    marginTop: 15,
    fontSize: 18,
    color: themeColors.error,
    textAlign: 'center',
    fontWeight: '500',
  },
  header: {
    marginBottom: 25,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: themeColors.textPrimary,
    marginBottom: 8,
  },
  stopCodeBadge: {
    backgroundColor: themeColors.accent,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    alignSelf: 'flex-start', // Sadece kendi genişliği kadar yer kaplasın
  },
  subtitle: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: themeColors.textPrimary,
    marginTop: 15,
    marginBottom: 15,
  },
  card: {
    backgroundColor: themeColors.cardBackground,
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: `${themeColors.primary}20`, // %20 opacity
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: themeColors.textPrimary,
    flex: 1, // Uzun metinlerin sığması için
  },
  routeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeBadgeText: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  plateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  plateText: {
    color: themeColors.textSecondary,
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 5,
  },
  cardRightContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  timeText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: themeColors.primary,
  },
  timeLabel: {
    fontSize: 14,
    color: themeColors.textSecondary,
  },
  cardRightContentMinimal: {
    marginLeft: 10,
  },
  nextTripText: {
    fontSize: 13,
    color: themeColors.textSecondary,
    fontStyle: 'italic',
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: themeColors.cardBackground,
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 16,
    color: themeColors.textSecondary,
    textAlign: 'center',
    marginTop: 10,
  },
  // Modal Styles
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Arka planı karart
  },
  modalView: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    marginBottom: 20,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: 'bold',
    color: themeColors.textPrimary,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#f9f9f9',
    paddingHorizontal: 15,
    width: '100%',
    borderRadius: 10,
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    width: '100%',
    marginTop: 25,
  },
  button: {
    borderRadius: 10,
    padding: 12,
    elevation: 2,
    flex: 1,
  },
  buttonClose: {
    backgroundColor: '#f1f1f1',
    marginRight: 10,
  },
  buttonSave: {
    backgroundColor: themeColors.primary,
  },
  textStyle: {
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});