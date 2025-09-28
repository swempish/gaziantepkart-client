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
  Animated, // Animasyon için ekledik
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
  const pulseAnimation = new Animated.Value(1); // Animasyon için state

  // Veri çekme mantığını ayrı bir fonksiyona taşıyalım
  const fetchData = (isInitialLoad = false) => {
    if (isInitialLoad) {
      setLoading(true);
      setError(null);
    }
    
    if (!stopId) return;

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
        // Animasyonu tetikle
        pulseAnimation.setValue(0.8);
        Animated.spring(pulseAnimation, {
          toValue: 1,
          friction: 3,
          useNativeDriver: true,
        }).start();
      })
      .catch(() => {
        setError('Veri alınamadı.');
      })
      .finally(() => {
        if (isInitialLoad) {
          setLoading(false);
        }
      });
  };

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
      data?.stopInfo?.busStopName ? (
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
      ) : null
      ),
    });
  }, [data, navigation, isFavorite]);

  useEffect(() => {
    checkFavoriteStatus();
    fetchData(true); // İlk yükleme

    const interval = setInterval(() => {
      fetchData(false); // Periyodik güncelleme
    }, 5000); // 5 saniyede bir

    return () => clearInterval(interval); // Component unmount olduğunda interval'i temizle
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

  if (error || !data || data.stopInfo.busStopName == "") {
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
      <View style={[styles.routeColorStrip, { backgroundColor: item.routeColor ? `#${item.routeColor}` : themeColors.primary }]} />
      <View style={styles.cardContent}>
        <View>
          <View style={styles.cardTitleContainer}>
            <View style={styles.routeCodeBadge}>
              <Text style={styles.routeCodeBadgeText}>{item.displayRouteCode}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{item.headSign}</Text>
          </View>
          <View style={styles.cardDetails}>
            <MaterialCommunityIcons name="card-account-details-outline" size={16} color={themeColors.textSecondary} />
            <Text style={styles.plateText}>{item.plate}</Text>
            {item.disabledPerson === '1' && (
              <FontAwesome name="wheelchair" size={16} color={themeColors.textPrimary} style={{ marginLeft: 12 }} />
            )}
          </View>
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
      <View style={[styles.routeColorStrip, { backgroundColor: item.routeColor ? `#${item.routeColor}` : themeColors.secondary }]} />
      <View style={styles.cardContent}>
        <View style={styles.cardTitleContainer}>
          <View style={styles.routeCodeBadge}>
            <Text style={styles.routeCodeBadgeText}>{item.displayRouteCode}</Text>
          </View>
          <Text style={styles.cardTitle} numberOfLines={1} ellipsizeMode="tail">{item.headSign}</Text>
        </View>
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Durağa Yaklaşan Araçlar</Text>
          <View style={styles.liveIndicatorContainer}>
            <Animated.View style={[styles.liveDot, { transform: [{ scale: pulseAnimation }] }]} />
            <Text style={styles.liveText}>CANLI</Text>
          </View>
        </View>
        <FlatList
          style={{marginBottom: 20}}
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: themeColors.textPrimary,
  },
  liveIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9', // Açık yeşil arka plan
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 15,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: themeColors.secondary, // Yeşil nokta
    marginRight: 6,
  },
  liveText: {
    fontSize: 14,
    color: themeColors.secondary,
    fontWeight: 'bold',
  },
  card: {
    backgroundColor: themeColors.cardBackground,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'stretch', // İçeriklerin yüksekliğini eşitle
    overflow: 'hidden', // Renk şeridinin köşelerini yuvarlatmak için
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  routeColorStrip: {
    width: 8,
  },
  cardContent: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 15,
    justifyContent: 'space-between',
  },
  cardTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  routeCodeBadge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  routeCodeBadgeText: {
    color: themeColors.textPrimary,
    fontWeight: 'bold',
    fontSize: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: themeColors.textPrimary,
    flex: 1, // Uzun metinlerin sığması için
  },
  cardDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plateText: {
    color: themeColors.textSecondary,
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 5,
  },
  cardRightContent: {
    width: 70,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F7FAFC',
    paddingHorizontal: 10,
    borderLeftWidth: 1,
    borderLeftColor: '#E2E8F0',
  },
  timeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: themeColors.primary,
  },
  timeLabel: {
    fontSize: 14,
    color: themeColors.textSecondary,
    marginTop: -2,
  },
  nextTripText: {
    fontSize: 14,
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